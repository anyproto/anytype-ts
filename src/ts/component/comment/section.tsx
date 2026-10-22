import React, { useEffect, useCallback, useRef, useState } from 'react';
import raf from 'raf';
import { Icon } from 'Component';
import CommentList from './list';
import CommentForm from './form';
import CommentActivity from './activity';
import * as I from 'Interface';
import { presence } from 'Lib/presence';
import { chatStatus } from 'Lib/chatStatus';

const HIGHLIGHT_DURATION = 2000;

const POST_LIMIT = 20;
const SCROLL_THRESHOLD = 16;

const CommentSection = (props: I.CommentSectionProps) => {

	const { rootId, targetId, targetType, readonly, isPopup, messageId } = props;
	const object = S.Detail.get(rootId, rootId, [ 'discussionId', 'isArchived' ]);
	const [ localDiscussionId, setLocalDiscussionId ] = useState('');
	const [ isExpanded, setIsExpanded ] = useState(false);
	const isHiddenRef = useRef(false);
	const discussionId = object.discussionId || localDiscussionId || '';
	const subId = U.Comment.getSubId(targetType, discussionId || targetId);
	const formRef = useRef<any>(null);
	const isLoaded = useRef(false);
	const isBottom = useRef(false);
	const isCreating = useRef(false);
	const subscribedId = useRef('');
	const sectionRef = useRef<HTMLDivElement>(null);
	const socialRef = useRef<HTMLDivElement>(null);
	const scrollTimerRef = useRef(0);
	const readStopTimerRef = useRef(0);
	const isSectionVisibleRef = useRef(false);
	const messageIdHandled = useRef(false);
	const lastScrollTopRef = useRef(0);
	const isTypingRef = useRef(false);
	const scrolledItems = useRef<Set<string>>(new Set());
	const readVisibleMessagesRef = useRef<() => void>(() => {});
	// Stable claimant token for the active-read claim (see S.Chat.setActiveReadChat):
	// while the discussion tail is read in place here, its unread counters are excluded
	// from aggregates instead of blinking for the read round-trip (JS-9298).
	const activeReadToken = useRef(`commentSection-${Math.random().toString(36).slice(2, 10)}`).current;

	const posts = S.Comment.getPosts(subId);
	const postCount = posts.length;
	const isOpen = (postCount > 0) || isExpanded;
	const isOpenRef = useRef(isOpen);
	isOpenRef.current = isOpen;
	const discussionIdRef = useRef(discussionId);
	discussionIdRef.current = discussionId;

	const resize = useCallback(() => {
		props.resize?.();
	}, [ props.resize ]);

	const updateSocialVisibility = useCallback(() => {
		const loaded = isLoaded.current || !discussionIdRef.current;
		const shouldHide = !loaded || isHiddenRef.current || (isOpenRef.current && isSectionVisibleRef.current);
		U.Dom.toggleClass(socialRef.current, 'isHidden', shouldHide);
	}, []);

	const setHidden = useCallback((v: boolean) => {
		if (v === isHiddenRef.current) {
			return;
		};
		isHiddenRef.current = v;
		updateSocialVisibility();
	}, [ updateSocialVisibility ]);

	const findMessage = useCallback((sid: string, id: string): I.CommentMessage | null => {
		return S.Comment.getById(sid, id) || null;
	}, []);

	const getVisibleMessages = useCallback((): I.CommentMessage[] => {
		const node = sectionRef.current;
		if (!node) {
			return [];
		};

		const container = U.Dom.getScrollContainer(isPopup);
		const containerRect = container ? container.getBoundingClientRect() : null;
		const top = containerRect ? containerRect.top : 0;
		const bottom = containerRect ? containerRect.bottom : window.innerHeight;
		const sid = U.Comment.getSubId(targetType, discussionIdRef.current || targetId);
		const ret: I.CommentMessage[] = [];

		U.Dom.selectAll('[data-message-id]', node).forEach((el: HTMLElement) => {
			const rect = el.getBoundingClientRect();
			if ((rect.bottom < top) || (rect.top > bottom)) {
				return;
			};

			const id = el.getAttribute('data-message-id');
			const msg = id ? findMessage(sid, id) : null;
			if (msg) {
				ret.push(msg);
			};
		});

		return ret;
	}, [ isPopup, targetType, targetId, findMessage ]);

	const readMessage = useCallback((id: string, orderId: string, lastStateId: string, type: I.ChatReadType) => {
		const did = discussionIdRef.current;
		if (!did || !orderId) {
			return;
		};

		const sid = U.Comment.getSubId(targetType, did);

		if (type == I.ChatReadType.Message) {
			S.Comment.setReadMessageStatus(sid, [ id ], true);
		};
		if (type == I.ChatReadType.Mention) {
			S.Comment.setReadMentionStatus(sid, [ id ], true);
		};

		C.ChatReadMessages(did, orderId, orderId, lastStateId, type);
	}, [ targetType, targetId ]);

	const onReadStop = useCallback(() => {
		if (!scrolledItems.current.size) {
			return;
		};

		const did = discussionIdRef.current;
		if (!did) {
			scrolledItems.current.clear();
			return;
		};

		// Every seen message was read by itself in readVisibleMessages. No orderId range read here:
		// threads are laid out by post, so a range between seen messages also spans unseen replies
		// of other threads.
		const sid = U.Comment.getSubId(targetType, did);
		const ids: string[] = [ ...scrolledItems.current ];

		if (S.Common.windowIsFocused) {
			S.Comment.setReadMessageStatus(sid, ids, true);
			S.Comment.setReadMentionStatus(sid, ids, true);
		};

		scrolledItems.current.clear();
	}, [ targetType ]);

	// Claim / release the active-read flag for the discussion: with the window focused and
	// the discussion's live tail (bottom-most rendered message) in the viewport, arriving
	// comments are read in place, so counter aggregates skip this discussion instead of
	// blinking for the read-confirmation round-trip (JS-9298) — mirrors the claim BlockChat
	// holds for full chats. Presentational only, counters stay server-authoritative.
	const updateActiveReadClaim = useCallback(() => {
		const did = discussionIdRef.current;
		const node = sectionRef.current;
		const items = node ? U.Dom.selectAll('[data-message-id]', node) : [];
		const last = items.length ? items[items.length - 1] : null;

		let tailVisible = false;
		if (last) {
			const container = U.Dom.getScrollContainer(isPopup);
			const containerRect = container ? container.getBoundingClientRect() : null;
			const top = containerRect ? containerRect.top : 0;
			const bottom = containerRect ? containerRect.bottom : window.innerHeight;
			const rect = last.getBoundingClientRect();

			tailVisible = (rect.bottom >= top) && (rect.top <= bottom);
		};

		if (did && tailVisible && S.Common.windowIsFocused && isSectionVisibleRef.current) {
			S.Chat.setActiveReadChat(activeReadToken, S.Common.space, did);
		} else {
			S.Chat.clearActiveReadChat(activeReadToken);
		};
	}, [ isPopup ]);

	const readVisibleMessages = useCallback(() => {
		updateActiveReadClaim();

		if (!discussionIdRef.current || !S.Common.windowIsFocused) {
			return;
		};

		const did = discussionIdRef.current;
		const chatPreviewSubId = S.Chat.getChatSubId(J.Constant.subId.chatPreview, S.Common.space, did);
		const { lastStateId } = S.Chat.getState(chatPreviewSubId);
		const visible = getVisibleMessages();

		if (!visible.length) {
			return;
		};

		visible.forEach(msg => {
			scrolledItems.current.add(msg.id);

			if (!msg.isReadMessage) {
				readMessage(msg.id, msg.orderId, lastStateId, I.ChatReadType.Message);
			};
			if (!msg.isReadMention) {
				readMessage(msg.id, msg.orderId, lastStateId, I.ChatReadType.Mention);
			};
		});

		window.clearTimeout(readStopTimerRef.current);
		readStopTimerRef.current = window.setTimeout(() => onReadStop(), 300);
	}, [ getVisibleMessages, readMessage, onReadStop, updateActiveReadClaim ]);

	readVisibleMessagesRef.current = readVisibleMessages;

	useEffect(() => {
		updateSocialVisibility();
		resize();
	}, [ isOpen, updateSocialVisibility, resize ]);

	useEffect(() => {
		if (!postCount) {
			return;
		};
		const id = raf(() => readVisibleMessages());
		return () => raf.cancel(id);
	}, [ postCount, readVisibleMessages ]);

	// Typing and agent activity over pubsub, while the discussion is shown
	useEffect(() => {
		if (!isOpen || !discussionId) {
			return;
		};

		const { space } = S.Common;
		const release = chatStatus.retain(space, discussionId, 'discussion');

		presence.subscribe(space, discussionId);

		return () => {
			release();
			presence.unsubscribe(discussionId);
		};
	}, [ isOpen, discussionId ]);

	useEffect(() => {
		if (discussionId && (subscribedId.current != discussionId)) {
			subscribe(discussionId);
		};

		const container = U.Dom.getScrollContainer(isPopup);

		const scrollHandler = () => {
			const st = Math.ceil(container?.scrollTop ?? 0);
			const max = U.Dom.getMaxScrollHeight(isPopup);
			const lastSt = lastScrollTopRef.current;

			isBottom.current = (max - st) <= SCROLL_THRESHOLD;
			lastScrollTopRef.current = st;

			readVisibleMessages();

			// Show at end of document if no comments
			if (isBottom.current && !postCount) {
				setHidden(false);
				return;
			};

			// Scrolling down: hide; scrolling up: show
			if (st > lastSt) {
				setHidden(true);
			} else
			if (st < lastSt) {
				isTypingRef.current = false;
				setHidden(false);
			};
		};

		if (container) {
			U.Dom.addEvent(container, 'scroll', scrollHandler);
		};

		return () => {
			if (container) {
				U.Dom.removeEvent(container, 'scroll', scrollHandler);
			};
			window.clearTimeout(scrollTimerRef.current);
			window.clearTimeout(readStopTimerRef.current);

			if (discussionId) {
				unsubscribe(discussionId);
			};
		};
	}, [ discussionId, readVisibleMessages ]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;

			if (!target?.closest('.blocks')) {
				return;
			};

			isTypingRef.current = true;
			setHidden(true);
		};

		const onMouseMove = () => {
			if (!isTypingRef.current) {
				setHidden(false);
			};
		};

		const onMouseDown = () => {
			isTypingRef.current = false;
		};

		U.Dom.addEvents(window, [
			['keydown', onKeyDown],
			['mousemove', onMouseMove],
			['mousedown', onMouseDown],
		]);

		return () => {
			U.Dom.removeEvents(window, [
				['keydown', onKeyDown],
				['mousemove', onMouseMove],
				['mousedown', onMouseDown],
			]);
		};
	}, [ setHidden ]);

	useEffect(() => {
		const el = sectionRef.current;
		if (!el) {
			isSectionVisibleRef.current = false;
			updateSocialVisibility();
			return;
		};

		const observer = new IntersectionObserver((entries) => {
			isSectionVisibleRef.current = entries[0]?.isIntersecting || false;
			updateSocialVisibility();

			if (isSectionVisibleRef.current) {
				readVisibleMessages();
			} else {
				// Scrolled out of view — the discussion is no longer being read in place.
				S.Chat.clearActiveReadChat(activeReadToken);
			};
		}, { threshold: 0 });

		observer.observe(el);
		return () => observer.disconnect();
	}, [ updateSocialVisibility, readVisibleMessages ]);

	const loadDeps = useCallback((messages: any[], callBack?: () => void) => {
		const ids = U.Comment.getDepsIds(messages);

		if (!ids.length) {
			callBack?.();
			return;
		};

		const sid = U.Comment.getSubId(targetType, discussionId || targetId);
		const keys = U.Subscription.chatRelationKeys();

		U.Subscription.subscribeIds({
			ids,
			subId: sid,
			keys,
			noDeps: true,
			ignoreHidden: true,
			crossSpace: true,
			updateDetails: true,
		}, callBack);
	}, [ targetType, discussionId, targetId ]);

	const onMessageAdd = useCallback((e: any) => {
		const { message, subIds: eventSubIds } = e.detail;
		const subIds = eventSubIds || [];

		if (!subIds.includes(subId)) {
			return;
		};

		loadDeps([ message ]);
	}, [ subId, loadDeps ]);

	useEffect(() => {
		U.Dom.addEvents(window, [
			['messageAdd', onMessageAdd],
			['messageUpdate', onMessageAdd],
		]);

		return () => {
			U.Dom.removeEvents(window, [
				['messageAdd', onMessageAdd],
				['messageUpdate', onMessageAdd],
			]);
		};
	}, [ onMessageAdd ]);

	// The active-read claim only holds while the user can actually see the discussion
	// tail — release it on blur so unread counters surface again; focus re-evaluates the
	// claim (and marks the visible messages read) via readVisibleMessages.
	useEffect(() => {
		const onFocus = () => readVisibleMessages();
		const onBlur = () => S.Chat.clearActiveReadChat(activeReadToken);

		U.Dom.addEvents(window, [
			['focus', onFocus],
			['blur', onBlur],
		]);

		return () => {
			U.Dom.removeEvents(window, [
				['focus', onFocus],
				['blur', onBlur],
			]);
		};
	}, [ readVisibleMessages ]);

	// A closed / unmounted section (or one switching discussions) must not keep the old
	// discussion's badge suppressed — the next readVisibleMessages run re-claims if due.
	useEffect(() => {
		return () => S.Chat.clearActiveReadChat(activeReadToken);
	}, [ discussionId ]);


	const scrollToMessage = useCallback((msgId: string) => {
		window.setTimeout(() => {
			resize();

			const node = sectionRef.current;
			if (!node) {
				return;
			};

			const el = U.Dom.select(`[data-message-id="${msgId}"]`, node);
			if (!el) {
				return;
			};

			const container = U.Dom.getScrollContainer(isPopup);
			if (!container) {
				return;
			};

			const elRect = el.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();
			const scrollTop = container.scrollTop + (elRect.top - containerRect.top) - (containerRect.height / 3);

			container.scrollTop = Math.max(0, scrollTop);

			U.Dom.addClass(el as HTMLElement, 'isHighlighted');
			window.setTimeout(() => U.Dom.removeClass(el as HTMLElement, 'isHighlighted'), HIGHLIGHT_DURATION);
		}, 100);
	}, [ isPopup, resize ]);

	// Runs after the whole discussion is loaded, so the linked message is either in the store or
	// not shown (a reply whose thread is gone)
	const handleMessageId = useCallback((discId: string) => {
		if (!messageId || messageIdHandled.current) {
			return;
		};

		messageIdHandled.current = true;

		if (S.Comment.getById(U.Comment.getSubId(targetType, discId), messageId)) {
			scrollToMessage(messageId);
		};
	}, [ messageId, targetType, scrollToMessage ]);

	// Loads the whole discussion: replies to replies are placed by following their parents, so a
	// thread can only be laid out with every message at hand
	const fetchAllMessages = useCallback((discId: string, sid: string, token: number, callBack?: () => void) => {
		const PAGE_SIZE = 100;
		const all: I.CommentMessage[] = [];

		// The store drops a load for a discussion closed or reopened meanwhile
		const done = () => {
			loadDeps(all, () => {
				S.Comment.load(sid, all, token);
				callBack?.();
			});
		};

		const fetchPage = (afterOrderId: string) => {
			C.ChatGetMessages(discId, '', afterOrderId, PAGE_SIZE, false, (message: any) => {
				if (message.error.code) {
					done();
					return;
				};

				const batch = message.messages || [];

				for (const it of batch) {
					all.push({
						...it,
						content: {
							...it.content,
							parts: U.Comment.blocksToParts(it.blocks, it.content),
						},
					});
				};

				if (batch.length >= PAGE_SIZE) {
					fetchPage(batch[batch.length - 1].orderId);
				} else {
					done();
				};
			});
		};

		fetchPage('');
	}, [ loadDeps ]);

	const subscribe = useCallback((id: string) => {
		const sid = U.Comment.getSubId(targetType, id);

		subscribedId.current = id;

		// Opened before subscribing, so the events that follow are kept while the pages load
		const token = S.Comment.startLoad(sid);

		C.ChatSubscribeLastMessages(id, POST_LIMIT, sid, (message: any) => {
			if (message.error.code) {
				isLoaded.current = true;
				updateSocialVisibility();
				return;
			};

			if (message.state) {
				const chatPreviewSubId = S.Chat.getChatSubId(J.Constant.subId.chatPreview, S.Common.space, id);
				S.Chat.setState(chatPreviewSubId, message.state);
			};

			fetchAllMessages(id, sid, token, () => {
				// Closed or switched to another discussion meanwhile. A section still subscribed
				// finishes even when another section on the same object loaded it last.
				if (subscribedId.current != id) {
					return;
				};

				isLoaded.current = true;
				updateSocialVisibility();
				handleMessageId(id);
				raf(() => readVisibleMessagesRef.current());
			});
		});
	}, [ targetType, fetchAllMessages, handleMessageId, updateSocialVisibility ]);

	const unsubscribe = useCallback((id: string) => {
		const sid = U.Comment.getSubId(targetType, id);

		subscribedId.current = '';

		C.ChatUnsubscribe(id, sid);
		S.Comment.clear(sid);
	}, [ targetType ]);

	const scrollToBottom = useCallback(() => {
		resize();

		window.setTimeout(() => {
			const container = U.Dom.getScrollContainer(isPopup);
			if (container) {
				isBottom.current = true;
				container.scrollTop = container.scrollHeight;
			};
		}, 0);
	}, [ isPopup, resize ]);

	const scrollToBottomCheck = useCallback(() => {
		if (isBottom.current) {
			scrollToBottom();
		};
	}, [ scrollToBottom ]);

	const quoteLockRef = useRef(0);

	useEffect(() => {
		const onQuote = (e: Event) => {
			const part = (e as CustomEvent).detail as I.CommentContentPart;
			if (!part) {
				return;
			};

			// Drop rapid duplicate firings (same event reaching multiple
			// listeners, or fast double-clicks) that would re-enter the
			// editor.update sequence before the first one settled.
			const now = Date.now();
			if ((now - quoteLockRef.current) < 300) {
				return;
			};
			quoteLockRef.current = now;

			setIsExpanded(true);
			isSectionVisibleRef.current = true;
			updateSocialVisibility();

			window.setTimeout(() => {
				scrollToBottom();
				formRef.current?.insertQuote(part);
			}, 50);
		};

		const eventName = `commentQuote.${rootId}`;
		window.addEventListener(eventName, onQuote);
		return () => window.removeEventListener(eventName, onQuote);
	}, [ rootId, scrollToBottom, updateSocialVisibility ]);

	const ensureDiscussion = useCallback((callBack: (id: string) => void) => {
		if (discussionId) {
			callBack(discussionId);
			return;
		};

		if (isCreating.current) {
			return;
		};

		isCreating.current = true;

		C.ObjectAddDiscussion(rootId, (message: any) => {
			isCreating.current = false;

			let id = message.discussionId;

			// Discussion may already exist — re-read from details
			if (message.error.code) {
				const obj = S.Detail.get(rootId, rootId, [ 'discussionId' ]);
				id = obj.discussionId;

				if (!id) {
					return;
				};
			};

			setLocalDiscussionId(id);
			subscribe(id);
			callBack(id);
		});
	}, [ rootId, discussionId ]);

	const getCommentAnalyticsData = useCallback((parts: I.CommentContentPart[]) => {
		const hasMention = parts.some(p => (p.marks || []).some(m => m.type === I.MarkType.Mention));
		const hasAttachments = parts.some(p => (p.type === I.BlockType.Link) || (p.type === I.BlockType.Embed));
		return { hasMention, hasAttachments };
	}, []);

	const onSubmitPost = useCallback((parts: I.CommentContentPart[], messageAttachments?: I.ChatMessageAttachment[], attachmentObjects?: any[]) => {
		const blocks = U.Comment.partsToChatBlocks(parts);
		const { account } = S.Auth;

		const msg = {
			replyToMessageId: '',
			content: {
				text: '',
				style: I.TextStyle.Paragraph,
				marks: [],
			},
			blocks,
			attachments: messageAttachments || [],
			reactions: [],
		};

		ensureDiscussion((id: string) => {
			const sid = U.Comment.getSubId(targetType, id);

			// Seed attachment details so optimistic post can render them
			if (attachmentObjects?.length) {
				for (const obj of attachmentObjects) {
					S.Detail.update(sid, { id: obj.id, details: obj }, false);
				};
			};

			const isFirstPost = !S.Comment.getPosts(sid).length;

			C.ChatAddMessage(id, msg as any, (response: any) => {
				if (response.error.code) {
					return;
				};

				const analyticsData = getCommentAnalyticsData(parts);

				if (isFirstPost) {
					analytics.event('StartDiscussion', analyticsData);
				};

				analytics.event('PostDiscussion', analyticsData);

				const newPost = {
					id: response.messageId,
					orderId: response.orderId,
					creator: account.id,
					createdAt: U.Date.now(),
					modifiedAt: 0,
					replyToMessageId: '',
					content: {
						text: '',
						style: I.TextStyle.Paragraph,
						marks: [],
						parts,
					},
					attachments: messageAttachments || [],
					reactions: [],
					isSynced: false,
					isReadMessage: true,
					isReadMention: true,
					isDeleted: false,
				};

				S.Comment.insert(sid, newPost);
				loadDeps([ newPost as any ]);
				formRef.current?.clear();
				window.setTimeout(() => scrollToBottom(), 50);
			});
		});
	}, [ discussionId, subId, scrollToBottom, ensureDiscussion, getCommentAnalyticsData, loadDeps ]);

	const onMouseDown = useCallback((e: React.MouseEvent) => {
		keyboard.disableSelection(true);
	}, []);

	const onMouseUp = useCallback(() => {
		keyboard.disableSelection(false);
	}, []);

	const onCounterClick = useCallback(() => {
		setIsExpanded(true);
		isSectionVisibleRef.current = true;
		updateSocialVisibility();
		resize();

		window.setTimeout(() => {
			const container = U.Dom.getScrollContainer(isPopup);
			if (container) {
				container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
			};

			window.setTimeout(() => formRef.current?.focus(), 300);
		}, 50);
	}, [ isPopup, resize ]);

	const liveCount = posts.filter(it => !it.isDeleted).length;
	const counterLabel = liveCount > 0
		? `${liveCount} ${U.Common.plural(liveCount, translate('pluralComment'))}`
		: translate(object.isArchived ? 'commentDiscussion' : 'commentLeaveComment');

	const hasUnread = !!discussionId && U.Object.discussionHasUnread(S.Common.space, discussionId);
	const cn = [ 'commentSection', (isOpen ? 'isVisible' : '') ];

	return (
		<>
			<div ref={sectionRef} className={cn.join(' ')} onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
				{isOpen ? <div className="commentTitle">{translate('commentDiscussion')}</div> : null}

				{postCount > 0 ? (
					<div className="commentBody">
						<CommentList
							rootId={rootId}
							targetId={discussionId || targetId}
							targetType={targetType}
							readonly={readonly}
						/>
					</div>
				) : null}

				{isOpen ? (
					<CommentActivity
						discussionId={discussionId}
						subId={subId}
						onResize={scrollToBottomCheck}
					/>
				) : null}

				{isOpen ? (
					<div className="commentFormWrap">
						<CommentForm
							ref={formRef}
							rootId={rootId}
							subId={subId}
							discussionId={discussionId}
							readonly={readonly}
							onSubmit={onSubmitPost}
							onResize={scrollToBottomCheck}
						/>
					</div>
				) : null}
			</div>

			<div className="socialBlockWrap">
				<div ref={socialRef} className="socialBlock isHidden">
					<div className="commentCounter" onClick={onCounterClick}>
						<Icon name="comment/discussion" className="discussion" size={18} />
						<span className="count">{counterLabel}</span>
						{hasUnread ? <span className="unreadDot" /> : null}
					</div>
				</div>
			</div>
		</>
	);
};

export default CommentSection;
