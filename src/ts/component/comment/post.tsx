import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Icon, IconObject, ObjectName } from 'Component';
import CommentForm from './form';
import CommentReply from './reply';
import Attachment from 'Component/block/chat/attachment';
import Reaction from 'Component/block/chat/message/reaction';
import { renderParts } from './render';
import * as I from 'Interface';

interface Props {
	rootId: string;
	targetId: string;
	message: I.CommentMessage;
	readonly?: boolean;
	isLast?: boolean;
};

const REPLY_LIMIT = 10;

const CommentPost = (props: Props) => {

	const { rootId, targetId, message, readonly, isLast } = props;
	const { space } = S.Common;
	const { account } = S.Auth;
	const [ isEditing, setIsEditing ] = useState(false);
	const [ isReplying, setIsReplying ] = useState(false);
	const [ isLoadingReplies, setIsLoadingReplies ] = useState(false);
	const replyFormRef = useRef<any>(null);
	const postRef = useRef<HTMLDivElement>(null);
	const contentWrapRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const attachmentRefs = useRef<any[]>([]);
	const emojiRootsRef = useRef<Map<HTMLElement, Root>>(new Map());
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

	// Unmount any remaining inline emoji roots when the post itself unmounts.
	useEffect(() => {
		const roots = emojiRootsRef.current;
		return () => {
			roots.forEach(root => root.unmount());
			roots.clear();
		};
	}, []);

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

		// Mentions and Object marks
		[ I.MarkType.Mention, I.MarkType.Object ].forEach(type => {
			U.Dom.selectAll(Mark.getTag(type), node).forEach((item: HTMLElement) => {
				const param = String(item.getAttribute('data-param') || '');
				if (!param) {
					return;
				};

				item.onmousedown = (e: any) => {
					e.preventDefault();
					const object = S.Detail.get(subId, param);
					if (!object._empty_) {
						U.Object.openEvent(e, object);
					};
				};
			});
		});

		// Links
		U.Dom.selectAll(Mark.getTag(I.MarkType.Link), node).forEach((item: HTMLElement) => {
			item.onclick = (e: Event) => {
				e.preventDefault();
			};

			item.onmousedown = (e: MouseEvent) => {
				if (e.button == 2) {
					return;
				};

				e.preventDefault();

				const el = e.currentTarget as HTMLElement;
				const url = String(el.getAttribute('href') || '');
				const { isInside, target, spaceId } = U.Common.getLinkParamFromUrl(url);

				const openObject = (id: string, spaceId: string) => {
					if (spaceId && (spaceId != S.Common.space)) {
						U.Router.go(U.Router.build({ page: 'main', action: 'object', id, spaceId }), {});
						return;
					};

					const cb = (object) => {
						if (object) {
							U.Object.openEvent(e, object);
						};
					};

					if (spaceId) {
						U.Object.getById(id, { spaceId }, cb);
					} else {
						cb(S.Detail.get(subId, id, []));
					};
				};

				if (isInside) {
					openObject(target, spaceId);
					return;
				};

				const route = U.Common.getRouteFromUrl(url);
				if (route) {
					const routeParam = U.Router.getParam(route);
					if (routeParam.id) {
						openObject(routeParam.id, routeParam.spaceId);
						return;
					};
				};

				Action.openUrl(target);
			};
		});

		// Emoji marks — render as cross-platform images.
		//
		// Reconcile against a persistent per-post Map<container, Root> instead
		// of unmount + createRoot on every effect run: dangerouslySetInnerHTML
		// replaces the smile elements on every parts change, and rapid
		// concurrent ChatUpdates would otherwise stack microtask unmounts
		// against fresh createRoot calls on the same containers, which React
		// 18 explicitly forbids and which can stall the reconciler — the
		// "tab unresponsive" symptom seen with concurrent discussion edits.
		const roots = emojiRootsRef.current;
		const seen = new Set<HTMLElement>();

		U.Dom.selectAll(Mark.getTag(I.MarkType.Emoji), node).forEach((item: HTMLElement) => {
			const emojiId = item.getAttribute('data-param');
			const smile = U.Dom.select('smile', item) as HTMLElement | null;

			if (!smile) {
				return;
			};

			// Clear native emoji text, keep only the smile mount point
			Array.from(item.childNodes).forEach(child => {
				if (child.nodeType === 3) {
					child.remove();
				};
			});

			seen.add(smile);

			let root = roots.get(smile);
			if (!root) {
				root = createRoot(smile);
				roots.set(smile, root);
			};
			root.render(<IconObject size={20} iconSize={20} object={{ iconEmoji: emojiId }} />);
		});

		// Containers replaced by the new innerHTML are detached — unmount the
		// roots that were bound to them.
		roots.forEach((root, container) => {
			if (!seen.has(container)) {
				roots.delete(container);
				root.unmount();
			};
		});
	}, [ isEditing, parts, subId ]);

	// Right-click on selected text in the rendered post content opens a small
	// menu offering "Quote in comment" / "Copy Text". Quoting opens the reply
	// form for THIS post's thread (not the main form), so quotes stay attached
	// to the conversation they came from. Plain-text quote only — marks are
	// not extracted from selections in v1.
	useEffect(() => {
		const node = contentRef.current;
		if (!node) {
			return;
		};

		const onContextMenu = (e: MouseEvent) => {
			const sel = window.getSelection();
			const text = sel ? sel.toString() : '';

			if (!text.trim() || !sel.rangeCount) {
				return;
			};

			const range = sel.getRangeAt(0);
			if (!node.contains(range.commonAncestorContainer)) {
				return;
			};

			e.preventDefault();
			e.stopPropagation();

			S.Menu.open('select', {
				rect: { x: e.clientX, y: e.clientY, width: 0, height: 0 },
				horizontal: I.MenuDirection.Right,
				offsetY: 4,
				data: {
					options: [
						{ id: 'quoteInComment', iconParam: { name: 'menu/action/quote' }, name: translate('commonQuoteInComment') },
						{ id: 'copyText', iconParam: { name: 'menu/action/copy' }, name: translate('commonCopyText') },
					],
					onSelect: (_e: any, item: any) => {
						if (item.id == 'quoteInComment') {
							const part: I.CommentContentPart = {
								style: I.TextStyle.Quote,
								type: I.BlockType.Text,
								text,
								marks: [],
								messageQuote: { messageId: id },
							};

							// Defer so the select menu's close stack unwinds first.
							window.setTimeout(() => {
								window.dispatchEvent(new CustomEvent(`commentReplyQuote.${id}`, { detail: part }));
							}, 0);
						} else
						if (item.id == 'copyText') {
							U.Common.clipboardCopy({ text });
						};
					},
				},
			});
		};

		node.addEventListener('contextmenu', onContextMenu);
		return () => node.removeEventListener('contextmenu', onContextMenu);
	}, [ id ]);

	// Listen for quote events targeted at this post's thread (fired from
	// either this post's own selection menu or from a reply's menu) and
	// open the reply form pre-filled with the quote.
	const replyQuoteLockRef = useRef(0);
	useEffect(() => {
		const onReplyQuote = (e: Event) => {
			const part = (e as CustomEvent).detail as I.CommentContentPart;
			if (!part) {
				return;
			};

			// Drop rapid duplicate firings that would re-enter editor.update
			// before the first insertion settled.
			const now = Date.now();
			if ((now - replyQuoteLockRef.current) < 300) {
				return;
			};
			replyQuoteLockRef.current = now;

			setIsReplying(true);
			window.setTimeout(() => replyFormRef.current?.insertQuote(part), 50);
		};

		const eventName = `commentReplyQuote.${id}`;
		window.addEventListener(eventName, onReplyQuote);
		return () => window.removeEventListener(eventName, onReplyQuote);
	}, [ id ]);

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
			updateDetails: true,
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

	const onSaveEdit = useCallback((newParts: I.CommentContentPart[], attachments?: I.ChatMessageAttachment[], attachmentObjects?: any[]) => {
		const blocks = U.Comment.partsToChatBlocks(newParts);
		const newAttachments = attachments || [];

		if (attachmentObjects?.length) {
			for (const obj of attachmentObjects) {
				S.Detail.update(subId, { id: obj.id, details: obj }, false);
			};
		};

		C.ChatEditMessageContent(targetId, id, {
			content: {
				text: '',
				style: I.TextStyle.Paragraph,
				marks: [],
			},
			blocks,
			attachments: newAttachments,
			reactions: message.reactions || [],
		} as any, (response: any) => {
			if (response.error.code) {
				return;
			};

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
				attachments: newAttachments,
			} as any);
		});
	}, [ targetId, id, subId, message.reactions ]);

	const onDelete = useCallback(() => {
		S.Popup.open('confirm', {
			data: {
				iconParam: { name: 'popup/header/confirm', color: 'orange' },
				title: translate('popupConfirmChatDeleteMessageTitle'),
				text: translate('popupConfirmChatDeleteMessageText'),
				textConfirm: translate('commonDelete'),
				onConfirm: () => {
					C.ChatDeleteMessage(targetId, id, (response: any) => {
						if (response.error.code) {
							return;
						};

						S.Comment.deletePost(subId, id);
					});
				},
			},
		});
	}, [ targetId, id, subId ]);

	const onReply = useCallback(() => {
		setIsReplying(true);
		window.setTimeout(() => replyFormRef.current?.focus(), 50);
	}, []);

	const onCancelReply = useCallback(() => {
		setIsReplying(false);
	}, []);

	const onSubmitReply = useCallback((newParts: I.CommentContentPart[], messageAttachments?: I.ChatMessageAttachment[], attachmentObjects?: any[]) => {
		const blocks = U.Comment.partsToChatBlocks(newParts);

		const msg = {
			replyToMessageId: id,
			content: {
				text: '',
				style: I.TextStyle.Paragraph,
				marks: [],
			},
			blocks,
			attachments: messageAttachments || [],
			reactions: [],
		};

		// Seed attachment details so optimistic reply can render them
		if (attachmentObjects?.length) {
			for (const obj of attachmentObjects) {
				S.Detail.update(subId, { id: obj.id, details: obj }, false);
			};
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
				attachments: messageAttachments || [],
				reactions: [],
				isSynced: false,
				replyCount: 0,
			};

			S.Comment.addReply(id, newReply as any);
			loadDeps([ newReply as any ]);

			S.Comment.updatePost(subId, {
				id,
				replyCount: (replyCount || 0) + 1,
			} as any);

			setIsReplying(false);
			replyFormRef.current?.clear();
		});
	}, [ targetId, id, subId, replyCount, loadDeps ]);

	const onCopyText = useCallback(() => {
		const blocks = U.Comment.partsToBlocks(parts);

		C.BlockCopy(rootId, blocks, { from: 0, to: 0 }, null, (message: any) => {
			if (message.error.code) {
				return;
			};

			U.Common.clipboardCopy({
				text: String(message.textSlot || '').replace(/\n+$/, ''),
				html: message.htmlSlot,
			});

			Preview.toastShow({ text: translate('toastCopyBlock') });
		});
	}, [ rootId, parts ]);

	const onCopyMessageLink = useCallback(() => {
		const object = S.Detail.get(rootId, rootId);
		const spaceObject = U.Space.getSpaceview();

		U.Object.copyLink(object, spaceObject, 'deeplink', '', `&messageId=${id}`);
	}, [ rootId, id ]);

	const onCopyUrl = useCallback((url: string) => {
		if (!url) {
			return;
		};

		U.Common.copyToast(translate('commonLink'), url);
	}, []);

	const onReactionSelect = useCallback((icon: string) => {
		const limit = J.Constant.limit.chat.reactions;
		const hasReaction = reactions.find(it => it.icon == icon);
		const self = reactions.filter(it => it.authors.includes(account.id));

		if (!hasReaction && ((self.length >= limit.self) || (reactions.length >= limit.all))) {
			return;
		};

		C.ChatToggleMessageReaction(targetId, id, icon);
	}, [ targetId, id, reactions ]);

	const setHover = useCallback((v: boolean) => {
		U.Dom.toggleClass(contentWrapRef.current, 'hover', v);
	}, []);

	const openReactionPicker = useCallback((element: HTMLElement) => {
		setHover(true);

		S.Menu.open('smile', {
			classNameWrap: 'fromBlock',
			element,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			noAnimation: true,
			onClose: () => setHover(false),
			data: {
				noHead: true,
				noUpload: true,
				value: '',
				onSelect: (icon: string) => onReactionSelect(icon),
			},
		});
	}, [ onReactionSelect, setHover ]);

	const onReaction = useCallback((e: React.MouseEvent) => {
		openReactionPicker(e.currentTarget as HTMLElement);
	}, [ openReactionPicker ]);

	const buildMenuOptions = useCallback((withQuickActions: boolean, url?: string) => {
		const limit = J.Constant.limit.chat.reactions;
		const self = (reactions || []).filter(it => it.authors?.includes(account.id));
		const canReact = (self.length < limit.self) && ((reactions || []).length < limit.all);
		const items: any[] = [];

		if (withQuickActions) {
			items.push({ id: 'reply', name: translate('blockChatReply'), iconParam: { name: 'chat/buttons/reply' } });
			if (canReact) {
				items.push({ id: 'reaction', name: translate('blockChatReactionAdd'), iconParam: { name: 'comment/reaction' } });
			};
			items.push({ isDiv: true });
		};

		items.push({ id: 'copyText', name: translate('commentCopyText'), iconParam: { name: 'menu/action/copy' } });

		// Only offered when the menu was opened on a URL inside the message text
		if (url) {
			items.push({ id: 'copyLink', name: translate('commentCopyLink'), iconParam: { name: 'menu/action/copyLink' } });
		};

		if (withQuickActions) {
			items.push({ isDiv: true });
		};

		items.push({ id: 'copyMessageLink', name: translate('commentCopyMessageLink'), iconParam: { name: 'menu/action/pageLink' } });

		if (isSelf) {
			items.push({ id: 'edit', name: translate('commentEdit'), iconParam: { name: 'common/edit' } });

			if (!withQuickActions) {
				items.push({ isDiv: true });
			};

			items.push({ id: 'delete', name: translate('commentDelete'), iconParam: { name: 'menu/action/remove', color: 'destructive' }, color: 'destructive' });
		};

		return items;
	}, [ isSelf, reactions, account.id ]);

	const onMenuSelect = useCallback((item: any, anchor: HTMLElement, url?: string) => {
		switch (item.id) {
			case 'reply': onReply(); break;
			case 'reaction': openReactionPicker(anchor); break;
			case 'copyText': onCopyText(); break;
			case 'copyLink': onCopyUrl(url); break;
			case 'copyMessageLink': onCopyMessageLink(); break;
			case 'edit': onEdit(); break;
			case 'delete': onDelete(); break;
		};
	}, [ onReply, openReactionPicker, onCopyText, onCopyUrl, onCopyMessageLink, onEdit, onDelete ]);

	const onMenuClick = useCallback((e: React.MouseEvent) => {
		const element = e.currentTarget as HTMLElement;

		setHover(true);

		S.Menu.open('select', {
			classNameWrap: 'fromBlock',
			element,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			onClose: () => setHover(false),
			data: {
				options: buildMenuOptions(false),
				onSelect: (e: any, item: any) => onMenuSelect(item, element),
			},
		});
	}, [ buildMenuOptions, onMenuSelect, setHover ]);

	const onContextMenu = useCallback((e: React.MouseEvent) => {
		if (readonly || isEditing) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const x = e.pageX;
		const y = e.pageY;
		const anchor = contentWrapRef.current;
		const link = (e.target as HTMLElement)?.closest(Mark.getTag(I.MarkType.Link)) as HTMLElement;
		const url = link ? String(link.getAttribute('href') || '') : '';

		setHover(true);

		S.Menu.open('select', {
			classNameWrap: 'fromBlock',
			recalcRect: () => ({ x, y, width: 0, height: 0 }),
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			onClose: () => setHover(false),
			data: {
				options: buildMenuOptions(true, url),
				onSelect: (e: any, item: any) => onMenuSelect(item, anchor, url),
			},
		});
	}, [ readonly, isEditing, buildMenuOptions, onMenuSelect, setHover ]);

	const getAttachments = useCallback((): any[] => {
		const linkTargets = new Set(
			parts
				.filter(p => (p.type === I.BlockType.Link) && p.link?.targetObjectId)
				.map(p => p.link.targetObjectId)
		);

		return (message.attachments || [])
			.filter(it => !linkTargets.has(it.target))
			.map(it => S.Detail.get(subId, it.target))
			.filter(it => !it._empty_ && !it.isDeleted);
	}, [ message.attachments, parts, subId ]);

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
						withInlineSize={false}
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

		const sorted = [...reactions].sort((a: any, b: any) => (b.authors?.length || 0) - (a.authors?.length || 0));

		return (
			<div className="reactions">
				{sorted.map((item: any, i: number) => (
					<Reaction key={i} {...item} onSelect={onReactionSelect} />
				))}
			</div>
		);
	};

	const renderHoverActions = () => {
		if (isEditing || readonly) {
			return null;
		};

		const limit = J.Constant.limit.chat.reactions;
		const self = (reactions || []).filter(it => it.authors?.includes(account.id));
		const canReact = (self.length < limit.self) && ((reactions || []).length < limit.all);

		return (
			<div className="hoverActions">
				{canReact ? <Icon name="comment/reaction" className="reaction" withBackground={true} onClick={onReaction} /> : null}
				<Icon name="chat/buttons/reply" className="reply" withBackground={true} onClick={onReply} />
				<Icon name="common/more" className="more" withBackground={true} onClick={onMenuClick} />
			</div>
		);
	};

	const cn = [ 'commentPost', (isEditing ? 'isEditing' : '') ];
	const showReplyInput = !isEditing && !isReplying && !readonly;

	return (
		<div ref={postRef} className={cn.join(' ')} data-message-id={id}>
			<div ref={contentWrapRef} className="contentWrap" onContextMenu={onContextMenu}>
				{!isEditing ? (
					<div className="head">
						<div className="side left">
							<IconObject
								object={{ ...author, layout: I.ObjectLayout.Participant }}
								size={20}
								onClick={e => U.Object.openConfig(e, author)}
							/>
							<div className="author" onClick={e => U.Object.openConfig(e, author)}>
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
				) : null}

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
							onReply={onReply}
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

			{showReplyInput ? (
				<div className="replyInput" onClick={onReply}>
					<IconObject
						object={{ ...U.Space.getParticipant(U.Space.getParticipantId(space, account.id)), layout: I.ObjectLayout.Participant }}
						size={20}
					/>
					<span className="replyInputLabel">{translate('commentReplyPlaceholder')}</span>
				</div>
			) : null}
		</div>
	);

};

export default CommentPost;
