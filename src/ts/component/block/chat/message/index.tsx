import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle, memo } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, Label } from 'Component';
import { I, S, U, C, J, Mark, translate, analytics } from 'Lib';

import Attachment from '../attachment';
import Reply from './reply';
import Reaction from './reaction';

const LINES_LIMIT = 10;

interface ChatMessageRefProps {
	highlight: () => void;
	onReactionAdd: () => void;
	getNode: () => HTMLElement;
};

const ChatMessageBase = observer(forwardRef<ChatMessageRefProps, I.ChatMessageComponent>((props, ref) => {

	const { 
		rootId, id, isNew, readonly, subId, hasMore, isPopup, style, scrollToBottom, onContextMenu, onMore, onReplyEdit,
		renderLinks, renderMentions, renderObjects, renderEmoji,
	} = props;
	const { space } = S.Common;
	const { account } = S.Auth;
	const nodeRef = useRef(null);
	const textRef = useRef(null);
	const attachmentRefs = useRef({});
	const [ isExpanded, setIsExpanded ] = useState(false);
	const message = S.Chat.getMessage(subId, id);

	useEffect(() => {
		init();
	});

	useImperativeHandle(ref, () => ({
		highlight: highlight,
		onReactionAdd: onReactionAdd,
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

		checkLinesLimit();
		resize();
	};

	const onExpand = () => {
		setIsExpanded(!isExpanded);
	};

	const checkLinesLimit = () => {
		const node = $(nodeRef.current);
		const ref = $(textRef.current);
		const textHeight = ref.outerHeight();
		const lineHeight = parseInt(ref.css('line-height'));
		const canExpand = textHeight / lineHeight > LINES_LIMIT;

		if (canExpand) {
			node.addClass('canExpand');
		};
	};

	const onReactionAdd = () => {
		const node = $(nodeRef.current);
		const container = isPopup ? U.Common.getScrollContainer(isPopup) : $('body');

		let menuContext = null;

		S.Menu.open('smile', { 
			element: node.find('#reaction-add'),
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
					menuContext.close();
				},
				route: analytics.route.reaction,
			}
		});

		analytics.event('ClickMessageMenuReaction');
	};

	const onReactionSelect = (icon: string) => {
		const { reactions } = message;
		const limit = J.Constant.limit.chat.reactions;
		const self = reactions.filter(it => it.authors.includes(account.id));

		if ((self.length >= limit.self) || (reactions.length >= limit.all)) {
			return;
		};

		C.ChatToggleMessageReaction(rootId, id, icon);
		analytics.event(self.find(it => it.icon == icon) ? 'RemoveReaction' : 'AddReaction');
	};

	const onAttachmentRemove = (attachmentId: string) => {
		update({ attachments: getAttachments().filter(it => it.target != attachmentId) });
	};

	const onPreview = (preview: any) => {
		const data: any = { ...preview };
		const gallery = [];

		Object.keys(attachmentRefs.current).forEach(key => {
			const ref = attachmentRefs.current[key];
			if (ref) {
				const item = ref.getPreviewItem();
				if (item) {
					gallery.push(item);
				};
			};
		});

		data.gallery = gallery;
		data.initialIdx = gallery.findIndex(it => it.src == preview.src);

		S.Popup.open('preview', { data });
	};

	const update = (param: Partial<I.ChatMessage>) => {
		const message = Object.assign(S.Chat.getMessage(subId, id), param);

		C.ChatEditMessageContent(rootId, id, message);
	};

	const getAttachments = (): any[] => {
		return (message.attachments || []).map(it => S.Detail.get(subId, it.target)).filter(it => !it._empty_);
	};

	const getAttachmentsClass = (): string => {
		const attachments = getAttachments();
		const mediaLayouts = [ I.ObjectLayout.Image, I.ObjectLayout.Video ];
		const media = attachments.filter(it => mediaLayouts.includes(it.layout));
		const al = attachments.length;
		const ml = media.length;
		const c = [];

		if (ml && (ml == al)) {
			if (ml == 1) {
				const { widthInPixels, heightInPixels } = attachments[0];

				if (Math.max(widthInPixels, heightInPixels) < 100) {
					return '';
				};
			};

			c.push(`withLayout ${ml >= 10 ? `layout-10` : `layout-${ml}`}`);
		};

		return c.join(' ');
	};

	const canAddReaction = (): boolean => {
		const message = S.Chat.getMessage(subId, id);
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
		const bubble = node.find('.bubbleInner .bubble');
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
	const attachmentsLayout = getAttachmentsClass();
	const canAddReactionValue = canAddReaction();
	const cn = [ 'message' ];
	const ca = [ 'attachments', attachmentsLayout ];
	const ct = [ 'textWrapper' ];
	const cnBubble = [ 'bubble' ];
	const editedLabel = modifiedAt ? translate('blockChatMessageEdited') : '';
	const controls = [];
	const text = U.Common.sanitize(U.Common.lbBr(Mark.toHtml(content.text, content.marks)));

	let userpicNode = null;
	let authorNode = null;
	let statusIcon = <Icon className="status syncing" />;

	if (isSynced || !isSelf) {
		statusIcon = null;
	};

	if (!readonly) {
		if (!hasReactions && canAddReactionValue) {
			controls.push({ id: 'reaction-add', className: 'reactionAdd', tooltip: translate('blockChatReactionAdd'), onClick: onReactionAdd });
		};

		controls.push({ id: 'message-reply', className: 'messageReply', tooltip: translate('blockChatReply'), onClick: onReplyEdit });

		if (hasMore) {
			controls.push({ className: 'more', onClick: onMore });
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
	if (isExpanded) {
		cn.push('isExpanded');
	};
	if (U.Common.checkRtl(text)) {
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
				onClick={e => U.Object.openConfig(author)}
			/>
		);

		authorNode = (
			<div className="author" onClick={e => U.Object.openConfig(author)}>
				<ObjectName object={author} />
			</div>
		);
	};

	if (hasAttachments) {
		cn.push('withAttachment');

		if (attachmentsLayout) {
			cn.push('withMedia');
			cn.push(`mediaLayout-${attachments.length}`)
		};
	};

	return (
		<div
			ref={nodeRef}
			id={`item-${id}`}
			className={cn.join(' ')}
			onContextMenu={onContextMenu}
			onDoubleClick={onReplyEdit}
			style={style}
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
							<div className={cnBubble.join(' ')}>
								<div className={ct.join(' ')}>
									<div
										ref={textRef}
										className="text"
										dangerouslySetInnerHTML={{ __html: text }}
									/>
									<div className="time">{statusIcon} {editedLabel} {U.Date.date('H:i', createdAt)}</div>

									<div className="expand" onClick={onExpand}>
										{translate(isExpanded ? 'blockChatMessageCollapse' : 'blockChatMessageExpand')}
									</div>
								</div>

								{hasAttachments ? (
									<div className={ca.join(' ')}>
										{attachments.map((item: any, i: number) => (
											<Attachment
												ref={ref => attachmentRefs.current[item.id] = ref}
												key={i}
												object={item}
												subId={subId}
												scrollToBottom={scrollToBottom}
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
		</div>
	);

}));

const ChatMessage = memo(ChatMessageBase);

export default ChatMessage;