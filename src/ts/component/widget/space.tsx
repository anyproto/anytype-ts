import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, U, translate, keyboard, analytics } from 'Lib';

const WidgetSpace = observer(forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const space = U.Space.getSpaceview();
	const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]);
	const requestCnt = participants.filter(it => it.isJoining).length;
	const isSpaceOwner = U.Space.isMyOwner();
	const cn = [];
	const buttons = [
		{ id: 'search', name: translate('commonSearch') },
		//{ id: 'all', name: translate('commonAllContent') },
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
			/*
			case 'all': {
				sidebar.panelSetState(false, sidebarDirection, { page: 'allObject' });
				break;
			};
			*/

			case 'member': {
				U.Object.openRoute({ id: 'spaceShare', layout: I.ObjectLayout.Settings });
				analytics.event('ClickSpaceWidgetInvite', { route: analytics.route.widget });
				break;
			};

			case 'search': {
				keyboard.onSearchPopup(analytics.route.widget);
				break;
			};

			case 'settings': {
				U.Object.openRoute({ id: 'spaceIndex', layout: I.ObjectLayout.Settings });
				break;
			};
		};
	};

	return (
		<div className={cn.join(' ')}>
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