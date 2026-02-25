import React, { useState, useCallback } from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, S, U, C, Mark, translate } from 'Lib';
import CommentForm from './form';

interface Props {
	rootId: string;
	targetId: string;
	parentId: string;
	message: I.CommentMessage;
	readonly?: boolean;
};

const CommentReply = observer((props: Props) => {

	const { rootId, targetId, parentId, message, readonly } = props;
	const { space } = S.Common;
	const { account } = S.Auth;
	const [ isEditing, setIsEditing ] = useState(false);
	const { id, creator, content, createdAt, modifiedAt } = message;
	const author = U.Space.getParticipant(U.Space.getParticipantId(space, creator));
	const isSelf = creator == account.id;
	const parts = U.Comment.decodeParts(content);
	const editedLabel = modifiedAt ? ` (${translate('commentEdited')})` : '';

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

			S.Comment.updateReply(parentId, {
				id,
				modifiedAt: U.Date.now(),
				content: {
					...encoded,
					parts: newParts,
				},
			} as any);
		});
	}, [ targetId, id, parentId ]);

	const onDelete = useCallback(() => {
		C.ChatDeleteMessage(targetId, id, () => {
			S.Comment.deleteReply(parentId, id);

			const subId = U.Comment.getSubId(I.CommentTargetType.Object, targetId);
			const post = S.Comment.getPostById(subId, parentId);
			if (post) {
				S.Comment.updatePost(subId, {
					id: parentId,
					replyCount: Math.max(0, post.replyCount - 1),
				} as any);
			};
		});
	}, [ targetId, id, parentId ]);

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
		<div className="commentReply">
			<div className="head">
				<IconObject
					object={{ ...author, layout: I.ObjectLayout.Participant }}
					size={24}
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
					{isSelf ? (
						<>
							<div className="action" onClick={onEdit}>{translate('commentEdit')}</div>
							<div className="action" onClick={onDelete}>{translate('commentDelete')}</div>
						</>
					) : ''}
				</div>
			) : ''}
		</div>
	);
});

export default CommentReply;
