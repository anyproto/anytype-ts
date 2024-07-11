import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, ObjectDescription } from 'Component';
import { U } from 'Lib';

interface Props {
	object: any;
	onRemove: () => void;
};

const ChatAttachment = observer(class ChatAttachment extends React.Component<Props> {

	render () {
		const { object, onRemove } = this.props;

		return (
			<div className="attachment" onClick={() => U.Object.openPopup(object)}>
				<IconObject object={object} size={48} />

				<div className="info">
					<ObjectName object={object} />
					<ObjectDescription object={object} />
				</div>

				<Icon className="remove" onClick={onRemove} />
			</div>
		);
	};

});

export default ChatAttachment;