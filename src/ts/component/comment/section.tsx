import React, { useEffect, useCallback, useRef, useState } from 'react';
import raf from 'raf';
import { Icon } from 'Component';
import CommentList from './list';
import CommentForm from './form';
import * as I from 'Interface';

const HIGHLIGHT_DURATION = 2000;

const POST_LIMIT = 20;
const REPLY_LIMIT = 10;
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
		const post = S.Comment.getPostById(sid, id);
		if (post) {
			return post;
		};

		for (const p of S.Comment.getPosts(sid)) {
			const reply = S.Comment.getReplies(p.id).find(it => it.id == id);
			if (reply) {
				return reply;
			};
		};

		return null;
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
		if (!did) {
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

		const sid = U.Comment.getSubId(targetType, did);
		const ids: string[] = [ ...scrolledItems.current ];
		const first = findMessage(sid, ids[0]);
		const last = findMessage(sid, ids[ids.length - 1]);
		const chatPreviewSubId = S.Chat.getChatSubId(J.Constant.subId.chatPreview, S.Common.space, did);
		const { lastStateId } = S.Chat.getState(chatPreviewSubId);

		if (S.Common.windowIsFocused && first && last) {
			C.ChatReadMessages(did, first.orderId, last.orderId, lastStateId, I.ChatReadType.Message);
			C.ChatReadMessages(did, first.orderId, last.orderId, lastStateId, I.ChatReadType.Mention);

			S.Comment.setReadMessageStatus(sid, ids, true);
			S.Comment.setReadMentionStatus(sid, ids, true);
		};

		scrolledItems.current.clear();
	}, [ targetType, findMessage ]);

	const readVisibleMessages = useCallback(() => {
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
	}, [ getVisibleMessages, readMessage, onReadStop ]);

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

	const handleMessageId = useCallback((discId: string) => {
		if (!messageId || messageIdHandled.current) {
			return;
		};

		messageIdHandled.current = true;

		C.ChatGetMessagesByIds(discId, [ messageId ], (message: any) => {
			if (message.error.code || !message.messages?.length) {
				return;
			};

			const msg = message.messages[0];
			const sid = U.Comment.getSubId(targetType, discId);
			const isReply = !!msg.replyToMessageId;

			if (isReply) {
				// For a reply, check if the parent post is loaded
				const parentId = msg.replyToMessageId;
				const posts = S.Comment.getPosts(sid);
				const parentLoaded = posts.find(it => it.id == parentId);

				if (!parentLoaded) {
					// Load the parent post first
					C.ChatGetMessagesByIds(discId, [ parentId ], (parentMessage: any) => {
						if (parentMessage.error.code || !parentMessage.messages?.length) {
							return;
						};

						const parentPost = parentMessage.messages[0];

						// Load posts around the parent
						loadPostsAroundMessage(discId, sid, parentPost, () => {
							// Load replies around the target reply
							loadRepliesAroundMessage(discId, parentId, msg, () => {
								scrollToMessage(messageId);
							});
						});
					});
				} else {
					// Parent is loaded, load replies around the target
					loadRepliesAroundMessage(discId, parentId, msg, () => {
						scrollToMessage(messageId);
					});
				};
			} else {
				// It's a top-level post — check if it's already loaded
				const posts = S.Comment.getPosts(sid);
				const postLoaded = posts.find(it => it.id == msg.id);

				if (postLoaded) {
					scrollToMessage(messageId);
				} else {
					loadPostsAroundMessage(discId, sid, msg, () => {
						scrollToMessage(messageId);
					});
				};
			};
		});
	}, [ messageId, targetType, scrollToMessage ]);

	const loadPostsAroundMessage = useCallback((discId: string, sid: string, msg: any, callBack?: () => void) => {
		// Load posts before the target (older)
		C.ChatGetMessages(discId, msg.orderId, '', POST_LIMIT, false, (beforeMsg: any) => {
			if (!beforeMsg.error.code) {
				const beforePosts = (beforeMsg.messages || [])
					.filter((it: any) => !it.replyToMessageId)
					.map((it: any) => ({
						...it,
						content: { ...it.content, parts: U.Comment.blocksToParts(it.blocks, it.content) },
						replyCount: 0,
					}));

				loadDeps(beforePosts, () => {
					S.Comment.prependPosts(sid, beforePosts);
					S.Comment.setHasMorePosts(sid, beforePosts.length >= POST_LIMIT);
					callBack?.();
				});
			} else {
				callBack?.();
			};
		});
	}, [ loadDeps ]);

	const loadRepliesAroundMessage = useCallback((discId: string, parentId: string, msg: any, callBack?: () => void) => {
		// Load replies before the target (older)
		C.ChatGetMessages(discId, msg.orderId, '', REPLY_LIMIT, false, (beforeMsg: any) => {
			const beforeReplies = (!beforeMsg.error.code ? beforeMsg.messages || [] : [])
				.filter((it: any) => it.replyToMessageId == parentId)
				.map((it: any) => ({
					...it,
					content: { ...it.content, parts: U.Comment.blocksToParts(it.blocks, it.content) },
					replyCount: 0,
				}));

			// Load replies after the target (newer)
			C.ChatGetMessages(discId, '', msg.orderId, REPLY_LIMIT, false, (afterMsg: any) => {
				const afterReplies = (!afterMsg.error.code ? afterMsg.messages || [] : [])
					.filter((it: any) => it.replyToMessageId == parentId)
					.map((it: any) => ({
						...it,
						content: { ...it.content, parts: U.Comment.blocksToParts(it.blocks, it.content) },
						replyCount: 0,
					}));

				// Combine: before + target + after
				const targetReply = {
					...msg,
					content: { ...msg.content, parts: U.Comment.blocksToParts(msg.blocks, msg.content) },
					replyCount: 0,
				};

				const allReplies = [ ...beforeReplies, targetReply, ...afterReplies ];

				loadDeps(allReplies, () => {
					S.Comment.setReplies(parentId, allReplies);
					S.Comment.setHasMoreReplies(parentId, afterReplies.length >= REPLY_LIMIT);
					S.Comment.setHasOlderReplies(parentId, beforeReplies.length >= REPLY_LIMIT);
					callBack?.();
				});
			});
		});
	}, [ loadDeps ]);

	const buildTree = useCallback((messages: any[], sid: string, callBack?: () => void) => {
		const posts = messages.filter((it: any) => !it.replyToMessageId);
		const replies = messages.filter((it: any) => it.replyToMessageId);

		const replyCountMap: Record<string, number> = {};
		const replyGroups: Record<string, any[]> = {};

		for (const reply of replies) {
			const pid = reply.replyToMessageId;

			replyCountMap[pid] = (replyCountMap[pid] || 0) + 1;

			if (!replyGroups[pid]) {
				replyGroups[pid] = [];
			};
			replyGroups[pid].push(reply);
		};

		for (const post of posts) {
			post.replyCount = replyCountMap[post.id] || 0;
		};

		loadDeps(messages, () => {
			S.Comment.setPosts(sid, posts);
			S.Comment.setHasMorePosts(sid, false);

			for (const [ parentId, groupReplies ] of Object.entries(replyGroups)) {
				S.Comment.setReplies(parentId, groupReplies);
			};

			callBack?.();
		});
	}, [ loadDeps ]);

	const fetchAllMessages = useCallback((discId: string, sid: string, callBack?: () => void) => {
		const PAGE_SIZE = 100;

		const fetchPage = (afterOrderId: string, accumulated: any[]) => {
			C.ChatGetMessages(discId, '', afterOrderId, PAGE_SIZE, false, (message: any) => {
				if (message.error.code) {
					buildTree(accumulated, sid, callBack);
					return;
				};

				const batch = (message.messages || []).map((it: any) => ({
					...it,
					content: {
						...it.content,
						parts: U.Comment.blocksToParts(it.blocks, it.content),
					},
				}));

				const all = [ ...accumulated, ...batch ];

				if (batch.length >= PAGE_SIZE) {
					fetchPage(batch[batch.length - 1].orderId, all);
				} else {
					buildTree(all, sid, callBack);
				};
			});
		};

		fetchPage('', []);
	}, [ loadDeps, buildTree ]);

	const subscribe = useCallback((id: string) => {
		const sid = U.Comment.getSubId(targetType, id);

		subscribedId.current = id;

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

			fetchAllMessages(id, sid, () => {
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

	const onLoadMore = useCallback((callBack?: () => void) => {
		if (!discussionId) {
			callBack?.();
			return;
		};

		const posts = S.Comment.getPosts(subId);
		if (!posts.length) {
			callBack?.();
			return;
		};

		const firstPost = posts[0];

		C.ChatGetMessages(discussionId, firstPost.orderId, '', POST_LIMIT, false, (message: any) => {
			if (message.error.code) {
				callBack?.();
				return;
			};

			const messages = (message.messages || [])
				.filter((it: any) => !it.replyToMessageId)
				.map((it: any) => ({
					...it,
					content: {
						...it.content,
						parts: U.Comment.blocksToParts(it.blocks, it.content),
					},
					replyCount: 0,
				}));

			loadDeps(messages, () => {
				S.Comment.prependPosts(subId, messages);
				S.Comment.setHasMorePosts(subId, messages.length >= POST_LIMIT);
				callBack?.();
			});
		});
	}, [ discussionId, subId, loadDeps ]);

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
					replyCount: 0,
				};

				S.Comment.addPost(sid, newPost as any);
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

	const counterLabel = postCount > 0
		? `${postCount} ${U.Common.plural(postCount, translate('pluralComment'))}`
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
							onLoadMore={onLoadMore}
						/>
					</div>
				) : null}

				{isOpen ? (
					<div className="commentFormWrap">
						<CommentForm
							ref={formRef}
							rootId={rootId}
							subId={subId}
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
