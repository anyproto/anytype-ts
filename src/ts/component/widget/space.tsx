import React, { useRef, forwardRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName, Label } from 'Component';
import { I, U, S, translate, analytics, Action, keyboard } from 'Lib';
import MemberCnt from 'Component/util/memberCnt';

const WidgetSpace = observer(forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const spaceview = U.Space.getSpaceview();
	if (!spaceview) {
		return null;
	};

	const nodeRef = useRef(null);
	const [ dummy, setDummy ] = useState(0);
	const canWrite = U.Space.canMyParticipantWrite();
	const route = analytics.route.widget;
	const cn = [ U.Data.spaceClass(spaceview.uxType) ];
	const iconSize = (spaceview.isChat || spaceview.isOneToOne) ? 80 : 48;
	const rootId = keyboard.getRootId();

	const icon = (
		<IconObject
			size={iconSize}
			iconSize={iconSize}
			object={spaceview}
			onClick={() => U.Space.openDashboard()}
		/>
	);

	const buttons = [
		canWrite ? { 
			id: 'create', 
			name: translate('commonCreate'), 
			withArrow: true,
			arrowTooltipParam: { 
				text: translate('popupShortcutMainBasics19'), 
				caption: keyboard.getCaption('selectType'), 
				typeY: I.MenuDirection.Bottom as any,
			},
		} : null,
		{ id: 'search', name: translate('commonSearch') },
		(spaceview.isChat || spaceview.isOneToOne) ? { id: 'chat', name: translate('commonMainChat') } : null,
	].filter(it => it);

	const onButtonClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		switch (item.id) {
			case 'search': {
				keyboard.onSearchPopup(analytics.route.widget);
				break;
			};

			case 'create': {
				keyboard.pageCreate({}, analytics.route.widget, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
				break;
			};

			case 'chat': {
				U.Object.openRoute({ id: S.Block.workspace, layout: I.ObjectLayout.Chat });
				break;
			};
		};
	};

	const onArrow = (e: any) => {
		e.stopPropagation();

		U.Menu.typeSuggest({ 
			element: '#button-create-arrow',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			offsetY: 4,
		}, {}, { 
			deleteEmpty: true,
			selectTemplate: true,
			withImport: true,
		}, analytics.route.navigation, object => U.Object.openConfig(null, object));
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
	if (spaceview.isChat || spaceview.isOneToOne) {
		content = (
			<div className="spaceInfo">
				{icon}
				<div className="nameWrap" onClick={onMore}>
					<ObjectName object={spaceview} />
					<Icon className="arrow" />
				</div>

				<MemberCnt route={analytics.route.widget} />
			</div>
		);
	} else {
		content = (
			<div className="head">
				{icon}
				<div className="info">
					<div className="nameWrap" onClick={onMore}>
						<ObjectName object={spaceview} />
						<Icon className="arrow" />
					</div>

					<MemberCnt route={analytics.route.widget} />
				</div>
			</div>
		);
	};

	useEffect(() => {
		const win = $(window);

		win.off('objectView').on('objectView', () => setDummy(dummy => dummy + 1));

		return () => {
			win.off('objectView');
		};
	}, []);

	return (
		<div ref={nodeRef} className={cn.join(' ')}>
			{content}
			<div className="buttons">
				{buttons.map((item, idx) => {
					const cn = [ 'item' ];

					if ((item.id == 'chat') && (rootId == S.Block.workspace)) {
						cn.push('active');
					};

					return (
						<div className={cn.join(' ')} onClick={e => onButtonClick(e, item)} key={idx}>
							<Icon className={item.id} />
							<Label text={item.name} />
							{item.withArrow ? (
								<Icon 
									id={`button-${item.id}-arrow`}
									className="arrow withBackground"
									onClick={onArrow}
									tooltipParam={item.arrowTooltipParam}
								/>
							) : ''}
						</div>
					);
				})}
			</div>
		</div>
	);

}));

export default WidgetSpace;
