import React, { FC, useRef, useEffect } from 'react';
import { Icon, Title, Label, Button, } from 'Component';
import * as I from 'Interface';
import { notificationReplyClose } from 'Lib/notificationReply';

/**
 * The AI apps nudge's controls: native buttons (Tab, Enter, Space as any button). Their keystrokes stay theirs:
 * none reaches the editor's or the app's window shortcuts, so Enter on Connect never adds a block and Tab is
 * never taken as indentation (A5).
 */
export const NudgeButtons = ({ onConnect, onClose }: { onConnect: (e: any) => void; onClose: (e: any) => void }) => (
	<div className="buttons" onKeyDown={e => e.stopPropagation()}>
		<button type="button" className="button black size28" aria-label={translate('aiAppsConnect')} onClick={onConnect}>{translate('aiAppsConnect')}</button>
		<button type="button" className="button blank size28" aria-label={translate('commonClose')} onClick={onClose}>{translate('commonClose')}</button>
	</div>
);

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
	// The AI apps nudge has its own native buttons (keyboard reachable); other types keep their markup
	const isAiConnect = (type == I.NotificationType.AiConnect);

	let buttons = [];

	switch (type) {
		case I.NotificationType.Export: {
			if (payload.report || errorCode) {
				buttons.push({ id: 'exportResult', text: translate('popupExportResultViewDetails') });
			};
			break;
		};

		case I.NotificationType.Import: {
			if (payload.reportObjectId) {
				buttons = buttons.concat([
					{ id: 'report', text: translate('notificationButtonImportReport') }
				]);
			} else
			if (!errorCode && (spaceId != space)) {
				buttons = buttons.concat([
					{ id: 'spaceSwitch', text: translate('notificationButtonSpaceSwitch') }
				]);
			};
			break;
		};

		case I.NotificationType.Gallery: {
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
		buttons = buttons.filter(it => ![ 'spaceSwitch', 'report' ].includes(it.id));
	};

	const onButton = (e: any, action: string) => {
		e.stopPropagation();

		switch (action) {
			case 'exportResult': {
				S.Popup.open('exportResult', {
					data: {
						report: payload.report,
						path: payload.path,
						error: { code: errorCode },
						spaceId,
						exportType: payload.exportType,
					},
				});
				break;
			};

			case 'spaceSwitch': {
				U.Router.switchSpace(payload.spaceId, '', true, {}, false);
				break;
			};

			case 'report': {
				const object = { id: payload.reportObjectId, layout: I.ObjectLayout.Page, spaceId: payload.spaceId };

				if (payload.spaceId == space) {
					U.Object.openAuto(object);
				} else {
					U.Router.switchSpace(payload.spaceId, U.Object.route(object), true, {}, false);
				};
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

	const onAiConnect = (e: any): void => {
		e.stopPropagation();

		Action.openAiApps({ app: payload.appId }, analytics.route.notification);
		onDelete(e);
	};

	const onDelete = (e: any): void => {
		e.stopPropagation();

		U.Dom.addClass(nodeRef.current, 'to');

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			notificationReplyClose([ item ]);

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

				{isAiConnect ? <NudgeButtons onConnect={onAiConnect} onClose={onDelete} /> : ''}
			</div>
		</div>
	);

};

export default Notification;
