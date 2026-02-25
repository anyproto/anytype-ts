import React, { useState, useCallback, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, S, U, C, Mark, translate } from 'Lib';
import CommentForm from './form';
import CommentReply from './reply';

interface Props {
	rootId: string;
	targetId: string;
	message: I.CommentMessage;
	readonly?: boolean;
};

const REPLY_LIMIT = 10;

const CommentPost = observer((props: Props) => {

	const { rootId, targetId, message, readonly } = props;
	const { space } = S.Common;
	const { account } = S.Auth;
	const [ isEditing, setIsEditing ] = useState(false);
	const [ isReplying, setIsReplying ] = useState(false);
	const replyFormRef = useRef<any>(null);
	const { id, creator, content, createdAt, modifiedAt, replyCount } = message;
	const author = U.Space.getParticipant(U.Space.getParticipantId(space, creator));
	const isSelf = creator == account.id;
	const parts = U.Comment.decodeParts(content);
	const editedLabel = modifiedAt ? ` (${translate('commentEdited')})` : '';
	const replies = S.Comment.getReplies(id);
	const hasMoreReplies = S.Comment.getHasMoreReplies(id);

	useEffect(() => {
		if (replyCount > 0) {
			loadReplies(true);
		};
	}, [ id ]);

	const loadReplies = useCallback((initial?: boolean) => {
		const existing = S.Comment.getReplies(id);
		const afterOrderId = existing.length ? existing[existing.length - 1].orderId : '';

		C.ChatGetMessages(targetId, '', afterOrderId, REPLY_LIMIT, false, (message: any) => {
			if (message.error.code) {
				return;
			};

			const messages = (message.messages || [])
				.filter((it: any) => it.replyToMessageId == id)
				.map((it: any) => ({
					...it,
					content: {
						...it.content,
						parts: U.Comment.decodeParts(it.content),
					},
					replyCount: 0,
				}));

			if (initial) {
				S.Comment.setReplies(id, messages);
			} else {
				S.Comment.appendReplies(id, messages);
			};

			S.Comment.setHasMoreReplies(id, messages.length >= REPLY_LIMIT);
		});
	}, [ id, targetId ]);

	const onEdit = useCallback(() => {
		setIsEditing(true);
	}, []);

	const onCancelEdit = useCallback(() => {
		setIsEditing(false);
	}, []);

	const onSaveEdit = useCallback((newParts: I.CommentContentPart[]) => {
		const encoded = U.Comment.encodeParts(newParts);

		C.ChatEditMessageContent(targetId, id, {
			text: encoded.text,
			style: encoded.style,
			marks: encoded.marks,
		} as any, () => {
			setIsEditing(false);

			const subId = U.Comment.getSubId(I.CommentTargetType.Object, targetId);
			S.Comment.updatePost(subId, {
				id,
				modifiedAt: U.Date.now(),
				content: {
					...encoded,
					parts: newParts,
				},
			} as any);
		});
	}, [ targetId, id ]);

	const onDelete = useCallback(() => {
		const subId = U.Comment.getSubId(I.CommentTargetType.Object, targetId);

		C.ChatDeleteMessage(targetId, id, () => {
			S.Comment.deletePost(subId, id);
		});
	}, [ targetId, id ]);

	const onReply = useCallback(() => {
		setIsReplying(true);
		window.setTimeout(() => replyFormRef.current?.focus(), 50);
	}, []);

	const onCancelReply = useCallback(() => {
		setIsReplying(false);
	}, []);

	const onSubmitReply = useCallback((newParts: I.CommentContentPart[]) => {
		const encoded = U.Comment.encodeParts(newParts);

		const msg = {
			replyToMessageId: id,
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

			const newReply = {
				id: response.messageId,
				orderId: response.orderId,
				creator: account.id,
				createdAt: U.Date.now(),
				modifiedAt: 0,
				replyToMessageId: id,
				content: {
					...encoded,
					parts: newParts,
				},
				attachments: [],
				reactions: [],
				isSynced: false,
				replyCount: 0,
			};

			S.Comment.addReply(id, newReply as any);

			const subId = U.Comment.getSubId(I.CommentTargetType.Object, targetId);
			S.Comment.updatePost(subId, {
				id,
				replyCount: (replyCount || 0) + 1,
			} as any);

			setIsReplying(false);
			replyFormRef.current?.clear();
		});
	}, [ targetId, id, replyCount ]);

	const renderContent = () => {
		if (isEditing) {
			return (
				<CommentForm
					rootId={rootId}
					initialParts={parts}
					isEdit={true}
					onSubmit={onSaveEdit}
					onCancel={onCancelEdit}
				/>
			);
		};

		const html = parts.map(part => {
			return U.String.sanitize(Mark.toHtml(part.text, part.marks));
		}).join('<br/>');

		return (
			<div className="content" dangerouslySetInnerHTML={{ __html: html }} />
		);
	};

	return (
		<div className="commentPost">
			<div className="head">
				<IconObject
					object={{ ...author, layout: I.ObjectLayout.Participant }}
					size={28}
				/>
				<div className="author">
					<ObjectName object={author} />
				</div>
				<div className="date">
					{U.Date.date('M j, H:i', createdAt)}{editedLabel}
				</div>
			</div>

			{renderContent()}

			{!isEditing && !readonly ? (
				<div className="actions">
					<div className="action" onClick={onReply}>{translate('commentReply')}</div>
					{isSelf ? (
						<>
							<div className="action" onClick={onEdit}>{translate('commentEdit')}</div>
							<div className="action" onClick={onDelete}>{translate('commentDelete')}</div>
						</>
					) : ''}
				</div>
			) : ''}

			{replies.length ? (
				<div className="replyList">
					{hasMoreReplies ? (
						<div className="loadMore" onClick={() => loadReplies()}>
							{translate('commentLoadMoreReplies')}
						</div>
					) : ''}

					{replies.map(reply => (
						<CommentReply
							key={reply.id}
							rootId={rootId}
							targetId={targetId}
							parentId={id}
							message={reply}
							readonly={readonly}
						/>
					))}
				</div>
			) : ''}

			{isReplying ? (
				<div className="replyFormWrap">
					<CommentForm
						ref={replyFormRef}
						rootId={rootId}
						placeholder={translate('commentReplyPlaceholder')}
						onSubmit={onSubmitReply}
						onCancel={onCancelReply}
					/>
				</div>
			) : ''}
		</div>
	);
});

export default CommentPost;
