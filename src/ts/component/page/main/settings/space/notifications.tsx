import React, { forwardRef, useEffect, useState, useRef } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Label, Title, IconObject, Icon } from 'Component';
import { I, J, U, S, translate, C, Action } from 'Lib';

const PageMainSettingsNotifications = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { getId } = props;
	const spaceview = U.Space.getSpaceview();
	const { notificationMode } = spaceview;
	const nodeRef = useRef(null);
	const chatsRef = useRef([]);
	const [ dummy, setDummy ] = useState(0);
	const notificationOptions: any[] = [
		I.NotificationMode.All,
		I.NotificationMode.Mentions,
		I.NotificationMode.Nothing,
	];

	if (notificationMode == I.NotificationMode.Custom) {
		notificationOptions.push(I.NotificationMode.Custom);
	};

	const load = () => {
		const filters = [
			{ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Chat }
		];
		const keys = J.Relation.default.concat([ 'links', 'backlinks' ]);

		U.Subscription.search({ filters, keys }, (message: any) => {
			console.log('MESSAGE: ', message)
			chatsRef.current = message.records;
			setDummy(dummy + 1);
		});
	};

	const onSpaceModeChange = (v: I.NotificationMode) => {
		C.PushNotificationSetSpaceMode(S.Common.space, Number(v));
	};

	const onChatModeClick = (el: any) => {
		const element = `#${getId()} #${el.id} .icon.more`;
		S.Menu.open('select', {
			element,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			data: {
				options: U.Menu.notificationModeOptions(),
				onSelect: (e: any, item: any) => {
					console.log('ITEM: ', item)
					Action.setChatNotificationMode(S.Common.space, [ el.id ], Number(item.id));
				}
			}
		})
	};

	useEffect(() => {
		load();
	}, []);

	return (
		<div ref={nodeRef} className="wrap">
			<Title text={translate(`commonNotifications`)} />

			<div className="section options">
				<Label text={translate(`pageSettingsSpaceNotificationsNotifyMeAbout`)} />
				<div className="actionItems">
					{notificationOptions.map((el, idx) => (
						<div key={idx} onClick={() => onSpaceModeChange(el)} className={[ 'item', notificationMode == el ? 'selected' : '' ].join(' ')}>
							<Label text={translate(`pageSettingsSpaceNotificationsMode${el}`)} />
						</div>
					))}
				</div>
			</div>


			{chatsRef.current.length ? (
				<div className="section chats">
					<Label text={translate(`pageSettingsSpaceNotificationsChatSpecificNotifications`)} />
					<div className="actionItems">
						{chatsRef.current.map((el, idx) => (
							<div key={idx} id={el.id} className="item">
								<div className="side left">
									<IconObject object={el} size={40} iconSize={20} />
									<div className="info">
										<Title text={el.name} />
										<Label text={translate(`pageSettingsSpaceNotificationsChatSpecificMode${U.Object.getChatNotificationMode(spaceview, el.id)}`)} />
									</div>
								</div>
								<div className="side right">
									<Icon onClick={() => onChatModeClick(el)} className="more withBackground" />
								</div>
							</div>
						))}
					</div>
				</div>
			) : ''}

		</div>
	);

}));

export default PageMainSettingsNotifications;
