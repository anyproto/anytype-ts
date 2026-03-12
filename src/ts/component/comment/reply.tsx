import React, { useState, useCallback, useRef, useEffect } from 'react';
import $ from 'jquery';
import * as Prism from 'prismjs';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, S, U, C, Mark, translate, Action } from 'Lib';
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
const renderPart = (part: I.CommentContentPart, index: number, subId?: string): JSX.Element => {
	const key = `part-${index}`;

	if (part.type === I.BlockType.Div) {
		return <hr key={key} className="commentDivider" />;
	};

	// Link (attachment)
	if ((part.type === I.BlockType.Link) && part.link) {
		const object = subId ? S.Detail.get(subId, part.link.targetObjectId) : null;
		if (!object || object._empty_) {
			return <React.Fragment key={key} />;
		};

		return (
			<div key={key} className="commentAttachments">
				<Attachment
					object={object}
					subId={subId}
					onRemove={() => {}}
				/>
			</div>
		);
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
	const contentRef = useRef<HTMLDivElement>(null);
	const attachmentRefs = useRef<any[]>([]);
	const { id, creator, content, createdAt, modifiedAt } = message;
	const author = U.Space.getParticipant(U.Space.getParticipantId(space, creator));
	const isSelf = creator == account.id;
	const parts = message.content?.parts || [];
	const editedLabel = modifiedAt ? ` (${translate('commentEdited')})` : '';
	const subId = U.Comment.getSubId(I.CommentTargetType.Object, targetId);

	// Bind click handlers for mentions and links
	useEffect(() => {
		const node = contentRef.current;
		if (!node || isEditing) {
			return;
		};

		const el = $(node);

		el.find(Mark.getTag(I.MarkType.Mention)).each((_i: number, item: any) => {
			item = $(item);
			const param = String(item.attr('data-param') || '');
			if (!param) {
				return;
			};

			const object = S.Detail.get(subId, param, []);
			item.off('mousedown.mention').on('mousedown.mention', (e: any) => {
				e.preventDefault();
				if (!object._empty_) {
					U.Object.openEvent(e, object);
				};
			});
		});

		el.find('a').each((_i: number, item: any) => {
			item = $(item);
			const href = String(item.attr('href') || item.attr('data-param') || '');
			if (!href) {
				return;
			};

			item.off('click.link').on('click.link', (e: any) => {
				e.preventDefault();
				Action.openUrl(href);
			});
		});
	}, [ isEditing, parts, subId ]);

	const onEdit = useCallback(() => {
		setIsEditing(true);
	}, []);

	const onCancelEdit = useCallback(() => {
		setIsEditing(false);
	}, []);

	const onSaveEdit = useCallback((newParts: I.CommentContentPart[]) => {
		const blocks = U.Comment.partsToBlocks(newParts);

		C.ChatEditMessageContent(targetId, id, {
			content: {
				text: '',
				style: I.TextStyle.Paragraph,
				marks: [],
			},
			blocks,
			attachments: message.attachments || [],
			reactions: message.reactions || [],
		} as any, () => {
			setIsEditing(false);

			S.Comment.updateReply(parentId, {
				id,
				modifiedAt: U.Date.now(),
				content: {
					text: '',
					style: I.TextStyle.Paragraph,
					marks: [],
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

	const onCopyText = useCallback(() => {
		const text = parts.map(p => p.text || '').join('\n');
		U.Common.copyToast('', text);
	}, [ parts ]);

	const onMenuClick = useCallback((e: React.MouseEvent) => {
		const element = $(e.currentTarget);

		const menuItems: any[] = [];

		if (isSelf) {
			menuItems.push({ id: 'edit', name: translate('commentEdit'), icon: 'pencil' });
		};

		menuItems.push({ id: 'copyText', name: translate('commentCopyText'), icon: 'copy' });

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
						case 'delete': onDelete(); break;
					};
				},
			},
		});
	}, [ isSelf, onEdit, onCopyText, onDelete ]);

	const onAttachmentPreview = useCallback((preview: any) => {
		const data: any = { ...preview };
		const gallery: any[] = [];

		attachmentRefs.current.forEach((ref) => {
			const item = ref?.getPreviewItem();
			if (item) {
				gallery.push(item);
			};
		});

		data.gallery = gallery;
		data.initialIdx = gallery.findIndex(it => it.src == preview.src);

		S.Popup.open('preview', { data });
	}, []);

	const renderAttachments = () => {
		const list = (message.attachments || [])
			.map(it => S.Detail.get(subId, it.target))
			.filter(it => !it._empty_);

		if (!list.length) {
			return null;
		};

		attachmentRefs.current = [];

		return (
			<div className="commentAttachments">
				{list.map((item: any, i: number) => (
					<Attachment
						key={item.id}
						ref={(ref: any) => { if (ref) { attachmentRefs.current[i] = ref; }; }}
						object={item}
						subId={subId}
						showAsFile={false}
						onRemove={() => {}}
						onPreview={onAttachmentPreview}
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
					isReply={true}
					onSubmit={onSaveEdit}
					onCancel={onCancelEdit}
				/>
			);
		};

		return (
			<>
				<div ref={contentRef} className="content">
					{parts.map((part, i) => renderPart(part, i, subId))}
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
				<div className="hoverBtn" onClick={onMenuClick}>
					<Icon className="more" />
				</div>
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
					<ObjectName object={author} withBadge={true} />
				</div>
				<div className="date">
					{U.Date.isToday(createdAt) ? U.Date.timeWithFormat(S.Common.timeFormat, createdAt) : U.Date.date('M j', createdAt)}{editedLabel}
				</div>

				{renderHoverActions()}
			</div>

			{renderContent()}
		</div>
	);
});

export default CommentReply;
