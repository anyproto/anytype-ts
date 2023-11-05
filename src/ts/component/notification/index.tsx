import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I } from 'Lib';
import { notificationStore } from 'Store';
import Constant from 'json/constant.json';

import NotificationUsecase from './usecase';
import NotificationInvite from './invite';

const Notification = observer(class Notification extends React.Component<I.NotificationComponent, {}> {

	public static defaultProps = {
		className: '',
	};

	_isMounted = false;
	node: any = null;
	timeout = 0;

	constructor (props: I.NotificationComponent) {
		super(props);

		this.onDelete = this.onDelete.bind(this);
	};

	render () {
		const { item, className, style } = this.props;
		const { id, type } = item;
		const cn = [ 'notification', className ];

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
				className={cn.join(' ')}
				style={style}
			>
				<Icon className="delete" onClick={this.onDelete} />
				<div className="content">{content}</div>
			</div>
		);
	};

	componentDidMount (): void {
		const { resize } = this.props;
		const node = $(this.node);

		node.addClass('from');
		this.timeout = window.setTimeout(() => {
			node.removeClass('from');
			window.setTimeout(() => resize(), Constant.delay.notification);
		}, 40);
	};

	componentWillUnmount (): void {
		window.clearTimeout(this.timeout);
	};

	onDelete () {
		const { item, resize } = this.props;
		const node = $(this.node);

		raf(() => {
			node.addClass('to');
			notificationStore.delete(item.id);
			window.setTimeout(() => resize(), Constant.delay.notification);
		});
	};
	
});

export default Notification;
