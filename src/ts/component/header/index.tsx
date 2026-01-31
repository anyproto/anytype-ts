import React, { forwardRef, useRef, useEffect, useImperativeHandle, useLayoutEffect } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { I, S, U, J, Renderer, keyboard, sidebar, Preview, translate } from 'Lib';
import { Icon } from 'Component';
import { observer } from 'mobx-react';

import HeaderAuthIndex from './auth';
import HeaderMainObject from './main/object';
import HeaderMainChat from './main/chat';
import HeaderMainHistory from './main/history';
import HeaderMainGraph from './main/graph';
import HeaderMainNavigation from './main/navigation';
import HeaderMainSettings from './main/settings';
import HeaderMainEmpty from './main/empty';

interface Props extends I.HeaderComponent {
	component: string;
	className?: string;
	onBack?: () => void;
};

const Components = {
	authIndex:			 HeaderAuthIndex,
	mainObject:			 HeaderMainObject,
	mainChat:			 HeaderMainChat,
	mainHistory:		 HeaderMainHistory,
	mainGraph:			 HeaderMainGraph,
	mainNavigation:		 HeaderMainNavigation,
	mainEmpty:			 HeaderMainEmpty,
	mainSettings: 		 HeaderMainSettings,
};

const Header = observer(forwardRef<{}, Props>((props, ref) => {

	const { 
		component, 
		className = '', 
		withBanner = false, 
		rootId = '', 
		tab = '', 
		tabs = [], 
		layout = I.ObjectLayout.Page,
		isPopup = false,
		onTab,
	} = props;

	const nodeRef = useRef(null);
	const childRef = useRef(null);
	const Component = Components[component] || null;
	const cn = [ 'header', component, className ];
	const object = S.Detail.get(rootId, rootId, []);
	const resizeObserver = new ResizeObserver(() => {
		raf(() => resize());
	});

	if (![ 'authIndex' ].includes(component)) {
		cn.push('isCommon');
	};

	if (withBanner) {
		cn.push('withBanner');
	};

	const onGraph = (e: any) => {
		e.stopPropagation();
		U.Object.openAuto({ id: keyboard.getRootId(), layout: I.ObjectLayout.Graph });
	};

	const renderLeftIcons = (withNavigation?: boolean, withGraph?: boolean, onOpen?: () => void) => {
		const { status } = S.Auth.getSyncStatus(S.Common.space);
		const { isClosed } = sidebar.getData(I.SidebarPanel.SubLeft);

		let bullet = null;
		if (isClosed && [ I.SyncStatusSpace.Error, I.SyncStatusSpace.Upgrade ].includes(status)) {
			bullet = <div className="bullet" />;
		};

		const cnb = [ 'back', 'withBackground', (!keyboard.checkBack(isPopup) ? 'disabled' : '') ];
		const cnf = [ 'forward', 'withBackground', (!keyboard.checkForward(isPopup) ? 'disabled' : '') ];

		return (
			<>
				<Icon
					className="vaultToggle withBackground"
					onClick={() => sidebar.leftPanelToggle()}
					tooltipParam={{
						text: translate('commonVault'),
						typeY: I.MenuDirection.Bottom,
					}}
				/>
				<Icon 
					className="widgetPanel withBackground" 
					onClick={() => sidebar.leftPanelSubPageToggle('widget')}
					inner={bullet}
					tooltipParam={{ 
						text: translate('commonWidgets'), 
						caption: keyboard.getCaption('widget'), 
						typeY: I.MenuDirection.Bottom,
					}}
				/>
				<Icon 
					className="expand withBackground" 
					onClick={onOpen || onExpand}
					tooltipParam={{ 
						text: translate('commonOpenObject'), 
						typeY: I.MenuDirection.Bottom,
					}}
				/>

				{withNavigation ? (
					<div className="arrowWrapper">
						<Icon 
							className={cnb.join(' ')} 
							onClick={() => keyboard.onBack(isPopup)}
							tooltipParam={{ 
								text: translate('commonBack'), 
								caption: keyboard.getCaption('back'), 
								typeY: I.MenuDirection.Bottom,
							}}
						/>
						<Icon 
							className={cnf.join(' ')} 
							onClick={() => keyboard.onForward(isPopup)}
							tooltipParam={{ 
								text: translate('commonForward'), 
								caption: keyboard.getCaption('forward'), 
								typeY: I.MenuDirection.Bottom,
							}}
						/>
					</div>
				) : ''}

				{withGraph ? (
					<Icon 
						className="graph withBackground" 
						onClick={onGraph}
						tooltipParam={{ 
							text: translate('commonGraph'), 
							caption: keyboard.getCaption('graph'), 
							typeY: I.MenuDirection.Bottom,
						}}
					/>
				) : ''}
			</>
		);
	};

	const renderTabs = () => {
		return (
			<div id="tabs" className="tabs">
				{tabs.map((item: any, i: number) => (
					<div 
						key={i}
						className={[ 'tab', (item.id == tab ? 'active' : '') ].join(' ')} 
						onClick={() => onTab(item.id)}
						onMouseOver={e => onTooltipShow(e, item.tooltip, item.tooltipCaption)} 
						onMouseOut={onTooltipHide}
					>
						{item.name}
					</div>
				))}
			</div>
		);
	};

	const onExpand = () => {
		S.Popup.closeAll(null, () => U.Object.openRoute({ id: rootId, layout }));
	};

	const onSearch = () => {
		keyboard.onSearchPopup('Header');
	};

	const onTooltipShow = (e: any, text: string, caption?: string) => {
		const t = Preview.tooltipCaption(text, caption);
		if (t) {
			Preview.tooltipShow({ text: t, element: $(e.currentTarget), typeY: I.MenuDirection.Bottom });
		};
	};

	const onTooltipHide = () => {
		Preview.tooltipHide(false);
	};

	const onDoubleClick = () => {
		if (U.Common.isPlatformMac()) {
			Renderer.send('winCommand', 'maximize');
		};
	};

	const menuOpen = (id: string, elementId: string, param: Partial<I.MenuParam>) => {
		const element = U.Common.getScrollContainer(isPopup).find(`.header ${elementId}`);
		const menuParam: any = Object.assign({
			element,
			offsetY: 4,
		}, param);

		if (!isPopup) {
			menuParam.className = 'fixed';
			menuParam.classNameWrap = 'fromHeader';
		};

		S.Menu.closeAllForced(null, () => S.Menu.open(id, menuParam));
	};

	const resize = () => {
		const node = $(nodeRef.current);
		const center = node.find('.side.center');

		node.toggleClass('isSmall', center.outerWidth() <= 200);
	};

	useEffect(() => {
		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};

		resize();

		return () => {
			if (nodeRef.current) {
				resizeObserver.disconnect();
			};
		};
	}, []);

	useLayoutEffect(() => {
		raf(() => sidebar.resizePage(isPopup, null, null, false));
	}, [ object ]);

	useImperativeHandle(ref, () => ({
		setVersion: (version: string) => {
			if (childRef.current && childRef.current.setVersion) {
				childRef.current.setVersion(version);
			};
		},

		forceUpdate: () => {
			if (childRef.current && childRef.current.forceUpdate) {
				childRef.current?.forceUpdate();
			};
		},
	}));

	return (
		<div 
			id="header" 
			ref={nodeRef}
			className={cn.join(' ')}
			onDoubleClick={onDoubleClick}
		>
			{Component ? (
				<Component 
					ref={childRef} 
					{...props} 
					onSearch={onSearch}
					onTooltipShow={onTooltipShow}
					onTooltipHide={onTooltipHide}
					menuOpen={menuOpen}
					renderLeftIcons={renderLeftIcons}
					renderTabs={renderTabs}
				/>
			) : ''}
		</div>
	);

}));

export default Header;
