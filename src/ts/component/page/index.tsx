import React, { forwardRef, useRef, useEffect, useLayoutEffect } from 'react';
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
import PageMainOneToOne from './main/oneToOne';
import PageMainMembership from './main/membership';
import PageMainObject from './main/object';
import PageMainChat from './main/chat';
import PageMainDate from './main/date';
import PageMainSettings from './main/settings';

const Components = {
	'index/index':			 PageMainBlank,

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
	'main/oneToOne':		 PageMainOneToOne,
	'main/membership':		 PageMainMembership,
	'main/object':			 PageMainObject,
	'main/chat':			 PageMainChat,
	'main/void':			 PageMainVoid,
	'main/date':			 PageMainDate,
	'main/settings':		 PageMainSettings,
};

const PageIndex = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const { account } = S.Auth;
	const { isFullScreen, singleTab, vaultIsMinimal } = S.Common;
	const ns = U.Common.getEventNamespace(isPopup);
	const childRef = useRef(null);
	const match = keyboard.getMatch(isPopup);
	const { page, action, id } = match.params;
	const isMain = page == 'main';
	const isAuth = page == 'auth';
	const isAuthPinCheck = isAuth && (action == 'pin-check');
	const isIndex = page == 'index';

	const getId = (prefix: string) => {
		return U.String.toCamelCase([ prefix, page, action ].join('-'));
	};

	const pageId = getId('page');
	const path = [ page, action ].join('/');
	const Component = Components[path];

	if (account) {
		const { status } = account || {};
		const { type } = status || {};
	};

	const init = () => {
		const { account } = S.Auth;
		const { pin } = S.Common;
		const path = [ page, action ].join('/');
		const Component = Components[path];
		const selection = S.Common.getRef('selectionProvider');

		Preview.tooltipHide(true);
		Preview.previewHide(true);
		keyboard.setWindowTitle();
		selection?.rebind();

		if (!Component) {
			return;
		};

		if (isMain && !account) {
			U.Router.go('/auth/select', { replace: true });
			return;
		};

		if (pin && !keyboard.isPinChecked && !isAuthPinCheck && !isAuth && !isIndex) {
			U.Router.go('/auth/pin-check', {});
			return;
		};

		if (isMain && (S.Auth.accountIsDeleted() || S.Auth.accountIsPending())) {
			U.Router.go('/auth/deleted', { replace: true });
			return;
		};

		if (!isPopup) {
			keyboard.setBodyClass();
		};

		rebind();
		Onboarding.start(U.String.toCamelCase([ page, action ].join('-')), isPopup);
		Highlight.showAll();

		analytics.event('page', { params: match.params });
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

	const resize = () => {
		childRef.current?.resize?.();
		sidebar.resizePage(isPopup, null, null, false);
	};

	useEffect(() => {
		init();
		resize();

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

	useEffect(() => init(), [ match.params ]);

	useLayoutEffect(() => {
		raf(() => resize());
	}, [ match.params ]);

	if (isMain && !account) {
		return null;
	};

	return (
		<div 
			id="pageFlex" 
			className={[ 'pageFlex', U.Common.getContainerClassName(isPopup) ].join(' ')}
		>
			{!isPopup ? <div id="sidebarDummyLeft" className="sidebarDummy" /> : ''}
			<div 
				id="page" 
				className={`page ${keyboard.getPageClass('page', isPopup)}`}
			>
				{Component ? (
					<Component 
						ref={childRef} 
						{...props}
						storageGet={() => Storage.get(pageId) || {}}
						storageSet={data => Storage.set(pageId, data)}
					/>
				) : (
					<Frame>
						<Label text={U.String.sprintf(translate('pageMainIndexComponentNotFound'), path)} />
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
