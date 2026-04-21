import React, { useRef, forwardRef, useEffect, useState, MouseEvent } from 'react';
import { Icon, IconObject, ObjectName, Label } from 'Component';
import MemberCnt from 'Component/util/memberCnt';
import ChatCounter from 'Component/util/chatCounter';
import * as I from 'Interface';

const WidgetSpace = forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const spaceview = U.Space.getSpaceview();
	if (!spaceview) {
		return null;
	};

	const nodeRef = useRef(null);
	const [ dummy, setDummy ] = useState(0);
	const canWrite = U.Space.canMyParticipantWrite();
	const route = analytics.route.widget;
	const cn = [ U.Data.spaceClass(spaceview.spaceType) ];
	const iconSize = spaceview.isOneToOne ? 80 : 32;
	const rootId = keyboard.getRootId();
	const workspace = S.Detail.get(S.Block.workspace, S.Block.workspace, [ 'chatId' ]);
	const chatId = workspace.chatId;

	const icon = (
		<IconObject
			size={iconSize}
			iconSize={iconSize}
			object={spaceview}
			onClick={() => U.Space.openDashboard()}
		/>
	);

	let buttons = [];
	if (spaceview.isOneToOne) {
		[
			canWrite ? {
				id: 'create',
				iconName: 'menu/action/createObject',
				name: translate('commonCreate'),
				withArrow: true,
				arrowTooltipParam: {
					text: translate('popupShortcutMainBasics19'),
					caption: keyboard.getCaption('selectType'),
					typeY: I.MenuDirection.Bottom as any,
				},
			} : null,
			{ id: 'search', iconName: 'common/search', name: translate('commonSearch') },
			{ id: 'chat', iconName: 'widget/button/chat', name: translate('commonMainChat') },
		];
	};
	buttons = buttons.filter(it => it);

	const onButtonClick = (e: MouseEvent, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		switch (item.id) {
			case 'search': {
				keyboard.onSearchPopup(route);
				break;
			};

			case 'create': {
				keyboard.pageCreate({}, route, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
				break;
			};

			case 'chat': {
				U.Object.openRoute({ id: S.Block.workspace, layout: I.ObjectLayout.Chat });
				break;
			};
		};
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

	let content = null;
	if (spaceview.isOneToOne) {
		content = (
			<div className="spaceInfo">
				{icon}
				<div className="nameWrap" onClick={onMore}>
					<ObjectName object={spaceview} />
					<Icon name="arrow/button" size={8} color="default" />
				</div>

				<MemberCnt route={route} />
			</div>
		);
	} else {
		content = (
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
									onClick={e => onButtonClick(e, { id: 'create' })}
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
		);
	};

	return (
		<div ref={nodeRef} className={cn.join(' ')}>
			{content}
			{buttons.length ? (
				<div className="buttons">
					{buttons.map((item, idx) => {
						const cn = [ 'item' ];

						if ((item.id == 'chat') && (rootId == S.Block.workspace)) {
							cn.push('active');
						};

						return (
							<div className={cn.join(' ')} onClick={e => onButtonClick(e, item)} key={idx}>
								<Icon name={item.iconName} className={item.id} />
								<Label text={item.name} />
								{item.id == 'chat' ? <ChatCounter chatId={chatId} /> : ''}
								{item.withArrow ? (
									<Icon
										id={`button-${item.id}-arrow`}
										name="arrow/button"
										size={8} 
										withBackground={true}
										onClick={onArrow}
										tooltipParam={item.arrowTooltipParam}
									/>
								) : ''}
							</div>
						);
					})}
				</div>
			) : ''}
		</div>
	);

});

export default WidgetSpace;
