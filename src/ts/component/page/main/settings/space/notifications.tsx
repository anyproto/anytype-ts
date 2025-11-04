import React, { forwardRef, useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import { Label, Title, IconObject, Icon } from 'Component';
import { I, J, U, S, translate, C, Action } from 'Lib';

const PageMainSettingsNotifications = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { getId } = props;
	const { space } = S.Common;
	const spaceview = U.Space.getSpaceview();
	const { allIds, mentionIds, muteIds } = spaceview;
	const notificationMode = spaceview.notificationMode || I.NotificationMode.All;
	const nodeRef = useRef(null);
	const chatsRef = useRef([]);
	const [ dummy, setDummy ] = useState(0);
	const notificationOptions: any[] = [
		I.NotificationMode.All,
		I.NotificationMode.Mentions,
		I.NotificationMode.Nothing,
	];

	const load = () => {
		const ids = [ ...allIds, ...mentionIds, ...muteIds ];
		const filters = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Chat },
			{ relationKey: 'id', condition: I.FilterCondition.In, value: ids },
		];
		const keys = U.Subscription.chatRelationKeys();

		U.Subscription.search({ 
			filters, 
			keys,
		}, (message: any) => {
			chatsRef.current = message.records;
			setDummy(dummy + 1);
		});
	};

	const onSpaceModeChange = (v: I.NotificationMode) => {
		C.PushNotificationSetSpaceMode(space, Number(v));
	};

	const onChatModeClick = (el: any) => {
		const options: any[] = (U.Menu.notificationModeOptions() as any[]).concat([
			{ isDiv: true },
			{ id: 'reset', name: translate(`commonReset`) },
		]);

		S.Menu.open('select', {
			element: `#${getId()} #${el.id} .icon.more`,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			data: {
				options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'reset': {
							C.PushNotificationResetIds(space, [ el.id ], load);
							break;
						};

						default: {
							Action.setChatNotificationMode(S.Common.space, [ el.id ], Number(item.id), load);
							break;
						};
					};
				},
			},
		});
	};

	useEffect(() => {
		load();
	}, []);

	useEffect(() => {
		load();
	}, [ allIds, mentionIds, muteIds ]);

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
