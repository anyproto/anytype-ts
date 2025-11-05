import React, { useRef, forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName, Label } from 'Component';
import { I, U, S, C, translate, analytics, Action } from 'Lib';

const WidgetSpace = observer(forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const spaceview = U.Space.getSpaceview();
	if (!spaceview) {
		return null;
	};

	const nodeRef = useRef(null);
	const isMuted = spaceview.notificationMode != I.NotificationMode.All;
	const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
	const cn = [ `space${I.SpaceUxType[spaceview.uxType]}` ];

	const onButtonClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		switch (item.id) {
			case 'member': {
				Action.openSpaceShare(analytics.route.widget);
				analytics.event('ClickSpaceWidgetInvite', { route: analytics.route.widget });
				break;
			};

			case 'settings': {
				U.Object.openRoute({ id: 'spaceIndex', layout: I.ObjectLayout.Settings });
				break;
			};

			case 'chat': {
				U.Object.openAuto({ id: S.Block.workspace, layout: I.ObjectLayout.Chat });
				break;
			};

			case 'mute': {
				C.PushNotificationSetSpaceMode(S.Common.space, Number(isMuted ? I.NotificationMode.All : I.NotificationMode.Mentions));
				break;
			};
		};
	};

	const onMore = () => {
		U.Menu.spaceContext(U.Space.getSpaceview(), {
			element: '#widget-space .nameWrap .arrow',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
		}, { route: analytics.route.widget });
	};

	let content = null;
	if (spaceview.isChat) {
		const buttons = [
			{ id: 'chat', name: translate('commonChat') },
			{ id: 'mute', name: isMuted ? translate('commonUnmute') : translate('commonMute'), className: isMuted ? 'off' : 'on' },
			{ id: 'settings', name: translate('commonSettings') }
		];

		content = (
			<>
				<div className="spaceInfo">
					<IconObject
						id="spaceIcon"
						size={80}
						iconSize={80}
						object={{ ...spaceview, spaceId: S.Common.space }}
					/>
					<ObjectName object={{ ...spaceview, spaceId: S.Common.space }} />
					{spaceview.isShared ? (
						<Label text={`${members.length} ${U.Common.plural(members.length, translate('pluralMember'))}`} /> 
					) : (
						<Label text={translate('commonPersonalSpace')} />
					)}
				</div>
				<div className="buttons">
					{buttons.map((item, idx) => (
						<div className="item" onClick={e => onButtonClick(e, item)} key={idx}>
							<Icon className={[ item.id, item.className ? item.className : '' ].join(' ')} />
							<Label text={item.name} />
						</div>
					))}
				</div>
			</>
		);
	} else {
		content = (
			<div className="head">
				<IconObject object={spaceview} size={48} />
				<div className="info">
					<div className="nameWrap" onClick={onMore}>
						<ObjectName object={spaceview} />
						<Icon className="arrow" />
					</div>

					{spaceview.isShared ? (
						<Label 
							text={`${members.length} ${U.Common.plural(members.length, translate('pluralMember'))}`} 
							onClick={e => onButtonClick(e, { id: 'member' })}
						/>
					) : (
						<Label text={translate('commonPersonalSpace')} />
					)}
				</div>
			</div>
		);
	};

	return (
		<div ref={nodeRef} className={cn.join(' ')}>
			{content}
		</div>
	);

}));

export default WidgetSpace;