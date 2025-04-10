import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Label, Icon } from 'Component';
import { I, C, S, U, J, keyboard, translate, Preview, Mark } from 'Lib';

import Message from './chat/message';
import Form from './chat/form';

const GROUP_TIME = 300;

const BlockChat = observer(class BlockChat extends React.Component<I.BlockComponent> {

	_isMounted = false;
	node = null;
	refList = null;
	refForm = null;
	isLoaded = false;
	isLoading = false;
	isBottom = false;
	isAutoLoadDisabled = false;
	messageRefs: any = {};
	timeoutInterface = 0;
	timeoutScroll = 0;
	timeoutScrollStop = 0;
	top = 0;
	firstUnreadOrderId = '';
	scrolledItems = [];

	constructor (props: I.BlockComponent) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
		this.onReadStop = this.onReadStop.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onContextMenu = this.onContextMenu.bind(this);
		this.onStateUpdate = this.onStateUpdate.bind(this);
		this.scrollToMessage = this.scrollToMessage.bind(this);
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.scrollToBottomCheck = this.scrollToBottomCheck.bind(this);
		this.getMessagesInViewport = this.getMessagesInViewport.bind(this);
		this.getMessages = this.getMessages.bind(this);
		this.getReplyContent = this.getReplyContent.bind(this);
		this.loadMessagesByOrderId = this.loadMessagesByOrderId.bind(this);
		this.hasScroll = this.hasScroll.bind(this);
	};

	render () {
		const { showRelativeDates } = S.Common;
		const rootId = this.getRootId();
		const blockId = this.getBlockId();
		const messages = this.getMessages();
		const sections = this.getSections();
		const subId = this.getSubId();
		const hasScroll = this.hasScroll();

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
							isNew={item.orderId == this.firstUnreadOrderId}
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
					scrollToBottom={this.scrollToBottom}
					scrollToMessage={this.scrollToMessage}
					loadMessagesByOrderId={this.loadMessagesByOrderId}
					getMessages={this.getMessages}
					getMessagesInViewport={this.getMessagesInViewport}
					getIsBottom={() => hasScroll ? this.isBottom : true}
					getReplyContent={this.getReplyContent}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();

		this.loadMessages(1, true, () => {
			const { messageOrderId } = S.Chat.getState(this.getSubId());

			if (messageOrderId) {
				this.firstUnreadOrderId = messageOrderId;

				this.loadMessagesByOrderId(messageOrderId, () => {
					const target = this.getMessages().find(it => it.orderId == messageOrderId);
					this.scrollToMessage(target?.id);
				});
			} else {
				this.scrollToBottom();
			};
		});
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		C.ObjectSearchUnsubscribe([ this.getSubId() ]);
		window.clearTimeout(this.timeoutInterface);
		window.clearTimeout(this.timeoutScroll);
		window.clearTimeout(this.timeoutScrollStop);
	};

	unbind () {
		const { isPopup, block } = this.props;
		const events = [ 'messageAdd', 'messageUpdate', 'reactionUpdate', 'chatStateUpdate' ];
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
		U.Common.getScrollContainer(isPopup).off(`scroll.${ns}`);
	};

	rebind () {
		const { isPopup, block } = this.props;
		const win = $(window);
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		this.unbind();

		win.on(`messageAdd.${ns}`, (e, message, subIds) => this.onMessageAdd(message, subIds));
		win.on(`messageUpdate.${ns}`, () => this.scrollToBottomCheck());
		win.on(`reactionUpdate.${ns}`, () => this.scrollToBottomCheck());
		win.on(`chatStateUpdate.${ns}`, this.onStateUpdate);

		U.Common.getScrollContainer(isPopup).on(`scroll.${ns}`, e => this.onScroll(e));
	};

	loadDepsAndReplies = (list: I.ChatMessage[], callBack?: () => void) => {
		this.loadReplies(this.getReplyIds(list), () => {
			this.loadDeps(this.getDepsIds(list), () => {
				if (callBack) {
					callBack();
				};
			});
		});
	};

	subscribeMessages (clear: boolean, callBack?: () => void) {
		const rootId = this.getRootId();
		const subId = this.getSubId();

		if (!rootId) {
			return;
		};

		C.ChatSubscribeLastMessages(rootId, J.Constant.limit.chat.messages, subId, (message: any) => {
			if (message.error.code) {
				if (callBack) {
					callBack();
				};
				return;
			};

			const messages = message.messages || [];
			const state = message.state;

			if (messages.length && clear) {
				S.Chat.set(subId, messages);
				this.forceUpdate();
			};

			S.Chat.setState(subId, state);
			this.loadDepsAndReplies(messages, callBack);
		});
	};

	loadMessages (dir: number, clear: boolean, callBack?: () => void) {
		const { isPopup } = this.props;
		const rootId = this.getRootId();
		const subId = this.getSubId();

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
				this.setIsBottom(true);

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

			C.ChatGetMessages(rootId, before, after, J.Constant.limit.chat.messages, false, (message: any) => {
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
					if (messages.length < J.Constant.limit.chat.messages) {
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
					S.Chat[(dir < 0 ? 'prepend' : 'append')](subId, messages);
				};

				this.loadDepsAndReplies(messages, () => {
					if ((dir < 0) && messages.length) {
						U.Common.getScrollContainer(isPopup).scrollTop(20);
					};

					if (callBack) {
						callBack();
					};
				});
			});
		};
	};

	loadMessagesByOrderId (orderId: string, callBack?: () => void) {
		const rootId = this.getRootId();
		const subId = this.getSubId();
		const limit = Math.ceil(J.Constant.limit.chat.messages / 2);

		let list = [];

		C.ChatGetMessages(rootId, orderId, '', limit, true, (message: any) => {
			if (!message.error.code && message.messages.length) {
				list = list.concat(message.messages);
			};

			C.ChatGetMessages(rootId, '', orderId, limit, false, (message: any) => {
				if (!message.error.code && message.messages.length) {
					list = list.concat(message.messages);
				};

				S.Chat.set(subId, list);
				this.loadDepsAndReplies(list, callBack);
			});
		});
	};

	getMessages () {
		return S.Chat.getList(this.getSubId());
	};

	getDepsIds (list: any[]) {
		const markTypes = [ I.MarkType.Object, I.MarkType.Mention ];

		let deps = [];

		list.forEach(it => {
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

	getReplyIds (list: any[]) {
		return (list || []).filter(it => it.replyToMessageId).map(it => it.replyToMessageId)
	};

	getSubId (): string {
		return S.Record.getSubId(this.getRootId(), this.getBlockId());
	};

	loadDeps (ids: string[], callBack?: () => void) {
		if (!ids.length) {
			if (callBack) {
				callBack();
			};
			return;
		};

		const rootId = this.getRootId();

		U.Data.subscribeIds({
			subId: this.getSubId(),
			ids,
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

	loadReplies (ids: string[], callBack?: () => void) {
		if (!ids.length) {
			if (callBack) {
				callBack();
			};
			return;
		};

		const rootId = this.getRootId();
		const subId = this.getSubId();

		C.ChatGetMessagesByIds(rootId, ids, (message: any) => {
			if (!message.error.code) {
				message.messages.forEach(it => S.Chat.setReply(subId, it));
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

	onMessageAdd (message: I.ChatMessage, subIds: string[]) {
		const subId = this.getSubId();
		if (!subIds.includes(subId)) {
			return;
		};

		this.loadDepsAndReplies([ message ]);
		this.onStateUpdate();
	};

	onStateUpdate () {
		const { messageOrderId, messageCounter } = S.Chat.getState(this.getSubId());

		if (!this.firstUnreadOrderId && messageCounter) {
			this.firstUnreadOrderId = messageOrderId;
		};
	};

	onContextMenu (e: React.MouseEvent, item: any, onMore?: boolean) {
		const { readonly } = this.props;
		if (readonly) {
			return;
		};

		const { isPopup } = this.props;
		const { account } = S.Auth;
		const { config } = S.Common;
		const blockId = this.getBlockId();
		const message = `#block-${blockId} #item-${item.id}`;
		const container = isPopup ? U.Common.getScrollContainer(isPopup) : $('body');
		const isSelf = item.creator == account.id;
		const options: any[] = [
			config.experimental ? { id: 'unread', name: 'Unread' } : null,
			{ id: 'reply', name: translate('blockChatReply') },
			isSelf ? { id: 'edit', name: translate('commonEdit') } : null,
			isSelf ? { id: 'delete', name: translate('commonDelete'), color: 'red' } : null,
		].filter(it => it);

		const menuParam: Partial<I.MenuParam> = {
			vertical: I.MenuDirection.Bottom,
			horizontal: onMore ? I.MenuDirection.Center : I.MenuDirection.Left,
			onOpen: () => {
				$(message).addClass('hover');
				container.addClass('over');
			},
			onClose: () => {
				$(message).removeClass('hover');
				container.removeClass('over');
			},
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

						case 'unread': {
							this.onUnread(item.orderId);
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

	onUnread (orderId: string) {
		const rootId = this.getRootId();
		const subId = this.getSubId();
		const viewport = this.getMessagesInViewport();

		C.ChatUnreadMessages(rootId, orderId, () => {
			if (viewport.length) {
				const { lastStateId } = S.Chat.getState(subId);

				C.ChatReadMessages(rootId, viewport[0].orderId, viewport[viewport.length - 1].orderId, lastStateId);
			};
		});
	};

	onScroll (e: any) {
		const { isPopup } = this.props;
		const node = $(this.node);
		const scrollWrapper = node.find('#scrollWrapper');
		const formWrapper = node.find('#formWrapper');
		const container = U.Common.getScrollContainer(isPopup);
		const st = container.scrollTop();
		const dates = node.find('.section > .date');
		const fh = formWrapper.outerHeight();
		const ch = container.outerHeight();
		const hh = J.Size.header;

		this.setIsBottom(false);

		if (!this.isAutoLoadDisabled) {
			if (st <= 0) {
				this.loadMessages(-1, false);
			};

			if (st - fh >= scrollWrapper.outerHeight() - ch) {
				this.loadMessages(1, false);
			};
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
		this.scrolledItems = this.scrolledItems.concat(this.getMessagesInViewport().filter(it => !it.isRead).map(it => ({ id: it.id, orderId: it.orderId })));

		window.clearTimeout(this.timeoutScrollStop);
		this.timeoutScrollStop = window.setTimeout(() => this.onReadStop(), 100);

		Preview.tooltipHide(true);
		Preview.previewHide(true);
	};

	onReadStop () {
		if (!this.scrolledItems.length) {
			return;
		};

		const first = this.scrolledItems[0]?.orderId;
		const last = this.scrolledItems[this.scrolledItems.length - 1]?.orderId;
		const rootId = this.getRootId();
		const subId = this.getSubId();
		const state = S.Chat.getState(subId);
		const { lastStateId } = state;

		if (first && last) {
			C.ChatReadMessages(rootId, first, last, lastStateId);
		};

		S.Chat.setReadStatus(subId, this.scrolledItems.map(it => it.id), true);

		this.scrolledItems = [];
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

	getMessagesInViewport () {
		const messages = this.getMessages();
		const container = U.Common.getScrollContainer(this.props.isPopup);
		const formHeight = this.refForm ? $(this.refForm.node).outerHeight() : 120;
		const min = this.top;
		const max = min + container.outerHeight() - formHeight;
		const ret = [];

		messages.forEach((it: any) => {
			const st = this.getMessageScrollOffset(it.id);

			if ((st > min) && (st < max)) {
				ret.push(it);
			};
		});

		return ret;
	};

	scrollToMessage (id: string, offset?: number) {
		if (!id) {
			return;
		};

		offset = Number(offset) || 0;

		const container = U.Common.getScrollContainer(this.props.isPopup);
		const top = this.getMessageScrollOffset(id);

		this.setIsBottom(false);
		this.setAutoLoadDisabled(true);

		container.scrollTop(Math.max(0, top - container.height() / 2) + offset);

		this.setAutoLoadDisabled(false);
	};

	scrollToBottom () {
		const { isPopup } = this.props;
		const container = U.Common.getScrollContainer(isPopup);
		const node = $(this.node);
		const wrapper = node.find('#scrollWrapper');
		const viewport = this.getMessagesInViewport();

		const read = () => {
			if (viewport.length) {
				this.scrolledItems = viewport.map(it => ({ id: it.id, orderId: it.orderId }));
				this.onReadStop();
			};
		};

		if (!this.hasScroll()) {
			read();
			this.setIsBottom(true);
			return;
		};

		this.setAutoLoadDisabled(true);

		container.scrollTop(wrapper.outerHeight());
		window.setTimeout(() => read, 20);

		this.setAutoLoadDisabled(false);
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
		this.isLoaded = false;
		this.setIsBottom(false);

		const rootId = this.getRootId();
		const subId = this.getSubId();

		C.ChatGetMessagesByIds(rootId, [ item.replyToMessageId ], (message: any) => {
			if (message.error.code || !message.messages.length) {
				return;
			};

			const reply = message.messages[0];
			if (!reply) {
				return;
			};

			S.Chat.clear(subId);
			this.loadMessagesByOrderId(reply.orderId, () => {
				this.scrollToMessage(reply.id);
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
		if (v != this.isBottom) {
			this.refForm?.setState({ isBottom: v });
		};
		this.isBottom = v;
	};

	setAutoLoadDisabled (v: boolean) {
		this.isAutoLoadDisabled = v;
	};

	hasScroll () {
		const { isPopup } = this.props;
		const container = U.Common.getScrollContainer(isPopup);

		if (isPopup) {
			return container.get(0).scrollHeight > container.get(0).clientHeight;
		};
		return document.documentElement.scrollHeight > window.innerHeight;
	};

});

export default BlockChat;
