import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, C, UtilRouter } from 'Lib';
import { notificationStore, popupStore } from 'Store';
import Constant from 'json/constant.json';

import NotificationImport from './import';
import NotificationExport from './export';
import NotificationGallery from './gallery';
import NotificationJoin from './join';

const Notification = observer(class Notification extends React.Component<I.NotificationComponent, {}> {

	_isMounted = false;
	node: any = null;
	timeout = 0;

	constructor (props: I.NotificationComponent) {
		super(props);

		this.onButton = this.onButton.bind(this);
		this.onDelete = this.onDelete.bind(this);
	};

	render () {
		const { item, style } = this.props;
		const { id, type } = item;

		let content = null;
		switch (type) {
			case I.NotificationType.Import: {
				content = <NotificationImport {...this.props} onButton={this.onButton} />;
				break;
			};

			case I.NotificationType.Export: {
				content = <NotificationExport {...this.props} onButton={this.onButton} />;
				break;
			};

			case I.NotificationType.Gallery: {
				content = <NotificationGallery {...this.props} onButton={this.onButton} />;
				break;
			};

			case I.NotificationType.Join: {
				content = <NotificationJoin {...this.props} onButton={this.onButton} />;
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

	onButton (e: any, action: string) {
		e.stopPropagation();

		const { item } = this.props;
		const { payload } = item;

		switch (action) {
			case 'space': {
				UtilRouter.switchSpace(payload.spaceId);
				break;
			};

			case 'request': {
				popupStore.open('inviteConfirm', { 
					data: {
						name: payload.identityName,
						icon: payload.identityIcon,
						spaceId: payload.spaceId,
						identity: payload.identity
					}
				});
			};
		};

		this.onDelete(e);
	};

	onDelete (e: any): void {
		e.stopPropagation();

		const { item, resize } = this.props;
		const node = $(this.node);

		node.addClass('to');
		this.timeout = window.setTimeout(() => {
			C.NotificationReply([ item.id ], I.NotificationAction.Close);

			notificationStore.delete(item.id);
			resize();
		}, Constant.delay.notification);
	};
	
});

export default Notification;
