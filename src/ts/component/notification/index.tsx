import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Button, Error } from 'Component';
import { I, C, S, U, J, translate, Action, analytics } from 'Lib';

interface State {
	error: string;
};

const Notification = observer(class Notification extends React.Component<I.NotificationComponent, State> {

	_isMounted = false;
	node: any = null;
	timeout = 0;
	state = {
		error: '',
	};

	constructor (props: I.NotificationComponent) {
		super(props);

		this.onButton = this.onButton.bind(this);
		this.onDelete = this.onDelete.bind(this);
	};

	render () {
		const { error } = this.state;
		const { item, style } = this.props;
		const { space } = S.Common;
		const { id, type, payload, title, text } = item;
		const { errorCode, spaceId } = payload;
		const spaceview = U.Space.getSpaceviewBySpaceId(spaceId);
		const participant = U.Space.getMyParticipant(spaceId);
		const spaceCheck = spaceview && (spaceview.isAccountRemoving || spaceview.isAccountDeleted);
		const participantCheck = participant && (participant.isRemoving || participant.isJoining);

		let buttons = [];

		switch (type) {
			case I.NotificationType.Gallery:
			case I.NotificationType.Import: {
				if (!errorCode && (spaceId != space)) {
					buttons = buttons.concat([
						{ id: 'spaceSwitch', text: translate('notificationButtonSpaceSwitch') }
					]);
				};
				break;
			};

			case I.NotificationType.Join: {
				buttons = buttons.concat([
					{ id: 'request', text: translate('notificationButtonRequest') },
					{ id: 'spaceSwitch', text: translate('notificationButtonSpaceSwitch'), color: 'blank' },
				]);
				break;
			};

			case I.NotificationType.Leave: {
				buttons = buttons.concat([
					{ id: 'approve', text: translate('commonApprove') }
				]);
				break;
			};

			case I.NotificationType.Remove: {
				buttons = buttons.concat([
					{ id: 'spaceDelete', text: translate('notificationButtonSpaceDelete'), color: 'red' },
				]);
				break;
			};

		};

		// Check that space is not removed
		if (spaceCheck || participantCheck) {
			buttons = buttons.filter(it => ![ 'spaceSwitch' ].includes(it.id));
		};

		return (
			<div 
				id={`notification-${id}`}
				ref={node => this.node = node}
				className="notification"
				style={style}
			>
				<Icon className="delete" onClick={this.onDelete} />
				<div className="content">
					{title ? <Title text={title} /> : ''}
					{text ? <Label text={text} /> : ''}
					<Error text={error} />

					{buttons.length ? (
						<div className="buttons">
							{buttons.map((item: any, i: number) => (
								<Button key={i} className="c28" {...item} onClick={e => this.onButton(e, item.id)} />
							))}
						</div>
					) : ''}
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		const { resize } = this.props;
		const node = $(this.node);

		node.addClass('from');
		this.timeout = window.setTimeout(() => {
			node.removeClass('from');
			window.setTimeout(() => resize(), J.Constant.delay.notification);
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
			case 'spaceSwitch': {
				U.Router.switchSpace(payload.spaceId, '', true);
				break;
			};

			case 'spaceDelete': {
				Action.removeSpace(payload.spaceId, 'Notification');
				break;
			};

			case 'request': {
				S.Popup.open('inviteConfirm', { 
					data: {
						name: payload.identityName,
						icon: payload.identityIcon,
						spaceId: payload.spaceId,
						identity: payload.identity,
						route: analytics.route.notification,
					}
				});
				break;
			};

			case 'approve': {
				Action.leaveApprove(payload.spaceId, [ payload.identity ], payload.identityName, analytics.route.notification, (message: any) => {
					if (message.error.code) {
						this.setState({ error: message.error.description });
					};
				});
				break;
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

			S.Notification.delete(item.id);
			resize();
		}, J.Constant.delay.notification);
	};
	
});

export default Notification;
