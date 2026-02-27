import React, { useState, useCallback } from 'react';
import * as Prism from 'prismjs';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, S, U, C, Mark, translate } from 'Lib';
import CommentForm from './form';
import Attachment from 'Component/block/chat/attachment';

interface Props {
	rootId: string;
	targetId: string;
	parentId: string;
	message: I.CommentMessage;
	readonly?: boolean;
};

/**
 * Render a single CommentContentPart to HTML (simplified for replies)
 */
const renderPart = (part: I.CommentContentPart, index: number): JSX.Element => {
	const key = `part-${index}`;

	if (part.type === I.BlockType.Div) {
		return <hr key={key} className="commentDivider" />;
	};

	const html = U.String.sanitize(Mark.toHtml(part.text || '', part.marks || []));

	switch (part.style) {
		case I.TextStyle.Header1:
			return <h1 key={key} className="commentH1" dangerouslySetInnerHTML={{ __html: html }} />;

		case I.TextStyle.Header2:
			return <h2 key={key} className="commentH2" dangerouslySetInnerHTML={{ __html: html }} />;

		case I.TextStyle.Header3:
			return <h3 key={key} className="commentH3" dangerouslySetInnerHTML={{ __html: html }} />;

		case I.TextStyle.Quote:
			return <blockquote key={key} className="commentBlockquote" dangerouslySetInnerHTML={{ __html: html }} />;

		case I.TextStyle.Code: {
			const grammar = Prism.languages.clike || {};
			const highlighted = Prism.highlight(part.text || '', grammar, 'clike');

			return <pre key={key} className="commentCodeBlock"><code dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>;
		}

		case I.TextStyle.Bulleted:
		case I.TextStyle.Numbered:
			return <div key={key} className="commentListItem" dangerouslySetInnerHTML={{ __html: html }} />;

		case I.TextStyle.Checkbox: {
			const cn = [ 'commentListItem', 'commentCheckbox' ];
			if (part.checked) {
				cn.push('isChecked');
			};
			return (
				<div key={key} className={cn.join(' ')}>
					<div className="checkboxMark" />
					<span dangerouslySetInnerHTML={{ __html: html }} />
				</div>
			);
		};

		default:
			return <p key={key} className="commentParagraph" dangerouslySetInnerHTML={{ __html: html }} />;
	};
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

	const renderAttachments = () => {
		const list = (message.attachments || [])
			.map(it => S.Detail.get(U.Comment.getSubId(I.CommentTargetType.Object, targetId), it.target))
			.filter(it => !it._empty_);

		if (!list.length) {
			return null;
		};

		return (
			<div className="commentAttachments">
				{list.map((item: any) => (
					<Attachment
						key={item.id}
						object={item}
						showAsFile={true}
						onRemove={() => {}}
					/>
				))}
			</div>
		);
	};

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

		return (
			<>
				<div className="content">
					{parts.map((part, i) => renderPart(part, i))}
				</div>
				{renderAttachments()}
			</>
		);
	};

	const renderActions = () => {
		if (isEditing || readonly || !isSelf) {
			return null;
		};

		return (
			<div className="actions">
				<div className="action" onClick={onEdit}>{translate('commentEdit')}</div>
				<div className="action" onClick={onDelete}>{translate('commentDelete')}</div>
			</div>
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
			{renderActions()}
		</div>
	);
});

export default CommentReply;
