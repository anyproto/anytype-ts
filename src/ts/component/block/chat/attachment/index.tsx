import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, ObjectDescription } from 'Component';
import { U } from 'Lib';

interface Props {
	object: any;
	onRemove: () => void;
};

const ChatAttachment = observer(class ChatAttachment extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onRemove = this.onRemove.bind(this);
	};

	render () {
		const { object } = this.props;

		return (
			<div className="attachment" onClick={() => U.Object.openPopup(object)}>
				<IconObject object={object} size={48} />

				<div className="info">
					<ObjectName object={object} />
					<ObjectDescription object={object} />
				</div>

				<Icon className="remove" onClick={this.onRemove} />
			</div>
		);
	};

	onRemove (e: any) {
		e.stopPropagation();
		this.props.onRemove();
	};

});

export default ChatAttachment;