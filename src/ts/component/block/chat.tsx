import React, { forwardRef, useRef, useEffect, DragEvent, MouseEvent, useCallback, useState, useLayoutEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Label, Title, Icon, Button } from 'Component';
import { I, C, S, U, J, M, keyboard, translate, Preview, Mark, analytics, Action } from 'Lib';

import Form from './chat/form';
import Message from './chat/message';
import SectionDate from './chat/message/date';

interface RefProps {
	forceUpdate: () => void;
	resize: () => void;
	onDragOver: (e: DragEvent) => void;
	onDragLeave: (e: DragEvent) => void;
	onDrop: (e: DragEvent) => void;
};

const GROUP_TIME = 300;

const BlockChat = observer(forwardRef<RefProps, I.BlockComponent>((props, ref) => {

	const { space } = S.Common;
	const { account } = S.Auth;
	const { rootId, block, isPopup, readonly } = props;
	const nodeRef = useRef(null);
	const formRef = useRef(null);
	const scrollWrapperRef = useRef(null);
	const messageRefs = useRef({});
	const timeoutInterface = useRef(0);
	const timeoutScrollStop = useRef(0);
	const timeoutResize = useRef(0);
	const top = useRef(0);
	const scrolledItems = useRef(new Set());
	const isLoading = useRef(false);
	const isBottom = useRef(false);
	const isAutoLoadDisabled = useRef(false);
	const [ firstUnreadOrderId, setFirstUnreadOrderId ] = useState('');
	const [ dummy, setDummy ] = useState(0);
	const [ isLoaded, setIsLoaded ] = useState(false);
	const frameRef = useRef(0);
	const initialRender = useRef(true);

	const getChatId = () => {
		const object = S.Detail.get(rootId, rootId, [ 'chatId' ]);
		return object.chatId || rootId;
	};

	const getSubId = () => {
		return S.Chat.getChatSubId('chat', space, getChatId());
	};

	const chatId = getChatId();
	const subId = getSubId();
	const messages = S.Chat.getList(subId);

	const unbind = () => {
		const events = [ 'messageAdd', 'messageUpdate', 'reactionUpdate', 'focus' ];
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
		U.Common.getScrollContainer(isPopup).off(`scroll.${ns}`);
	};

	const rebind = () => {
		const win = $(window);
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		unbind();

		win.on(`messageAdd.${ns}`, (e, message, subIds) => onMessageAdd(message, subIds));
		win.on(`messageUpdate.${ns}`, (e, message, subIds) => onMessageAdd(message, subIds));
		win.on(`reactionUpdate.${ns}`, () => scrollToBottomCheck());
		win.on(`focus.${ns}`, () => readScrolledMessages());

		U.Common.getScrollContainer(isPopup).on(`scroll.${ns}`, e => onScroll(e));
	};

	const loadDepsAndReplies = (list: I.ChatMessage[], callBack?: () => void) => {
		loadReplies(getReplyIds(list), () => {
			loadDeps(getDepsIds(list), callBack);
		});
	};

	const loadState = (callBack?: () => void) => {
		const chatId = getChatId();
		const subId = getSubId();

		if (!chatId) {
			return;
		};

		C.ChatSubscribeLastMessages(chatId, 1, subId, (message: any) => {
			if (message.state) {
				S.Chat.setState(subId, message.state, false);
			};

			if (callBack) {
				callBack();
			};
		});
	};

	const subscribeMessages = (clear: boolean, callBack?: () => void) => {
		const chatId = getChatId();
		const subId = getSubId();

		if (!chatId) {
			return;
		};

		C.ChatSubscribeLastMessages(chatId, J.Constant.limit.chat.messages, subId, (message: any) => {
			if (message.error.code) {
				if (callBack) {
					callBack();
				};
				return;
			};

			if (message.state) {
				S.Chat.setState(subId, message.state, false);
			};

			const messages = message.messages || [];
			if (messages.length < J.Constant.limit.chat.messages) {
				setIsLoaded(true);
			};

			loadDepsAndReplies(messages, () => {
				if (messages.length && clear) {
					S.Chat.set(subId, messages);
				} else {
					setDummy(dummy + 1);
				};

				if (callBack) {
					callBack();
				};
			});
		});
	};

	const loadMessages = (dir: number, clear: boolean, callBack?: () => void) => {
		const chatId = getChatId();
		const subId = getSubId();

		if (!chatId || isLoading.current) {
			return;
		};

		if (!clear && (dir > 0) && isLoaded) {
			setIsBottom(true);
			return;
		};

		isLoading.current = true;

		if (clear) {
			subscribeMessages(clear, () => {
				isLoading.current = false;
				setIsBottom(true);

				if (callBack) {
					callBack();
				};
			});
		} else {
			const messages = S.Chat.getList(subId);
			if (!messages.length) {
				isLoading.current = false;
				return;
			};

			const first = messages[0];
			const before = dir < 0 ? messages[0].orderId : '';
			const after = dir > 0 ? messages[messages.length - 1].orderId : '';

			if (!before && !after) {
				isLoading.current = false;
				return;
			};

			C.ChatGetMessages(chatId, before, after, J.Constant.limit.chat.messages, false, (message: any) => {
				isLoading.current = false;

				if (message.error.code) {
					setIsLoaded(true);

					if (callBack) {
						callBack();
					};
					return;
				};

				const messages = message.messages || [];

				if (dir > 0) {
					if (messages.length < J.Constant.limit.chat.messages) {
						setIsLoaded(true);
						setIsBottom(true);
						subscribeMessages(false);
					} else {
						setIsBottom(false);
					};
				} else {
					setIsBottom(false);
				};

				loadDepsAndReplies(messages, () => {
					if (messages.length) {
						S.Chat[(dir < 0 ? 'prepend' : 'append')](subId, messages);

						if (first && (dir < 0)) {
							scrollToMessage(first.id);
						};
					};

					if (callBack) {
						callBack();
					};
				});
			});
		};
	};

	const loadMessagesByOrderId = (orderId: string, callBack?: () => void) => {
		const chatId = getChatId();
		const subId = getSubId();

		if (!chatId) {
			return;
		};

		const limit = Math.ceil(J.Constant.limit.chat.messages / 2);

		let list = [];

		C.ChatGetMessages(chatId, orderId, '', limit, true, (message: any) => {
			if (!message.error.code && message.messages.length) {
				list = list.concat(message.messages);
			};

			C.ChatGetMessages(chatId, '', orderId, limit, false, (message: any) => {
				if (!message.error.code && message.messages.length) {
					list = list.concat(message.messages);
				};

				loadDepsAndReplies(list, () => {
					S.Chat.set(subId, list);

					if (callBack) {
						callBack();
					};
				});
			});
		});
	};

	const getMessages = () => {
		return S.Chat.getList(getSubId());
	};

	const getDepsIds = (list: any[]) => {
		const subId = getSubId();
		const markTypes = [ I.MarkType.Object, I.MarkType.Mention ];

		let attachments = [];
		let marks = [];

		if (formRef.current) {
			attachments = attachments.concat(formRef.current.getAttachments().filter(it => !it.isTmp).map(it => it.id));
			marks = marks.concat(formRef.current.getMarks());

			const replyingId = formRef.current.getReplyingId();

			if (replyingId) {
				const message = S.Chat.getMessageById(subId, replyingId);
				if (message) {
					list.push(message);
				};
			};
		};

		list.forEach(it => {
			attachments = attachments.concat((it.attachments || []).map(it => it.target));
			marks = marks.concat(it.content.marks || []);
		});

		marks = marks.filter(it => markTypes.includes(it.type) && it.param).map(it => it.param);

		return attachments.concat(marks).filter(it => it);
	};

	const getReplyIds = (list: any[]) => {
		return (list || []).filter(it => it.replyToMessageId).map(it => it.replyToMessageId);
	};

	const loadDeps = (ids: string[], callBack?: () => void) => {
		if (!ids.length) {
			if (callBack) {
				callBack();
			};
			return;
		};

		U.Subscription.subscribeIds({
			subId: getSubId(),
			ids,
			noDeps: true,
			keys: U.Subscription.chatRelationKeys(),
			updateDetails: true,
		}, () => {
			if (callBack) {
				callBack();
			};
		});
	};

	const loadReplies = (ids: string[], callBack?: () => void) => {
		if (!ids.length) {
			if (callBack) {
				callBack();
			};
			return;
		};

		const chatId = getChatId();
		const subId = getSubId();

		C.ChatGetMessagesByIds(chatId, ids, (message: any) => {
			if (!message.error.code) {
				message.messages.forEach(it => S.Chat.setReply(subId, it));
			};

			if (callBack) {
				callBack();
			};
		});
	};

	const getSections = () => {
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

				if (prev && ((item.creator != prev.creator) || (item.createdAt - prev.createdAt >= GROUP_TIME) || item.replyToMessageId)) {
					item.isFirst = true;

					if (prev) {
						prev.isLast = true;
					};
				};
			};

			section.list[0].isFirst = true;
			section.list[length - 1].isLast = true;

			section.list.sort((c1, c2) => U.Data.sortByOrderId(c1, c2));
		});

		sections.sort((c1, c2) => U.Data.sortByNumericKey('createdAt', c1, c2, I.SortType.Asc));

		return sections;
	};

	const getItems = useCallback(() => {
		let items = [];
		for (const section of sections) {
			items.push({ key: section.key, createdAt: section.createdAt, isSection: true });
			items = items.concat(section.list);
		};
		return items;
	}, [ messages.length ]);

	const onMessageAdd = (message: I.ChatMessage, subIds: string[]) => {
		if (subIds.includes(getSubId())) {
			loadDepsAndReplies([ message ], () => scrollToBottomCheck());
		};
	};

	const onContextMenu = (e: MouseEvent, item: any, onMore?: boolean) => {
		if (readonly) {
			return;
		};

		const message = `#block-${block.id} #item-${item.id}`;
		const container = U.Common.getScrollContainer(isPopup);

		const menuParam: Partial<I.MenuParam> = {
			classNameWrap: 'fromBlock',
			onOpen: () => {
				$(message).addClass('hover');
				container.addClass('over');
			},
			onClose: () => {
				$(message).removeClass('hover');
				container.removeClass('over');
			},
			data: {
				options: getMessageMenuOptions(item, onMore),
				onSelect: (e, option) => {
					switch (option.id) {
						case 'reaction': {
							messageRefs.current[item.id]?.onReactionAdd();
							break;
						};

						case 'copy': {
							const block = new M.Block({
								type: I.BlockType.Text,
								content: item.content,
							});
					
							U.Common.clipboardCopy({ 
								text: U.Common.sanitize(Mark.insertEmoji(item.content.text, item.content.marks)),
								anytype: {
									range: { from: 0, to: item.content.text.length },
									blocks: [ block ],
								},
							});

							analytics.event('ClickMessageMenuCopy');
							break;
						};

						case 'link': {
							const object = S.Detail.get(rootId, rootId);

							U.Object.copyLink(object, space, 'deeplink', '', `&messageOrder=${encodeURIComponent(item.orderId)}`);
							analytics.event('ClickMessageMenuLink');
							break;
						};

						case 'reply': {
							formRef.current.onReply(item);
							break;
						};

						case 'edit': {
							formRef.current.onEdit(item);
							break;
						};

						case 'delete': {
							formRef.current.onDelete(item.id);
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

	const renderDates = () => {
		const node = $(nodeRef.current);
		const dates = node.find('.sectionDate');
		const offset = J.Size.header + 8;
		const container = U.Common.getScrollContainer(isPopup);
		const top = container.offset().top;

		raf.cancel(frameRef.current);
		frameRef.current = raf(() => {
			dates.css({ position: 'static', left: '', top: '', width: '' });

			let last = null;

			dates.each((i, item: any) => {
				item = $(item);

				const y = item.offset().top;
				if (y <= offset) {
					last = item;
				};
			});

			if (!last && dates.length) {
				last = dates.first();
			};

			if (last) {
				const width = last.outerWidth();
				const { left } = last.offset();

				last.css({ position: 'fixed', width, left, top: top + offset });
			};
		});
	};

	const onScroll = (e: any) => {
		const subId = getSubId();
		const container = U.Common.getScrollContainer(isPopup);
		const st = Math.ceil(container.scrollTop());
		const max = U.Common.getMaxScrollHeight(isPopup);
		const list = getMessagesInViewport();
		const state = S.Chat.getState(subId);
		const { lastStateId } = state;
		const isBottom = st >= max;

		setIsBottom(isBottom);

		if (!isAutoLoadDisabled.current) {
			if (st <= 0) {
				loadMessages(-1, false);
			};

			if (isBottom) {
				loadMessages(1, false);
			};
		};

		renderDates();

		if (S.Common.windowIsFocused && list.length) {
			list.forEach(it => {
				scrolledItems.current.add(it.id);

				if (!it.isReadMessage) {
					readMessage(it.id, it.orderId, lastStateId, I.ChatReadType.Message);
				};
				if (!it.isReadMention && it.hasMention) {
					readMessage(it.id, it.orderId, lastStateId, I.ChatReadType.Mention);
				};
			});
		};

		window.clearTimeout(timeoutScrollStop.current);
		timeoutScrollStop.current = window.setTimeout(() => onReadStop(), 300);

		top.current = st;

		Preview.tooltipHide(true);
		Preview.previewHide(true);
	};

	const readMessage = (id: string, orderId: string, lastStateId: string, type: I.ChatReadType) => {
		const chatId = getChatId();
		const subId = getSubId();

		if (type == I.ChatReadType.Message) {
			S.Chat.setReadMessageStatus(subId, [ id ], true);
		};
		if (type == I.ChatReadType.Mention) {
			S.Chat.setReadMentionStatus(subId, [ id ], true);
		};

		C.ChatReadMessages(chatId, orderId, orderId, lastStateId, type);
	};

	const onReadStop = () => {
		if (!scrolledItems.current.size) {
			return;
		};

		const chatId = getChatId();
		const subId = getSubId();
		const ids: string[] = [ ...scrolledItems.current ] as string[];
		const first = S.Chat.getMessageById(subId, ids[0]);
		const last = S.Chat.getMessageById(subId, ids[ids.length - 1]);
		const state = S.Chat.getState(subId);
		const { lastStateId } = state;

		if (S.Common.windowIsFocused) {
			if (first && last) {
				C.ChatReadMessages(chatId, first.orderId, last.orderId, lastStateId, I.ChatReadType.Message);
				C.ChatReadMessages(chatId, first.orderId, last.orderId, lastStateId, I.ChatReadType.Mention);
			};

			S.Chat.setReadMessageStatus(subId, ids, true);
			S.Chat.setReadMentionStatus(subId, ids, true);
		};

		scrolledItems.current.clear();
	};

	const onScrollToBottomClick = () => {
		loadMessages(1, true, () => scrollToBottom(true));
	};

	const getMessageScrollOffset = (id: string): number => {
		const ref = messageRefs.current[id];
		if (!ref) {
			return 0;
		};

		const node = $(ref.getNode());

		return node.length ? node.offset().top + node.outerHeight() : 0;
	};

	const getMessageScrollPosition = (id: string): number => {
		const ref = messageRefs.current[id];
		if (!ref) {
			return 0;
		};

		const node = $(ref.getNode());
		return node.length ? node.position().top + node.outerHeight() : 0;
	};

	const getMessagesInViewport = () => {
		const messages = getMessages();
		const container = U.Common.getScrollContainer(isPopup);
		const formHeight = Number($(formRef.current?.getNode()).outerHeight()) || 0;
		const ch = container.outerHeight();
		const max = ch - formHeight;
		const ret = [];

		messages.forEach((it: any) => {
			const st = getMessageScrollOffset(it.id);

			if ((st >= 0) && (st <= max)) {
				ret.push(it);
			};
		});

		return ret;
	};

	const getMessageMenuOptions = (message: I.ChatMessage, noControls: boolean): I.Option[] => {
		const { reactions } = message;
		const limit = J.Constant.limit.chat.reactions;
		const self = reactions.filter(it => it.authors.includes(account.id));
		const noReaction = (self.length >= limit.self) || (reactions.length >= limit.all);

		let options: any[] = [];

		if (message.content.text) {
			options.push({ id: 'copy', icon: 'chat-copy', name: translate('blockChatCopyText') });
		};

		options.push({ id: 'link', icon: 'chat-link', name: translate('commonCopyLink') });

		if (message.creator == S.Auth.account.id) {
			options = options.concat([
				{ id: 'edit', icon: 'chat-pencil', name: translate('commonEdit') },
				{ isDiv: true },
				{ id: 'delete', icon: 'remove-red', name: translate('commonDelete'), color: 'red' },
			]);
		};

		if (!noControls) {
			options = ([
				!noReaction ? { id: 'reaction', icon: 'chat-reaction', name: translate('blockChatReactionAdd') } : null,
				{ id: 'reply', icon: 'chat-reply', name: translate('blockChatReply') },
				options.length ? { isDiv: true } : null,
			].filter(it => it)).concat(options);
		};

		return options;
	};

	const readScrolledMessages = () => {
		scrolledItems.current = new Set(getMessagesInViewport().map(it => it.id));
		onReadStop();
	};

	const scrollToMessage = (id: string, animate?: boolean, highlight?: boolean) => {
		if (!id) {
			return;
		};

		const state = S.Chat.getState(subId);
		const { lastStateId } = state;
		const message = S.Chat.getMessageById(subId, id);

		if (message) {
			readMessage(id, message.orderId, lastStateId, I.ChatReadType.Message);
			readMessage(id, message.orderId, lastStateId, I.ChatReadType.Mention);
		};

		if (!hasScroll()) {
			readScrolledMessages();
			return;
		};

		raf(() => {
			const container = U.Common.getScrollContainer(isPopup);
			const top = getMessageScrollPosition(id);
			const y = Math.max(0, top - container.height() / 2 - J.Size.header);

			setIsBottom(false);
			setAutoLoadDisabled(true);

			const cb = () => {
				readScrolledMessages();

				if (highlight) {
					highlightMessage(id);
				};

				window.setTimeout(() => setAutoLoadDisabled(false), 50);
			};

			if (animate) {
				container.stop(true, true).animate({ scrollTop: y }, 300, cb);
			} else {
				container.scrollTop(y);
				cb();
			};
		});
	};

	const scrollToBottom = (animate?: boolean) => {
		setIsBottom(true);

		if (!hasScroll()) {
			readScrolledMessages();
			return;
		};

		raf(() => {
			const y = U.Common.getMaxScrollHeight(isPopup);
			const top = U.Common.getScrollContainerTop(isPopup);

			if (top >= y) {
				return;
			};

			const container = U.Common.getScrollContainer(isPopup);
			const cb = () => {
				readScrolledMessages();
				window.setTimeout(() => setAutoLoadDisabled(false), 50);
			};

			setAutoLoadDisabled(true);

			if (animate) {
				container.stop(true, true).animate({ scrollTop: y }, 300, cb);
			} else {
				container.scrollTop(y);
				cb();
			};
		});
	};

	const scrollToBottomCheck = () => {
		if (isBottom.current) {
			scrollToBottom(false);
		};
	};

	const onReplyEdit = (e: MouseEvent, message: any) => {
		formRef.current.onReply(message);
		scrollToBottomCheck();
	};

	const onReplyClick = (e: MouseEvent, item: any) => {
		analytics.event('ClickScrollToReply');

		const subId = getSubId();
		const message = S.Chat.getMessageById(subId, item.replyToMessageId);

		if (message) {
			scrollToMessage(message.id, true, true);
			return;
		};

		setIsLoaded(false);
		setIsBottom(false);

		C.ChatGetMessagesByIds(chatId, [ item.replyToMessageId ], (message: any) => {
			if (message.error.code || !message.messages.length) {
				return;
			};

			const reply = message.messages[0];

			S.Chat.clear(subId);
			loadMessagesByOrderId(reply.orderId, () => scrollToMessage(reply.id, true, true));
		});
	};

	const getReplyContent = (message: any): { title: string; text: string; attachment: any; isMultiple: boolean; } => {
		const subId = getSubId();
		const { creator, content } = message;
		const author = U.Space.getParticipant(U.Space.getParticipantId(S.Common.space, creator));
		const title = U.Common.sprintf(translate('blockChatReplying'), author?.name);
		const layouts = U.Object.getFileLayouts().concat(I.ObjectLayout.Bookmark);
		const attachments = (message.attachments || []).map(it => S.Detail.get(subId, it.target)).filter(it => !it._empty_ && !it.isDeleted);
		const l = attachments.length;

		let text: string = '';
		let attachmentText: string = '';
		let attachment: any = null;
		let isMultiple: boolean = false;

		if (content.text) {
			text = U.Common.sanitize(Mark.toHtml(content.text, content.marks));
			text = text.replace(/\n\r?/g, ' ');
		};

		if (!l) {
			return { title, text, attachment: null, isMultiple: false };
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

	const onDragOver = (e: DragEvent) => {
		formRef.current?.onDragOver(e);
	};

	const onDragLeave = (e: DragEvent) => {
		formRef.current?.onDragLeave(e);
	};

	const onDrop = (e: DragEvent) => {
		formRef.current?.onDrop(e);
	};

	const setIsBottom = (v: boolean) => {
		isBottom.current = v;

		const node = $(formRef.current?.getNode());
		const btn = node.find(`#navigation-${I.ChatReadType.Message}`);

		btn.toggleClass('active', !v);
	};

	const setAutoLoadDisabled = (v: boolean) => {
		isAutoLoadDisabled.current = v;
	};

	const hasScroll = () => {
		return U.Common.getMaxScrollHeight(isPopup) > 0;
	};

	const highlightMessage = (id: string, orderId?: string) => {
		if (!id && !orderId) {
			return;
		};

		const subId = getSubId();

		let targetId = id;
		if (!targetId && orderId) {
			const target = S.Chat.getMessageByOrderId(subId, orderId);

			if (target) {
				targetId = target.id;
			};
		};

		if (targetId && messageRefs.current[targetId]) {
			messageRefs.current[targetId].highlight();
		};
	};

	const init = () => {
		initialRender.current = true;

		loadState(() => {
			const subId = getSubId();
			const match = keyboard.getMatch(isPopup);
			const state = S.Chat.getState(subId);
			const orderId = match.params.messageOrder || state.messageOrderId;
			const cb = () => scrollToBottom(false);

			if (orderId) {
				loadMessagesByOrderId(orderId, () => {
					const target = S.Chat.getMessageByOrderId(subId, orderId);

					if (target) {
						setFirstUnreadOrderId(target.orderId);
					} else {
						loadMessages(1, true, cb);
					};
				});
			} else {
				loadMessages(1, true, cb);
			};
		});

		analytics.event('ScreenChat');
	};

	const resize = () => {
		renderDates();

		const container = U.Common.getScrollContainer(isPopup);
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		container.off(`scroll.${ns}`);

		window.clearTimeout(timeoutResize.current);
		timeoutResize.current = window.setTimeout(() => {
			container.on(`scroll.${ns}`, e => onScroll(e));
		}, 50);
	};

	const sections = getSections();
	const isEmpty = isLoaded && !messages.length;
	const items = getItems();

	let content = null;
	if (isEmpty) {
		content = (
			<div className="chatEmptyState">
				<div className="inner">
					<Title text={translate('blockChatEmptyTitle')} />
					<div className="item">
						<Icon className="infinity" />
						<Label text={translate('blockChatEmptyItem1')} />
					</div>
					<div className="item">
						<Icon className="wifi" />
						<Label text={translate('blockChatEmptyItem2')} />
					</div>
					<div className="item">
						<Icon className="key" />
						<Label text={translate('blockChatEmptyItem3')} />
					</div>
					<div className="buttons">
						<Button 
							onClick={() => Action.openSpaceShare(analytics.route.chat)} 
							text={translate('blockChatEmptyShareInviteLink')} 
							className="c28" 
							color="blank" 
						/>
					</div>
				</div>
			</div>
		);
	} else {
		content = (
			<div className="scroll">
				{items.map(item => {
					if (item.isSection) {
						return <SectionDate key={item.key} date={item.createdAt} />;
					} else {
						return (
							<Message
								ref={ref => messageRefs.current[item.id] = ref}
								key={item.id}
								{...props}
								id={item.id}
								rootId={chatId}
								blockId={block.id}
								subId={subId}
								isNew={item.orderId == firstUnreadOrderId}
								hasMore={!!getMessageMenuOptions(item, true).length}
								onContextMenu={e => onContextMenu(e, item)}
								onMore={e => onContextMenu(e, item, true)}
								onReplyEdit={e => onReplyEdit(e, item)}
								onReplyClick={e => onReplyClick(e, item)}
								getReplyContent={getReplyContent}
								scrollToBottom={scrollToBottomCheck}
							/>
						);
					};
				})}
			</div>
		);
	};

	useEffect(() => {
		rebind();
		init();

		return () => {
			unbind();

			window.clearTimeout(timeoutInterface.current);
			window.clearTimeout(timeoutScrollStop.current);
		};
	}, []);

	useEffect(() => {
		init();
	}, [ space, chatId ]);

	useLayoutEffect(() => {
		initialRender.current = false;
		scrollToBottomCheck();
	}, [ messages.length ]);

	useLayoutEffect(() => {
		const target = S.Chat.getMessageByOrderId(subId, firstUnreadOrderId);
		if (target) {
			scrollToMessage(target.id);
		};
	}, [ firstUnreadOrderId ]);

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
		resize,
		onDragOver,
		onDragLeave,
		onDrop,
	}));

	return (
		<div 
			ref={nodeRef}
			className="wrap"
			onDragOver={onDragOver} 
			onDragLeave={onDragLeave} 
			onDrop={onDrop}
		>
			<div id="scrollWrapper" ref={scrollWrapperRef} className="scrollWrapper">
				{content}
			</div>

			<Form 
				ref={formRef}
				{...props}
				rootId={chatId}
				blockId={block.id}
				subId={subId}
				onScrollToBottomClick={onScrollToBottomClick}
				scrollToBottom={scrollToBottomCheck}
				scrollToMessage={scrollToMessage}
				loadMessagesByOrderId={loadMessagesByOrderId}
				getMessages={getMessages}
				getReplyContent={getReplyContent}
				highlightMessage={highlightMessage}
				loadDepsAndReplies={loadDepsAndReplies}
				isEmpty={isEmpty}
			/>
		</div>
	);

}));

export default BlockChat;