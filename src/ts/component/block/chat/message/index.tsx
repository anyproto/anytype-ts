import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, Label } from 'Component';
import { I, S, U, C, Mark, translate, Preview } from 'Lib';

import Attachment from '../attachment';

interface State {
	canExpand: boolean;
	isExpanded: boolean;
};

interface Props extends I.BlockComponent {
	blockId: string;
	id: string;
	isThread: boolean;
	isNew: boolean;
	onThread: (id: string) => void;
	onContextMenu: (e: any) => void;
	onMore: (e: any) => void;
	onReply: (e: any) => void;
};

const LINES_LIMIT = 10;

const ChatMessage = observer(class ChatMessage extends React.Component<Props, State> {

	node = null;
	refText = null;
	state = { 
		canExpand: false, 
		isExpanded: false,
	};

	constructor (props: Props) {
		super(props);

		this.onExpand = this.onExpand.bind(this);
		this.onReactionAdd = this.onReactionAdd.bind(this);
		this.onReactionEnter = this.onReactionEnter.bind(this);
		this.onReactionLeave = this.onReactionLeave.bind(this);
	};

	render () {
		const { rootId, blockId, id, isThread, isNew, onThread, onContextMenu, onMore, onReply } = this.props;
		const { canExpand, isExpanded } = this.state;
		const { space } = S.Common;
		const { account } = S.Auth;
		const message = S.Chat.getMessage(rootId, id);
		const { creator, content, createdAt, reactions, isFirst, isLast } = message;
		const { marks } = content;
		const subId = S.Record.getSubId(rootId, blockId);
		const author = U.Space.getParticipant(U.Space.getParticipantId(space, creator));
		const text = U.Common.lbBr(Mark.toHtml(content.text, marks));
		const attachments = (message.attachments || []).map(it => S.Detail.get(subId, it.target));
		const hasReactions = reactions.length;
		const hasAttachments = attachments.length;
		const isSingle = attachments.length == 1;
		const isSelf = creator == account.id;
		const cn = [ 'message' ];

		if (isSelf) {
			cn.push('isSelf');
		};
		if (canExpand) {
			cn.push('canExpand');
		};
		if (isExpanded) {
			cn.push('isExpanded');
		};
		if (isFirst) {
			cn.push('isFirst');
		};
		if (isLast) {
			cn.push('isLast');
		};
		if (isNew) {
			cn.push('isNew');
		};

		// Subscriptions
		for (const mark of marks) {
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

		return (
			<div 
				ref={ref => this.node = ref} 
				id={`item-${id}`} 
				className={cn.join(' ')}
				onContextMenu={onContextMenu}
			>
				<div className="flex">
					<div className="side left">
						<IconObject object={author} size={40} />
					</div>
					<div className="side right">

						<div className="author">
							<ObjectName object={author} />
							<div className="time">{U.Date.date('H:i', createdAt)}</div>
						</div>

						<div className="textWrapper">
							<div 
								ref={ref => this.refText = ref} 
								className="text" 
								dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }}
							/>

							{canExpand && !isExpanded ? (
								<div className="expand" onClick={this.onExpand}>
									{translate('blockChatMessageExpand')}
								</div>
							) : ''}
						</div>

						{hasAttachments ? (
							<div className={[ 'attachments', (isSingle ? 'isSingle' : '') ].join(' ')}>
								{attachments.map((item: any, i: number) => (
									<Attachment key={i} object={item} onRemove={() => this.onAttachmentRemove(item.id)} />
								))}
							</div>
						) : ''}

						{hasReactions ? (
							<div className="reactions">
								{reactions.map((item: any, i: number) => (
									<Reaction key={i} {...item} />
								))}
							</div>
						) : ''}

						<div className="sub" onClick={() => onThread(id)}>
							{!isThread ? <div className="item">0 replies</div> : ''}
						</div>
					</div>
					<div className="controls">
						<Icon id="reaction-add" className="reactionAdd" onClick={this.onReactionAdd} tooltip={translate('blockChatReactionAdd')} />
						{/*<Icon id="message-reply" className="messageReply" onClick={onReply} tooltip={translate('blockChatReply')} />*/}
						{isSelf ? <Icon className="more" onClick={onMore} /> : ''}
					</div>
				</div>

				{isNew ? (
					<div className="newMessages">
						<Label text={translate('blockChatNewMessages')} />
					</div>
				) : ''}
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
		const { rootId, id, renderLinks, renderMentions, renderObjects, renderEmoji } = this.props;
		const message = S.Chat.getMessage(rootId, id);
		const { marks, text } = message.content;

		renderLinks(this.node, marks, text);
		renderMentions(this.node, marks, text);
		renderObjects(this.node, marks, text);
		renderEmoji(this.node);

		this.checkLinesLimit();
	};

	onExpand () {
		this.setState({ isExpanded: true });
	};

	checkLinesLimit () {
		const { isExpanded } = this.state;
		const ref = $(this.refText);
		const textHeight = ref.outerHeight();
		const lineHeight = parseInt(ref.css('line-height'));
		const canExpand = textHeight / lineHeight > LINES_LIMIT;

		if (canExpand && !isExpanded) {
			this.setState({ canExpand: true });
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
		const node = $(this.node);

		S.Menu.open('smile', { 
			element: node.find('#reaction-add'),
			horizontal: I.MenuDirection.Center,
			noFlipX: true,
			onOpen: () => node.addClass('hover'),
			onClose: () => node.removeClass('hover'),
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
		const { rootId, id } = this.props;
		const message = S.Chat.getMessage(rootId, id);
		const attachments = (message.attachments || []).filter(it => it.target != attachmentId);

		this.update({ attachments });
	};

	update (param: Partial<I.ChatMessage>) {
		const { rootId, id } = this.props;
		const message = Object.assign(S.Chat.getMessage(rootId, id), param);

		C.ChatEditMessageContent(rootId, id, message);
	};

});

export default ChatMessage;
