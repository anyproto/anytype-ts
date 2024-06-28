
import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, S, U, J, Mark } from 'Lib';

interface Props extends I.Block, I.BlockComponent {
	data: any;
	isThread: boolean;
	onThread: (id: string) => void;
};

const ChatMessage = observer(class ChatMessage extends React.Component<Props> {

	node = null;

	render () {
		const { id, data, isThread, onThread } = this.props;
		const { space } = S.Common;
		const length = this.getChildren().length;
		const author = U.Space.getParticipant(U.Space.getParticipantId(space, data.identity));
		const text = Mark.toHtml(data.text, data.marks);
		const files = (data.files || []).map(id => S.Detail.get(J.Constant.subId.file, id));

		return (
			<div 
				ref={ref => this.node = ref} 
				id={`item-${id}`} 
				className="message"
			>
				<div className="side left">
					<IconObject object={author} size={48} />
				</div>
				<div className="side right">
					<div className="author">
						<ObjectName object={author} />
						<div className="time">{U.Date.date('H:i', data.time)}</div>
					</div>

					<div className="text" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }}></div>

					{files.length ? (
						<div className="files">
							{files.map((item: any, i: number) => (
								<IconObject key={i} object={item} size={48} onClick={() => U.Object.openPopup(item)} />
							))}
						</div>
					) : ''}

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
	};

	getChildren () {
		const { rootId, id } = this.props;
		const childrenIds = S.Block.getChildrenIds(rootId, id);

		return S.Block.getChildren(rootId, id, it => it.isText());
	};

});

export default ChatMessage;