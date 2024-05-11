
import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilSpace, UtilDate, Mark, UtilCommon, UtilObject } from 'Lib';
import { commonStore, blockStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.Block, I.BlockComponent {
	data: any;
	isThread: boolean;
	onThread: (id: string) => void;
};

const ChatMessage = observer(class ChatMessage extends React.Component<Props> {

	node = null;

	render () {
		const { id, data, isThread, onThread } = this.props;
		const { space } = commonStore;
		const length = this.getChildren().length;
		const author = UtilSpace.getParticipant(UtilSpace.getParticipantId(space, data.identity));
		const text = Mark.toHtml(data.text, data.marks);
		const files = (data.files || []).map(id => detailStore.get(Constant.subId.file, id));

		return (
			<div 
				ref={ref => this.node = ref} 
				id={`item-${id}`} 
				className="message"
			>
				<div className="info">
					<div className="author">
						<IconObject object={author} />
						<ObjectName object={author} />
					</div>
					<div className="time">{UtilDate.date('H:i', data.time)}</div>
				</div>

				<div className="text" dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(text) }}></div>

				{files.length ? (
					<div className="files">
						{files.map((item: any, i: number) => (
							<IconObject key={i} object={item} size={48} onClick={() => UtilObject.openPopup(item)} />
						))}
					</div>
				) : ''}

				<div className="sub" onClick={() => onThread(id)}>
					{!isThread ? <div className="item">{length} replies</div> : ''}
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
		const childrenIds = blockStore.getChildrenIds(rootId, id);

		return blockStore.getChildren(rootId, id, it => it.isText());
	};

});

export default ChatMessage;