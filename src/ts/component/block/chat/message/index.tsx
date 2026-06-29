import React, { forwardRef, useEffect, useRef, useImperativeHandle, memo } from 'react';
import raf from 'raf';
import { motion, AnimatePresence, } from 'motion/react';
import { IconObject, Icon, ObjectName, Label } from 'Component';

import Attachment from '../attachment';
import Reply from './reply';
import Reaction from './reaction';
import CodeBlock from 'Component/util/codeBlock';
import Storage from 'Lib/storage';
import * as I from 'Interface';

interface ChatMessageRefProps {
	highlight: () => void;
	onReactionAdd: () => void;
	getNode: () => HTMLElement;
};

const ChatMessage = forwardRef<ChatMessageRefProps, I.ChatMessageComponent>((props, ref) => {

	const {
		rootId, id, isNew, readonly, subId, isPopup, style, onContextMenu, onMore, onReplyEdit, onReplyClick,
		renderLinks, renderMentions, renderObjects, renderEmoji, analyticsChatId, getMessageMenuOptions,
	} = props;
	const { space, theme } = S.Common;
	const { account } = S.Auth;
	const nodeRef = useRef(null);
	const textRef = useRef(null);
	const attachmentRefs = useRef(new Map<string, any>());
	const bubbleRef = useRef(null);
	const message = S.Chat.getMessageById(subId, id);

	// Memoized so re-rendering for a non-content reason (reaction / read-status / grouping)
	// does not re-run Mark.toHtml + sanitize. Hoisted above the null guard to satisfy rules-of-hooks.
	const text = React.useMemo(() => {
		const content = message?.content;
		return content ? U.String.sanitize(U.String.lbBr(Mark.toHtml(content.text, content.marks))).replace(/​/g, '') : '';
	}, [ message?.content?.text, message?.content?.marks ]);

	useEffect(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			// Use the size the observer already provides (border-box, == offsetWidth) rather than
			// reading .offsetWidth, which would force a synchronous layout on every callback.
			const entry = entries[0];
			const width = entry?.borderBoxSize?.[0]?.inlineSize ?? entry?.contentRect?.width ?? 0;

			raf(() => {
				if (!nodeRef.current) {
					return;
				};

				U.Dom.selectAll('.attachment.isBookmark', nodeRef.current).forEach((el: HTMLElement) => {
					U.Dom.toggleClass(el, 'isWide', width > 360);
				});
			});
		});

		if (bubbleRef.current) {
			resizeObserver.observe(bubbleRef.current);
		};

		return () => {
			resizeObserver.disconnect();
			attachmentRefs.current.clear();
		};
	}, []);

	useEffect(() => {
		// .isWide on bookmark attachments is owned by the ResizeObserver above (its initial callback
		// on observe() covers mount), so we no longer read offsetWidth synchronously here — that
		// per-mount read + class write forced a relayout on each mounting row (~1s in traces).
		init();
	});

	useImperativeHandle(ref, () => ({
		highlight,
		onReactionAdd,
		getNode: () => nodeRef.current,
	}));

	const init = () => {
		if (!message) {
			return;
		};

		const { creator, content } = message;
		const { marks, text } = content;
		const { account } = S.Auth;
		const isSelf = creator == account.id;
		const isReadonly = readonly || !isSelf;
		const node = nodeRef.current;
		if (!node) return;

		const er = U.Dom.select('.reply .text', node);
		const paragraphBlocks = (message.blocks || []).filter(it => it.text && (it.text.style != I.TextStyle.Code));

		if (paragraphBlocks.length) {
			U.Dom.selectAll('.bubbleOuter .text', node).forEach((el: HTMLElement, i: number) => {
				const bt = paragraphBlocks[i]?.text;
				if (!bt) {
					return;
				};

				renderMentions(rootId, el, bt.marks, () => bt.text, { subId, withPreview: false });
				renderObjects(rootId, el, bt.marks, () => bt.text, { readonly: isReadonly }, { subId });
				renderLinks(rootId, el, bt.marks, () => bt.text, { readonly: isReadonly }, { subId });
				renderEmoji(el);
			});
		} else {
			const et = U.Dom.select('.bubbleOuter .text', node);

			renderMentions(rootId, et, marks, () => text, { subId, withPreview: false });
			renderObjects(rootId, et, marks, () => text, { readonly: isReadonly }, { subId });
			renderLinks(rootId, et, marks, () => text, { readonly: isReadonly }, { subId });
			renderEmoji(et);
		};

		renderMentions(rootId, er, marks, () => text, { subId, iconSize: 16, withPreview: false });
		renderObjects(rootId, er, marks, () => text, { readonly: isReadonly }, { subId, iconSize: 16 });
		renderLinks(rootId, er, marks, () => text, { readonly: isReadonly }, { subId, iconSize: 16 });
		renderEmoji(er, { iconSize: 16 });
	};

	const onReactionAdd = () => {
		const node = nodeRef.current;
		let menuContext = null;

		S.Menu.open('smile', {
			element: U.Dom.select('#reaction-add', node),
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Center,
			noFlipX: true,
			onOpen: context => {
				U.Dom.addClass(node, 'hover');
				menuContext = context;
			},
			onClose: () => {
				U.Dom.removeClass(node, 'hover');
			},
			data: {
				noHead: true,
				noUpload: true,
				value: '',
				onSelect: icon => {
					onReactionSelect(icon);
					menuContext?.close();
				},
				route: analytics.route.reaction,
			}
		});

		analytics.event('ClickMessageMenuReaction', { chatId: analyticsChatId });
	};

	const onReactionSelect = (icon: string) => {
		const { reactions } = message;
		const limit = J.Constant.limit.chat.reactions;
		const hasReaction = reactions.find(it => it.icon == icon);
		const self = reactions.filter(it => it.authors.includes(account.id));

		if (!hasReaction && ((self.length >= limit.self) || (reactions.length >= limit.all))) {
			return;
		};

		C.ChatToggleMessageReaction(rootId, id, icon);
		analytics.event(hasReaction ? 'RemoveReaction' : 'AddReaction', { chatId: analyticsChatId });
	};

	const onAttachmentRemove = (attachmentId: string) => {
		update({ attachments: getAttachments().filter(it => it.target != attachmentId) });
	};

	const onPreview = (preview: any) => {
		const data: any = { ...preview };
		const gallery = [];

		attachmentRefs.current.forEach((ref) => {
			const item = ref?.getPreviewItem();
			if (item) {
				gallery.push(item);
			};
		});

		data.gallery = gallery;
		data.initialIdx = gallery.findIndex(it => it.src == preview.src);

		S.Popup.open('preview', { data });
	};

	const update = (param: Partial<I.ChatMessage>) => {
		const message = Object.assign(S.Chat.getMessageById(subId, id), param);

		C.ChatEditMessageContent(rootId, id, message);
	};

	const getAttachments = (): any[] => {
		return (message.attachments || []).map(it => S.Detail.get(subId, it.target)).filter(it => !it._empty_ && !it.isDeleted);
	};

	const getAttachmentsLayout = (): number => {
		const attachments = getAttachments();
		const mediaLayouts = [ I.ObjectLayout.Image, I.ObjectLayout.Video ];
		const media = attachments.filter(it => mediaLayouts.includes(it.layout));
		const al = attachments.length;
		const ml = media.length;

		let layout = 0;
		if (ml && (ml == al)) {
			if (ml == 1) {
				const { widthInPixels, heightInPixels } = attachments[0];

				if (Math.max(widthInPixels, heightInPixels) < 100) {
					return 0;
				};
			};

			layout = Math.min(10, ml);
		};

		return layout;
	};

	const canAddReaction = (): boolean => {
		const reactions = message.reactions || [];
		const { self, all } = J.Constant.limit.chat.reactions;

		let cntSelf = 0;

		reactions.forEach(it => {
			if (it.authors.includes(account.id)) {
				cntSelf++;
			};
		});

		return (cntSelf < self) && (reactions.length < all);
	};

	const highlight = () => {
		const node = nodeRef.current;

		U.Dom.addClass(node, 'highlight');
		window.setTimeout(() => U.Dom.removeClass(node, 'highlight'), J.Constant.delay.highlight);
	};

	if (!message) {
		return null;
	};

	const { creator, content, createdAt, modifiedAt, reactions, isFirst, isLast, replyToMessageId, isReadMessage, isReadMention, isSynced } = message;
	const author = U.Space.getParticipant(U.Space.getParticipantId(space, creator));
	const attachments = getAttachments();
	const hasReactions = reactions.length;
	const hasAttachments = attachments.length;
	const isSelf = creator == account.id;
	const attachmentsLayout = getAttachmentsLayout();
	const canAddReactionValue = canAddReaction();
	const cn = [ 'message' ];
	const ca = [ 'attachments' ];
	const ct = [ 'textWrapper' ];
	const cnBubble = [ 'bubble' ];
	const editedLabel = modifiedAt ? translate('blockChatMessageEdited') : '';
	const hasMore = !!getMessageMenuOptions(message, true).length;
	const controls = [];
	const cns = [ 'status', 'syncing' ];
	const textBlocks = (message.blocks || []).filter(it => it.text);
	const hasBlocks = textBlocks.length > 0;
	const renderBlocks = () => textBlocks.map((b, i) => {
		const bt = b.text;
		if (!bt) {
			return null;
		};

		if (bt.style == I.TextStyle.Code) {
			return <CodeBlock key={i} text={bt.text} lang={bt.lang} />;
		};

		const html = U.String.sanitize(U.String.lbBr(Mark.toHtml(bt.text, bt.marks))).replace(/\u200B/g, '');
		return <div key={i} className="text" dangerouslySetInnerHTML={{ __html: html }} />;
	});

	const codeRuns = U.Chat.splitCodeRuns(content.text, content.marks);
	const hasCodeMark = codeRuns.some(r => r.code);

	if (!text && !hasAttachments) {
		return null;
	};

	if (attachmentsLayout) {
		ca.push(`withLayout layout-${attachmentsLayout}`);
		cnBubble.push('withLayout');
	};

	let userpicNode = null;
	let authorNode = null;

	if (isSynced || !isSelf) {
		cns.push('isHidden');
	};

	if (!readonly) {
		if (!hasReactions && canAddReactionValue) {
			controls.push({ id: 'reaction-add', name: 'chat/buttons/reaction', className: 'reactionAdd', tooltip: translate('blockChatReactionAdd'), onClick: onReactionAdd });
		};

		controls.push({ id: 'message-reply', name: 'chat/buttons/reply', className: 'messageReply', tooltip: translate('blockChatReply'), onClick: (e: any) => onReplyEdit(e, id) });

		if (hasMore) {
			controls.push({ name: 'common/more', onClick: (e: any) => onMore(e, id), tooltip: translate('commonOptions') });
		};
	};

	if (hasAttachments) {
		cn.push(`attachmentsLayout${hasAttachments}`);
	};

	if (hasAttachments == 1) {
		ca.push('isSingle');
	};

	if (isSelf) {
		cn.push('isSelf');
	};
	if (isFirst) {
		cn.push('isFirst');
	};
	if (isLast) {
		cn.push('isLast');
	};
	if (isNew && !isSelf) {
		cn.push('isNew');
	};
	if (text) {
		cn.push('withText');
	};
	// For blocks-based messages, base RTL on the actual paragraph text, not the fenced source
	// (which would start with the LTR ``` marker for a code-led message).
	const rtlSource = hasBlocks ? textBlocks.map(it => it.text?.text || '').join(' ') : text;
	if (U.String.checkRtl(rtlSource)) {
		ct.push('isRtl');
	};
	if (!isReadMessage || !isReadMention) {
		ct.push('isUnread');
	};

	// Subscriptions
	for (const mark of content.marks) {
		if ([ I.MarkType.Mention, I.MarkType.Object ].includes(mark.type)) {
			const object = S.Detail.get(rootId, mark.param, []);
		};
	};

	if (!isSelf) {
		userpicNode = (
			<IconObject
				object={{ ...author, layout: I.ObjectLayout.Participant }}
				size={32}
				onClick={e => U.Object.openConfig(e, author)}
			/>
		);

		authorNode = (
			<div className="author" onClick={e => U.Object.openConfig(e, author)}>
				<ObjectName object={author} />
			</div>
		);
	};

	if (hasAttachments) {
		cn.push('withAttachment');

		if (attachmentsLayout) {
			cn.push('withMedia');
			cn.push(`mediaLayout-${attachments.length}`);
		};
	};

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				ref={nodeRef}
				id={`item-${id}`}
				className={cn.join(' ')}
				onContextMenu={e => onContextMenu(e, id)}
				style={style}
				{...U.Common.dataProps({ 'order-id': message.orderId })}
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: 0.1 },
				})}
			>
				{isNew ? (
					<div className="newMessages">
						<Label text={translate('blockChatNewMessages')} />
					</div>
				) : ''}

				<div className="flex">
					<div className="side left">
						{userpicNode}
					</div>

					<div className="side right">
						<Reply {...props} id={replyToMessageId} onReplyClick={e => onReplyClick(e, id)} />

						{authorNode}

						<div className="bubbleOuter">
							<div className="bubbleInner">
								<div ref={bubbleRef} className={cnBubble.join(' ')}>
									<div className={ct.join(' ')}>
										{hasBlocks ? renderBlocks() : (hasCodeMark ? (
											<div ref={textRef} className="text">
												{codeRuns.map((r, i) => (r.code ? (
													<div key={i} className="codeMark">{r.text}</div>
												) : (
													<span key={i} dangerouslySetInnerHTML={{ __html: U.String.sanitize(U.String.lbBr(Mark.toHtml(r.text, r.marks))).replace(/​/g, '') }} />
												)))}
											</div>
										) : (
											<div
												ref={textRef}
												className="text"
												dangerouslySetInnerHTML={{ __html: text }}
											/>
										))}
										<div className="time">
											<Icon name="chat/messageStatus/syncing" size={12} className={cns.join(' ')} />
											{editedLabel} {U.Date.date('H:i', createdAt)}
										</div>
									</div>

									{hasAttachments ? (
										<div className={ca.join(' ')}>
											{attachments.map((item: any, i: number) => (
												<Attachment
													ref={ref => {
														if (ref) {
															attachmentRefs.current.set(item.id, ref);
														} else {
															attachmentRefs.current.delete(item.id);
														};
													}}
													key={i}
													object={item}
													subId={subId}
													onRemove={() => onAttachmentRemove(item.id)}
													onPreview={(preview) => onPreview(preview)}
													onClick={() => Storage.setChat(rootId, { scrollMessageId: id })}
													showAsFile={!attachmentsLayout}
													bookmarkAsDefault={attachments.length > 1}
													isDownload={!isSelf}
												/>
											))}
										</div>
									) : ''}
								</div>

								{controls.length ? (
									<div className="controls">
										{controls.map((item, i) => (
											<Icon key={i} id={item.id} name={item.name} className={item.className} onClick={item.onClick} tooltipParam={{ text: item.tooltip }} />
										))}
									</div>
								) : ''}
							</div>

							{hasReactions ? (
								<div className="reactions">
									{reactions.map((item: any, i: number) => (
										<Reaction key={i} {...item} onSelect={onReactionSelect} />
									))}
									{!readonly && canAddReactionValue ? (
										<Icon id="reaction-add" name="chat/buttons/reaction" className="reactionAdd" onClick={onReactionAdd} tooltipParam={{ text: translate('blockChatReactionAdd') }} />
									) : ''}
								</div>
							) : ''}
						</div>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);

});

export default memo(ChatMessage);