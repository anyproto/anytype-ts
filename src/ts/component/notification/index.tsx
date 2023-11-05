import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I } from 'Lib';
import { notificationStore } from 'Store';

import NotificationUsecase from './usecase';
import NotificationInvite from './invite';

const Notification = observer(class Notification extends React.Component<I.Notification, {}> {

	_isMounted = false;
	node: any = null;
	timeout = 0;

	constructor (props: I.Notification) {
		super(props);

		this.onDelete = this.onDelete.bind(this);
	};

	render () {
		const { id, type, style } = this.props;

		let content = null;
		switch (type) {
			case I.NotificationType.Usecase: {
				content = <NotificationUsecase {...this.props} />;
				break;
			};

			case I.NotificationType.Invite: {
				content = <NotificationInvite {...this.props} />;
				break;
			};
		};

		return (
			<div 
				id={`notification-${id}`}
				ref={node => this.node = node}
				className="notification"
				style={style}
			>
				<Icon className="delete" onClick={this.onDelete} />
				<div className="content">{content}</div>
			</div>
		);
	};

	componentDidMount (): void {
		const node = $(this.node);

		node.addClass('from');
		this.timeout = window.setTimeout(() => node.removeClass('from'), 40);
	};

	componentWillUnmount (): void {
		window.clearTimeout(this.timeout);
	};

	onDelete () {
		const { id } = this.props;
		const node = $(this.node);

		node.addClass('to');
		window.setTimeout(() => notificationStore.delete(id), 200);
	};
	
});

export default Notification;
