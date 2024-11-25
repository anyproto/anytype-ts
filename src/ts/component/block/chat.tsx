import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Label, Icon } from 'Component';
import { I, C, S, U, J, keyboard, translate, Storage, Preview, Mark } from 'Lib';

import Message from './chat/message';
import Form from './chat/form';

interface State {
	threadId: string;
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
	messageRefs: any = {};
	timeoutInterface = 0;
	top = 0;
	state = {
		threadId: '',
		isLoading: false,
	};

	constructor (props: I.BlockComponent) {
		super(props);

		this.onThread = this.onThread.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onContextMenu = this.onContextMenu.bind(this);
		this.scrollToMessage = this.scrollToMessage.bind(this);
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.getMessages = this.getMessages.bind(this);
		this.getReplyContent = this.getReplyContent.bind(this);
	};

	render () {
		const { threadId } = this.state;
		const rootId = this.getRootId();
		const blockId = this.getBlockId();
		const messages = this.getMessages();
		const sections = this.getSections();
		const subId = this.getSubId();
		const length = messages.length;
		const lastId = Storage.getChat(rootId).lastId;

		const Section = (item: any) => {
			let date = U.Date.dayString(item.createdAt);
			if (!date) {
				date = U.Date.dateWithFormat(S.Common.dateFormat, item.createdAt);
			};

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
							isNew={item.id == lastId}
							isThread={!!threadId}
							onThread={this.onThread}
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
					scrollToBottom={this.scrollToBottom}
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

		this.loadMessages(true, () => {
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
		const events = [ 'messageAdd' ];
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
		U.Common.getScrollContainer(isPopup).off(`scroll.${ns}`);
	};

	rebind () {
		const { isPopup, block } = this.props;
		const { account } = S.Auth;
		const win = $(window);
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		this.unbind();

		win.on(`messageAdd.${ns}`, (e, message: I.ChatMessage) => {
			if (message.creator != account.id) {
				this.scrollToMessage(message.id);
			};
		});

		U.Common.getScrollContainer(isPopup).on(`scroll.${ns}`, e => this.onScroll(e));
	};

	loadMessages (clear: boolean, callBack?: () => void) {
		const rootId = this.getRootId();
		const list = this.getMessages();

		if (!rootId) {
			return;
		};

		if (clear) {
			C.ChatSubscribeLastMessages(rootId, J.Constant.limit.chat.messages, (message: any) => {
				if (!message.error.code) {
					S.Chat.set(rootId, message.messages);
					this.forceUpdate();
				};

				if (callBack) {
					callBack();
				};
			});
		} else {
			if (!list.length) {
				return;
			};

			const first = list[0];

			C.ChatGetMessages(rootId, first.orderId, J.Constant.limit.chat.messages, (message: any) => {
				if (!message.error.code && message.messages.length) {
					S.Chat.prepend(rootId, message.messages);

					this.scrollToMessage(first.id);
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
		return this.state.threadId || this.props.block.id;
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
			if (c1.time > c2.time) return 1;
			if (c1.time < c2.time) return -1;
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
		const rootId = this.getRootId();
		const container = U.Common.getScrollContainer(isPopup);
		const st = container.scrollTop();
		const co = isPopup ? container.offset().top : 0;
		const ch = container.outerHeight();
		const messages = this.getMessages();
		const dates = node.find('.section > .date');
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

		if (st <= 0) {
			this.loadMessages(false);
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
		window.setTimeout(() => {
			const container = U.Common.getScrollContainer(this.props.isPopup);
			const top = this.getMessageScrollOffset(id);

			container.get(0).scrollTo({ top });
		}, 50);
	};

	scrollToBottom () {
		window.setTimeout(() => {
			const { isPopup } = this.props;
			const container = U.Common.getScrollContainer(isPopup);
			const height = isPopup ? container.get(0).scrollHeight : document.body.scrollHeight;

			container.get(0).scrollTo({ top: height + 10000 });
		}, 50);
	};

	onThread (id: string) {
		this.setState({ threadId: id }, () => {
			this.scrollToBottom();
		});
	};

	onReplyEdit (e: React.MouseEvent, message: any) {
		this.refForm.onReply(message);
	};

	onReplyClick (e: React.MouseEvent, message: any) {
		if (!S.Common.config.experimental) {
			return;
		};

		const rootId = this.getRootId();
		const reply = S.Chat.getReply(rootId, message.replyToMessageId);
		const limit = Math.ceil(J.Constant.limit.chat.messages / 2);

		let messages = [];

		C.ChatGetMessages(rootId, reply.orderId, limit, (message: any) => {
			if (!message.error.code && message.messages.length) {
				messages = messages.concat(message.messages);
			};

			S.Chat.set(rootId, messages);
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

			attachment = first;
			attachments.forEach((el) => {
				if ((I.ObjectLayout[el.layout] != attachmentLayout) || !layouts.includes(el.layout)) {
					isMultiple = true;
					attachment = null;
					attachmentLayout = 'Attachment';
				};
			});
			attachmentText = `${U.Common.plural(l, translate(`plural${attachmentLayout}`))} (${l})`;
		};

		if (!text) {
			text = attachmentText;
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

});

export default BlockChat;
