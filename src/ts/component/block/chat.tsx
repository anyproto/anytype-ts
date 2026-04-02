import React, { forwardRef, useRef, useEffect, DragEvent, MouseEvent, useState, useLayoutEffect, useImperativeHandle } from 'react';
import raf from 'raf';

import Form from './chat/form';
import Message from './chat/message';
import Empty from './chat/empty';
import SectionDate from './chat/message/date';
import { Icon } from 'Component';
import * as I from 'Interface';
import * as M from 'Model';
import Storage from 'Lib/storage';

interface RefProps {
	forceUpdate: () => void;
	resize: () => void;
	onDragOver: (e: DragEvent) => void;
	onDragLeave: (e: DragEvent) => void;
	onDrop: (e: DragEvent) => void;
	getFormRef: () => any;
	loadAndScrollToMessage: (id: string) => void;
};

const GROUP_TIME = 300;
const DOWNLOAD_LAYOUTS = [
	I.ObjectLayout.File,
	I.ObjectLayout.Image,
	I.ObjectLayout.Video,
	I.ObjectLayout.Audio,
	I.ObjectLayout.Pdf,
];

const BlockChat = forwardRef<RefProps, I.BlockComponent>((props, ref) => {

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
	const isBottom = useRef(false);
	const isAutoLoadDisabled = useRef(false);
	const [ firstUnreadOrderId, setFirstUnreadOrderId ] = useState('');
	const [ dummy, setDummy ] = useState(0);
	const [ isLoaded, setIsLoaded ] = useState(false);
	const frameRef = useRef(0);
	const namespace = U.Dom.getEventNamespace(isPopup);
	const jumpIds = useRef([]);
	const prevDepsKey = useRef('');
	const prevReplyKey = useRef('');
	const object = S.Detail.get(rootId, rootId, []);

	const getChatId = () => {
		const object = S.Detail.get(rootId, rootId, [ 'chatId' ]);

		if (object._empty_) {
			return rootId;
		};

		return object.chatId || rootId;
	};

	const getAnalyticsChatId = () => {
		const chatId = getChatId();
		return S.Detail.get(chatId, chatId, [ 'analyticsChatId' ]).analyticsChatId;
	};

	const getSubId = () => {
		return S.Chat.getChatSubId('chat', space, getChatId());
	};

	const chatId = getChatId();
	const subId = getSubId();
	const messages = S.Chat.getList(subId);
	const analyticsChatId = getAnalyticsChatId();

	const scrollHandlerRef = useRef<((e: Event) => void) | null>(null);
	const messageAddHandlerRef = useRef<((e: Event) => void) | null>(null);
	const messageUpdateHandlerRef = useRef<((e: Event) => void) | null>(null);
	const reactionUpdateHandlerRef = useRef<((e: Event) => void) | null>(null);
	const focusHandlerRef = useRef<((e: Event) => void) | null>(null);

	const unbind = () => {
		if (messageAddHandlerRef.current) {
			window.removeEventListener('messageAdd', messageAddHandlerRef.current);
			messageAddHandlerRef.current = null;
		};
		if (messageUpdateHandlerRef.current) {
			window.removeEventListener('messageUpdate', messageUpdateHandlerRef.current);
			messageUpdateHandlerRef.current = null;
		};
		if (reactionUpdateHandlerRef.current) {
			window.removeEventListener('reactionUpdate', reactionUpdateHandlerRef.current);
			reactionUpdateHandlerRef.current = null;
		};
		if (focusHandlerRef.current) {
			window.removeEventListener('focus', focusHandlerRef.current);
			focusHandlerRef.current = null;
		};

		const container = U.Dom.getScrollContainer(isPopup);
		if (container && scrollHandlerRef.current) {
			container.removeEventListener('scroll', scrollHandlerRef.current);
			scrollHandlerRef.current = null;
		};
	};

	const rebind = () => {
		unbind();

		messageAddHandlerRef.current = (e: Event) => {
			const detail = (e as CustomEvent).detail || {};
			onMessageAdd(detail.message, detail.subIds);
		};
		messageUpdateHandlerRef.current = (e: Event) => {
			const detail = (e as CustomEvent).detail || {};
			onMessageAdd(detail.message, detail.subIds);
		};
		reactionUpdateHandlerRef.current = () => scrollToBottomCheck();
		focusHandlerRef.current = () => readScrolledMessages();

		window.addEventListener('messageAdd', messageAddHandlerRef.current);
		window.addEventListener('messageUpdate', messageUpdateHandlerRef.current);
		window.addEventListener('reactionUpdate', reactionUpdateHandlerRef.current);
		window.addEventListener('focus', focusHandlerRef.current);

		const container = U.Dom.getScrollContainer(isPopup);
		if (container) {
			scrollHandlerRef.current = (e: Event) => onScroll(e);
			container.addEventListener('scroll', scrollHandlerRef.current);
		};
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
				S.Chat.setState(subId, message.state);
			};

			callBack?.();
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
				callBack?.();
				return;
			};

			if (message.state) {
				S.Chat.setState(subId, message.state);
			};

			const messages = message.messages || [];
			if (!messages.length) {
				setLoaded(true);
				callBack?.();
				return;
			};

			loadDepsAndReplies(messages, () => {
				if (clear) {
					S.Chat.set(subId, messages);
				};

				if (messages.length < J.Constant.limit.chat.messages) {
					setLoaded(true);
				} else {
					setDummy(dummy + 1);
				};

				callBack?.();
			});
		});
	};

	const loadMessages = (dir: number, clear: boolean, callBack?: () => void) => {
		const chatId = getChatId();
		const subId = getSubId();

		if (!chatId) {
			return;
		};

		if (!clear && (dir > 0) && isLoaded) {
			setIsBottom(true);
			return;
		};

		if (clear) {
			subscribeMessages(clear, () => {
				setIsBottom(true);
				callBack?.();
			});
		} else {
			const messages = S.Chat.getList(subId);
			if (!messages.length) {
				return;
			};

			const first = messages[0];
			const before = dir < 0 ? messages[0].orderId : '';
			const after = dir > 0 ? messages[messages.length - 1].orderId : '';

			if (!before && !after) {
				return;
			};

			C.ChatGetMessages(chatId, before, after, J.Constant.limit.chat.messages, false, (message: any) => {
				if (message.error.code) {
					setLoaded(true);
					callBack?.();
					return;
				};

				const messages = message.messages || [];

				if (dir > 0) {
					if (messages.length < J.Constant.limit.chat.messages) {
						setLoaded(true);
						setIsBottom(true);
						subscribeMessages(false);
					} else {
						setIsBottom(false);
					};
				} else {
					const y = U.Dom.getMaxScrollHeight(isPopup);
					const top = U.Dom.getScrollContainerTop(isPopup);

					setIsBottom(!(top < y));
				};

				loadDepsAndReplies(messages, () => {
					if (messages.length) {
						S.Chat[(dir < 0 ? 'prepend' : 'append')](subId, messages);

						if (first && (dir < 0)) {
							scrollToMessage(first.id);
						};
					};

					callBack?.();
				});
			});
		};
	};

	const loadMessagesByOrderId = (orderId: string, callBack?: () => void) => {
		const chatId = getChatId();
		if (!chatId) {
			return;
		};

		const subId = getSubId();
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
					callBack?.();
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
			callBack?.();
			return;
		};

		const key = [ ...ids ].sort().join(',');

		if (key == prevDepsKey.current) {
			callBack?.();
			return;
		};

		prevDepsKey.current = key;

		const subId = getSubId();
		const keys = U.Subscription.chatRelationKeys();

		U.Subscription.destroyList([ subId ], false, () => {
			U.Subscription.subscribeIds({
				ids,
				subId,
				keys,
				noDeps: true,
				ignoreHidden: true,
				crossSpace: true,
			}, callBack);
		});
	};

	const loadReplies = (ids: string[], callBack?: () => void) => {
		if (!ids.length) {
			callBack?.();
			return;
		};

		const key = [ ...ids ].sort().join(',');

		if (key == prevReplyKey.current) {
			callBack?.();
			return;
		};

		prevReplyKey.current = key;

		const chatId = getChatId();
		const subId = getSubId();

		C.ChatGetMessagesByIds(chatId, ids, (message: any) => {
			if (!message.error.code) {
				message.messages.forEach(it => S.Chat.setReply(subId, it));
			};

			callBack?.();
		});
	};

	const getSections = () => {
		const sections = [];

		const sectionMap = new Map();
		messages.forEach(item => {
			const key = U.Date.dateWithFormat(I.DateFormat.ShortUS, item.createdAt);
			let section = sectionMap.get(key);

			if (!section) {
				section = { createdAt: item.createdAt, key, isSection: true, list: [] };
				sectionMap.set(key, section);
				sections.push(section);
			};
			section.list.push(item);
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

	const getItems = () => {
		let items = [];
		for (const section of sections) {
			items.push({ key: section.key, createdAt: section.createdAt, isSection: true });
			items = items.concat(section.list);
		};
		return items;
	};

	const onMessageAdd = (message: I.ChatMessage, subIds: string[]) => {
		subIds = subIds || [];

		const subId = getSubId();

		if (subIds.includes(subId)) {
			loadDepsAndReplies(S.Chat.getList(subId).concat(message), () => scrollToBottomCheck());
		};
	};

	const getDownloadableAttachments = (message: I.ChatMessage): any[] => {
		return (message.attachments || [])
			.map(it => S.Detail.get(subId, it.target))
			.filter(it => !it._empty_ && DOWNLOAD_LAYOUTS.includes(it.layout));
	};

	const canAddReaction = (message: I.ChatMessage): boolean => {
		const { reactions } = message;
		const limit = J.Constant.limit.chat.reactions;
		const self = reactions.filter(it => it.authors.includes(account.id));
		return (self.length < limit.self) && (reactions.length < limit.all);
	};

	const getQuickReactionEmojis = (): { id: string, skin: number, native: string }[] => {
		const defaults = [
			{ id: 'heart', skin: 1 },
			{ id: 'joy', skin: 1 },
			{ id: 'open_mouth', skin: 1 },
			{ id: 'cry', skin: 1 },
			{ id: 'rage', skin: 1 },
			{ id: '+1', skin: 1 },
		];

		const storage = Storage.get('smile') || {};
		const recent = (storage.recent || []).slice(0, 6);
		const list = recent.length >= 6 ? recent : defaults;

		return list.map(it => ({
			id: it.id,
			skin: it.skin || 1,
			native: U.Smile.nativeById(it.id, it.skin || 1),
		})).filter(it => it.native);
	};

	const onContextMenu = (e: MouseEvent, item: any, onMore?: boolean) => {
		if (readonly) {
			return;
		};

		const message = `#block-${U.Common.esc(block.id)} #item-${U.Common.esc(item.id)}`;
		const isRightClick = !onMore;

		let satellite = null;

		if (isRightClick && canAddReaction(item)) {
			const emojis = getQuickReactionEmojis();

			satellite = (
				<div className="satellite emojiQuickReaction">
					{emojis.map((emoji, i) => (
						<div
							key={i}
							className="emojiItem"
							onClick={() => {
								const hasReaction = item.reactions.find(it => it.icon == emoji.native);

								C.ChatToggleMessageReaction(chatId, item.id, emoji.native);
								S.Menu.close('select');
								analytics.event(hasReaction ? 'RemoveReaction' : 'AddReaction', { chatId: analyticsChatId });
							}}
						>
							{emoji.native}
						</div>
					))}
					<div
						className="emojiItem emojiPlus"
						onClick={() => {
							S.Menu.close('select', () => {
								messageRefs.current[item.id]?.onReactionAdd();
							});
						}}
					>
						<Icon name="plus/menu" className="plus" />
					</div>
				</div>
			);
		};

		const messageEl = U.Dom.select(message);

		const menuParam: Partial<I.MenuParam> = {
			classNameWrap: 'fromBlock',
			onOpen: () => {
				U.Dom.addClass(messageEl, 'hover');
			},
			onClose: () => {
				U.Dom.removeClass(messageEl, 'hover');
			},
			data: {
				options: getMessageMenuOptions(item, onMore),
				satellite,
				onSelect: (e, option) => {
					switch (option.id) {
						case 'copy': {
							const block = new M.Block({
								type: I.BlockType.Text,
								content: item.content,
							});

							U.Common.clipboardCopy({
								text: U.String.sanitize(Mark.insertEmoji(item.content.text, item.content.marks)),
								anytype: {
									range: { from: 0, to: item.content.text.length },
									blocks: [ block ],
								},
							});

							analytics.event('ClickMessageMenuCopy', { chatId: analyticsChatId });
							break;
						};

						case 'link': {
							const object = S.Detail.get(rootId, rootId);

							U.Object.copyLink(object, space, 'deeplink', '', `&messageId=${item.id}`);
							analytics.event('ClickMessageMenuLink', { chatId: analyticsChatId });
							break;
						};

						case 'reply': {
							formRef.current?.onReply(item);
							break;
						};

						case 'edit': {
							formRef.current?.onEdit(item);
							break;
						};

						case 'delete': {
							formRef.current.onDelete(item.id);
							break;
						};

						case 'download': {
							const files = getDownloadableAttachments(item);

							if (files.length) {
								const file = files[0];
								Action.downloadFile(file.id, analytics.route.chat, file.layout == I.ObjectLayout.Image);
							};
							break;
						};
					};
				},
			},
		};

		if (onMore) {
			menuParam.element = `${message} .icon.commonMore`;
		} else {
			menuParam.recalcRect = () => ({ x: keyboard.mouse.page.x, y: keyboard.mouse.page.y, width: 0, height: 0 });
		};

		S.Menu.open('select', menuParam);
	};

	const renderDates = () => {
		const node = nodeRef.current;
		if (!node) return;

		const dates = U.Dom.selectAll('.sectionDate', node);
		const offset = J.Size.header + 8;
		const container = U.Dom.getScrollContainer(isPopup);
		const top = container?.getBoundingClientRect().top ?? 0;

		raf.cancel(frameRef.current);
		frameRef.current = raf(() => {
			dates.forEach((item: HTMLElement) => {
				item.style.position = 'static';
				item.style.left = '';
				item.style.top = '';
				item.style.width = '';
			});

			let last: HTMLElement = null;

			dates.forEach((item: HTMLElement) => {
				const rect = item.getBoundingClientRect();
				if (rect.top <= offset) {
					last = item;
				};
			});

			if (!last && dates.length) {
				last = dates[0];
			};

			if (last) {
				const width = last.offsetWidth;
				const rect = last.getBoundingClientRect();

				last.style.position = 'fixed';
				last.style.width = width + 'px';
				last.style.left = rect.left + 'px';
				last.style.top = (top + offset) + 'px';
			};
		});
	};

	const onScroll = (e: any) => {
		const subId = getSubId();
		const container = U.Dom.getScrollContainer(isPopup);
		const st = Math.ceil(container?.scrollTop ?? 0);
		const max = U.Dom.getMaxScrollHeight(isPopup);
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

			// Read reactions: only if the message with the unread reaction is within the visible range
			if (state.reactionOrderId && first && last) {
				const minOrderId = ids.reduce((min, id) => {
					const msg = S.Chat.getMessageById(subId, id);
					return (msg && (!min || (msg.orderId <= min))) ? msg.orderId : min;
				}, '');

				const maxOrderId = ids.reduce((max, id) => {
					const msg = S.Chat.getMessageById(subId, id);
					return (msg && (msg.orderId >= max)) ? msg.orderId : max;
				}, '');

				if ((state.reactionOrderId >= minOrderId) && (state.reactionOrderId <= maxOrderId)) {
					C.ChatReadReactions(chatId, maxOrderId);
				};
			};

			S.Chat.setReadMessageStatus(subId, ids, true);
			S.Chat.setReadMentionStatus(subId, ids, true);
		};

		scrolledItems.current.clear();
	};

	const getMessageScrollOffset = (id: string): number => {
		const ref = messageRefs.current[id];
		if (!ref) {
			return 0;
		};

		const node = ref.getNode() as HTMLElement;

		return node ? node.getBoundingClientRect().top + node.offsetHeight : 0;
	};

	const getMessageScrollPosition = (id: string): number => {
		const ref = messageRefs.current[id];
		if (!ref) {
			return 0;
		};

		const node = ref.getNode() as HTMLElement;
		return node ? node.offsetTop + node.offsetHeight : 0;
	};

	const getMessagesInViewport = () => {
		const messages = getMessages();
		const container = U.Dom.getScrollContainer(isPopup);
		const formNode = formRef.current?.getNode() as HTMLElement;
		const formHeight = formNode ? formNode.offsetHeight : 0;
		const ch = container?.offsetHeight ?? 0;
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
		const isSelf = message.creator == S.Auth.account.id;
		const downloadable = getDownloadableAttachments(message);
		const options: any[] = [];

		if (!noControls) {
			options.push({ id: 'reply', iconParam: { name: 'chat/buttons/reply' }, name: translate('blockChatReply') });
		};

		if (message.content.text) {
			options.push({ id: 'copy', iconParam: { name: 'menu/action/copy' }, name: translate('blockChatCopyText') });
		};

		if (downloadable.length == 1) {
			const isFileDownloading = S.Common.isDownloading(downloadable[0].id);

			options.push({ id: 'download', iconParam: { name: 'menu/action/download' }, name: isFileDownloading ? translate('commonDownloading') : translate('commonDownload'), disabled: isFileDownloading });
		};

		if (isSelf) {
			options.push({ isDiv: true });
			options.push({ id: 'edit', iconParam: { name: 'common/edit' }, name: translate('commonEdit') });
			options.push({ isDiv: true });
			options.push({ id: 'link', iconParam: { name: 'menu/action/pageLink' }, name: translate('commonCopyLink') });
			options.push({ id: 'delete', iconParam: { name: 'menu/action/remove', color: 'darkRed' }, name: translate('commonDelete'), color: 'red' });
		} else {
			if (options.length) {
				options.push({ isDiv: true });
			};
			options.push({ id: 'link', iconParam: { name: 'menu/action/pageLink' }, name: translate('commonCopyLink') });
		};

		return options;
	};

	const readScrolledMessages = () => {
		scrolledItems.current = new Set(getMessagesInViewport().map(it => it.id));
		onReadStop();
	};

	const loadAndScrollToMessage = (id: string) => {
		if (!id) {
			return;
		};

		const subId = getSubId();
		const message = S.Chat.getMessageById(subId, id);

		if (message) {
			scrollToMessage(message.id, true, true);
			return;
		};

		setLoaded(false);
		setIsBottom(false);

		C.ChatGetMessagesByIds(chatId, [ id ], (message: any) => {
			if (message.error.code || !message.messages.length) {
				return;
			};

			const first = message.messages[0];

			S.Chat.clear(subId);
			setIsBottom(false);
			loadMessagesByOrderId(first.orderId, () => {
				raf(() => scrollToMessage(first.id, true, true));
			});
		});
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

		const doScroll = () => {
			const container = U.Dom.getScrollContainer(isPopup);
			if (!container) {
				return;
			};

			const top = getMessageScrollPosition(id);
			const y = Math.max(0, top - (container.clientHeight / 2) - J.Size.header);

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
				container.scrollTo({ top: y, behavior: 'smooth' });
				window.setTimeout(cb, 300);
			} else {
				container.scrollTop = y;
				cb();
			};
		};

		if (animate) {
			raf(doScroll);
		} else {
			doScroll();
		};
	};

	const scrollToBottom = (animate?: boolean) => {
		setIsBottom(true);

		if (!hasScroll()) {
			readScrolledMessages();
			return;
		};

		const doScroll = () => {
			const y = U.Dom.getMaxScrollHeight(isPopup);
			const top = U.Dom.getScrollContainerTop(isPopup);

			if (top >= y) {
				return;
			};

			const container = U.Dom.getScrollContainer(isPopup);
			const cb = () => {
				readScrolledMessages();
				window.setTimeout(() => setAutoLoadDisabled(false), 50);
			};

			setAutoLoadDisabled(true);

			if (container) {
				if (animate) {
					container.scrollTo({ top: y, behavior: 'smooth' });
					window.setTimeout(cb, 300);
				} else {
					container.scrollTop = y;
					cb();
				};
			};
		};

		if (animate) {
			raf(doScroll);
		} else {
			doScroll();
		};
	};

	const scrollToBottomCheck = () => {
		if (isBottom.current) {
			scrollToBottom(false);
		};
	};

	const onScrollToBottomClick = () => {
		if (jumpIds.current.length) {
			const idx = jumpIds.current.length - 1;
			const id = jumpIds.current[idx];
			const ref = messageRefs.current[id];

			jumpIds.current.splice(idx, 1);

			if (!ref) {
				loadAndScrollToMessage(id);
				return;
			};

			const container = U.Dom.getScrollContainer(isPopup);
			const threshold = (container?.offsetHeight ?? 0) / 2;

			if (getMessageScrollOffset(id) < threshold) {
				onScrollToBottomClick();
			} else {
				scrollToMessage(id, true, true);
			};
		} else {
			loadMessages(1, true, () => scrollToBottom(true));
		};
	};

	const reloadAndScrollToBottom = () => {
		jumpIds.current = [];
		loadMessages(1, true, () => scrollToBottom(true));
	};

	const onReplyEdit = (e: MouseEvent, message: any) => {
		formRef.current?.onReply(message);
		scrollToBottomCheck();
	};

	const onReplyClick = (e: MouseEvent, item: any) => {
		jumpIds.current.push(item.id);
		loadAndScrollToMessage(item.replyToMessageId);
		analytics.event('ClickScrollToReply', { chatId: analyticsChatId });
	};

	const getReplyContent = (message: any): { title: string; text: string; attachment: any; isMultiple: boolean; } => {
		const subId = getSubId();
		const { creator, content } = message;
		const author = U.Space.getParticipant(U.Space.getParticipantId(S.Common.space, creator));
		const title = U.String.sprintf(translate('blockChatReplying'), author?.name);
		const layouts = U.Object.getFileLayouts().concat(I.ObjectLayout.Bookmark);
		const attachments = (message.attachments || []).map(it => S.Detail.get(subId, it.target)).filter(it => !it._empty_ && !it.isDeleted);
		const length = attachments.length;

		let text: string = '';
		let attachmentText: string = '';
		let attachment: any = null;
		let isMultiple: boolean = false;

		if (content.text) {
			text = U.String.sanitize(Mark.toHtml(content.text, content.marks)).replace(/\u200B/g, '');
			text = text.replace(/\n\r?/g, ' ');
		};

		if (!length) {
			return { title, text, attachment: null, isMultiple: false };
		};

		const first = attachments[0];

		if (length == 1) {
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

			attachmentText = text.length ? 
				`${U.Common.plural(length, translate(`plural${attachmentLayout}`))} (${length})` : 
				`${length} ${U.Common.plural(length, translate(`plural${attachmentLayout}`)).toLowerCase()}`;
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

		const formNode = formRef.current?.getNode() as HTMLElement;
		const btn = formNode ? U.Dom.select(`#navigation-${I.ChatReadType.Message}`, formNode) : null;

		if (btn) {
			U.Dom.toggleClass(btn, 'active', !v);
		};
	};

	const setAutoLoadDisabled = (v: boolean) => {
		isAutoLoadDisabled.current = v;
	};

	const hasScroll = () => {
		return U.Dom.getMaxScrollHeight(isPopup) > 0;
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
		setLoaded(false);
		setIsBottom(false);
		setFirstUnreadOrderId('');
		loadState(() => {
			const subId = getSubId();
			const match = keyboard.getMatch(isPopup);
			const state = S.Chat.getState(subId);

			const cb1 = (orderId: string) => {
				if (orderId) {
					loadMessagesByOrderId(orderId, () => {
						const target = S.Chat.getMessageByOrderId(subId, orderId);
						if (target) {
							setFirstUnreadOrderId(target.orderId);
						} else {
							loadMessages(1, true, cb2);
						};
					});
				} else {
					loadMessages(1, true, cb2);
				};
			};
			const cb2 = () => {
				scrollToBottom(false);
			};

			if (match.params.messageId) {
				C.ChatGetMessagesByIds(chatId, [ match.params.messageId ], (message: any) => {
					if (message.error.code) {
						return;
					};

					if (message.messages.length) {
						cb1(message.messages[0].orderId);
					} else {
						cb1(state.messageOrderId);
					};
				});
			} else {
				cb1(state.messageOrderId);
			};
		});
	};

	const resize = () => {
		renderDates();

		const container = U.Dom.getScrollContainer(isPopup);

		if (container && scrollHandlerRef.current) {
			container.removeEventListener('scroll', scrollHandlerRef.current);
		};

		window.clearTimeout(timeoutResize.current);
		timeoutResize.current = window.setTimeout(() => {
			if (container) {
				scrollHandlerRef.current = (e: Event) => onScroll(e);
				container.addEventListener('scroll', scrollHandlerRef.current);
			};
		}, 50);
	};

	const setLoaded = (v: boolean) => {
		setIsLoaded(v);
	};

	const sections = getSections();
	const isEmpty = isLoaded && !messages.length;
	const items = getItems();

	let content = null;
	if (isEmpty) {
		content = <Empty />;
	} else {
		content = (
			<div className="scroll">
				{items.map((item, i) => {
					if (item.isSection) {
						return <SectionDate key={item.key} date={item.createdAt} />;
					} else {
						return (
							<Message
								ref={ref => {
									if (ref) {
										messageRefs.current[item.id] = ref;
									} else {
										delete messageRefs.current[item.id];
									};
								}}
								key={item.id}
								{...props}
								id={item.id}
								rootId={chatId}
								blockId={block.id}
								subId={subId}
								analyticsChatId={analyticsChatId}
								index={i}
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

		return () => {
			unbind();

			window.clearTimeout(timeoutInterface.current);
			window.clearTimeout(timeoutScrollStop.current);
			window.clearTimeout(timeoutResize.current);
			raf.cancel(frameRef.current);
			messageRefs.current = {};
		};
	}, []);

	useEffect(() => {
		const match = keyboard.getMatch(isPopup);
	});

	useEffect(() => {
		rebind();
		init();
	}, [ rootId, space, chatId, analyticsChatId ]);

	useLayoutEffect(() => {
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
		getFormRef: () => formRef.current,
		loadAndScrollToMessage,
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

			{!object.isArchived ? (
				<Form 
					ref={formRef}
					{...props}
					rootId={chatId}
					blockId={block.id}
					subId={subId}
					analyticsChatId={analyticsChatId}
					onScrollToBottomClick={onScrollToBottomClick}
					scrollToBottom={scrollToBottomCheck}
					scrollToMessage={scrollToMessage}
					loadMessagesByOrderId={loadMessagesByOrderId}
					getMessages={getMessages}
					getReplyContent={getReplyContent}
					highlightMessage={highlightMessage}

					reloadAndScrollToBottom={reloadAndScrollToBottom}
					isEmpty={isEmpty}
					isBottom={isBottom}
				/>
			) : ''}
		</div>
	);

});

export default BlockChat;