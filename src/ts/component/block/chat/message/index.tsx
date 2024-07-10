import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName } from 'Component';
import { I, S, U, J, Mark,translate } from 'Lib';

interface Props extends I.Block, I.BlockComponent {
	data: any;
	isThread: boolean;
	onThread: (id: string) => void;
};

const LINES_LIMIT = 10;

const ChatMessage = observer(class ChatMessage extends React.Component<Props> {

	node = null;
	text: any = null;
	canExpand: boolean = false;
	isExpanded: boolean = false;

	constructor (props: Props) {
		super(props);

		this.onExpand = this.onExpand.bind(this);
		this.onReactionAdd = this.onReactionAdd.bind(this);
	};


	render () {
		const { id, data, isThread, onThread } = this.props;
		const { space } = S.Common;
		const { account } = S.Auth;
		const length = this.getChildren().length;
		const author = U.Space.getParticipant(U.Space.getParticipantId(space, data.identity));
		const text = U.Common.lbBr(Mark.toHtml(data.text, data.marks));
		const files = (data.files || []).map(id => S.Detail.get(J.Constant.subId.file, id));
		const reactions = data.reactions || [];
		const cn = [ 'message' ];

		if (data.identity == account.id) {
			cn.push('isSelf');
		};
		if (this.canExpand) {
			cn.push('canExpand');
		};
		if (this.isExpanded) {
			cn.push('expanded');
		};

		const Reaction = (item: any) => {
			const author = U.Space.getParticipant(U.Space.getParticipantId(space, item.author));

			return (
				<div className="reaction">
					<div className="value">
						<IconObject object={{ iconEmoji: item.value }} size={18} />
					</div>
					<div className="count">
						{item.count > 1 ? item.count : <IconObject object={author} size={18} />}
					</div>
				</div>
			);
		};

		return (
			<div 
				ref={ref => this.node = ref} 
				id={`item-${id}`} 
				className={cn.join(' ')}
			>
				<div className="side left">
					<IconObject object={author} size={48} />
				</div>
				<div className="side right">
					<div className="author">
						<ObjectName object={author} />
						<div className="time">{U.Date.date('H:i', data.time)}</div>
					</div>

					<div className="textWrapper">
						<div ref={ref => this.text = ref}  className="text" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }}></div>

						{this.canExpand && !this.isExpanded ? <div className="expand" onClick={this.onExpand}>{translate('blockChatMessageExpand')}</div> : ''}
					</div>

					{files.length ? (
						<div className="files">
							{files.map((item: any, i: number) => (
								<IconObject key={i} object={item} size={48} onClick={() => U.Object.openPopup(item)} />
							))}
						</div>
					) : ''}

					<div className="reactions">
						{reactions.map((item: any, i: number) => (
							<Reaction key={i} {...item} />
						))}
						<Icon className="add" onClick={this.onReactionAdd} />
					</div>

					<div className="sub" onClick={() => onThread(id)}>
						{!isThread ? <div className="item">{length} replies</div> : ''}
					</div>

				</div>
			</div>
		);
	};

	componentDidMount(): void {
		const { data, renderLinks } = this.props;

		renderLinks(this.node, data.marks, false, () => {});

		this.checkLinesLimit();
	};

	onExpand () {
		this.isExpanded = true;
		this.forceUpdate();
	};

	getChildren () {
		const { rootId, id } = this.props;
		const childrenIds = S.Block.getChildrenIds(rootId, id);

		return S.Block.getChildren(rootId, id, it => it.isText());
	};

	checkLinesLimit () {
		const textHeight = $(this.text).outerHeight();
		const lineHeight = Number($(this.text).css('line-height').replace('px', ''));

		if (textHeight/lineHeight > LINES_LIMIT) {
			this.canExpand = true;
			this.forceUpdate();
		};
	};

	onReactionAdd () {
		const node = $(this.node);
		const { rootId, id, data } = this.props;
		const { account } = S.Auth;

		S.Menu.open('smile', { 
			element: node.find('.reactions .icon.add'),
			horizontal: I.MenuDirection.Center,
			vertical: I.MenuDirection.Top,
			noFlipX: true,
			noFlipY: true,
			data: {
				noUpload: true,
				value: '',
				onSelect: (icon: string) => {
					data.reactions = data.reactions || [];

					const item = data.reactions.find(it => it.value == icon);

					if (!item) {
						data.reactions.push({ value: icon, author: account.id, count: 1 });
					};

					U.Data.blockSetText(rootId, id, JSON.stringify(data), [], true);

				},
				onUpload (objectId: string) {
				},
			}
		});
	};

});

export default ChatMessage;
