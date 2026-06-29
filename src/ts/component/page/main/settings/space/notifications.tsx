import React, { forwardRef, useEffect, useState, useRef } from 'react';
import { Label, Title, IconObject, Icon } from 'Component';
import * as I from 'Interface';

const PageMainSettingsNotifications = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { getId } = props;
	const { space } = S.Common;
	const spaceview = U.Space.getSpaceview();
	const allIds = Relation.getArrayValue(spaceview.allIds);
	const mentionIds = Relation.getArrayValue(spaceview.mentionIds);
	const muteIds = Relation.getArrayValue(spaceview.muteIds);
	const notificationMode = spaceview.notificationMode || I.NotificationMode.All;
	const nodeRef = useRef(null);
	const chatsRef = useRef([]);
	const prevIds = useRef([]);
	const [ dummy, setDummy ] = useState(0);
	const notificationOptions = U.Menu.notificationModeOptions(true);

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
			if (message.error.code) {
				return;
			};

			if (message.records) {
				chatsRef.current = message.records;
				setDummy(dummy + 1);
			};
		});
	};

	const onSpaceModeChange = (v: I.NotificationMode) => {
		C.PushNotificationSetSpaceMode(space, Number(v));
		analytics.event('ChangeMessageNotificationState', { type: v, spaceType: spaceview.spaceType, route: analytics.route.settingsSpaceNotifications });
	};

	const onChatModeClick = (el: any) => {
		const options: any[] = (U.Menu.notificationModeOptions(true) as any[]).concat([
			{ isDiv: true },
			{ id: 'reset', name: translate(`commonReset`) },
		]);

		S.Menu.open('select', {
			element: `#${getId()} #${el.id} .icon.more`,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			data: {
				options,
				value: String(U.Object.getChatNotificationMode(spaceview, el.id)),
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'reset': {
							C.PushNotificationResetIds(space, [ el.id ]);
							break;
						};

						default: {
							Action.setChatNotificationMode(S.Common.space, [ el.id ], Number(item.id), analytics.route.settingsSpaceNotifications);
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
		const ids = [ ...allIds, ...mentionIds, ...muteIds ];

		if (!U.Common.compareJSON(ids, prevIds.current)) {
			prevIds.current = ids;
			load();
		};
	}, [ allIds, mentionIds, muteIds ]);

	return (
		<div ref={nodeRef} className="wrap">
			<Title text={translate(`commonNotifications`)} />

			<div className="section options">
				<Label text={translate(`pageSettingsSpaceNotificationsNotifyMeAbout`)} />

				<div className="actionItems">
					{notificationOptions.map((el, idx) => {
						const isSelected = notificationMode == el.id;
						const cn = [ 'item' ];
						if (isSelected) {
							cn.push('selected');
						};

						return (
							<div
								key={idx}
								onClick={() => onSpaceModeChange(el.id)}
								className={cn.join(' ')}
							>
								<Label text={el.name} />
								{isSelected ? <Icon name="common/tick" className="check" /> : ''}
							</div>
						);
					})}
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
									<Icon name="common/more" className="more" withBackground={true} onClick={() => onChatModeClick(el)} />
								</div>
							</div>
						))}
					</div>
				</div>
			) : ''}

		</div>
	);

});

export default PageMainSettingsNotifications;
