import React, { forwardRef, useRef, useEffect, useImperativeHandle, useLayoutEffect } from 'react';
import raf from 'raf';
import { Icon } from 'Component';

import HeaderAuthIndex from './auth';
import HeaderAuthLogout from './auth/logout';
import HeaderMainObject from './main/object';
import HeaderMainChat from './main/chat';
import HeaderMainHistory from './main/history';
import HeaderMainGraph from './main/graph';
import HeaderMainNavigation from './main/navigation';
import HeaderMainSettings from './main/settings';
import HeaderMainEmpty from './main/empty';
import HeaderMainArchive from './main/archive';
import * as I from 'Interface';

interface Props extends I.HeaderComponent {
	component: string;
	className?: string;
	onBack?: () => void;
};

const Components = {
	authIndex:			 HeaderAuthIndex,
	authLogout:			 HeaderAuthLogout,
	mainObject:			 HeaderMainObject,
	mainChat:			 HeaderMainChat,
	mainHistory:		 HeaderMainHistory,
	mainGraph:			 HeaderMainGraph,
	mainNavigation:		 HeaderMainNavigation,
	mainEmpty:			 HeaderMainEmpty,
	mainArchive:		 HeaderMainArchive,
	mainSettings: 		 HeaderMainSettings,
};

const Header = forwardRef<{}, Props>((props, ref) => {

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

	const onRecentlyOpen = () => {
		S.Menu.open('searchObject', {
			className: 'single fixed widthValue',
			classNameWrap: 'fromHeader',
			element: '#button-recently-open',
			offsetY: 4,
			data: {
				limit: 15,
				noFilter: true,
				noInfiniteLoading: true,
				label: translate('widgetRecentOpen'),
				withPlural: true,
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts().filter(it => !U.Object.isTypeLayout(it)).concat(I.ObjectLayout.Participant) },
					{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template ] },
					{ relationKey: 'lastOpenedDate', condition: I.FilterCondition.Greater, value: 0 },
				],
				sorts: [
					{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
				],
				onSelect: (el: any) => {
					U.Object.openConfig(null, el);
				},
			}
		});

		analytics.event('ClickRecentlyOpen');
	};

	const renderLeftIcons = (withNavigation?: boolean, withGraph?: boolean, onOpen?: () => void) => {
		const { status } = S.Auth.getSyncStatus(S.Common.space);
		const { isClosed } = sidebar.getData(I.SidebarPanel.SubLeft);

		let bullet = null;
		if (isClosed && [ I.SyncStatusSpace.Error, I.SyncStatusSpace.Upgrade ].includes(status)) {
			bullet = <div className="bullet" />;
		};

		return (
			<>
				<Icon
					name="widget/vaultToggle" className="vaultToggle" withBackground={true}
					onClick={() => sidebar.leftPanelToggle(true, true)}
					tooltipParam={{
						text: translate('commonVault'),
						typeY: I.MenuDirection.Bottom,
					}}
				/>
				<Icon
					name="header/widget" withBackground={true}
					onClick={() => sidebar.leftPanelSubPageToggle('widget', true, true)}
					inner={bullet}
					tooltipParam={{
						text: translate('commonWidgets'),
						caption: keyboard.getCaption('widget'),
						typeY: I.MenuDirection.Bottom,
					}}
				/>
				<Icon
					name="common/expand" withBackground={true}
					onClick={onOpen || onExpand}
					tooltipParam={{
						text: translate('commonOpenObject'),
						typeY: I.MenuDirection.Bottom,
					}}
				/>

				{withNavigation ? (
					<div className="arrowWrapper">
						<Icon
							name="common/back" className={!keyboard.checkBack(isPopup) ? 'disabled' : ''} withBackground={true}
							onClick={() => keyboard.onBack(isPopup)}
							tooltipParam={{
								text: translate('commonBack'),
								caption: keyboard.getCaption('back'),
								typeY: I.MenuDirection.Bottom,
							}}
						/>
						<Icon
							name="common/back" className={[ 'forward', (!keyboard.checkForward(isPopup) ? 'disabled' : '') ].join(' ')} withBackground={true}
							onClick={() => keyboard.onForward(isPopup)}
							tooltipParam={{
								text: translate('commonForward'),
								caption: keyboard.getCaption('forward'),
								typeY: I.MenuDirection.Bottom,
							}}
						/>
					</div>
				) : ''}

				<Icon
					id="button-recently-open"
					name="common/clock" withBackground={true}
					onClick={onRecentlyOpen}
					tooltipParam={{
						text: translate('widgetRecentOpen'),
						typeY: I.MenuDirection.Bottom,
					}}
				/>

				{withGraph ? (
					<Icon
						name="header/graph" withBackground={true}
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
						onMouseEnter={e => onTooltipShow(e, item.tooltip, item.tooltipCaption)}
						onMouseLeave={onTooltipHide}
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
			Preview.tooltipShow({ text: t, element: e.currentTarget as HTMLElement, typeY: I.MenuDirection.Bottom });
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
		const container = U.Dom.getScrollContainer(isPopup);
		const element = U.Dom.select(`.header ${elementId}`, container);
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
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const center = U.Dom.select('.side.center', node);
		U.Dom.toggleClass(node, 'isSmall', (center?.offsetWidth ?? 0) <= 200);
	};

	useEffect(() => {
		const resizeObserver = new ResizeObserver(() => {
			raf(() => resize());
		});

		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};

		resize();

		return () => {
			resizeObserver.disconnect();
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

});

export default Header;
