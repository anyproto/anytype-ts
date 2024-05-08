
import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilSpace, UtilDate, Mark, UtilCommon } from 'Lib';
import { commonStore, blockStore } from 'Store';

interface Props extends I.Block, I.BlockComponent {
	data: any;
	isThread: boolean;
	onThread: (id: string) => void;
};

const ChatMessage = observer(class ChatMessage extends React.Component<Props> {

	render () {
		const { id, data, isThread, onThread } = this.props;
		const { space } = commonStore;
		const length = this.getChildren().length;
		const author = UtilSpace.getParticipant(UtilSpace.getParticipantId(space, data.identity));
		const text = Mark.toHtml(data.text, data.marks);

		return (
			<div id={`item-${id}`} className="message">
				<div className="info">
					<div className="author">
						<IconObject object={author} />
						<ObjectName object={author} />
					</div>
					<div className="time">{UtilDate.date('H:i', data.time)}</div>
				</div>

				<div className="text" dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(text) }}></div>

				<div className="sub" onClick={() => onThread(id)}>
					{!isThread ? <div className="item">{length} replies</div> : ''}
				</div>
			</div>
		);
	};

	getChildren () {
		const { rootId, id } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, id);

		return blockStore.getChildren(rootId, id, it => it.isText());
	};

});

export default ChatMessage;