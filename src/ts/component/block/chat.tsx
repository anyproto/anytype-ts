import React, { forwardRef, useRef, useEffect, useCallback, DragEvent, MouseEvent, useState, useLayoutEffect, useImperativeHandle } from 'react';
import raf from 'raf';

import Form from './chat/form';
import Message from './chat/message';
import Empty from './chat/empty';
import SectionDate from './chat/message/date';
import { Icon, IconObject } from 'Component';
import * as I from 'Interface';
import * as M from 'Model';
import Storage from 'Lib/storage';
import { reachedEdge, shouldRefetchForward } from 'Lib/util/chatWindow';

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
	const [ pinnedMessages, setPinnedMessages ] = useState<I.ChatMessage[]>([]);
	const [ pinnedIndex, setPinnedIndex ] = useState(-1);
	const scrollRafRef = useRef(0);
	const visibleIds = useRef<Set<string>>(new Set());
	const viewportObserver = useRef<IntersectionObserver | null>(null);
	const formResizeObserver = useRef<ResizeObserver | null>(null);
	const refSetters = useRef<Map<string, (r: any) => void>>(new Map());
	const namespace = U.Dom.getEventNamespace(isPopup);
	const jumpIds = useRef([]);
	const prevDepsKey = useRef('');
	const prevReplyKey = useRef('');
	const pendingScrollToBottom = useRef(false);
	const pendingScrollToMessageId = useRef('');
	const isLoadingPrev = useRef(false);
	const isLoadingNext = useRef(false);
	const loadEpoch = useRef(0);
	const object = S.Detail.get(rootId, rootId, []);

	const getChatId = () => {
		const object = S.Detail.get(rootId, rootId, [ 'chatId' ]);

		if (object._empty_) {
			return '';
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

	// Stable handler identities so <Message>'s memo holds across BlockChat's setDummy re-renders
	// (inline closures recreated every render were defeating it → full-list repaint on each prepend).
	// They resolve the message live via the O(1) store; the body handlers are recaptured when
	// subId/readonly/analyticsChatId change (add any newly-read render state to the deps below).
	const onContextMenuCb = useCallback((e: any, id: string) => onContextMenu(e, S.Chat.getMessageById(getSubId(), id)), [ subId, readonly, analyticsChatId ]);
	const onMoreCb = useCallback((e: any, id: string) => onContextMenu(e, S.Chat.getMessageById(getSubId(), id), true), [ subId, readonly, analyticsChatId ]);
	const onReplyEditCb = useCallback((e: any, id: string) => onReplyEdit(e, S.Chat.getMessageById(getSubId(), id)), [ subId ]);
	const onReplyClickCb = useCallback((e: any, id: string) => onReplyClick(e, S.Chat.getMessageById(getSubId(), id)), [ subId, analyticsChatId ]);
	const getReplyContentCb = useCallback((m: any) => getReplyContent(m), [ subId ]);
	const scrollToBottomCb = useCallback(() => scrollToBottomCheck(), []);
	const getMessageMenuOptionsCb = useCallback((m: any, noControls: boolean, url?: string, targetId?: string) => getMessageMenuOptions(m, noControls, url, targetId), [ subId, readonly, analyticsChatId ]);

	// Stable per-id ref-setter so the ref prop identity doesn't churn every render (which also
	// defeated memo and thrashed observe/unobserve). Wires the viewport observer (Phase 2).
	const getRefSetter = (id: string) => {
		let fn = refSetters.current.get(id);
		if (!fn) {
			fn = (r: any) => {
				if (r) {
					messageRefs.current[id] = r;

					const node = r.getNode?.() as HTMLElement;
					if (node) {
						node.setAttribute('data-viewport-id', id);
						viewportObserver.current?.observe(node);
					};
				} else {
					const node = messageRefs.current[id]?.getNode?.() as HTMLElement;
					if (node) {
						viewportObserver.current?.unobserve(node);
					};
					delete messageRefs.current[id];
					refSetters.current.delete(id);
				};
			};
			refSetters.current.set(id, fn);
		};
		return fn;
	};

	const scrollHandlerRef = useRef<((e: Event) => void) | null>(null);
	const messageAddHandlerRef = useRef<((e: Event) => void) | null>(null);
	const messageUpdateHandlerRef = useRef<((e: Event) => void) | null>(null);
	const reactionUpdateHandlerRef = useRef<((e: Event) => void) | null>(null);
	const pinnedStatusUpdateHandlerRef = useRef<((e: Event) => void) | null>(null);
	const focusHandlerRef = useRef<((e: Event) => void) | null>(null);

	const unbind = () => {
		if (messageAddHandlerRef.current) {
			U.Dom.removeEvent(window, 'messageAdd', messageAddHandlerRef.current);
			messageAddHandlerRef.current = null;
		};
		if (messageUpdateHandlerRef.current) {
			U.Dom.removeEvent(window, 'messageUpdate', messageUpdateHandlerRef.current);
			messageUpdateHandlerRef.current = null;
		};
		if (reactionUpdateHandlerRef.current) {
			U.Dom.removeEvent(window, 'reactionUpdate', reactionUpdateHandlerRef.current);
			reactionUpdateHandlerRef.current = null;
		};
		if (pinnedStatusUpdateHandlerRef.current) {
			U.Dom.removeEvent(window, 'pinnedStatusUpdate', pinnedStatusUpdateHandlerRef.current);
			pinnedStatusUpdateHandlerRef.current = null;
		};
		if (focusHandlerRef.current) {
			U.Dom.removeEvent(window, 'focus', focusHandlerRef.current);
			focusHandlerRef.current = null;
		};

		const container = U.Dom.getScrollContainer(isPopup);
		if (container && scrollHandlerRef.current) {
			U.Dom.removeEvent(container, 'scroll', scrollHandlerRef.current);
			scrollHandlerRef.current = null;
		};

		viewportObserver.current?.disconnect();
		viewportObserver.current = null;
		formResizeObserver.current?.disconnect();
		formResizeObserver.current = null;
		visibleIds.current.clear();

		// Drop any pending coalesced scroll frame so it can't run against a switched chat.
		raf.cancel(scrollRafRef.current);
		scrollRafRef.current = 0;
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
		pinnedStatusUpdateHandlerRef.current = (e: Event) => {
			const detail = (e as CustomEvent).detail || {};
			onPinnedStatusUpdate(detail.message, detail.isPinned, detail.subIds);
		};
		focusHandlerRef.current = () => {
			// Re-render from windowIsFocused observable can reset scrollTop — restore it after paint.
			// readScrolledMessages must run AFTER the restore write, because its state mutations
			// (setReadMessageStatus / setReadMentionStatus) trigger MobX re-renders that would
			// otherwise land with scrollTop=0 before the restore takes effect.
			const prevTop = top.current;
			const wasBottom = isBottom.current;

			raf(() => {
				if (wasBottom) {
					scrollToBottom(false);
				} else
				if (prevTop > 0) {
					const container = U.Dom.getScrollContainer(isPopup);
					if (container && (container.scrollTop != prevTop)) {
						container.scrollTop = prevTop;
					};
				};

				readScrolledMessages();
			});
		};

		U.Dom.addEvents(window, [
			['messageAdd', messageAddHandlerRef.current],
			['messageUpdate', messageUpdateHandlerRef.current],
			['reactionUpdate', reactionUpdateHandlerRef.current],
			['pinnedStatusUpdate', pinnedStatusUpdateHandlerRef.current],
			['focus', focusHandlerRef.current],
		]);

		const container = U.Dom.getScrollContainer(isPopup);
		if (container) {
			scrollHandlerRef.current = (e: Event) => onScrollRaf(e);
			U.Dom.addEvent(container, 'scroll', scrollHandlerRef.current);
		};

		bindViewportObserver();

		// The composer auto-grows as the user types; its height feeds the observer's bottom band.
		// Rebuild the observer when the form height changes so the read band never extends behind
		// the grown composer and marks hidden messages read (C.ChatReadMessages is irreversible).
		const formNode = formRef.current?.getNode() as HTMLElement;
		if (formNode) {
			formResizeObserver.current = new ResizeObserver(() => bindViewportObserver());
			formResizeObserver.current.observe(formNode);
		};
	};

	// Maintains visibleIds via an IntersectionObserver instead of a per-frame getBoundingClientRect
	// scan over the whole list (the legacy scan forced layout every scroll frame). A message counts
	// as "visible" (for read receipts) only when its BOTTOM edge sits inside the root bounds — the
	// rootMargin trims the form height off the bottom, reproducing the legacy band [0, ch - formHeight].
	const bindViewportObserver = () => {
		const container = U.Dom.getScrollContainer(isPopup);
		if (!container) {
			return;
		};

		const formNode = formRef.current?.getNode() as HTMLElement;
		const formHeight = formNode ? formNode.offsetHeight : 0;

		viewportObserver.current?.disconnect();
		viewportObserver.current = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				const id = (e.target as HTMLElement).getAttribute('data-viewport-id') || '';
				if (!id) {
					return;
				};

				const rb = e.rootBounds;
				const visible = (!!rb) && (e.boundingClientRect.bottom >= rb.top) && (e.boundingClientRect.bottom <= rb.bottom);

				if (visible) {
					visibleIds.current.add(id);
				} else {
					visibleIds.current.delete(id);
				};
			});
		// Dense thresholds so the callback re-fires as a message taller than the band scrolls
		// through it (its ratio never reaches 1, so [0,1] alone would miss the bottom-edge crossing).
		}, { root: container, rootMargin: `0px 0px -${formHeight}px 0px`, threshold: Array.from({ length: 21 }, (_, i) => i / 20) });

		// Rows mount during commit, before this runs (and the ref callback won't re-fire for
		// already-mounted rows), so observe everything currently mounted now.
		Object.keys(messageRefs.current).forEach((id) => {
			const node = messageRefs.current[id]?.getNode?.() as HTMLElement;
			if (node) {
				node.setAttribute('data-viewport-id', id);
				viewportObserver.current.observe(node);
			};
		});
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
					S.Chat.setAtChatEnd(subId, true);
					S.Chat.setAtChatStart(subId, reachedEdge(messages.length, J.Constant.limit.chat.messages));
				};

				if (messages.length < J.Constant.limit.chat.messages) {
					setLoaded(true);
				} else {
					setDummy(v => v + 1);
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

		if (!clear && (dir > 0) && S.Chat.isAtChatEnd(subId)) {
			setIsBottom(true);
			return;
		};

		if (clear) {
			// Re-subscribing to the latest messages resets the window, so older history is
			// reachable again — clear the prefetch guards and invalidate in-flight responses.
			isLoadingPrev.current = false;
			isLoadingNext.current = false;
			loadEpoch.current++;

			subscribeMessages(clear, () => {
				setIsBottom(true);
				callBack?.();
			});
		} else {
			const messages = S.Chat.getList(subId);
			if (!messages.length) {
				return;
			};

			const before = dir < 0 ? messages[0].orderId : '';
			const after = dir > 0 ? messages[messages.length - 1].orderId : '';

			if (!before && !after) {
				return;
			};

			// Guard older-batch loads: skip if one is already in flight (the prefetch threshold
			// widens the trigger band, so onScroll can fire many times) or we already hit the
			// oldest message. Without this the prefetch would spam duplicate requests.
			// Only one pagination fetch in flight at a time, in EITHER direction: a backward and
			// a forward load overlapping (e.g. a fling from top to bottom within one round-trip)
			// could evict one end before the other's response stitches in, punching a gap.
			if (isLoadingPrev.current || isLoadingNext.current) {
				return;
			};

			if (dir < 0) {
				if (S.Chat.isAtChatStart(subId)) {
					return;
				};

				isLoadingPrev.current = true;
			} else {
				isLoadingNext.current = true;
			};

			// Snapshot the window generation. If the window is reset (jump-to-bottom, deeplink,
			// reload, chat switch) while this request is in flight, the response is stale and must
			// be dropped — otherwise it would prepend/append into a freshly-rebuilt window, punching
			// a gap and corrupting the edge flags. Reset paths bump loadEpoch and clear the guards.
			const epoch = loadEpoch.current;

			C.ChatGetMessages(chatId, before, after, J.Constant.limit.chat.messages, false, (message: any) => {
				if (loadEpoch.current != epoch) {
					return;
				};

				if (message.error.code) {
					if (dir < 0) {
						isLoadingPrev.current = false;
					} else {
						isLoadingNext.current = false;
					};

					setLoaded(true);
					callBack?.();
					return;
				};

				const messages = message.messages || [];

				if (dir > 0) {
					if (reachedEdge(messages.length, J.Constant.limit.chat.messages)) {
						S.Chat.setAtChatEnd(subId, true);
						setLoaded(true);
						setIsBottom(true);
						subscribeMessages(false);
					} else {
						setIsBottom(false);
					};
				} else {
					const y = U.Dom.getMaxScrollHeight(isPopup);
					const top = U.Dom.getScrollContainerTop(isPopup);

					// Fewer than a full page means there are no older messages left to fetch.
					if (reachedEdge(messages.length, J.Constant.limit.chat.messages)) {
						S.Chat.setAtChatStart(subId, true);
					};

					setIsBottom(!(top < y));
				};

				loadDepsAndReplies(messages, () => {
					// The window may have been reset during the async dep/reply fetch — re-check
					// before mutating the store so a stale page can't stitch into a new window.
					if (loadEpoch.current != epoch) {
						return;
					};

					if (messages.length) {
						const lengthBefore = S.Chat.getList(subId).length;
						const evicted = S.Chat[(dir < 0 ? 'prepend' : 'append')](subId, messages);
						const grew = S.Chat.getList(subId).length > lengthBefore;

						// Force a re-render so the new rows commit (either direction) — the
						// component is not a MobX observer. At the MAX_MESSAGES cap a prepend/append
						// inserts and evicts the same count, so the length is unchanged even though
						// the content changed — repaint on `evicted` too, otherwise older history
						// freezes at the cap. We deliberately do NOT touch scrollTop: native scroll
						// anchoring (overflow-anchor) keeps the viewport static when content is
						// inserted above and preserves momentum; setting scrollTop ourselves would
						// jump the view (~1 viewport) at load time.
						if (grew || evicted) {
							setDummy(v => v + 1);
						};
					};

					// Release the in-flight guard only after the store mutation, so the wider
					// prefetch band can't fire a duplicate request for the same batch mid-flight.
					if (dir < 0) {
						isLoadingPrev.current = false;
					} else {
						isLoadingNext.current = false;
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

		// The list is rebuilt around orderId. Reset the in-flight guards and invalidate in-flight
		// responses; the window edges are derived below from the actual before/after page lengths.
		isLoadingPrev.current = false;
		isLoadingNext.current = false;
		loadEpoch.current++;

		let list = [];
		let beforeOk = false;
		let afterOk = false;
		let beforeLength = 0;
		let afterLength = 0;

		C.ChatGetMessages(chatId, orderId, '', limit, true, (message: any) => {
			if (!message.error.code) {
				beforeOk = true;
				beforeLength = message.messages.length;
				if (beforeLength) {
					list = list.concat(message.messages);
				};
			};

			C.ChatGetMessages(chatId, '', orderId, limit, false, (message: any) => {
				if (!message.error.code) {
					afterOk = true;
					afterLength = message.messages.length;
					if (afterLength) {
						list = list.concat(message.messages);
					};
				};

				loadDepsAndReplies(list, () => {
					S.Chat.set(subId, list);

					// Derive edges from the actual page lengths, but only for a fetch that
					// SUCCEEDED — a transient error (length 0) must not be read as "reached the
					// edge", which would permanently short-circuit pagination in that direction.
					S.Chat.setAtChatStart(subId, beforeOk && reachedEdge(beforeLength, limit));
					S.Chat.setAtChatEnd(subId, afterOk && reachedEdge(afterLength, limit));

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

	const onMessageAdd = (message: I.ChatMessage, subIds: string[]) => {
		subIds = subIds || [];

		const subId = getSubId();

		if (subIds.includes(subId)) {
			loadDepsAndReplies(S.Chat.getList(subId).concat(message), () => scrollToBottomCheck());
		};
	};

	const onPinnedStatusUpdate = (message: I.ChatMessage, isPinned: boolean, subIds: string[]) => {
		const subId = getSubId();

		if (!subIds.includes(subId)) {
			return;
		};

		if (isPinned) {
			const full = S.Chat.getMessageById(subId, message.id);

			setPinnedMessages(prev => [ ...prev.filter(it => it.id != message.id), full || message ]);
		} else {
			setPinnedMessages(prev => prev.filter(it => it.id != message.id));
		};
	};

	const loadPinnedMessages = () => {
		if (!chatId || U.Space.getSpaceview().isOneToOne) {
			return;
		};

		C.ChatGetPinnedMessages(chatId, (message: any) => {
			if (!message.error.code) {
				setPinnedMessages(message.messages || []);
			};
		});
	};

	const onPinToggle = (message: I.ChatMessage) => {
		const isPinned = message.isPinned;

		C.ChatSetPinnedMessages(chatId, [ message.id ], !isPinned, (response: any) => {
			if (!response.error.code) {
				analytics.event(isPinned ? 'UnpinMessage' : 'PinMessage', { chatId: analyticsChatId });
			};
		});
	};

	const getPinnedIndex = () => {
		const length = pinnedMessages.length;
		if (!length) {
			return 0;
		};

		return ((pinnedIndex < 0) || (pinnedIndex >= length)) ? length - 1 : pinnedIndex;
	};

	const onPinnedBannerClick = () => {
		const length = pinnedMessages.length;
		if (!length) {
			return;
		};

		const index = getPinnedIndex();
		const current = pinnedMessages[index];

		if (current) {
			loadAndScrollToMessage(current.id);
			analytics.event('ClickPinnedMessage', { chatId: analyticsChatId });
		};

		setPinnedIndex(((index - 1) + length) % length);
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

		// Right-clicking a URL inside the message text offers a "Copy link" for that URL,
		// distinct from "Copy message link" (the message deeplink)
		const linkEl = isRightClick ? (e.target as HTMLElement)?.closest('a.markuplink') as HTMLElement : null;
		const url = linkEl ? String(linkEl.getAttribute('href') || '') : '';

		// Resolve the file the user right-clicked on, so a single attachment can be downloaded on its own.
		let targetId = '';
		if (isRightClick) {
			const attachmentEl = (e.target as HTMLElement)?.closest('.attachment');
			targetId = attachmentEl?.getAttribute('data-id') || '';
		};

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
				options: getMessageMenuOptions(item, onMore, url, targetId),
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
								html: Mark.toStandardHtml(Mark.toHtml(item.content.text, item.content.marks)),
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

						case 'copyLink': {
							U.Common.copyToast(translate('commonLink'), url);
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

						case 'pin':
						case 'unpin': {
							onPinToggle(item);
							break;
						};

						case 'download': {
							const files = getDownloadableAttachments(item);
							const file = targetId ? files.find(it => it.id == targetId) : files[0];

							if (file) {
								Action.downloadFile(file.id, analytics.route.chat, file.layout == I.ObjectLayout.Image);
							};
							break;
						};

						case 'downloadAll': {
							const files = getDownloadableAttachments(item).map(it => ({ id: it.id, isImage: it.layout == I.ObjectLayout.Image }));

							Action.downloadFiles(files, analytics.route.chat);
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

	// Date headers float via CSS `position: sticky` (see chat.scss .sectionDate). This only
	// updates the sticky offset CSS variable when the header / pinned-banner height changes —
	// no per-frame layout reads/writes (the previous JS reposition forced a full relayout of the
	// whole message DOM on every scroll frame). Called from resize() and the pinned-banner effect,
	// NOT from onScroll.
	const renderDates = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const pinned = U.Dom.select('.pinnedMessage', node) as HTMLElement | null;
		const pinnedHeight = pinned ? pinned.offsetHeight : 0;
		const offset = J.Size.header + 8 + pinnedHeight;

		node.style.setProperty('--chat-sticky-top', `${offset}px`);
	};

	const onScroll = (e: any) => {
		const subId = getSubId();
		const container = U.Dom.getScrollContainer(isPopup);
		const st = Math.ceil(container?.scrollTop ?? 0);
		const max = U.Dom.getMaxScrollHeight(isPopup);
		// Per-frame read-receipt set comes from the IntersectionObserver (no layout read).
		// readScrolledMessages keeps the synchronous getMessagesInViewport scan for post-jump accuracy.
		const list = getMessages().filter((it: any) => visibleIds.current.has(it.id));
		const state = S.Chat.getState(subId);
		const { lastStateId } = state;
		const isBottom = (max > 0) && (st >= max);

		setIsBottom(isBottom);

		if (!isAutoLoadDisabled.current) {
			// Prefetch one viewport before each edge so scrolling doesn't stall on the network
			// round-trip — into the past (older), and into the present (newer) when the window's
			// tail was evicted. shouldRefetchForward keeps the newer-fetch off once we're at the
			// chat end or a fetch is already in flight.
			const threshold = container?.offsetHeight ?? 0;

			if ((max > 0) && (st <= threshold)) {
				loadMessages(-1, false);
			};

			if ((max > 0) && (st >= (max - threshold)) && shouldRefetchForward(S.Chat.isAtChatEnd(subId), true, isLoadingNext.current)) {
				loadMessages(1, false);
			};
		};

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

	// Coalesce scroll events to one onScroll run per animation frame. onScroll does an
	// O(n) viewport scan (getBoundingClientRect per message); without this, a single
	// gesture fires it many times per frame, and that cost doubles at the larger window.
	const onScrollRaf = (e: Event) => {
		if (scrollRafRef.current) {
			return;
		};

		scrollRafRef.current = raf(() => {
			scrollRafRef.current = 0;
			onScroll(e);
		});
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

	const getMessageMenuOptions = (message: I.ChatMessage, noControls: boolean, url?: string, targetId?: string): I.Option[] => {
		const isSelf = message.creator == S.Auth.account.id;
		const downloadable = getDownloadableAttachments(message);
		const options: any[] = [];

		if (!noControls) {
			options.push({ id: 'reply', iconParam: { name: 'chat/buttons/reply' }, name: translate('blockChatReply') });
		};

		if (message.content.text) {
			options.push({ id: 'copy', iconParam: { name: 'menu/action/copy' }, name: translate('blockChatCopyText') });
		};

		// Only offered when the menu was opened on a URL inside the message text
		if (url) {
			options.push({ id: 'copyLink', iconParam: { name: 'menu/action/copyLink' }, name: translate('blockChatCopyLink') });
		};

		if (downloadable.length) {
			// With one file, or one right-clicked among many, offer to download just that file.
			const target = (downloadable.length == 1) ? downloadable[0] : downloadable.find(it => it.id == targetId);

			if (target) {
				const isFileDownloading = S.Common.isDownloading(target.id);

				// With a single file the name is obvious; only spell it out to disambiguate one file among many.
				let name = '';
				if (isFileDownloading) {
					name = translate('commonDownloading');
				} else
				if (downloadable.length == 1) {
					name = translate('commonDownload');
				} else {
					name = U.String.sprintf(translate('commonDownloadFile'), U.String.shorten(U.File.name(target), J.Constant.limit.string.fileName));
				};

				options.push({ id: 'download', iconParam: { name: 'menu/action/download' }, name, disabled: isFileDownloading });
			};

			// With many files, also offer to download all of them at once.
			if (downloadable.length > 1) {
				options.push({ id: 'downloadAll', iconParam: { name: 'menu/action/download' }, name: translate('commonDownloadAll') });
			};
		};

		if (!U.Space.getSpaceview().isOneToOne) {
			if (message.isPinned) {
				options.push({ id: 'unpin', iconParam: { name: 'menu/action/unpin' }, name: translate('commonUnpin') });
			} else {
				options.push({ id: 'pin', iconParam: { name: 'menu/action/pin' }, name: translate('commonPin') });
			};
		};

		if (isSelf) {
			options.push({ isDiv: true });
			options.push({ id: 'edit', iconParam: { name: 'common/edit' }, name: translate('commonEdit') });
			options.push({ isDiv: true });
			options.push({ id: 'link', iconParam: { name: 'menu/action/pageLink' }, name: translate('blockChatCopyMessageLink') });
			options.push({ id: 'delete', iconParam: { name: 'menu/action/remove', color: 'destructive' }, name: translate('commonDelete'), color: 'destructive' });
		} else {
			if (options.length) {
				options.push({ isDiv: true });
			};
			options.push({ id: 'link', iconParam: { name: 'menu/action/pageLink' }, name: translate('blockChatCopyMessageLink') });

			// Owners and Admins can delete any message in the space
			if (U.Space.canMyParticipantModerate()) {
				options.push({ id: 'delete', iconParam: { name: 'menu/action/remove', color: 'destructive' }, name: translate('commonDelete'), color: 'destructive' });
			};
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

		// Mark this as the active scroll target. A newer scrollToMessage/scrollToBottom
		// call replaces it and cancels the retry loop below.
		pendingScrollToMessageId.current = id;

		const doScroll = (attempts: number) => {
			if (pendingScrollToMessageId.current != id) {
				return;
			};

			const container = U.Dom.getScrollContainer(isPopup);
			if (!container) {
				pendingScrollToMessageId.current = '';
				return;
			};

			// When entering a chat, React concurrent mode may not have committed the
			// messages DOM yet, so hasScroll() is false and the message ref is still
			// null — falling through here would land container.scrollTop at 0 because
			// getMessageScrollPosition returns 0 for a missing ref. Retry until the
			// target message's ref is populated and the container has overflow.
			const top = getMessageScrollPosition(id);
			if (!hasScroll() || !top) {
				if (attempts <= 0) {
					pendingScrollToMessageId.current = '';
					readScrolledMessages();
					return;
				};
				raf(() => doScroll(attempts - 1));
				return;
			};

			pendingScrollToMessageId.current = '';

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
			raf(() => doScroll(30));
		} else {
			doScroll(30);
		};
	};

	const scrollToBottom = (animate?: boolean) => {
		setIsBottom(true);

		// A newer scrollToMessage call takes priority, so cancel any pending scroll-to-message retry.
		pendingScrollToMessageId.current = '';

		if (!hasScroll()) {
			readScrolledMessages();

			// DOM may not be committed yet (React concurrent mode); keep retrying until
			// the scroll container has overflow. A single raf isn't enough for large
			// chats whose messages commit across multiple frames.
			if (!animate) {
				pendingScrollToBottom.current = true;
				const retry = (attempts: number) => {
					if (!pendingScrollToBottom.current || !isBottom.current) {
						pendingScrollToBottom.current = false;
						return;
					};
					if (hasScroll()) {
						pendingScrollToBottom.current = false;
						scrollToBottom(false);
						return;
					};
					if (attempts <= 0) {
						pendingScrollToBottom.current = false;
						return;
					};
					raf(() => retry(attempts - 1));
				};
				raf(() => retry(30));
			};
			return;
		};

		pendingScrollToBottom.current = false;

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

		if (formNode) {
			U.Dom.toggleClass(formNode, 'isBottom', v);
		};

		if (btn) {
			// Show the jump-to-bottom / new-messages button when the user is not at the window
			// bottom, OR when the window bottom is not the chat's newest (tail was evicted) —
			// otherwise a suppressed live message would have no affordance.
			const showNav = (!v) || (!S.Chat.isAtChatEnd(getSubId()));
			U.Dom.toggleClass(btn, 'active', showNav);
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
		isLoadingPrev.current = false;
		isLoadingNext.current = false;
		loadEpoch.current++;
		loadState(() => {
			loadPinnedMessages();
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

			const storedScrollId = Storage.getChat(chatId).scrollMessageId;
			const initialMessageId = match.params.messageId || storedScrollId;

			if (storedScrollId) {
				Storage.setChat(chatId, { scrollMessageId: '' });
			};

			if (initialMessageId) {
				C.ChatGetMessagesByIds(chatId, [ initialMessageId ], (message: any) => {
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
			U.Dom.removeEvent(container, 'scroll', scrollHandlerRef.current);
		};

		window.clearTimeout(timeoutResize.current);
		timeoutResize.current = window.setTimeout(() => {
			if (container) {
				scrollHandlerRef.current = (e: Event) => onScrollRaf(e);
				U.Dom.addEvent(container, 'scroll', scrollHandlerRef.current);
			};

			// Rebuild the observer so its bottom rootMargin tracks the current form height
			// (multi-line input / attachment preview changes it).
			bindViewportObserver();
		}, 50);
	};

	const setLoaded = (v: boolean) => {
		setIsLoaded(v);
	};

	const sections = getSections();
	const isEmpty = isLoaded && !messages.length;

	let content = null;
	if (isEmpty) {
		content = <Empty />;
	} else {
		content = (
			<div className="scroll">
				{sections.map(section => (
					// Each section is its own sticky containing block, so its date header sticks only
					// within its own day and is pushed out by the next — exactly one floating date, no
					// flat-sibling pile-up. .section stays position:static so message offsetTop (used by
					// scrollToMessage) is unchanged.
					<div className="section" key={section.key}>
						<SectionDate date={section.createdAt} />
						{section.list.map(item => (
							<Message
								ref={getRefSetter(item.id)}
								key={item.id}
								{...props}
								id={item.id}
								rootId={chatId}
								blockId={block.id}
								subId={subId}
								analyticsChatId={analyticsChatId}
								isNew={item.orderId == firstUnreadOrderId}
								onContextMenu={onContextMenuCb}
								onMore={onMoreCb}
								onReplyEdit={onReplyEditCb}
								onReplyClick={onReplyClickCb}
								getReplyContent={getReplyContentCb}
								scrollToBottom={scrollToBottomCb}
								getMessageMenuOptions={getMessageMenuOptionsCb}
							/>
						))}
					</div>
				))}
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
			raf.cancel(scrollRafRef.current);
			messageRefs.current = {};
			refSetters.current.clear();
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

	useLayoutEffect(() => {
		renderDates();
	}, [ pinnedMessages.length ]);

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
		resize,
		onDragOver,
		onDragLeave,
		onDrop,
		getFormRef: () => formRef.current,
		loadAndScrollToMessage,
	}));

	const pinnedLength = pinnedMessages.length;
	const currentPinnedIndex = getPinnedIndex();
	const currentPinned = pinnedMessages[currentPinnedIndex];
	let pinnedBanner = null;

	if (currentPinned) {
		const { text, attachment } = getReplyContent(currentPinned);
		const iconLayouts = U.Object.getFileLayouts().concat(U.Object.getHumanLayouts());
		const cn = [ 'pinnedMessage' ];

		let icon: any = null;
		if (attachment) {
			const iconSize = iconLayouts.includes(attachment.layout) ? 20 : null;

			icon = <IconObject object={attachment} size={32} iconSize={iconSize} />;
			cn.push('withIcon');
		};

		const segmentCount = Math.min(Math.max(pinnedLength, 1), 6);
		const activeSegment = (pinnedLength > 1)
			? Math.round((currentPinnedIndex / (pinnedLength - 1)) * (segmentCount - 1))
			: 0;
		const segments = [];

		for (let i = 0; i < segmentCount; i++) {
			const sc = [ 'segment', (i == activeSegment ? 'isActive' : '') ];
			segments.push(<div key={i} className={sc.join(' ')} />);
		};

		const indicator = <div className="pinnedIndicator">{segments}</div>;

		const onUnpinClick = (e: React.MouseEvent) => {
			e.stopPropagation();
			onPinToggle(currentPinned);
		};

		pinnedBanner = (
			<div className={cn.join(' ')} onClick={onPinnedBannerClick}>
				{indicator}
				{icon}
				<div className="pinnedInner">
					<div className="pinnedLabel">{translate('blockChatPinnedMessage')}</div>
					<div className="pinnedText" dangerouslySetInnerHTML={{ __html: U.String.sanitize(text) }} />
				</div>
				<Icon
					className="unpin"
					name="menu/action/clear"
					onClick={onUnpinClick}
					tooltipParam={{ text: translate('commonUnpin') }}
				/>
			</div>
		);
	};

	return (
		<div
			ref={nodeRef}
			className="wrap"
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
		>
			{pinnedBanner}

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