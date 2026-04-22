import React, { forwardRef, MouseEvent } from 'react';
import { Icon, IconObject, ObjectName } from 'Component';
import * as I from 'Interface';

const WidgetSpace = forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const spaceview = U.Space.getSpaceview();
	if (!spaceview) {
		return null;
	};

	const canWrite = U.Space.canMyParticipantWrite();
	const route = analytics.route.widget;
	const cn = [ U.Data.spaceClass(spaceview.spaceType) ];

	const icon = (
		<IconObject
			size={32}
			iconSize={32}
			object={spaceview}
			onClick={() => U.Space.openDashboard()}
		/>
	);

	const onCreate = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		keyboard.pageCreate({}, route, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
	};

	const onArrow = (e: MouseEvent) => {
		e.stopPropagation();

		analytics.event('ScreenSelectType');

		U.Menu.typeSuggest({
			element: '#button-create-arrow',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			offsetY: 4,
		}, {}, {
			deleteEmpty: true,
			selectTemplate: true,
			withImport: true,
			uploadRoute: analytics.route.uploadGlobalMenu,
		}, analytics.route.navigation, object => U.Object.openConfig(null, object));
	};

	const onMore = () => {
		U.Menu.spaceContext(U.Space.getSpaceview(), {
			element: '#widget-space .nameWrap .icon.arrowButton',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
		}, {
			route,
			withDelete: true,
		});
	};

	return (
		<div className={cn.join(' ')}>
			<div className="head">
				{icon}
				<div className="info">
					<div className="nameWrap" onClick={onMore}>
						<ObjectName object={spaceview} />
						<Icon name="arrow/button" size={8} color="default" />
					</div>
					<div className="side right">
						{canWrite ? (
							<>
								<Icon
									id={`button-create`}
									name="menu/action/createObject"
									color="default"
									onClick={onCreate}
									tooltipParam={{
										text: translate('popupShortcutMainBasics1'),
										caption: keyboard.getCaption('createObject'),
										typeY: I.MenuDirection.Bottom as any,
									}}
								/>
								<Icon
									id={`button-create-arrow`}
									name="arrow/button"
									size={8}
									color="default"
									onClick={onArrow}
									tooltipParam={{
										text: translate('popupShortcutMainBasics19'),
										caption: keyboard.getCaption('selectType'),
										typeY: I.MenuDirection.Bottom as any,
									}}
								/>
							</>
						): ''}
					</div>
				</div>
			</div>
		</div>
	);

});

export default WidgetSpace;
