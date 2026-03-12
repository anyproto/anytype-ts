import React, { useState, useCallback, useRef, useEffect } from 'react';
import $ from 'jquery';
import * as Prism from 'prismjs';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, J, S, U, C, Mark, translate, Action } from 'Lib';
import CommentForm from './form';
import CommentReply from './reply';
import Attachment from 'Component/block/chat/attachment';
import Reaction from 'Component/block/chat/message/reaction';

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
const renderPart = (part: I.CommentContentPart, index: number, subId?: string): JSX.Element => {
	const key = `part-${index}`;

	// Divider
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
			const lang = part.lang || 'plain';
			const grammar = Prism.languages[lang];
			const text = part.text || '';
			const highlighted = grammar ? Prism.highlight(text, grammar, lang) : U.String.sanitize(text);
			const titles = U.Prism.getTitles();
			const langTitle = titles.find((t: any) => t.id === lang);
			const langLabel = langTitle ? langTitle.name : (lang !== 'plain' ? lang : '');

			return (
				<pre key={key} className="commentCodeBlock">
					{langLabel ? <div className="codeLang">{langLabel}</div> : ''}
					<code dangerouslySetInnerHTML={{ __html: highlighted }} />
				</pre>
			);
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
const renderParts = (parts: I.CommentContentPart[], subId?: string): JSX.Element[] => {
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
				items.push(renderPart(parts[j], j, subId));
				j++;
			};

			elements.push(<div key={`checklist-${i}`} className="commentChecklist">{items}</div>);
			i = j;
			continue;
		};

		elements.push(renderPart(part, i, subId));
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
	const contentRef = useRef<HTMLDivElement>(null);
	const attachmentRefs = useRef<any[]>([]);
	const { id, creator, content, createdAt, modifiedAt, replyCount, reactions } = message;
	const author = U.Space.getParticipant(U.Space.getParticipantId(space, creator));
	const isSelf = creator == account.id;
	const parts = message.content?.parts || [];
	const editedLabel = modifiedAt ? ` (${translate('commentEdited')})` : '';
	const replies = S.Comment.getReplies(id);
	const hasMoreReplies = S.Comment.getHasMoreReplies(id);
	const subId = U.Comment.getSubId(I.CommentTargetType.Object, targetId);

	useEffect(() => {
		if (replyCount > 0) {
			loadReplies(true);
		};
	}, [ id, replyCount ]);

	// Bind click handlers for mentions and links in rendered content
	useEffect(() => {
		const node = contentRef.current;
		if (!node || isEditing) {
			return;
		};

		const el = $(node);

		// Mentions
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

		// Links
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

		// Object marks
		el.find(Mark.getTag(I.MarkType.Object)).each((_i: number, item: any) => {
			item = $(item);
			const param = String(item.attr('data-param') || '');
			if (!param) {
				return;
			};

			const object = S.Detail.get(subId, param, []);
			item.off('mousedown.object').on('mousedown.object', (e: any) => {
				e.preventDefault();
				if (!object._empty_) {
					U.Object.openEvent(e, object);
				};
			});
		});
	}, [ isEditing, parts, subId ]);

	const loadDeps = useCallback((messages: any[], callBack?: () => void) => {
		const ids = U.Comment.getDepsIds(messages);

		if (!ids.length) {
			callBack?.();
			return;
		};

		const keys = U.Subscription.chatRelationKeys();

		U.Subscription.subscribeIds({
			ids,
			subId,
			keys,
			noDeps: true,
			ignoreHidden: true,
			crossSpace: true,
		}, callBack);
	}, [ subId ]);

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
						parts: U.Comment.blocksToParts(it.blocks, it.content),
					},
					replyCount: 0,
				}));

			loadDeps(messages, () => {
				if (initial) {
					S.Comment.setReplies(id, messages);
				} else {
					S.Comment.appendReplies(id, messages);
				};

				S.Comment.setHasMoreReplies(id, messages.length >= REPLY_LIMIT);
			});
		});
	}, [ id, targetId, isLoadingReplies, loadDeps ]);

	const onEdit = useCallback(() => {
		setIsEditing(true);
	}, []);

	const onCancelEdit = useCallback(() => {
		setIsEditing(false);
	}, []);

	const onSaveEdit = useCallback((newParts: I.CommentContentPart[], attachments?: I.ChatMessageAttachment[]) => {
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

			S.Comment.updatePost(subId, {
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
	}, [ targetId, id ]);

	const onDelete = useCallback(() => {
		C.ChatDeleteMessage(targetId, id, () => {
			S.Comment.deletePost(subId, id);
		});
	}, [ targetId, id, subId ]);

	const onReply = useCallback(() => {
		setIsReplying(true);
		window.setTimeout(() => replyFormRef.current?.focus(), 50);
	}, []);

	const onCancelReply = useCallback(() => {
		setIsReplying(false);
	}, []);

	const onSubmitReply = useCallback((newParts: I.CommentContentPart[]) => {
		const blocks = U.Comment.partsToBlocks(newParts);

		const msg = {
			replyToMessageId: id,
			content: {
				text: '',
				style: I.TextStyle.Paragraph,
				marks: [],
			},
			blocks,
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
					text: '',
					style: I.TextStyle.Paragraph,
					marks: [],
					parts: newParts,
				},
				attachments: [],
				reactions: [],
				isSynced: false,
				replyCount: 0,
			};

			S.Comment.addReply(id, newReply as any);

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

	const onReactionSelect = useCallback((icon: string) => {
		const limit = J.Constant.limit.chat.reactions;
		const hasReaction = reactions.find(it => it.icon == icon);
		const self = reactions.filter(it => it.authors.includes(account.id));

		if (!hasReaction && ((self.length >= limit.self) || (reactions.length >= limit.all))) {
			return;
		};

		C.ChatToggleMessageReaction(targetId, id, icon);
	}, [ targetId, id, reactions ]);

	const onReaction = useCallback((e: React.MouseEvent) => {
		S.Menu.open('smile', {
			element: $(e.currentTarget),
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			noAnimation: true,
			data: {
				noHead: true,
				noUpload: true,
				value: '',
				onSelect: (icon: string) => {
					onReactionSelect(icon);
				},
			},
		});
	}, [ targetId, id, onReactionSelect ]);

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

	const getAttachments = useCallback((): any[] => {
		return (message.attachments || [])
			.map(it => S.Detail.get(subId, it.target))
			.filter(it => !it._empty_);
	}, [ message.attachments, subId ]);

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
		const list = getAttachments();

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

	const renderReactions = () => {
		const hasReactions = (reactions || []).length > 0;

		if (!hasReactions) {
			return null;
		};

		return (
			<div className="reactions">
				{reactions.map((item: any, i: number) => (
					<Reaction key={i} {...item} onSelect={onReactionSelect} />
				))}
			</div>
		);
	};

	const renderHoverActions = () => {
		if (isEditing || readonly) {
			return null;
		};

		return (
			<div className="hoverActions">
				<Icon className="reaction withBackground" onClick={onReaction} />
				<Icon className="reply withBackground" onClick={onReply} />
				<Icon className="more withBackground" onClick={onMenuClick} />
			</div>
		);
	};

	return (
		<div ref={postRef} className="commentPost">
			{renderHoverActions()}

			<IconObject
				object={{ ...author, layout: I.ObjectLayout.Participant }}
				size={32}
			/>

			<div className="postInner">
				<div className="head">
					<div className="author">
						<ObjectName object={author} withBadge={true} />
					</div>
					<div className="date">
						{U.Date.isToday(createdAt) ? U.Date.timeWithFormat(S.Common.timeFormat, createdAt) : U.Date.date('M j', createdAt)}{editedLabel}
					</div>
				</div>

				{renderContent()}
				{renderReactions()}

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
		</div>
	);

});

export default CommentPost;
