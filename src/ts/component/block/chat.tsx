import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Label, Icon } from 'Component';
import { I, C, S, U, J, keyboard, translate, Storage, Preview, Mark } from 'Lib';

import Message from './chat/message';
import Form from './chat/form';

interface State {
	isLoading: boolean;
};

const GROUP_TIME = 300;

const BlockChat = observer(class BlockChat extends React.Component<I.BlockComponent, State> {

	_isMounted = false;
	node = null;
	refList = null;
	refForm = null;
	deps: string[] = null;
	replies: string[] = null;
	isLoaded = false;
	isLoading = false;
	isBottom = true;
	messageRefs: any = {};
	timeoutInterface = 0;
	timeoutScroll = 0;
	top = 0;
	state = {
		isLoading: false,
	};

	constructor (props: I.BlockComponent) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onContextMenu = this.onContextMenu.bind(this);
		this.scrollToMessage = this.scrollToMessage.bind(this);
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.scrollToBottomCheck = this.scrollToBottomCheck.bind(this);
		this.getMessages = this.getMessages.bind(this);
		this.getReplyContent = this.getReplyContent.bind(this);
	};

	render () {
		const { showRelativeDates } = S.Common;
		const rootId = this.getRootId();
		const blockId = this.getBlockId();
		const messages = this.getMessages();
		const sections = this.getSections();
		const subId = this.getSubId();
		const length = messages.length;
		const lastId = Storage.getChat(rootId).lastId;

		const Section = (item: any) => {
			const day = showRelativeDates ? U.Date.dayString(item.createdAt) : null;
			const date = day ? day : U.Date.dateWithFormat(S.Common.dateFormat, item.createdAt);

			return (
				<div className="section">
					<div className="date">
						<Label text={date} />
					</div>

					{(item.list || []).map(item => (
						<Message
							ref={ref => this.messageRefs[item.id] = ref}
							key={item.id}
							{...this.props}
							id={item.id}
							rootId={rootId}
							blockId={blockId}
							subId={subId}
							isNew={item.id == lastId}
							scrollToBottom={this.scrollToBottomCheck}
							onContextMenu={e => this.onContextMenu(e, item)}
							onMore={e => this.onContextMenu(e, item, true)}
							onReplyEdit={e => this.onReplyEdit(e, item)}
							onReplyClick={e => this.onReplyClick(e, item)}
							getReplyContent={this.getReplyContent}
						/>
					))}
				</div>
			);
		};

		return (
			<div 
				ref={ref => this.node = ref}
				className="wrap"
				onDragOver={this.onDragOver} 
				onDragLeave={this.onDragLeave} 
				onDrop={this.onDrop}
			>
				<div id="scrollWrapper" ref={ref => this.refList = ref} className="scrollWrapper">
					{!messages.length ? (
						<div className="emptyState">
							<div className="img"><Icon /></div>
							<Label text={translate('blockChatEmpty')} />
						</div>
					) : (
						<div className="scroll">
							{sections.map(section => <Section {...section} key={section.createdAt} />)}
						</div>
					)}
				</div>

				<Form 
					ref={ref => this.refForm = ref}
					{...this.props}
					rootId={rootId}
					blockId={blockId}
					subId={subId}
					scrollToBottom={this.scrollToBottomCheck}
					scrollToMessage={this.scrollToMessage}
					getMessages={this.getMessages}
					getReplyContent={this.getReplyContent}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		const rootId = this.getRootId();
		const lastId = Storage.getChat(rootId).lastId;

		this._isMounted = true;
		this.rebind();
		this.setState({ isLoading: true });

		this.loadMessages(1, true, () => {
			this.loadReplies(() => {
				this.replies = this.getReplies();

				this.loadDeps(() => {
					this.deps = this.getDeps();

					this.setState({ isLoading: false }, () => {
						const messages = this.getMessages();
						const length = messages.length;
						const isLast = length && (messages[length - 1].id == lastId);

						if (!lastId || isLast) {
							this.scrollToBottom();
						} else {
							this.scrollToMessage(lastId);
						};
					});
				});
			});
		});
	};

	componentDidUpdate () {
		const deps = this.getDeps();
		const replies = this.getReplies();

		if (this.deps && !U.Common.compareJSON(deps, this.deps)) {
			this.deps = deps;
			this.loadDeps(() => this.forceUpdate());
		};

		if (this.replies && !U.Common.compareJSON(replies, this.replies)) {
			this.replies = replies;
			this.loadReplies(() => this.forceUpdate());
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		C.ObjectSearchUnsubscribe([ this.getSubId() ]);
		window.clearTimeout(this.timeoutInterface);
	};

	unbind () {
		const { isPopup, block } = this.props;
		const events = [ 'messageAdd', 'messageUpdate', 'reactionUpdate' ];
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
		U.Common.getScrollContainer(isPopup).off(`scroll.${ns}`);
	};

	rebind () {
		const { isPopup, block } = this.props;
		const win = $(window);
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		this.unbind();

		win.on(`messageAdd.${ns}`, () => this.scrollToBottomCheck());
		win.on(`messageUpdate.${ns}`, () => this.scrollToBottomCheck());
		win.on(`reactionUpdate.${ns}`, () => this.scrollToBottomCheck());

		U.Common.getScrollContainer(isPopup).on(`scroll.${ns}`, e => this.onScroll(e));
	};

	subscribeMessages (clear: boolean, callBack?: () => void) {
		const rootId = this.getRootId();

		C.ChatSubscribeLastMessages(rootId, J.Constant.limit.chat.messages, (message: any) => {
			if (message.error.code) {
				if (callBack) {
					callBack();
				};
				return;
			};

			const messages = message.messages || [];

			if (messages.length && clear) {
				S.Chat.set(rootId, messages);
				this.forceUpdate();
			};

			if (callBack) {
				callBack();
			};
		});
	};

	loadMessages (dir: number, clear: boolean, callBack?: () => void) {
		const rootId = this.getRootId();

		if (!rootId || this.isLoading) {
			return;
		};

		if (!clear && (dir > 0) && this.isLoaded) {
			this.setIsBottom(true);
			return;
		};

		this.isLoading = true;

		if (clear) {
			this.subscribeMessages(clear, () => {
				this.isLoading = false;

				if (callBack) {
					callBack();
				};
			});
		} else {
			const list = this.getMessages();
			if (!list.length) {
				return;
			};

			const before = dir < 0 ? list[0].orderId : '';
			const after = dir > 0 ? list[list.length - 1].orderId : '';

			if (!before && !after) {
				return;
			};

			C.ChatGetMessages(rootId, before, after, J.Constant.limit.chat.messages, (message: any) => {
				this.isLoading = false;

				if (message.error.code) {
					this.isLoaded = true;

					if (callBack) {
						callBack();
					};
					return;
				};

				const messages = message.messages || [];

				if (dir > 0) {
					if (!messages.length) {
						this.isLoaded = true;
						this.setIsBottom(true);
						this.subscribeMessages(false);
					} else {
						this.setIsBottom(false);
					};
				} else {
					this.setIsBottom(false);
				};

				if (messages.length) {
					const scrollTo = dir < 0 ? messages[0].id : messages[messages.length - 1].id;

					S.Chat[(dir < 0 ? 'prepend' : 'append')](rootId, messages);
					this.scrollToMessage(scrollTo);
				};

				if (callBack) {
					callBack();
				};
			});
		};
	};

	getMessages () {
		return S.Chat.getList(this.getRootId());
	};

	getDeps () {
		const messages = this.getMessages();
		const markTypes = [ I.MarkType.Object, I.MarkType.Mention ];

		let deps = [];

		messages.forEach(it => {
			const marks = (it.content.marks || []).filter(it => markTypes.includes(it.type)).map(it => it.param);
			const attachments = (it.attachments || []).map(it => it.target);

			deps = deps.concat(marks);
			deps = deps.concat(attachments);
		});

		if (this.refForm) {
			deps = deps.concat((this.refForm.state.attachments || []).map(it => it.target));
			deps = deps.concat((this.refForm.marks || []).filter(it => markTypes.includes(it.type)).map(it => it.param));
		};

		return deps;
	};

	getReplies () {
		return this.getMessages().filter(it => it.replyToMessageId).map(it => it.replyToMessageId);
	};

	getSubId (): string {
		return S.Record.getSubId(this.getRootId(), this.getBlockId());
	};

	loadDeps (callBack?: () => void) {
		const rootId = this.getRootId();
		const deps = this.getDeps();

		if (!deps.length) {
			if (callBack) {
				callBack();
			};
			return;
		};

		U.Data.subscribeIds({
			subId: this.getSubId(),
			ids: deps,
			noDeps: true,
			keys: U.Data.chatRelationKeys(),
		}, (message: any) => {
			if (message.error.code) {
				return;
			};
			message.records.forEach(it => S.Detail.update(rootId, { id: it.id, details: it }, false));

			if (callBack) {
				callBack();
			};

			this.refForm?.forceUpdate();
		});
	};

	loadReplies (callBack?: () => void) {
		const rootId = this.getRootId();
		const replies = this.getReplies();

		if (!replies.length) {
			if (callBack) {
				callBack();
			};
			return;
		};

		C.ChatGetMessagesByIds(rootId, replies, (message: any) => {
			if (!message.error.code) {
				message.messages.forEach(it => S.Chat.setReply(rootId, it));
			};

			if (callBack) {
				callBack();
			};
		});
	};

	getRootId () {
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId, [ 'chatId' ]);

		return object.chatId;
	};

	getBlockId () {
		return this.props.block.id;
	};

	getSections () {
		const messages = this.getMessages();
		const sections = [];

		messages.forEach(item => {
			const key = U.Date.dateWithFormat(I.DateFormat.ShortUS, item.createdAt);
			const section = sections.find(it => it.key == key);

			if (!section) {
				sections.push({ createdAt: item.createdAt, key, isSection: true, list: [ item ] });
			} else {
				section.list.push(item);
			};
		});

		// Message groups by author/time
		sections.forEach(section => {
			const length = section.list.length;

			for (let i = 0; i < length; ++i) {
				const prev = section.list[i - 1];
				const item = section.list[i];

				item.isFirst = false;
				item.isLast = false;

				if (prev && ((item.creator != prev.creator) || (item.createdAt - prev.createdAt >= GROUP_TIME))) {
					item.isFirst = true;

					if (prev) {
						prev.isLast = true;
					};
				};
			};

			section.list[0].isFirst = true;
			section.list[length - 1].isLast = true;
		});

		sections.sort((c1, c2) => {
			if (c1.createdAt > c2.createdAt) return 1;
			if (c1.createdAt < c2.createdAt) return -1;
			return 0;
		});

		return sections;
	};

	onContextMenu (e: React.MouseEvent, item: any, onMore?: boolean) {
		const { readonly } = this.props;
		const { account } = S.Auth;
		const blockId = this.getBlockId();
		const message = `#block-${blockId} #item-${item.id}`;
		const isSelf = item.creator == account.id;

		if (readonly) {
			return;
		};

		const options: any[] = [
			{ id: 'reply', name: translate('blockChatReply') },
			isSelf ? { id: 'edit', name: translate('commonEdit') } : null,
			isSelf ? { id: 'delete', name: translate('commonDelete'), color: 'red' } : null,
		].filter(it => it);

		const menuParam: Partial<I.MenuParam> = {
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			onOpen: () => $(message).addClass('hover'),
			onClose: () => $(message).removeClass('hover'),
			data: {
				options,
				onSelect: (e, option) => {
					switch (option.id) {
						case 'reply': {
							this.refForm.onReply(item);
							break;
						};

						case 'edit': {
							this.refForm.onEdit(item);
							break;
						};

						case 'delete': {
							this.refForm.onDelete(item.id);
							break;
						};
					};
				},
			},
		};

		if (onMore) {
			menuParam.element = `${message} .icon.more`;
		} else {
			menuParam.recalcRect = () => ({ x: keyboard.mouse.page.x, y: keyboard.mouse.page.y, width: 0, height: 0 });
		};

		S.Menu.open('select', menuParam);
	};

	onScroll (e: any) {
		const { isPopup } = this.props;
		const node = $(this.node);
		const scrollWrapper = node.find('#scrollWrapper');
		const formWrapper = node.find('#formWrapper');
		const rootId = this.getRootId();
		const container = U.Common.getScrollContainer(isPopup);
		const st = container.scrollTop();
		const co = isPopup ? container.offset().top : 0;
		const messages = this.getMessages();
		const dates = node.find('.section > .date');
		const fh = formWrapper.outerHeight();
		const ch = container.outerHeight();
		const hh = J.Size.header;
		const lastId = Storage.getChat(rootId).lastId;

		if (st > this.top) {
			messages.forEach(it => {
				const ref = this.messageRefs[it.id];
				if (!ref) {
					return false;
				};

				const node = $(ref.node);
				if (!node.length) {
					return false;
				};

				if ((it.id == lastId) && st >= node.offset().top - co - ch) {
					Storage.setChat(rootId, { lastId: '' });
				};
			});
		};

		this.setIsBottom(false);

		if (st <= 0) {
			this.loadMessages(-1, false);
		};

		if (st - fh >= scrollWrapper.outerHeight() - ch) {
			this.loadMessages(1, false);
		};

		dates.each((i, item: any) => {
			item = $(item);

			const y = item.offset().top - st;

			item.removeClass('hide');
			if (y == hh + 8) {
				window.clearTimeout(this.timeoutInterface);
				this.timeoutInterface = window.setTimeout(() => item.addClass('hide'), 1000);
			};
		});

		this.top = st;

		Preview.tooltipHide(true);
		Preview.previewHide(true);
	};

	getMessageScrollOffset (id: string) {
		const ref = this.messageRefs[id];
		if (!ref) {
			return;
		};

		const node = $(ref.node);
		if (!node.length) {
			return;
		};

		return node.offset().top + node.outerHeight();
	};

	scrollToMessage (id: string) {
		if (!id) {
			return;
		};

		const container = U.Common.getScrollContainer(this.props.isPopup);
		const top = this.getMessageScrollOffset(id);

		container.scrollTop(top);
	};

	scrollToBottom () {
		const { isPopup } = this.props;
		const container = U.Common.getScrollContainer(isPopup);
		const node = $(this.node);
		const wrapper = node.find('#scrollWrapper');

		container.scrollTop(wrapper.outerHeight());
	};

	scrollToBottomCheck () {
		if (this.isBottom) {
			window.clearTimeout(this.timeoutScroll);
			this.timeoutScroll = window.setTimeout(() => this.scrollToBottom(), 10);
		};
	};

	onReplyEdit (e: React.MouseEvent, message: any) {
		this.refForm.onReply(message);
		this.scrollToBottomCheck();
	};

	onReplyClick (e: React.MouseEvent, item: any) {
		if (!S.Common.config.experimental) {
			return;
		};

		this.isLoaded = false;
		this.setIsBottom(false);

		const rootId = this.getRootId();
		const limit = Math.ceil(J.Constant.limit.chat.messages / 2);

		C.ChatGetMessagesByIds(rootId, [ item.replyToMessageId ], (message: any) => {
			if (message.error.code || !message.messages.length) {
				return;
			};

			const reply = message.messages[0];
			if (!reply) {
				return;
			};

			let list = [];

			S.Chat.clear(rootId);
			
			C.ChatGetMessages(rootId, reply.orderId, '', limit, (message: any) => {
				if (!message.error.code && message.messages.length) {
					list = list.concat(message.messages);
				};

				list.push(reply);

				C.ChatGetMessages(rootId, '', reply.orderId, limit, (message: any) => {
					if (!message.error.code && message.messages.length) {
						list = list.concat(message.messages);
					};

					S.Chat.set(rootId, list);

					this.loadReplies(() => {
						this.replies = this.getReplies();

						this.loadDeps(() => {
							this.deps = this.getDeps();

							this.scrollToMessage(reply.id);
						});
					});
				});
			});
		});
	};

	getReplyContent (message: any): any {
		const { creator, content } = message;
		const { space } = S.Common;
		const author = U.Space.getParticipant(U.Space.getParticipantId(space, creator));
		const title = U.Common.sprintf(translate('blockChatReplying'), author?.name);
		const layouts = U.Object.getFileLayouts().concat(I.ObjectLayout.Bookmark);
		const attachments = (message.attachments || []).map(it => S.Detail.get(this.getSubId(), it.target)).filter(it => !it.isDeleted);
		const l = attachments.length;

		let text: string = '';
		let attachmentText: string = '';
		let attachment: any = null;
		let isMultiple: boolean = false;

		if (content.text) {
			text = U.Common.sanitize(U.Common.lbBr(Mark.toHtml(content.text, content.marks)));
		};

		if (!l) {
			return { title, text };
		};

		const first = attachments[0];

		if (l == 1) {
			attachmentText = first.name || U.Common.plural(1, translate('pluralAttachment'));
			attachment = first;
		} else {
			let attachmentLayout = I.ObjectLayout[first.layout];

			attachment = null;
			attachments.forEach((el) => {
				if ((I.ObjectLayout[el.layout] != attachmentLayout) || !layouts.includes(el.layout)) {
					isMultiple = true;
					attachment = first;
					attachmentLayout = 'Attachment';
				};
			});
			attachmentText = text.length ? `${U.Common.plural(l, translate(`plural${attachmentLayout}`))} (${l})` : `${l} ${U.Common.plural(l, translate(`plural${attachmentLayout}`)).toLowerCase()}`;
		};

		if (!text) {
			text = attachmentText;
			attachment = first;
		};

		return { title, text, attachment, isMultiple };
	};

	onDragOver (e: React.DragEvent) {
		this.refForm?.onDragOver(e);
	};

	onDragLeave (e: React.DragEvent) {
		this.refForm?.onDragLeave(e);
	};

	onDrop (e: React.DragEvent) {
		this.refForm?.onDrop(e);
	};

	setIsBottom (v: boolean) {
		this.isBottom = v;
	};

});

export default BlockChat;
