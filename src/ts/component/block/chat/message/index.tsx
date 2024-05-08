
import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilSpace, UtilDate, Mark, UtilCommon } from 'Lib';
import { commonStore } from 'Store';

interface Props extends I.Block {
	data: any;
};

const ChatMessage = observer(class ChatMessage extends React.Component<Props> {

	render () {
		const { id, content, data } = this.props;
		const { space } = commonStore;
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
			</div>
		);
	};

});

export default ChatMessage;