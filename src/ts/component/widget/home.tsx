import React, { forwardRef, MouseEvent } from 'react';
import { Icon, IconObject, ObjectName } from 'Component';
import * as I from 'Interface';

const WidgetHome = forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const home = U.Space.getDashboard();
	if (!home || U.Space.getSystemDashboardIds().includes(home.id)) {
		return null;
	};

	const onClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (U.Common.checkAuxButton(e)) {
			return;
		};

		U.Object.openEvent(e, home);
	};

	const onContextMenu = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const { x, y } = keyboard.mouse.page;

		S.Menu.open('select', {
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			rect: { width: 0, height: 0, x, y },
			data: {
				options: [
					{ id: 'change', name: translate('widgetHomeChange') },
				],
				onSelect: (_: any, item: any) => {
					if (item.id == 'change') {
						U.Menu.dashboardSelect(`#widget-home`, false, {
							element: '#widget-home',
							className: 'fixed',
							classNameWrap: 'fromSidebar',
							horizontal: I.MenuDirection.Right,
							stickToElementEdge: I.MenuDirection.Top,
							offsetX: 8,
						});
					};
				},
			},
		});
	};

	return (
		<div id="widget-home" className="widgetHome" onClick={onClick} onContextMenu={onContextMenu}>
			<div className="side left">
				<IconObject object={home} size={20} iconSize={20} className="headerIcon" onClick={e => e.stopPropagation()} />
				<ObjectName object={home} />
			</div>
			<div className="side right">
				<Icon name="settings/home" className="home" />
			</div>
		</div>
	);

});

export default WidgetHome;
