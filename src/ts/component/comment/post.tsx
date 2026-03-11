import React, { useState, useCallback, useRef, useEffect } from 'react';
import $ from 'jquery';
import * as Prism from 'prismjs';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, S, U, C, Mark, translate } from 'Lib';
import CommentForm from './form';
import CommentReply from './reply';
import Attachment from 'Component/block/chat/attachment';

interface Props {
	rootId: string;
	targetId: string;
	message: I.CommentMessage;
	readonly?: boolean;
};

const REPLY_LIMIT = 10;

/**
 * Render a single CommentContentPart to HTML
 */
const renderPart = (part: I.CommentContentPart, index: number): JSX.Element => {
	const key = `part-${index}`;

	// Divider
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
			return <div key={key} className="commentListItem commentBulleted" dangerouslySetInnerHTML={{ __html: html }} />;

		case I.TextStyle.Numbered:
			return <div key={key} className="commentListItem commentNumbered" dangerouslySetInnerHTML={{ __html: html }} />;

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

/**
 * Group consecutive list items and wrap them in appropriate list elements
 */
const renderParts = (parts: I.CommentContentPart[]): JSX.Element[] => {
	const elements: JSX.Element[] = [];
	let i = 0;

	while (i < parts.length) {
		const part = parts[i];

		// Group consecutive bulleted items
		if (part.style === I.TextStyle.Bulleted) {
			const items: JSX.Element[] = [];
			let j = i;

			while ((j < parts.length) && (parts[j].style === I.TextStyle.Bulleted)) {
				const html = U.String.sanitize(Mark.toHtml(parts[j].text || '', parts[j].marks || []));
				items.push(<li key={`li-${j}`} dangerouslySetInnerHTML={{ __html: html }} />);
				j++;
			};

			elements.push(<ul key={`ul-${i}`} className="commentList commentUl">{items}</ul>);
			i = j;
			continue;
		};

		// Group consecutive numbered items
		if (part.style === I.TextStyle.Numbered) {
			const items: JSX.Element[] = [];
			let j = i;

			while ((j < parts.length) && (parts[j].style === I.TextStyle.Numbered)) {
				const html = U.String.sanitize(Mark.toHtml(parts[j].text || '', parts[j].marks || []));
				items.push(<li key={`li-${j}`} dangerouslySetInnerHTML={{ __html: html }} />);
				j++;
			};

			elements.push(<ol key={`ol-${i}`} className="commentList commentOl">{items}</ol>);
			i = j;
			continue;
		};

		// Group consecutive checkbox items
		if (part.style === I.TextStyle.Checkbox) {
			const items: JSX.Element[] = [];
			let j = i;

			while ((j < parts.length) && (parts[j].style === I.TextStyle.Checkbox)) {
				items.push(renderPart(parts[j], j));
				j++;
			};

			elements.push(<div key={`checklist-${i}`} className="commentChecklist">{items}</div>);
			i = j;
			continue;
		};

		elements.push(renderPart(part, i));
		i++;
	};

	return elements;
};

const CommentPost = observer((props: Props) => {

	const { rootId, targetId, message, readonly } = props;
	const { space } = S.Common;
	const { account } = S.Auth;
	const [ isEditing, setIsEditing ] = useState(false);
	const [ isReplying, setIsReplying ] = useState(false);
	const [ isLoadingReplies, setIsLoadingReplies ] = useState(false);
	const replyFormRef = useRef<any>(null);
	const postRef = useRef<HTMLDivElement>(null);
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
	}, [ id, replyCount ]);

	const loadReplies = useCallback((initial?: boolean) => {
		if (!initial && isLoadingReplies) {
			return;
		};

		if (!initial) {
			setIsLoadingReplies(true);
		};

		const existing = S.Comment.getReplies(id);
		const afterOrderId = existing.length ? existing[existing.length - 1].orderId : '';

		C.ChatGetMessages(targetId, '', afterOrderId, REPLY_LIMIT, false, (message: any) => {
			setIsLoadingReplies(false);

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
	}, [ id, targetId, isLoadingReplies ]);

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

	const onCopyText = useCallback(() => {
		const text = parts.map(p => p.text || '').join('\n');
		U.Common.copyToast('', text);
	}, [ parts ]);

	const onCopyLink = useCallback(() => {
		const object = S.Detail.get(rootId, rootId);
		const spaceObject = U.Space.getSpaceview();

		U.Object.copyLink(object, spaceObject, 'deeplink', '');
	}, [ rootId ]);

	const onMenuClick = useCallback((e: React.MouseEvent) => {
		const element = $(e.currentTarget);

		const menuItems: any[] = [];

		if (isSelf) {
			menuItems.push({ id: 'edit', name: translate('commentEdit'), icon: 'pencil' });
		};

		menuItems.push({ id: 'copyText', name: translate('commentCopyText'), icon: 'copy' });
		menuItems.push({ id: 'copyLink', name: translate('commentCopyLink'), icon: 'link' });

		if (isSelf) {
			menuItems.push({ isDiv: true });
			menuItems.push({ id: 'delete', name: translate('commentDelete'), icon: 'remove', color: 'red' });
		};

		S.Menu.open('select', {
			element,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			data: {
				options: menuItems,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'edit': onEdit(); break;
						case 'copyText': onCopyText(); break;
						case 'copyLink': onCopyLink(); break;
						case 'delete': onDelete(); break;
					};
				},
			},
		});
	}, [ isSelf, onEdit, onCopyText, onCopyLink, onDelete ]);

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
						showAsFile={false}
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
					{renderParts(parts)}
				</div>
				{renderAttachments()}
			</>
		);
	};

	const renderHoverActions = () => {
		if (isEditing || readonly) {
			return null;
		};

		return (
			<div className="hoverActions">
				<div className="hoverBtn" onClick={onReply}>
					<Icon className="reply" />
				</div>
				<div className="hoverBtn" onClick={onMenuClick}>
					<Icon className="more" />
				</div>
			</div>
		);
	};

	const renderRepliesToggle = () => {
		if (isEditing || !replyCount || isReplying) {
			return null;
		};

		const label = replyCount == 1
			? U.String.sprintf(translate('commentReplyCount'), replyCount)
			: U.String.sprintf(translate('commentRepliesCount'), replyCount);

		return (
			<div className="repliesToggle" onClick={onReply}>
				{label}
			</div>
		);
	};

	return (
		<div ref={postRef} className="commentPost">
			<div className="postInner">
				<div className="head">
					<IconObject
						object={{ ...author, layout: I.ObjectLayout.Participant }}
						size={28}
					/>
					<div className="author">
						<ObjectName object={author} withBadge={true} />
					</div>
					<div className="date">
						{U.Date.date('M j', createdAt)}{editedLabel}
					</div>

					{renderHoverActions()}
				</div>

				{renderContent()}
				{renderRepliesToggle()}
			</div>

			{replies.length ? (
				<div className="replyList">
					{hasMoreReplies ? (
						<div
							className={[ 'loadMore', (isLoadingReplies ? 'isLoading' : '') ].join(' ')}
							onClick={() => loadReplies()}
						>
							{isLoadingReplies ? translate('commentLoading') : translate('commentLoadMoreReplies')}
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
						isReply={true}
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
