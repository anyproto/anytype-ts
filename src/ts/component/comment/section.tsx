import React, { useEffect, useCallback, useRef } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, U, keyboard, translate } from 'Lib';
import CommentList from './list';
import CommentForm from './form';
import mockupPosts from './mockupPosts';

const POST_LIMIT = 20;
const SCROLL_THRESHOLD = 16;

const CommentSection = observer((props: I.CommentSectionProps) => {

	const { rootId, targetId, targetType, readonly, isPopup } = props;
	const subId = U.Comment.getSubId(targetType, targetId);
	const formRef = useRef<any>(null);
	const isLoaded = useRef(false);
	const localIdCounter = useRef(0);
	const isBottom = useRef(false);

	useEffect(() => {
		if (targetId) {
			subscribe();
		};

		const container = U.Common.getScrollContainer(isPopup);
		const ns = 'commentSection';

		container.on(`scroll.${ns}`, () => {
			const st = Math.ceil(container.scrollTop());
			const max = U.Common.getMaxScrollHeight(isPopup);

			isBottom.current = (max - st) <= SCROLL_THRESHOLD;
		});

		return () => {
			container.off(`scroll.${ns}`);

			if (targetId) {
				unsubscribe();
			};
		};
	}, [ targetId ]);

	const subscribe = useCallback(() => {
		C.ChatSubscribeLastMessages(targetId, POST_LIMIT, subId, (message: any) => {
			if (message.error.code) {
				// Seed mockup posts on error (no middleware)
				seedMockup();
				isLoaded.current = true;
				return;
			};

			const messages = (message.messages || []).map((it: any) => ({
				...it,
				content: {
					...it.content,
					parts: U.Comment.decodeParts(it.content),
				},
				replyCount: 0,
			}));

			// Separate posts from replies
			const posts = messages.filter((it: any) => !it.replyToMessageId);
			const replies = messages.filter((it: any) => it.replyToMessageId);

			// Count replies per post
			const replyCountMap: Record<string, number> = {};
			for (const reply of replies) {
				replyCountMap[reply.replyToMessageId] = (replyCountMap[reply.replyToMessageId] || 0) + 1;
			};

			// Update reply counts on posts
			for (const post of posts) {
				post.replyCount = replyCountMap[post.id] || 0;
			};

			// If no real posts, seed mockup data
			if (!posts.length) {
				seedMockup();
			} else {
				S.Comment.setPosts(subId, posts);
			};

			S.Comment.setHasMorePosts(subId, posts.length >= POST_LIMIT);

			// Store replies grouped by parent
			for (const reply of replies) {
				S.Comment.addReply(reply.replyToMessageId, reply);
			};

			isLoaded.current = true;
		});
	}, [ targetId, subId ]);

	const seedMockup = useCallback(() => {
		S.Comment.setPosts(subId, mockupPosts);
	}, [ subId ]);

	const unsubscribe = useCallback(() => {
		C.ChatUnsubscribe(targetId, subId);
		S.Comment.clear(subId);
	}, [ targetId, subId ]);

	const scrollToBottom = useCallback(() => {
		const container = U.Common.getScrollContainer(isPopup);
		if (container.length) {
			isBottom.current = true;
			container.scrollTop(U.Common.getMaxScrollHeight(isPopup));
		};
	}, [ isPopup ]);

	const scrollToBottomCheck = useCallback(() => {
		if (isBottom.current) {
			scrollToBottom();
		};
	}, [ scrollToBottom ]);

	const onLoadMore = useCallback((callBack?: () => void) => {
		const posts = S.Comment.getPosts(subId);
		if (!posts.length) {
			callBack?.();
			return;
		};

		const firstPost = posts[0];

		C.ChatGetMessages(targetId, firstPost.orderId, '', POST_LIMIT, false, (message: any) => {
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
						parts: U.Comment.decodeParts(it.content),
					},
					replyCount: 0,
				}));

			S.Comment.prependPosts(subId, messages);
			S.Comment.setHasMorePosts(subId, messages.length >= POST_LIMIT);
		});
	}, [ targetId, subId ]);

	const onSubmitPost = useCallback((parts: I.CommentContentPart[], messageAttachments?: I.ChatMessageAttachment[]) => {
		const encoded = U.Comment.encodeParts(parts);
		const { account } = S.Auth;

		const msg = {
			replyToMessageId: '',
			content: {
				text: encoded.text,
				style: encoded.style,
				marks: encoded.marks,
			},
			attachments: messageAttachments || [],
			reactions: [],
		};

		C.ChatAddMessage(targetId, msg as any, (response: any) => {
			if (response.error.code) {
				// Add locally even on error so the MVP works without middleware
				localIdCounter.current++;

				const newPost = {
					id: `local-${localIdCounter.current}`,
					orderId: `local-${localIdCounter.current}`,
					creator: account?.id || '',
					createdAt: U.Date.now(),
					modifiedAt: 0,
					replyToMessageId: '',
					content: {
						...encoded,
						parts,
					},
					attachments: messageAttachments || [],
					reactions: [],
					isSynced: false,
					replyCount: 0,
				};

				S.Comment.addPost(subId, newPost as any);
				formRef.current?.clear();
				window.setTimeout(() => scrollToBottom(), 50);
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
					...encoded,
					parts,
				},
				attachments: messageAttachments || [],
				reactions: [],
				isSynced: false,
				replyCount: 0,
			};

			S.Comment.addPost(subId, newPost as any);
			formRef.current?.clear();
			window.setTimeout(() => scrollToBottom(), 50);
		});
	}, [ targetId, subId, scrollToBottom ]);

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
		<div className="commentSection" onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
			<CommentList
				rootId={rootId}
				targetId={targetId}
				targetType={targetType}
				readonly={readonly}
				onLoadMore={onLoadMore}
			/>

			<CommentForm
				ref={formRef}
				rootId={rootId}
				readonly={readonly}
				onSubmit={onSubmitPost}
				onResize={scrollToBottomCheck}
			/>
		</div>
	);
});

export default CommentSection;
