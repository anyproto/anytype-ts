import React, { useEffect, useCallback, useRef } from 'react';
import { observer } from 'mobx-react';
import { I, C, S, U, translate } from 'Lib';
import CommentList from './list';
import CommentForm from './form';

const POST_LIMIT = 20;

const CommentSection = observer((props: I.CommentSectionProps) => {

	const { rootId, targetId, targetType, readonly, isPopup } = props;
	const subId = U.Comment.getSubId(targetType, targetId);
	const formRef = useRef<any>(null);
	const isLoaded = useRef(false);

	useEffect(() => {
		if (targetId) {
			subscribe();
		};

		return () => {
			if (targetId) {
				unsubscribe();
			};
		};
	}, [ targetId ]);

	const subscribe = useCallback(() => {
		C.ChatSubscribeLastMessages(targetId, POST_LIMIT, subId, (message: any) => {
			if (message.error.code) {
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

			S.Comment.setPosts(subId, posts);
			S.Comment.setHasMorePosts(subId, posts.length >= POST_LIMIT);

			// Store replies grouped by parent
			for (const reply of replies) {
				S.Comment.addReply(reply.replyToMessageId, reply);
			};

			isLoaded.current = true;
		});
	}, [ targetId, subId ]);

	const unsubscribe = useCallback(() => {
		C.ChatUnsubscribe(targetId, subId);
		S.Comment.clear(subId);
	}, [ targetId, subId ]);

	const onLoadMore = useCallback(() => {
		const posts = S.Comment.getPosts(subId);
		if (!posts.length) {
			return;
		};

		const firstPost = posts[0];

		C.ChatGetMessages(targetId, firstPost.orderId, '', POST_LIMIT, false, (message: any) => {
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

	const onSubmitPost = useCallback((parts: I.CommentContentPart[]) => {
		const encoded = U.Comment.encodeParts(parts);
		const { account } = S.Auth;

		const msg = {
			replyToMessageId: '',
			content: {
				text: encoded.text,
				style: encoded.style,
				marks: encoded.marks,
			},
			attachments: [],
			reactions: [],
		};

		C.ChatAddMessage(targetId, msg as any, (response: any) => {
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
					...encoded,
					parts,
				},
				attachments: [],
				reactions: [],
				isSynced: false,
				replyCount: 0,
			};

			S.Comment.addPost(subId, newPost as any);
			formRef.current?.clear();
		});
	}, [ targetId, subId ]);

	return (
		<div className="commentSection">
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
			/>
		</div>
	);
});

export default CommentSection;
