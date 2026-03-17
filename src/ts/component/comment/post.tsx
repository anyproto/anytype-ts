import React, { useState, useCallback, useRef, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, J, S, U, C, Mark, translate, Action, analytics } from 'Lib';
import CommentForm from './form';
import CommentReply from './reply';
import Attachment from 'Component/block/chat/attachment';
import Reaction from 'Component/block/chat/message/reaction';
import { renderParts } from './render';

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
	const [ isLoadingReplies, setIsLoadingReplies ] = useState(false);
	const replyFormRef = useRef<any>(null);
	const postRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const attachmentRefs = useRef<any[]>([]);
	const { id, creator, createdAt, modifiedAt, replyCount, reactions } = message;
	const author = U.Space.getParticipant(U.Space.getParticipantId(space, creator));
	const isSelf = creator == account.id;
	const parts = message.content?.parts || [];
	const editedLabel = modifiedAt ? ` (${translate('commentEdited')})` : '';
	const replies = S.Comment.getReplies(id);
	const hasMoreReplies = S.Comment.getHasMoreReplies(id);
	const hasOlderReplies = S.Comment.getHasOlderReplies(id);
	const [ isLoadingOlderReplies, setIsLoadingOlderReplies ] = useState(false);
	const subId = U.Comment.getSubId(I.CommentTargetType.Object, targetId);

	useEffect(() => {
		const existing = S.Comment.getReplies(id);

		if ((replyCount > 0) && !existing.length) {
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
		const afterOrderId = initial ? '' : (existing.length ? existing[existing.length - 1].orderId : '');

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

	const loadOlderReplies = useCallback(() => {
		if (isLoadingOlderReplies) {
			return;
		};

		setIsLoadingOlderReplies(true);

		const existing = S.Comment.getReplies(id);
		const beforeOrderId = existing.length ? existing[0].orderId : '';

		C.ChatGetMessages(targetId, beforeOrderId, '', REPLY_LIMIT, false, (message: any) => {
			setIsLoadingOlderReplies(false);

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
				S.Comment.prependReplies(id, messages);
				S.Comment.setHasOlderReplies(id, messages.length >= REPLY_LIMIT);
			});
		});
	}, [ id, targetId, isLoadingOlderReplies, loadDeps ]);

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

			const hasMention = newParts.some(p => (p.marks || []).some(m => m.type === I.MarkType.Mention));
			const hasAttachments = newParts.some(p => (p.type === I.BlockType.Link) || (p.type === I.BlockType.Embed));

			analytics.event('ReplyDiscussion', { hasMention, hasAttachments });

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

		U.Object.copyLink(object, spaceObject, 'deeplink', '', `&messageId=${id}`);
	}, [ rootId, id ]);

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
			const editParts = parts.map(part => {
				if ((part.type === I.BlockType.Link) && part.link) {
					const object = subId ? S.Detail.get(subId, part.link.targetObjectId) : null;
					if (object && !object._empty_) {
						return { ...part, attachmentData: object };
					};
				};
				return part;
			});

			return (
				<CommentForm
					rootId={rootId}
					subId={subId}
					initialParts={editParts}
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

	const cn = [ 'commentPost', (isEditing ? 'isEditing' : '') ];

	return (
		<div ref={postRef} className={cn.join(' ')} data-message-id={id}>
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
			</div>

			{replies.length ? (
				<div className="replyList">
					{hasOlderReplies ? (
						<div
							className={[ 'loadMore', (isLoadingOlderReplies ? 'isLoading' : '') ].join(' ')}
							onClick={loadOlderReplies}
						>
							{isLoadingOlderReplies ? translate('commentLoading') : translate('commentLoadPreviousReplies')}
						</div>
					) : null}

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

					{hasMoreReplies ? (
						<div
							className={[ 'loadMore', (isLoadingReplies ? 'isLoading' : '') ].join(' ')}
							onClick={() => loadReplies()}
						>
							{isLoadingReplies ? translate('commentLoading') : translate('commentLoadMoreReplies')}
						</div>
					) : null}
				</div>
			) : null}

			{isReplying ? (
				<div className="replyFormWrap">
					<CommentForm
						ref={replyFormRef}
						rootId={rootId}
						subId={subId}
						isReply={true}
						placeholder={translate('commentReplyPlaceholder')}
						onSubmit={onSubmitReply}
						onCancel={onCancelReply}
					/>
				</div>
			) : null}
		</div>
	);

});

export default CommentPost;
