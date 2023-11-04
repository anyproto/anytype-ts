import * as React from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';

const Notification = observer(class Notification extends React.Component<I.Notification, {}> {

	_isMounted = false;
	node: any = null;

	constructor (props: I.Notification) {
		super(props);
	};

	render () {
		return (
			<div 
				ref={node => this.node = node}
				className="notification"
			>
				{this.props.id}
			</div>
		);
	};
	
});

export default Notification;
