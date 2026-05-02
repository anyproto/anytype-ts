import React, { FC, MouseEvent } from 'react';
import { Icon, ObjectName } from 'Component';
import * as I from 'Interface';

const ANCHOR = `#widget-${J.Constant.widgetId.home}`;

const WidgetHome: FC = () => {

	const home = U.Space.getDashboard();
	if (!home || U.Space.isSystemDashboard(home.id)) {
		return null;
	};

	const spaceview = U.Space.getSpaceview();
	const canChangeHome = spaceview && !spaceview.isOneToOne;

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

		if (!canChangeHome) {
			return;
		};

		const { x, y } = keyboard.mouse.page;

		S.Menu.open('select', {
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			rect: { width: 0, height: 0, x, y },
			data: {
				options: [
					{ id: 'change', name: translate('widgetHomeChange') },
				],
				onSelect: (_: unknown, item: { id: string }) => {
					if (item.id == 'change') {
						U.Menu.dashboardSelect(ANCHOR, false, {
							element: ANCHOR,
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
		<div 
			id={`widget-${J.Constant.widgetId.home}`} 
			className="widget widgetLink" 
			onClick={onClick} 
			onContextMenu={onContextMenu}
		>
			<div className="head">
				<div className="sides">
					<div className="side left">
						<div className="clickable">
							<Icon name="settings/home" color="red" />
							<ObjectName object={home} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);

};

export default WidgetHome;
