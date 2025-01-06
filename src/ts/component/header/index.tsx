import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { I, S, U, J, Renderer, keyboard, sidebar, Preview, translate } from 'Lib';
import { Icon, Sync } from 'Component';

import HeaderAuthIndex from './auth';
import HeaderMainObject from './main/object';
import HeaderMainChat from './main/chat';
import HeaderMainHistory from './main/history';
import HeaderMainGraph from './main/graph';
import HeaderMainNavigation from './main/navigation';
import HeaderMainEmpty from './main/empty';

interface Props extends I.HeaderComponent {
	component: string;
	className?: string;
};

const Components = {
	authIndex:			 HeaderAuthIndex,
	mainObject:			 HeaderMainObject,
	mainChat:			 HeaderMainChat,
	mainHistory:		 HeaderMainHistory,
	mainGraph:			 HeaderMainGraph,
	mainNavigation:		 HeaderMainNavigation,
	mainEmpty:			 HeaderMainEmpty,
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

	const childRef = useRef(null);
	const Component = Components[component] || null;
	const cn = [ 'header', component, className ];

	if (![ 'authIndex' ].includes(component)) {
		cn.push('isCommon');
	};

	if (withBanner) {
		cn.push('withBanner');
	};

	const renderLeftIcons = (onOpen?: () => void) => {
		const object = S.Detail.get(rootId, rootId, J.Relation.template);
		const isTypeOrRelation = U.Object.isTypeOrRelationLayout(object.layout);
		const showMenu = !isTypeOrRelation;
		const canSync = showMenu && !object.templateIsBundled && !U.Object.isParticipantLayout(object.layout);

		return (
			<>
				<Icon 
					className="expand withBackground" 
					tooltip={translate('commonOpenObject')} 
					onClick={onOpen || onExpand} 
				/>
				{canSync ? <Sync id="button-header-sync" onClick={onSync} /> : ''}
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
		const st = $(window).scrollTop();
		const element = $(`${getContainer()} ${elementId}`);
		const menuParam: any = Object.assign({
			element,
			offsetY: 4,
		}, param);

		if (!isPopup) {
			menuParam.fixedY = element.offset().top + element.height() - st + 4;
			menuParam.classNameWrap = 'fixed fromHeader';
		};

		S.Menu.closeAllForced(null, () => S.Menu.open(id, menuParam));
	};

	const onRelation = (param?: Partial<I.MenuParam>, data?: any) => {
		param = param || {};
		data = data || {};

		const cnw = [ 'fixed' ];

		if (!isPopup) {
			cnw.push('fromHeader');
		};

		menuOpen('blockRelationView', '#button-header-relation', {
			noFlipX: true,
			noFlipY: true,
			horizontal: I.MenuDirection.Right,
			subIds: J.Menu.cell,
			classNameWrap: cnw.join(' '),
			...param,
			data: {
				isPopup,
				rootId,
				...data,
			},
		});
	};

	const onSync = () => {
		menuOpen('syncStatus', '#button-header-sync', {
			subIds: [ 'syncStatusInfo' ],
			data: {
				rootId,
			}
		});
	};

	const getContainer = () => {
		return (isPopup ? '.popup' : '') + ' .header';
	};

	useEffect(() => {
		sidebar.resizePage(null, false);
	});

	useImperativeHandle(ref, () => ({
		setVersion: (version: string) => {
			if (childRef.current && childRef.current.setVersion) {
				childRef.current.setVersion(version);
			};
		},

		forceUpdate: () => {
			if (childRef.current && childRef.current.forceUpdate) {
				childRef.current.forceUpdate();
			};
		},
	}));

	return (
		<div 
			id="header" 
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
					onRelation={onRelation}
				/>
			) : ''}
		</div>
	);

});

export default Header;