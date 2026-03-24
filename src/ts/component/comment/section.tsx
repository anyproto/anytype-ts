import React, { useEffect, useCallback, useRef, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, C, S, U, keyboard, translate, analytics } from 'Lib';
import CommentList from './list';
import CommentForm from './form';

const HIGHLIGHT_DURATION = 2000;

const POST_LIMIT = 20;
const REPLY_LIMIT = 10;
const SCROLL_THRESHOLD = 16;

const CommentSection = observer((props: I.CommentSectionProps) => {

	const { rootId, targetId, targetType, readonly, isPopup, messageId } = props;
	const object = S.Detail.get(rootId, rootId, [ 'discussionId' ]);
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
	const placeholderRef = useRef<HTMLDivElement>(null);
	const wasStickyRef = useRef(false);
	const stickyRafRef = useRef(0);
	const messageIdHandled = useRef(false);

	const resize = useCallback(() => {
		props.resize?.();
	}, [ props.resize ]);

	const updateSocialSticky = useCallback(() => {
		const el = socialRef.current;
		const sectionEl = sectionRef.current;

		if (!el || !sectionEl) {
			return;
		};

		const container = U.Common.getScrollContainer(isPopup);
		if (!container.length) {
			return;
		};

		const viewportBottom = container.get(0).getBoundingClientRect().bottom;
		const ref = wasStickyRef.current ? placeholderRef.current : el;
		const isSticky = ref ? (ref.getBoundingClientRect().bottom > viewportBottom) : false;

		if (isSticky === wasStickyRef.current) {
			if (isSticky) {
				const rect = sectionEl.getBoundingClientRect();
				el.style.left = `${rect.left}px`;
				el.style.width = `${rect.width}px`;
			};
			return;
		};

		const naturalHeight = isSticky ? el.offsetHeight : 0;

		wasStickyRef.current = isSticky;
		el.classList.toggle('isSticky', isSticky);

		if (isSticky) {
			if (placeholderRef.current) {
				placeholderRef.current.style.height = `${naturalHeight}px`;
			};
			const rect = sectionEl.getBoundingClientRect();
			el.style.left = `${rect.left}px`;
			el.style.width = `${rect.width}px`;
		} else {
			if (placeholderRef.current) {
				placeholderRef.current.style.height = '0px';
			};
			el.style.left = '';
			el.style.width = '';
		};
	}, [ isPopup ]);

	useEffect(() => {
		if (discussionId && (subscribedId.current != discussionId)) {
			subscribe(discussionId);
		};

		const container = U.Common.getScrollContainer(isPopup);
		const ns = 'commentSection';

		container.on(`scroll.${ns}`, () => {
			const st = Math.ceil(container.scrollTop());
			const max = U.Common.getMaxScrollHeight(isPopup);

			isBottom.current = (max - st) <= SCROLL_THRESHOLD;
			updateSocialSticky();

			if (isHiddenRef.current) {
				isHiddenRef.current = false;
				socialRef.current?.classList.remove('isHidden');
			};
		});

		resize();
		updateSocialSticky();

		return () => {
			container.off(`scroll.${ns}`);

			if (discussionId) {
				unsubscribe(discussionId);
			};
		};
	}, [ discussionId, updateSocialSticky ]);

	useEffect(() => {
		const onResize = () => {
			resize();

			cancelAnimationFrame(stickyRafRef.current);
			stickyRafRef.current = requestAnimationFrame(() => {
				updateSocialSticky();
			});
		};

		window.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('resize', onResize);
			cancelAnimationFrame(stickyRafRef.current);
		};
	}, [ resize, updateSocialSticky ]);

	useEffect(() => {
		const setHidden = (v: boolean) => {
			if (v === isHiddenRef.current) {
				return;
			};
			isHiddenRef.current = v;
			socialRef.current?.classList.toggle('isHidden', v);
		};

		const onKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;

			if (!target?.closest('.blocks')) {
				return;
			};

			const canHide = wasStickyRef.current || (!S.Comment.getPosts(subId).length && !isExpanded);
			if (canHide) {
				setHidden(true);
			};
		};

		const onMouseMove = () => {
			setHidden(false);
		};

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('mousemove', onMouseMove);

		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('mousemove', onMouseMove);
		};
	}, [ subId, isExpanded ]);

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
		}, callBack);
	}, [ targetType, discussionId, targetId ]);

	const onMessageAdd = useCallback((e: any, message: any, eventSubIds: string[]) => {
		if (!eventSubIds.includes(subId)) {
			return;
		};

		loadDeps([ message ]);
	}, [ subId, loadDeps ]);

	useEffect(() => {
		const ns = 'commentSection';
		const win = $(window);

		win.on(`messageAdd.${ns}`, onMessageAdd);
		win.on(`messageUpdate.${ns}`, onMessageAdd);

		return () => {
			win.off(`messageAdd.${ns} messageUpdate.${ns}`);
		};
	}, [ onMessageAdd ]);

	const scrollToMessage = useCallback((msgId: string) => {
		window.setTimeout(() => {
			resize();

			const node = sectionRef.current;
			if (!node) {
				return;
			};

			const el = node.querySelector(`[data-message-id="${msgId}"]`);
			if (!el) {
				return;
			};

			const container = U.Common.getScrollContainer(isPopup);
			if (!container.length) {
				return;
			};

			const containerEl = container.get(0);
			const elRect = el.getBoundingClientRect();
			const containerRect = containerEl.getBoundingClientRect();
			const scrollTop = containerEl.scrollTop + (elRect.top - containerRect.top) - (containerRect.height / 3);

			containerEl.scrollTop = Math.max(0, scrollTop);

			el.classList.add('isHighlighted');
			window.setTimeout(() => el.classList.remove('isHighlighted'), HIGHLIGHT_DURATION);
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

	const subscribe = useCallback((id: string) => {
		const sid = U.Comment.getSubId(targetType, id);

		subscribedId.current = id;

		C.ChatSubscribeLastMessages(id, POST_LIMIT, sid, (message: any) => {
			if (message.error.code) {
				isLoaded.current = true;
				return;
			};

			fetchAllMessages(id, sid, () => {
				isLoaded.current = true;
				handleMessageId(id);
			});
		});
	}, [ targetType, fetchAllMessages, handleMessageId ]);

	const unsubscribe = useCallback((id: string) => {
		const sid = U.Comment.getSubId(targetType, id);

		subscribedId.current = '';

		C.ChatUnsubscribe(id, sid);
		S.Comment.clear(sid);
	}, [ targetType ]);

	const scrollToBottom = useCallback(() => {
		resize();

		window.setTimeout(() => {
			const container = U.Common.getScrollContainer(isPopup);
			if (container.length) {
				isBottom.current = true;

				const el = container.get(0);
				el.scrollTop = el.scrollHeight;
			};
		}, 0);
	}, [ isPopup, resize ]);

	const scrollToBottomCheck = useCallback(() => {
		if (isBottom.current) {
			scrollToBottom();
		};
	}, [ scrollToBottom ]);

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
		const blocks = U.Comment.partsToBlocks(parts);
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
				formRef.current?.clear();
				window.setTimeout(() => scrollToBottom(), 50);
			});
		});
	}, [ discussionId, subId, scrollToBottom, ensureDiscussion, getCommentAnalyticsData ]);

	const onMouseDown = useCallback((e: React.MouseEvent) => {
		keyboard.disableSelection(true);
	}, []);

	const onMouseUp = useCallback(() => {
		keyboard.disableSelection(false);
	}, []);

	const onCounterClick = useCallback(() => {
		setIsExpanded(true);

		window.setTimeout(() => {
			const container = U.Common.getScrollContainer(isPopup);
			if (container.length) {
				const el = container.get(0);
				el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
			};

			window.setTimeout(() => formRef.current?.focus(), 300);
		}, 50);
	}, [ isPopup ]);

	const posts = S.Comment.getPosts(subId);
	const postCount = posts.length;
	const isOpen = (postCount > 0) || isExpanded;

	return (
		<div ref={sectionRef} className="commentSection" onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
			<div ref={placeholderRef} className="socialPlaceholder" />
			<div ref={socialRef} className="socialBlock">
				<div className="commentCounter" onClick={onCounterClick}>
					<Icon name="comment/discussion" className="discussion" size={16} />
					<span className="count">{postCount}</span>
				</div>
			</div>

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
	);
});

export default CommentSection;
