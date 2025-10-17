import React, { useRef, forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName, Label } from 'Component';
import { I, U, S, C, translate, analytics, Action } from 'Lib';

const WidgetSpace = observer(forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const spaceview = U.Space.getSpaceview();
	if (!spaceview) {
		return null;
	};

	const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]);
	const requestCnt = participants.filter(it => it.isJoining).length;
	const isSpaceOwner = U.Space.isMyOwner();
	const canWrite = U.Space.canMyParticipantWrite();
	const nodeRef = useRef(null);
	const isMuted = spaceview.notificationMode != I.NotificationMode.All;
	const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]);
	const cn = [ `space${I.SpaceUxType[spaceview.uxType]}` ];

	if (isSpaceOwner && requestCnt) {
		cn.push('withCnt');
	};

	const onButtonClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		switch (item.id) {
			case 'member': {
				Action.openSpaceShare(analytics.route.navigation);
				analytics.event('ClickSpaceWidgetInvite', { route: analytics.route.widget });
				break;
			};

			case 'settings': {
				U.Object.openRoute({ id: 'spaceIndex', layout: I.ObjectLayout.Settings });
				break;
			};

			case 'create': {
				U.Menu.typeSuggest({ 
					element: '#widget-space #item-create',
					offsetX: $(nodeRef.current).width() + 4,
					className: 'fixed',
					classNameWrap: 'fromSidebar',
					vertical: I.MenuDirection.Center,
				}, {}, { 
					deleteEmpty: true,
					selectTemplate: true,
					withImport: true,
				}, analytics.route.navigation, object => U.Object.openConfig(object));
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
					{members.length > 1 ? <Label className="membersCounter" text={`${members.length} ${U.Common.plural(members.length, translate('pluralMember'))}`} /> : ''}
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
		const buttons = [
			canWrite ? { id: 'create', name: translate('commonNewObject') } : null,
			!spaceview.isPersonal ? { id: 'member', name: translate('pageSettingsSpaceIndexInviteMembers') } : null,
			{ id: 'settings', name: translate('commonSettings') },
		].filter(it => it);

		content = (
			<>
				<div className="head">
					<div className="sides">
						<div className="side left">
							<div className="clickable">
								<IconObject object={spaceview} />
								<ObjectName object={spaceview} />
							</div>
						</div>
					</div>
				</div>

				<div className="buttons">
					{buttons.map((item, i) => {
						let cnt = null;

						if (item.id == 'member') {
							cnt = <div className="cnt">{requestCnt}</div>;
						};

						return (
							<div 
								key={i} 
								id={`item-${item.id}`} 
								className="item" 
								onClick={e => onButtonClick(e, item)}
							>
								<div className="side left">
									<Icon className={item.id} />
									<div className="name">
										{item.name}
									</div>
								</div>
								<div className="side right">
									{cnt}
								</div>
							</div>
						);
					})}
				</div>
			</>
		);
	};

	return (
		<div ref={nodeRef} className={cn.join(' ')}>
			{content}
		</div>
	);

}));

export default WidgetSpace;