import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, Label } from 'Component';
import { I, S, U, C, J, Mark, translate, Preview } from 'Lib';

import Attachment from '../attachment';
import Reply from './reply';

const LINES_LIMIT = 10;

const ChatMessage = observer(class ChatMessage extends React.Component<I.ChatMessageComponent> {

	node = null;
	refText = null;
	attachmentRefs: any = {};
	isExpanded = false;

	constructor (props: I.ChatMessageComponent) {
		super(props);

		this.onExpand = this.onExpand.bind(this);
		this.onReactionAdd = this.onReactionAdd.bind(this);
		this.onReactionEnter = this.onReactionEnter.bind(this);
		this.onReactionLeave = this.onReactionLeave.bind(this);
		this.onPreview = this.onPreview.bind(this);
		this.highlight = this.highlight.bind(this);
	};

	render () {
		const { rootId, id, isNew, readonly, subId, hasMore, scrollToBottom, onContextMenu, onMore, onReplyEdit } = this.props;
		const { space } = S.Common;
		const { account } = S.Auth;
		const message = S.Chat.getMessage(subId, id);
		const { creator, content, createdAt, modifiedAt, reactions, isFirst, isLast, replyToMessageId, isReadMessage, isReadMention } = message;
		const author = U.Space.getParticipant(U.Space.getParticipantId(space, creator));
		const attachments = this.getAttachments();
		const hasReactions = reactions.length;
		const hasAttachments = attachments.length;
		const isSelf = creator == account.id;
		const attachmentsLayout = this.getAttachmentsClass();
		const canAddReaction = this.canAddReaction();
		const cn = [ 'message' ];
		const ca = [ 'attachments', attachmentsLayout ];
		const ct = [ 'textWrapper' ];
		const cnBubble = [ 'bubble' ];
		const editedLabel = modifiedAt ? translate('blockChatMessageEdited') : '';

		let text = content.text.replace(/\r?\n$/, '');
		text = U.Common.sanitize(U.Common.lbBr(Mark.toHtml(text, content.marks)));

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
		if (this.isExpanded) {
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

		const Reaction = (item: any) => {
			const authors = item.authors || [];
			const length = authors.length;
			const author = length ? U.Space.getParticipant(U.Space.getParticipantId(space, authors[0])) : '';
			const isMe = authors.includes(account.id);
			const cn = [ 'reaction', (isMe ? 'isSelf' : '') ];

			return (
				<div 
					className={cn.join(' ')}
					onClick={() => this.onReactionSelect(item.icon)}
					onMouseEnter={e => this.onReactionEnter(e, authors)}
					onMouseLeave={this.onReactionLeave}
				>
					<div className="value">
						<IconObject object={{ iconEmoji: item.icon }} size={18} />
					</div>
					<div className="count">
						{length > 1 ? length : <IconObject object={author} size={18} />}
					</div>
				</div>
			);
		};

		let userpicNode = null;
		let authorNode = null;

		if (!isSelf) {
			userpicNode = (
				<div className="side left">
					<IconObject
						object={{ ...author, layout: I.ObjectLayout.Participant }}
						size={32}
						onClick={e => U.Object.openConfig(author)}
					/>
				</div>
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
				ref={ref => this.node = ref}
				id={`item-${id}`}
				className={cn.join(' ')}
				onContextMenu={onContextMenu}
			>
				{isNew ? (
					<div className="newMessages">
						<Label text={translate('blockChatNewMessages')} />
					</div>
				) : ''}

				<div className="flex">
					{userpicNode}
					<div className="side right">

						<Reply {...this.props} id={replyToMessageId} />

						{authorNode}

						<div className="bubbleOuter">
							<div className="bubbleInner">
								<div className={cnBubble.join(' ')}>
									<div className={ct.join(' ')}>
										<div
											ref={ref => this.refText = ref}
											className="text"
											dangerouslySetInnerHTML={{ __html: text }}
										/>
										<div className="time">{editedLabel} {U.Date.date('H:i', createdAt)}</div>

										<div className="expand" onClick={this.onExpand}>
											{translate(this.isExpanded ? 'blockChatMessageCollapse' : 'blockChatMessageExpand')}
										</div>
									</div>


									{hasAttachments ? (
										<div className={ca.join(' ')}>
											{attachments.map((item: any, i: number) => (
												<Attachment
													ref={ref => this.attachmentRefs[item.id] = ref}
													key={i}
													object={item}
													subId={subId}
													scrollToBottom={scrollToBottom}
													onRemove={() => this.onAttachmentRemove(item.id)}
													onPreview={(preview) => this.onPreview(preview)}
													showAsFile={!attachmentsLayout}
													bookmarkAsDefault={attachments.length > 1}
												/>
											))}
										</div>
									) : ''}
								</div>

								{hasReactions ? (
									<div className="reactions">
										{reactions.map((item: any, i: number) => (
											<Reaction key={i} {...item} />
										))}
										{!readonly && canAddReaction ? (
											<Icon id="reaction-add" className="reactionAdd" onClick={this.onReactionAdd} tooltipParam={{ text: translate('blockChatReactionAdd') }} />
										) : ''}
									</div>
								) : ''}
							</div>

							{!readonly ? (
								<div className="controls">
									{!hasReactions && canAddReaction ? <Icon id="reaction-add" className="reactionAdd" onClick={this.onReactionAdd} tooltipParam={{ text: translate('blockChatReactionAdd') }} /> : ''}
									<Icon id="message-reply" className="messageReply" onClick={onReplyEdit} tooltipParam={{ text: translate('blockChatReply') }} />
									{hasMore ? <Icon className="more" onClick={onMore} /> : '' }
								</div>
							) : ''}
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		this.init();
	};

	componentDidUpdate (): void {
		this.init();
	};

	init () {
		const { rootId, id, subId, renderLinks, renderMentions, renderObjects, renderEmoji } = this.props;
		const message = S.Chat.getMessage(subId, id);
		const { creator, content } = message;
		const { marks, text } = content;
		const { account } = S.Auth;
		const isSelf = creator == account.id;
		const readonly = this.props.readonly || !isSelf;

		renderMentions(rootId, this.node, marks, () => text);
		renderObjects(rootId, this.node, marks, () => text, { readonly });
		renderLinks(this.node, marks, () => text, { readonly });
		renderEmoji(this.node);

		this.checkLinesLimit();
	};

	onExpand () {
		this.isExpanded = !this.isExpanded;
		this.forceUpdate();
	};

	checkLinesLimit () {
		const node = $(this.node);
		const ref = $(this.refText);
		const textHeight = ref.outerHeight();
		const lineHeight = parseInt(ref.css('line-height'));
		const canExpand = textHeight / lineHeight > LINES_LIMIT;

		if (canExpand) {
			node.addClass('canExpand');
		};
	};

	onReactionEnter (e: any, authors: string[]) {
		const { space } = S.Common;

		const text = authors.map(it => {
			const author = U.Space.getParticipant(U.Space.getParticipantId(space, it));

			return author?.name;
		}).filter(it => it).join('\n');

		Preview.tooltipShow({ text, element: $(e.currentTarget) });
	};

	onReactionLeave (e: any) {
		Preview.tooltipHide(false);
	};

	onReactionAdd () {
		const { isPopup } = this.props;
		const node = $(this.node);
		const container = isPopup ? U.Common.getScrollContainer(isPopup) : $('body');

		S.Menu.open('smile', { 
			element: node.find('#reaction-add'),
			horizontal: I.MenuDirection.Center,
			noFlipX: true,
			onOpen: () => {
				node.addClass('hover');
				container.addClass('over');
			},
			onClose: () => {
				node.removeClass('hover');
				container.removeClass('over');
			},
			data: {
				noHead: true,
				noUpload: true,
				value: '',
				onSelect: icon => this.onReactionSelect(icon),
			}
		});
	};

	onReactionSelect (icon: string) {
		const { rootId, id } = this.props;

		C.ChatToggleMessageReaction(rootId, id, icon);
	};

	onAttachmentRemove (attachmentId: string) {
		this.update({ attachments: this.getAttachments().filter(it => it.target != attachmentId) });
	};

	onPreview (preview: any) {
		const data: any = { ...preview };
		const gallery = [];

		Object.keys(this.attachmentRefs).forEach(key => {
			const ref = this.attachmentRefs[key];
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

	update (param: Partial<I.ChatMessage>) {
		const { rootId, id, subId } = this.props;
		const message = Object.assign(S.Chat.getMessage(subId, id), param);

		C.ChatEditMessageContent(rootId, id, message);
	};

	getAttachments (): any[] {
		const { rootId, subId, id } = this.props;
		const message = S.Chat.getMessage(subId, id);

		return (message.attachments || []).map(it => S.Detail.get(rootId, it.target)).filter(it => !it._empty_);
	};

	getAttachmentsClass (): string {
		const attachments = this.getAttachments();
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

	canAddReaction (): boolean {
		const { account } = S.Auth;
		const { id, subId } = this.props;
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

	highlight () {
		$(this.node).addClass('highlight');

		window.setTimeout(() => {
			$(this.node).removeClass('highlight');
		}, J.Constant.delay.highlight);
	};

});

export default ChatMessage;
