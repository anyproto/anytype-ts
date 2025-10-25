import React, { forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Label, Frame, SidebarRight } from 'Component';
import { I, S, U, J, Onboarding, Storage, analytics, keyboard, sidebar, Preview, Highlight, translate } from 'Lib';

import PageAuthSelect from './auth/select';
import PageAuthLogin from './auth/login';
import PageAuthPinCheck from './auth/pinCheck';
import PageAuthSetup from './auth/setup';
import PageAuthOnboard from './auth/onboard';
import PageAuthDeleted from './auth/deleted';
import PageAuthMigrate from './auth/migrate';

import PageMainBlank from './main/blank';
import PageMainVoid from './main/void';
import PageMainEdit from './main/edit';
import PageMainHistory from './main/history';
import PageMainSet from './main/set';
import PageMainMedia from './main/media';
import PageMainRelation from './main/relation';
import PageMainGraph from './main/graph';
import PageMainNavigation from './main/navigation';
import PageMainArchive from './main/archive';
import PageMainImport from './main/import';
import PageMainInvite from './main/invite';
import PageMainMembership from './main/membership';
import PageMainObject from './main/object';
import PageMainChat from './main/chat';
import PageMainDate from './main/date';
import PageMainSettings from './main/settings';

const Components = {
	'index/index':			 PageAuthSelect,

	'auth/select':			 PageAuthSelect,
	'auth/login':			 PageAuthLogin,
	'auth/pin-check':		 PageAuthPinCheck,
	'auth/setup':			 PageAuthSetup,
	'auth/onboard':			 PageAuthOnboard,
	'auth/deleted':			 PageAuthDeleted,
	'auth/migrate':			 PageAuthMigrate,

	'main/blank':			 PageMainBlank,
	'main/edit':			 PageMainEdit,
	'main/history':			 PageMainHistory,
	'main/set':				 PageMainSet,
	'main/media':			 PageMainMedia,
	'main/relation':		 PageMainRelation,
	'main/graph':			 PageMainGraph,
	'main/navigation':		 PageMainNavigation,
	'main/archive':			 PageMainArchive,
	'main/import':			 PageMainImport,
	'main/invite':			 PageMainInvite,
	'main/membership':		 PageMainMembership,
	'main/object':			 PageMainObject,
	'main/chat':			 PageMainChat,
	'main/void':			 PageMainVoid,
	'main/date':			 PageMainDate,
	'main/settings':		 PageMainSettings,
};

const PageIndex = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const { config, theme } = S.Common;
	const { showMenuBar } = config;
	const { account } = S.Auth;
	const ns = U.Common.getEventNamespace(isPopup);
	const childRef = useRef(null);
	const platform = U.Common.getPlatform();

	const getMatchParams = () => {
		const match = U.Common.objectCopy(keyboard.getMatch(isPopup));

		match.params.page = String(match.params.page || 'index');
		match.params.action = String(match.params.action || 'index');
		match.params.id = String(match.params.id || '');
		match.params.spaceId = String(match.params.spaceId || '');

		return match.params;
	};

	const { id, page, action } = getMatchParams();

	const getId = (prefix: string) => {
		return U.Common.toCamelCase([ prefix, page, action ].join('-'));
	};

	const pageId = getId('page');
	const path = [ page, action ].join('/');
	const Component = Components[path];

	if (account) {
		const { status } = account || {};
		const { type } = status || {};
	};

	const getRootId = () => {
		const home = U.Space.getDashboard();

		return id || home?.id;
	};

	const init = () => {
		const { account } = S.Auth;
		const { pin } = S.Common;
		const path = [ page, action ].join('/');
		const Component = Components[path];
		const routeParam = { replace: true };
		const data = sidebar.getData(I.SidebarPanel.Right, isPopup);
		const state = S.Common.getRightSidebarState(isPopup);
		const selection = S.Common.getRef('selectionProvider');

		Preview.tooltipHide(true);
		Preview.previewHide(true);
		keyboard.setWindowTitle();
		selection?.rebind();

		if (!Component) {
			return;
		};

		if (isMain() && !account) {
			U.Router.go('/', routeParam);
			return;
		};

		if (pin && !keyboard.isPinChecked && !isAuthPinCheck() && !isAuth() && !isIndex()) {
			U.Router.go('/auth/pin-check', routeParam);
			return;
		};

		if (isMain() && (S.Auth.accountIsDeleted() || S.Auth.accountIsPending())) {
			U.Router.go('/auth/deleted', routeParam);
			return;
		};

		if (!data.isClosed) {
			sidebar.rightPanelSetState(isPopup, { rootId: getRootId(), page: state.page });
		};

		setBodyClass();
		resize();
		rebind();

		Onboarding.start(U.Common.toCamelCase([ page, action ].join('-')), isPopup);
		Highlight.showAll();

		analytics.event('page', { params: getMatchParams() });
	};

	const rebind = () => {
		const { history } = U.Router;
		const ns = U.Common.getEventNamespace(isPopup);
		const key = String(history?.location?.key || '');

		unbind();
		$(window).on(`resize.page${ns}${key}`, () => resize());
	};

	const unbind = () => {
		const { history } = U.Router;
		const key = String(history?.location?.key || '');

		$(window).off(`resize.page${ns}${key}`);
	};

	const isIndex = () => {
		return page == 'index';
	};

	const isAuth = () => {
		return page == 'auth';
	};

	const isAuthPinCheck = () => {
		return isAuth() && (action == 'pin-check');
	};

	const isMain = () => {
		return page == 'main';
	};

	const getClass = (prefix: string) => {
		return [ 
			U.Common.toCamelCase([ prefix, page ].join('-')),
			U.Common.toCamelCase([ prefix, page, action, id ].join('-')),
			getId(prefix),
			U.Common.getContainerClassName(isPopup),
		].join(' ');
	};
	
	const setBodyClass = () => {
		const { isPopup } = props;
	
		if (isPopup) {
			return;
		};

		const cn = [ 
			getClass('body'), 
			U.Common.toCamelCase([ 'platform', platform ].join('-')),
		];
		const obj = $('html');

		if (config.debug.ui) {
			cn.push('debug');
		};
		if (!showMenuBar) {
			cn.push('noMenuBar');
		};

		obj.attr({ class: cn.join(' ') });
		S.Common.setThemeClass();
	};

	const resize = () => {
		childRef.current?.resize?.();
		sidebar.resizePage(isPopup, null, null, false);
	};

	useEffect(() => {
		init();

		return () => {
			unbind();

			if (!isPopup) {
				S.Popup.closeAll();
			};

			S.Menu.closeAll();
			Preview.tooltipHide(true);
			Preview.previewHide(true);
		};
	}, []);

	useEffect(() => init());

	if (isMain() && !account) {
		return null;
	};

	return (
		<div 
			id="pageFlex" 
			className={[ 'pageFlex', U.Common.getContainerClassName(isPopup) ].join(' ')}
		>
			{!isPopup ? <div id="sidebarDummyLeft" className="sidebarDummy" /> : ''}
			<div id="page" className={`page ${getClass('page')}`}>
				{Component ? (
					<Component 
						ref={childRef} 
						{...props}
						storageGet={() => Storage.get(pageId) || {}}
						storageSet={data => Storage.set(pageId, data)}
					/>
				) : (
					<Frame>
						<Label text={U.Common.sprintf(translate('pageMainIndexComponentNotFound'), path)} />
					</Frame>
				)}
			</div>
			<SidebarRight 
				ref={ref => S.Common.refSet(`sidebarRight${ns}`, ref)} 
				key="sidebarRight" 
				{...props} 
			/>
		</div>
	);
	
}));

export default PageIndex;