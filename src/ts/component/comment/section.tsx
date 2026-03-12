import React, { useEffect, useCallback, useRef, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, U, keyboard, translate } from 'Lib';
import CommentList from './list';
import CommentForm from './form';

const POST_LIMIT = 20;
const SCROLL_THRESHOLD = 16;

const CommentSection = observer((props: I.CommentSectionProps) => {

	const { rootId, targetId, targetType, readonly, isPopup } = props;
	const object = S.Detail.get(rootId, rootId, [ 'discussionId' ]);
	const [ localDiscussionId, setLocalDiscussionId ] = useState('');
	const discussionId = object.discussionId || localDiscussionId || '';
	const subId = U.Comment.getSubId(targetType, discussionId || targetId);
	const formRef = useRef<any>(null);
	const isLoaded = useRef(false);
	const isBottom = useRef(false);
	const isCreating = useRef(false);
	const subscribedId = useRef('');
	const sectionRef = useRef<HTMLDivElement>(null);

	const resize = useCallback(() => {
		const node = sectionRef.current;
		if (!node) {
			return;
		};

		const container = U.Common.getScrollContainer(isPopup);
		if (!container.length) {
			return;
		};

		// Reset to natural height before measuring
		node.style.minHeight = '0px';

		const containerEl = container.get(0);
		const containerHeight = containerEl.clientHeight;
		const scrollHeight = containerEl.scrollHeight;
		const gap = containerHeight - scrollHeight;

		node.style.minHeight = (gap > 0) ? `${node.offsetHeight + gap}px` : '';
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
		});

		resize();

		return () => {
			container.off(`scroll.${ns}`);

			if (discussionId) {
				unsubscribe(discussionId);
			};
		};
	}, [ discussionId ]);

	useEffect(() => {
		window.addEventListener('resize', resize);
		return () => window.removeEventListener('resize', resize);
	}, [ resize ]);

	const subscribe = useCallback((id: string) => {
		const sid = U.Comment.getSubId(targetType, id);

		subscribedId.current = id;

		C.ChatSubscribeLastMessages(id, POST_LIMIT, sid, (message: any) => {
			if (message.error.code) {
				isLoaded.current = true;
				return;
			};

			const messages = (message.messages || []).map((it: any) => ({
				...it,
				content: {
					...it.content,
					parts: U.Comment.blocksToParts(it.blocks, it.content),
				},
				replyCount: 0,
			}));

			const posts = messages.filter((it: any) => !it.replyToMessageId);
			const replies = messages.filter((it: any) => it.replyToMessageId);

			const replyCountMap: Record<string, number> = {};
			for (const reply of replies) {
				replyCountMap[reply.replyToMessageId] = (replyCountMap[reply.replyToMessageId] || 0) + 1;
			};

			for (const post of posts) {
				post.replyCount = replyCountMap[post.id] || 0;
			};

			S.Comment.setPosts(sid, posts);
			S.Comment.setHasMorePosts(sid, posts.length >= POST_LIMIT);

			for (const reply of replies) {
				S.Comment.addReply(reply.replyToMessageId, reply);
			};

			isLoaded.current = true;
		});
	}, [ targetType ]);

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

				console.log(el.scrollTop, el.scrollHeight);
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
			callBack?.();

			if (message.error.code) {
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

			S.Comment.prependPosts(subId, messages);
			S.Comment.setHasMorePosts(subId, messages.length >= POST_LIMIT);
		});
	}, [ discussionId, subId ]);

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

	const onSubmitPost = useCallback((parts: I.CommentContentPart[], messageAttachments?: I.ChatMessageAttachment[]) => {
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

			C.ChatAddMessage(id, msg as any, (response: any) => {
				if (response.error.code) {
					return;
				};

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
	}, [ discussionId, subId, scrollToBottom, ensureDiscussion ]);

	const onMouseDown = useCallback((e: React.MouseEvent) => {
		keyboard.disableSelection(true);

		// Allow native text selection inside rendered comment content
		const target = e.target as HTMLElement;
		if (target.closest('.content') || target.closest('.commentAttachments')) {
			keyboard.disableSelection(false);
		};
	}, []);

	const onMouseUp = useCallback(() => {
		keyboard.disableSelection(false);
	}, []);

	return (
		<div ref={sectionRef} className="commentSection" onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
			<div className="sectionTitle">{translate('commentDiscussion')}</div>

			<div className="commentBody">
				<CommentList
					rootId={rootId}
					targetId={discussionId || targetId}
					targetType={targetType}
					readonly={readonly}
					onLoadMore={onLoadMore}
				/>
			</div>

			<div className="commentFormWrap">
				<CommentForm
					ref={formRef}
					rootId={rootId}
					readonly={readonly}
					onSubmit={onSubmitPost}
					onResize={scrollToBottom}
				/>
			</div>
		</div>
	);
});

export default CommentSection;
