import React, { forwardRef, useEffect, useRef, useImperativeHandle, memo } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { motion, AnimatePresence, animate } from 'motion/react';
import { IconObject, Icon, ObjectName, Label } from 'Component';
import { I, S, U, C, J, Mark, translate, analytics } from 'Lib';

import Attachment from '../attachment';
import Reply from './reply';
import Reaction from './reaction';

interface ChatMessageRefProps {
	highlight: () => void;
	onReactionAdd: () => void;
	getNode: () => HTMLElement;
};

const ChatMessage = observer(forwardRef<ChatMessageRefProps, I.ChatMessageComponent>((props, ref) => {

	const { 
		rootId, id, isNew, readonly, subId, hasMore, isPopup, style, onContextMenu, onMore, onReplyEdit,
		renderLinks, renderMentions, renderObjects, renderEmoji, analyticsChatId,
	} = props;
	const { space, theme } = S.Common;
	const { account } = S.Auth;
	const nodeRef = useRef(null);
	const textRef = useRef(null);
	const attachmentRefs = useRef(new Map<string, any>());
	const bubbleRef = useRef(null);
	const message = S.Chat.getMessageById(subId, id);

	useEffect(() => {
		const resizeObserver = new ResizeObserver(() => {
			raf(() => resize());
		});

		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};

		resize();

		return () => {
			resizeObserver.disconnect();
			attachmentRefs.current.clear();
		};
	}, []);

	useEffect(() => {
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
		const node = $(nodeRef.current);
		const et = node.find('.bubbleOuter .text');
		const er = node.find('.reply .text');

		renderMentions(rootId, et, marks, () => text, { subId });
		renderObjects(rootId, et, marks, () => text, { readonly: isReadonly }, { subId });
		renderLinks(rootId, et, marks, () => text, { readonly: isReadonly }, { subId });
		renderEmoji(et);

		renderMentions(rootId, er, marks, () => text, { subId, iconSize: 16 });
		renderObjects(rootId, er, marks, () => text, { readonly: isReadonly }, { subId, iconSize: 16 });
		renderLinks(rootId, er, marks, () => text, { readonly: isReadonly }, { subId, iconSize: 16 });
		renderEmoji(er, { iconSize: 16 });

		resize();
	};

	const onReactionAdd = () => {
		const node = $(nodeRef.current);
		const container = U.Common.getScrollContainer(isPopup);

		let menuContext = null;

		S.Menu.open('smile', { 
			element: node.find('#reaction-add'),
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Center,
			noFlipX: true,
			onOpen: context => {
				node.addClass('hover');
				container.addClass('over');
				menuContext = context;
			},
			onClose: () => {
				node.removeClass('hover');
				container.removeClass('over');
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
		return (message.attachments || []).map(it => S.Detail.get(subId, it.target)).filter(it => !it._empty_);
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
		const message = S.Chat.getMessageById(subId, id);
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
		const node = $(nodeRef.current);

		node.addClass('highlight');
		window.setTimeout(() => node.removeClass('highlight'), J.Constant.delay.highlight);
	};

	const resize = () => {
		const node = $(nodeRef.current);
		const bubble = $(bubbleRef.current);
		const width = bubble.outerWidth();

		node.find('.attachment.isBookmark').toggleClass('isWide', width > 360);
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
	const controls = [];
	const text = U.String.sanitize(U.String.lbBr(Mark.toHtml(content.text, content.marks)));
	const cns = [ 'status', 'syncing' ];

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
			controls.push({ id: 'reaction-add', className: 'reactionAdd', tooltip: translate('blockChatReactionAdd'), onClick: onReactionAdd });
		};

		controls.push({ id: 'message-reply', className: 'messageReply', tooltip: translate('blockChatReply'), onClick: onReplyEdit });

		if (hasMore) {
			controls.push({ className: 'more', onClick: onMore, tooltip: translate('commonOptions') });
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
	if (U.String.checkRtl(text)) {
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
				onContextMenu={onContextMenu}
				style={style}
				{...U.Common.dataProps({ 'order-id': message.orderId })}
				{...U.Common.animationProps({ 
					initial: { y: 20 }, 
					animate: { y: 0 }, 
					exit: { y: -20 },
					transition: { duration: 0.3, delay: 0.1 },
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
						<Reply {...props} id={replyToMessageId} />

						{authorNode}

						<div className="bubbleOuter">
							<div className="bubbleInner">
								<div ref={bubbleRef} className={cnBubble.join(' ')}>
									<div className={ct.join(' ')}>
										<div
											ref={textRef}
											className="text"
											dangerouslySetInnerHTML={{ __html: text }}
										/>
										<div className="time">
											<Icon className={cns.join(' ')} />
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
											<Icon key={i} id={item.id} className={item.className} onClick={item.onClick} tooltipParam={{ text: item.tooltip }} />
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
										<Icon id="reaction-add" className="reactionAdd" onClick={onReactionAdd} tooltipParam={{ text: translate('blockChatReactionAdd') }} />
									) : ''}
								</div>
							) : ''}
						</div>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);

}));

export default memo(ChatMessage);