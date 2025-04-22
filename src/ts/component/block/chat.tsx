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
	scrolledItems = new Set();

	constructor (props: I.BlockComponent) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
		this.onReadStop = this.onReadStop.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onContextMenu = this.onContextMenu.bind(this);
		this.onScrollToBottomClick = this.onScrollToBottomClick.bind(this);
		this.scrollToMessage = this.scrollToMessage.bind(this);
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.scrollToBottomCheck = this.scrollToBottomCheck.bind(this);
		this.getMessagesInViewport = this.getMessagesInViewport.bind(this);
		this.getMessages = this.getMessages.bind(this);
		this.getReplyContent = this.getReplyContent.bind(this);
		this.loadMessagesByOrderId = this.loadMessagesByOrderId.bind(this);
		this.hasScroll = this.hasScroll.bind(this);
		this.highlightMessage = this.highlightMessage.bind(this);
	};

	render () {
		const { showRelativeDates } = S.Common;
		const { block } = this.props;
		const rootId = this.getRootId();
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

					{(item.list || []).map(item => {
						const hasMore = !!this.getMessageMenuOptions(item, true).length;

						return (
							<Message
								ref={ref => this.messageRefs[item.id] = ref}
								key={item.id}
								{...this.props}
								id={item.id}
								rootId={rootId}
								blockId={block.id}
								subId={subId}
								isNew={item.orderId == this.firstUnreadOrderId}
								hasMore={hasMore}
								scrollToBottom={this.scrollToBottomCheck}
								onContextMenu={e => this.onContextMenu(e, item)}
								onMore={e => this.onContextMenu(e, item, true)}
								onReplyEdit={e => this.onReplyEdit(e, item)}
								onReplyClick={e => this.onReplyClick(e, item)}
								getReplyContent={this.getReplyContent}
							/>
						);
					})}
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
					blockId={block.id}
					subId={subId}
					onScrollToBottomClick={this.onScrollToBottomClick}
					scrollToBottom={this.scrollToBottom}
					scrollToMessage={this.scrollToMessage}
					loadMessagesByOrderId={this.loadMessagesByOrderId}
					getMessages={this.getMessages}
					getMessagesInViewport={this.getMessagesInViewport}
					getIsBottom={() => hasScroll ? this.isBottom : true}
					getReplyContent={this.getReplyContent}
					highlightMessage={this.highlightMessage}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();

		this.loadState(() => {
			const { messageOrderId } = S.Chat.getState(this.getSubId());

			if (messageOrderId) {
				this.firstUnreadOrderId = messageOrderId;

				this.loadMessagesByOrderId(messageOrderId, () => {
					const target = this.getMessages().find(it => it.orderId == messageOrderId);

					this.scrollToMessage(target?.id);
				});
			} else {
				this.loadMessages(1, true, this.scrollToBottom);
			};
		});
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

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

	loadState (callBack?: () => void) {
		const rootId = this.getRootId();
		const subId = this.getSubId();

		if (!rootId) {
			return;
		};

		C.ChatSubscribeLastMessages(rootId, 0, subId, (message: any) => {
			if (message.state) {
				S.Chat.setState(subId, message.state);
			};

			if (callBack) {
				callBack();
			};
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

			if (message.state) {
				S.Chat.setState(subId, message.state);
			};

			const messages = message.messages || [];

			this.loadDepsAndReplies(messages, () => {
				if (messages.length && clear) {
					S.Chat.set(subId, messages);
				};

				if (callBack) {
					callBack();
				};
			});
		});
	};

	loadMessages (dir: number, clear: boolean, callBack?: () => void) {
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
				this.isLoading = false;
				return;
			};

			const first = list[0];
			const before = dir < 0 ? list[0].orderId : '';
			const after = dir > 0 ? list[list.length - 1].orderId : '';

			if (!before && !after) {
				this.isLoading = false;
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

				this.loadDepsAndReplies(messages, () => {
					if (messages.length) {
						S.Chat[(dir < 0 ? 'prepend' : 'append')](subId, messages);

						if (first && (dir < 0)) {
							this.scrollToMessage(first.id);
						};
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

				this.loadDepsAndReplies(list, () => {
					S.Chat.set(subId, list);

					if (callBack) {
						callBack();
					};
				});
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
		return S.Record.getSubId(this.getRootId(), this.props.block.id);
	};

	loadDeps (ids: string[], callBack?: () => void) {
		if (!ids.length) {
			if (callBack) {
				callBack();
			};
			return;
		};

		const rootId = this.getRootId();

		U.Object.getByIds(ids, { keys: U.Data.chatRelationKeys() }, objects => {
			objects.forEach(it => S.Detail.update(rootId, { id: it.id, details: it }, false));

			this.forceUpdate();
			this.refForm?.forceUpdate();

			if (callBack) {
				callBack();
			};
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
		if (subIds.includes(subId)) {
			this.loadDepsAndReplies([ message ], () => this.scrollToBottomCheck());
		};
	};

	onContextMenu (e: React.MouseEvent, item: any, onMore?: boolean) {
		const { readonly } = this.props;
		if (readonly) {
			return;
		};

		const { isPopup, block } = this.props;
		const message = `#block-${block.id} #item-${item.id}`;
		const container = isPopup ? U.Common.getScrollContainer(isPopup) : $('body');

		const menuParam: Partial<I.MenuParam> = {
			className: 'chatMessage',
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			onOpen: () => {
				$(message).addClass('hover');
				container.addClass('over');
			},
			onClose: () => {
				$(message).removeClass('hover');
				container.removeClass('over');
			},
			data: {
				options: this.getMessageMenuOptions(item, onMore),
				onSelect: (e, option) => {
					switch (option.id) {
						case 'reaction': {
							this.messageRefs[item.id].onReactionAdd();
							break;
						};

						case 'copy': {
							U.Common.clipboardCopy({ text: item.content.text });
							break;
						};

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

				C.ChatReadMessages(rootId, viewport[0].orderId, viewport[viewport.length - 1].orderId, lastStateId, I.ChatReadType.Message);
			};
		});
	};

	onScroll (e: any) {
		const rootId = this.getRootId();
		const { isPopup } = this.props;
		const subId = this.getSubId();
		const node = $(this.node);
		const scrollWrapper = node.find('#scrollWrapper');
		const formWrapper = node.find('#formWrapper');
		const container = U.Common.getScrollContainer(isPopup);
		const st = container.scrollTop();
		const dates = node.find('.section > .date');
		const fh = formWrapper.outerHeight();
		const ch = container.outerHeight();
		const hh = J.Size.header;
		const list = this.getMessagesInViewport();
		const state = S.Chat.getState(subId);
		const { lastStateId } = state;

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

		list.forEach(it => {
			this.scrolledItems.add(it.id);

			if (!it.isReadMessage) {
				S.Chat.setReadMessageStatus(subId, [ it.id ], true);
				C.ChatReadMessages(rootId, it.orderId, it.orderId, lastStateId, I.ChatReadType.Message);
			};
			if (!it.isReadMention) {
				S.Chat.setReadMentionStatus(subId, [ it.id ], true);
				C.ChatReadMessages(rootId, it.orderId, it.orderId, lastStateId, I.ChatReadType.Mention);
			};
		});

		window.clearTimeout(this.timeoutScrollStop);
		this.timeoutScrollStop = window.setTimeout(() => this.onReadStop(), 300);

		this.top = st;

		Preview.tooltipHide(true);
		Preview.previewHide(true);
	};

	onReadStop () {
		if (!this.scrolledItems.size) {
			return;
		};

		const subId = this.getSubId();
		const ids: string[] = [ ...this.scrolledItems ] as string[];
		const first = S.Chat.getMessage(subId, ids[0]);
		const last = S.Chat.getMessage(subId, ids[ids.length - 1]);
		const rootId = this.getRootId();
		const state = S.Chat.getState(subId);
		const { lastStateId } = state;

		if (first && last) {
			C.ChatReadMessages(rootId, first.orderId, last.orderId, lastStateId, I.ChatReadType.Message);
			C.ChatReadMessages(rootId, first.orderId, last.orderId, lastStateId, I.ChatReadType.Mention);
		};

		S.Chat.setReadMessageStatus(subId, ids, true);
		S.Chat.setReadMentionStatus(subId, ids, true);

		this.scrolledItems.clear();
	};

	onScrollToBottomClick () {
		this.loadMessages(1, true, () => this.scrollToBottom(true));
	};

	getMessageScrollOffset (id: string): number {
		const ref = this.messageRefs[id];
		if (!ref) {
			return 0;
		};

		const node = $(ref.node);
		return node.length ? node.offset().top + node.outerHeight() : 0;
	};

	getMessagesInViewport () {
		const { isPopup } = this.props;
		const messages = this.getMessages();
		const container = U.Common.getScrollContainer(isPopup);
		const formHeight = this.refForm ? $(this.refForm.node).outerHeight() : 120;
		const ch = isPopup ? container.outerHeight() : $(window).height();
		const min = container.scrollTop();
		const max = min + ch - formHeight;
		const ret = [];

		messages.forEach((it: any) => {
			const st = this.getMessageScrollOffset(it.id);

			if ((st > min) && (st < max)) {
				ret.push(it);
			};
		});

		return ret;
	};

	getMessageMenuOptions (message, noControls) {
		let options: any[] = [];

		if (message.content.text) {
			options.push({ id: 'copy', icon: 'copy', name: translate('blockChatCopyText') });
		};

		if (message.creator == S.Auth.account.id) {
			options = options.concat([
				{ id: 'edit', icon: 'pencil', name: translate('commonEdit') },
				{ id: 'delete', icon: 'remove', name: translate('commonDelete') },
			]);
		};

		if (!noControls) {
			options = ([
				{ id: 'reaction',icon: 'reaction',  name: translate('blockChatReactionAdd') },
				{ id: 'reply',icon: 'reply',  name: translate('blockChatReply') },
				options.length ? { isDiv: true } : null,
			].filter(it => it)).concat(options);
		};

		if (S.Common.config.experimental) {
			options.push({ id: 'unread', icon: 'empty', name: 'Unread' });
		};

		return options;
	};

	readScrolledMessages () {
		const viewport = this.getMessagesInViewport();

		this.scrolledItems = new Set(viewport.map(it => it.id));
		this.onReadStop();
	};

	scrollToMessage (id: string, animate?: boolean) {
		if (!id) {
			return;
		};

		if (!this.hasScroll()) {
			this.readScrolledMessages();
			return;
		};

		const { isPopup } = this.props;
		const container = U.Common.getScrollContainer(isPopup);
		const top = this.getMessageScrollOffset(id);
		const y = Math.max(0, top - container.height() / 2 - J.Size.header);

		this.setIsBottom(false);
		this.setAutoLoadDisabled(true);

		const cb = () => {
			this.highlightMessage(id);
			this.readScrolledMessages();
			this.setAutoLoadDisabled(false);
		};

		if (animate) {
			const animContainer = isPopup ? U.Common.getScrollContainer(isPopup) : $('html, body');
			animContainer.stop(true, true).animate({ scrollTop: y }, 300, cb);
		} else {
			container.scrollTop(y);
			cb();
		};
	};

	scrollToBottom (animate?: boolean) {
		if (!this.hasScroll()) {
			this.readScrolledMessages();
			this.setIsBottom(true);
			return;
		};

		const { isPopup } = this.props;
		const container = U.Common.getScrollContainer(isPopup);
		const node = $(this.node);
		const wrapper = node.find('#scrollWrapper');
		const y = wrapper.outerHeight();

		this.setAutoLoadDisabled(true);

		const cb = () => {
			this.readScrolledMessages();
			this.setAutoLoadDisabled(false);
		};

		if (animate) {
			const animContainer = isPopup ? U.Common.getScrollContainer(isPopup) : $('html, body');
			animContainer.stop(true, true).animate({ scrollTop: y }, 300, cb);
		} else {
			container.scrollTop(y);
			cb();
		};
	};

	scrollToBottomCheck () {
		if (this.isBottom) {
			window.clearTimeout(this.timeoutScroll);
			this.timeoutScroll = window.setTimeout(() => this.scrollToBottom(false), 10);
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
		const message = S.Chat.getMessage(subId, item.replyToMessageId);

		if (message) {
			this.scrollToMessage(message.id, true);
			return;
		};

		C.ChatGetMessagesByIds(rootId, [ item.replyToMessageId ], (message: any) => {
			if (message.error.code || !message.messages.length) {
				return;
			};

			const reply = message.messages[0];
			if (!reply) {
				return;
			};

			S.Chat.clear(subId);
			this.loadMessagesByOrderId(reply.orderId, () => this.scrollToMessage(reply.id, true));
		});
	};

	getReplyContent (message: any): any {
		const { creator, content } = message;
		const rootId = this.getRootId();
		const author = U.Space.getParticipant(U.Space.getParticipantId(S.Common.space, creator));
		const title = U.Common.sprintf(translate('blockChatReplying'), author?.name);
		const layouts = U.Object.getFileLayouts().concat(I.ObjectLayout.Bookmark);
		const attachments = (message.attachments || []).map(it => S.Detail.get(rootId, it.target)).filter(it => !it.isDeleted);
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

		const node = $(this.refForm?.node);
		const btn = node.find(`#navigation-${I.ChatReadType.Message}`);

		btn.toggleClass('active', !v);
	};

	setAutoLoadDisabled (v: boolean) {
		this.isAutoLoadDisabled = v;
	};

	hasScroll () {
		const { isPopup } = this.props;
		const container = U.Common.getScrollContainer(isPopup);

		if (isPopup && container.length) {
			const el = container.get(0);

			return el.scrollHeight > el.clientHeight;
		};

		return document.documentElement.scrollHeight > window.innerHeight;
	};

	highlightMessage (id: string, orderId?: string) {
		const messages = this.getMessages();
		const target = messages.find(it => orderId ? it.orderId == orderId : it.id == id);
		if (!target) {
			return;
		};

		this.messageRefs[target.id].highlight();
	};

});

export default BlockChat;
