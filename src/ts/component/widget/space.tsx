import React, { useRef, forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, U, translate, analytics } from 'Lib';

const WidgetSpace = observer(forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const space = U.Space.getSpaceview();
	const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]);
	const requestCnt = participants.filter(it => it.isJoining).length;
	const isSpaceOwner = U.Space.isMyOwner();
	const canWrite = U.Space.canMyParticipantWrite();
	const nodeRef = useRef(null);
	const cn = [];
	const buttons = [
		canWrite ? { id: 'create', name: translate('commonNewObject') } : null,
		!space.isPersonal ? { id: 'member', name: translate('pageSettingsSpaceIndexInviteMembers') } : null,
		{ id: 'settings', name: translate('commonSettings') },
	].filter(it => it);

	if (isSpaceOwner && requestCnt) {
		cn.push('withCnt');
	};

	const onButtonClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		switch (item.id) {
			case 'member': {
				U.Object.openRoute({ id: 'spaceShare', layout: I.ObjectLayout.Settings });
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
				}, analytics.route.navigation, object => U.Object.openAuto(object));
				break;
			};
		};
	};

	return (
		<div ref={nodeRef} className={cn.join(' ')}>
			<div className="head">
				<div className="sides">
					<div className="side left">
						<div className="clickable">
							<IconObject object={space} />
							<ObjectName object={space} />
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
		</div>
	);

}));

export default WidgetSpace;