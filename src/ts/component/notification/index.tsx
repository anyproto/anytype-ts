import React, { FC, useRef, useEffect } from 'react';
import { Icon, Title, Label, Button, } from 'Component';
import * as I from 'Interface';

const Notification: FC<I.NotificationComponent> = (props) => {

	const nodeRef = useRef(null);
	const timeout = useRef(0);
	const { item, style, resize } = props;
	const { space } = S.Common;
	const { id, type, payload, title, text } = item;
	const { errorCode, spaceId } = payload;
	const spaceview = U.Space.getSpaceviewBySpaceId(spaceId);
	const participant = U.Space.getMyParticipant(spaceId);
	const spaceCheck = spaceview && (spaceview.isAccountRemoving || spaceview.isAccountDeleted);
	const participantCheck = participant && participant.isJoining;

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
	};

	// Check that space is not removed
	if (spaceCheck || participantCheck) {
		buttons = buttons.filter(it => ![ 'spaceSwitch' ].includes(it.id));
	};

	const onButton = (e: any, action: string) => {
		e.stopPropagation();

		switch (action) {
			case 'spaceSwitch': {
				U.Router.switchSpace(payload.spaceId, '', true, {}, false);
				break;
			};

			case 'spaceDelete': {
				Action.removeSpace(payload.spaceId, analytics.route.notification, true);
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

		};

		onDelete(e);
	};

	const onDelete = (e: any): void => {
		e.stopPropagation();

		U.Dom.addClass(nodeRef.current, 'to');

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			C.NotificationReply([ item.id ], I.NotificationAction.Close);

			S.Notification.delete(item.id);
			resize();
		}, J.Constant.delay.notification);
	};

	useEffect(() => {
		U.Dom.addClass(nodeRef.current, 'from');

		timeout.current = window.setTimeout(() => {
			U.Dom.removeClass(nodeRef.current, 'from');
			window.setTimeout(() => resize(), J.Constant.delay.notification);
		}, 40);

		return () => {
			window.clearTimeout(timeout.current);
		};
	}, []);

	return (
		<div 
			id={`notification-${id}`}
			ref={nodeRef}
			className="notification"
			style={style}
		>
			<Icon name="notification/delete" size={10} onClick={onDelete} />
			<div className="content">
				{title ? <Title text={title} /> : ''}
				{text ? <Label text={text} /> : ''}

				{buttons.length ? (
					<div className="buttons">
						{buttons.map((item: any, i: number) => (
							<Button key={i} size={28} {...item} onClick={e => onButton(e, item.id)} />
						))}
					</div>
				) : ''}
			</div>
		</div>
	);

};

export default Notification;