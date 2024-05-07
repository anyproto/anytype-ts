
import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilSpace, UtilDate } from 'Lib';

const ChatMessage = observer(class ChatMessage extends React.Component<I.Block> {

	public static defaultProps = {
		withButton: true,
	};

	render () {
		const { id, content } = this.props;
		const { text } = content;
		const author = UtilSpace.getProfile();

		return (
			<div id={`item-${id}`} className="message">
				<div className="info">
					<div className="author">
						<IconObject object={author} />
						<ObjectName object={author} />
					</div>
					<div className="time">{UtilDate.date('H:i', UtilDate.now())}</div>
				</div>

				<div className="text">
					{text}
				</div>
			</div>
		);
	};

});

export default ChatMessage;