import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I } from 'Lib';
import { notificationStore } from 'Store';

const Notification = observer(class Notification extends React.Component<I.Notification, {}> {

	_isMounted = false;
	node: any = null;

	constructor (props: I.Notification) {
		super(props);

		this.onDelete = this.onDelete.bind(this);
	};

	render () {
		const { id, style } = this.props;

		return (
			<div 
				id={`notification-${id}`}
				ref={node => this.node = node}
				className="notification"
				style={style}
			>
				<Icon className="delete" onClick={this.onDelete} />
				{id}
			</div>
		);
	};

	componentDidMount (): void {
		const node = $(this.node);

		node.addClass('hide');
		window.setTimeout(() => node.removeClass('hide'), 40);
	};

	onDelete () {
		notificationStore.delete(this.props.id);
	};
	
});

export default Notification;
