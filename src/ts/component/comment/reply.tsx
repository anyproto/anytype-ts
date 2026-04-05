import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Icon, IconObject, ObjectName } from 'Component';
import CommentForm from './form';
import Attachment from 'Component/block/chat/attachment';
import { renderParts } from './render';
import * as I from 'Interface';

interface Props {
	rootId: string;
	targetId: string;
	parentId: string;
	message: I.CommentMessage;
	readonly?: boolean;
};

const CommentReply = (props: Props) => {

	const { rootId, targetId, parentId, message, readonly } = props;
	const { space } = S.Common;
	const { account } = S.Auth;
	const [ isEditing, setIsEditing ] = useState(false);
	const contentWrapRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const attachmentRefs = useRef<any[]>([]);
	const { id, creator, createdAt, modifiedAt } = message;
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

		U.Dom.selectAll(Mark.getTag(I.MarkType.Mention), node).forEach((item: HTMLElement) => {
			const param = String(item.getAttribute('data-param') || '');
			if (!param) {
				return;
			};

			const object = S.Detail.get(subId, param, []);
			item.onmousedown = (e: any) => {
				e.preventDefault();
				if (!object._empty_) {
					U.Object.openEvent(e, object);
				};
			};
		});

		U.Dom.selectAll('a', node).forEach((item: HTMLElement) => {
			const href = String(item.getAttribute('href') || item.getAttribute('data-param') || '');
			if (!href) {
				return;
			};

			item.onclick = (e: any) => {
				e.preventDefault();
				Action.openUrl(href);
			};
		});

		// Object marks
		U.Dom.selectAll(Mark.getTag(I.MarkType.Object), node).forEach((item: HTMLElement) => {
			const param = String(item.getAttribute('data-param') || '');
			if (!param) {
				return;
			};

			const object = S.Detail.get(subId, param, []);
			item.onmousedown = (e: any) => {
				e.preventDefault();
				if (!object._empty_) {
					U.Object.openEvent(e, object);
				};
			};
		});

		// Emoji marks — render as cross-platform images
		const roots: Root[] = [];

		U.Dom.selectAll(Mark.getTag(I.MarkType.Emoji), node).forEach((item: HTMLElement) => {
			const emojiId = item.getAttribute('data-param');
			const smile = U.Dom.select('smile', item);

			if (smile) {
				// Clear native emoji text, keep only the smile mount point
				Array.from(item.childNodes).forEach(child => {
					if (child.nodeType === 3) {
						child.remove();
					};
				});

				const container = smile as HTMLElement & { _reactRoot?: Root };
				const root = container._reactRoot || createRoot(container);

				container._reactRoot = root;
				roots.push(root);
				root.render(<IconObject size={20} iconSize={20} object={{ iconEmoji: emojiId }} />);
			};
		});

		return () => {
			roots.forEach(root => root.unmount());
		};
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

	const setHover = useCallback((v: boolean) => {
		U.Dom.toggleClass(contentWrapRef.current, 'hover', v);
	}, []);

	const onMenuClick = useCallback((e: React.MouseEvent) => {
		const element = e.currentTarget as HTMLElement;

		const menuItems: any[] = [];

		if (isSelf) {
			menuItems.push({ id: 'edit', name: translate('commentEdit'), iconParam: { name: 'common/edit' } });
		};

		menuItems.push({ id: 'copyText', name: translate('commentCopyText'), iconParam: { name: 'menu/action/copy' } });

		if (isSelf) {
			menuItems.push({ isDiv: true });
			menuItems.push({ id: 'delete', name: translate('commentDelete'), iconParam: { name: 'menu/action/remove', color: 'darkRed' }, color: 'red' });
		};

		setHover(true);

		S.Menu.open('select', {
			classNameWrap: 'fromBlock',
			element,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			onClose: () => setHover(false),
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
	}, [ isSelf, onEdit, onCopyText, onDelete, setHover ]);

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
					subId={subId}
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
					{renderParts(parts, subId)}
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
					<Icon name="common/more" className="more" />
				</div>
			</div>
		);
	};

	return (
		<div className="commentReply" data-message-id={id}>
			<div ref={contentWrapRef} className="contentWrap">
				<div className="head">
					<div className="side left">
						<IconObject
							object={{ ...author, layout: I.ObjectLayout.Participant }}
							size={20}
						/>
						<div className="author">
							<ObjectName object={author} withBadge={true} />
						</div>
						<div className="date">
							{U.Date.isToday(createdAt) ? U.Date.timeWithFormat(S.Common.timeFormat, createdAt) : U.Date.date('M j', createdAt)}{editedLabel}
						</div>
					</div>
					<div className="side right">
						{renderHoverActions()}
					</div>
				</div>

				{renderContent()}
			</div>
		</div>
	);
};

export default CommentReply;
