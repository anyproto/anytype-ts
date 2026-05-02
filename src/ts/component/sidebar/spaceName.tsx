import React, { forwardRef } from 'react';
import { Icon, ObjectName } from 'Component';
import * as I from 'Interface';

const SpaceName = forwardRef(() => {

	const spaceview = U.Space.getSpaceview();
	if (!spaceview) {
		return null;
	};

	const canWrite = U.Space.canMyParticipantWrite();

	const onSpaceSearch = () => keyboard.onSearchPopup(analytics.route.widget);

	const onSpaceCreate = () => {
		keyboard.pageCreate({}, analytics.route.widget, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
	};

	const onSpaceArrow = () => {
		analytics.event('ScreenSelectType');

		U.Menu.typeSuggest({
			element: '#button-create-arrow',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			offsetY: 4,
		}, {}, {
			deleteEmpty: true,
			selectTemplate: true,
			withUpload: true,
			uploadRoute: analytics.route.uploadGlobalMenu,
		}, analytics.route.navigation, object => U.Object.openConfig(null, object));
	};

	const onSpaceMore = (e: any) => {
		U.Menu.spaceContext(U.Space.getSpaceview(), {
			element: e.currentTarget,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
		}, {
			route: analytics.route.widget,
			withDelete: true,
		});
	};

	return (
		<div id="widget-space-name" className="spaceName">
			<div className="info">
				<div className="nameWrap" onClick={onSpaceMore}>
					<ObjectName object={spaceview} />
					<Icon name="arrow/button" size={8} color="default" />
				</div>
				<div className="side right">
					<Icon
						id="button-widget-search"
						name="common/search"
						onClick={onSpaceSearch}
						withBackground={true}
						tooltipParam={{
							text: translate('commonSearch'),
							typeY: I.MenuDirection.Bottom,
						}}
					/>
					{canWrite ? (
						<div className="createGroup">
							<div id="button-create" className="createButton" onClick={onSpaceCreate}>
								<Icon
									name="menu/action/createObject"
									color="default"
									tooltipParam={{
										text: translate('popupShortcutMainBasics1'),
										caption: keyboard.getCaption('createObject'),
										typeY: I.MenuDirection.Bottom,
									}}
								/>
							</div>
							<div id="button-create-arrow" className="createArrow" onClick={onSpaceArrow}>
								<Icon
									name="arrow/button"
									size={8}
									color="default"
									tooltipParam={{
										text: translate('popupShortcutMainBasics19'),
										caption: keyboard.getCaption('selectType'),
										typeY: I.MenuDirection.Bottom,
									}}
								/>
							</div>
						</div>
					) : ''}
				</div>
			</div>
		</div>
	);

});

export default SpaceName;
