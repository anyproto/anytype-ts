import * as React from 'react';
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

const Page = observer(class Page extends React.Component<I.PageComponent> {

	_isMounted = false;
	refChild: any = null;
	frame = 0;

	render () {
		const { isPopup } = this.props;
		const { config, theme } = S.Common;
		const { showMenuBar } = config;
		const { account } = S.Auth;
		const { page, action } = this.getMatchParams();
		const path = [ page, action ].join('/');
		const isMain = this.isMain();
		const Component = Components[path];
		const namespace = U.Common.getEventNamespace(isPopup);

		if (account) {
			const { status } = account || {};
			const { type } = status || {};
		};

		if (isMain && !account) {
			return null;
		};

		return (
			<div 
				id="pageFlex" 
				className={[ 'pageFlex', U.Common.getContainerClassName(isPopup) ].join(' ')}
			>
				{!isPopup ? <div id="sidebarDummyLeft" className="sidebarDummy" /> : ''}
				<div id="page" className={`page ${this.getClass('page')}`}>
					{Component ? (
						<Component ref={ref => this.refChild = ref} {...this.props} />
					) : (
						<Frame>
							<Label text={U.Common.sprintf(translate('pageMainIndexComponentNotFound'), path)} />
						</Frame>
					)}
				</div>
				<SidebarRight 
					ref={ref => S.Common.refSet(`sidebarRight${namespace}`, ref)} 
					key="sidebarRight" 
					{...this.props} 
				/>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.init();
	};

	componentDidUpdate () {
		this.init();
	};
	
	componentWillUnmount () {
		const { isPopup } = this.props;

		this._isMounted = false;
		this.unbind();

		if (!isPopup) {
			S.Popup.closeAll();
		};

		S.Menu.closeAll();
		Preview.tooltipHide(true);
		Preview.previewHide(true);
	};

	getMatchParams () {
		const { isPopup } = this.props;
		const match = keyboard.getMatch(isPopup);

		match.params.page = String(match.params.page || 'index');
		match.params.action = String(match.params.action || 'index');
		match.params.id = String(match.params.id || '');
		match.params.spaceId = String(match.params.spaceId || '');

		return match.params;
	};

	getRootId () {
		const { id } = this.getMatchParams();
		const home = U.Space.getDashboard();

		return id || home?.id;
	};

	init () {
		const { account } = S.Auth;
		const { pin } = S.Common;
		const { isPopup } = this.props;
		const rightSidebar = S.Common.getRightSidebarState(isPopup);
		const { page, action } = this.getMatchParams();
		const isIndex = this.isIndex();
		const isAuth = this.isAuth();
		const isMain = this.isMain();
		const isPinCheck = this.isAuthPinCheck();
		const path = [ page, action ].join('/');
		const Component = Components[path];
		const routeParam = { replace: true };
		const refSidebar = sidebar.rightPanelRef(isPopup);
		const state = S.Common.getRightSidebarState(isPopup);
		const selection = S.Common.getRef('selectionProvider');

		Preview.tooltipHide(true);
		Preview.previewHide(true);
		keyboard.setWindowTitle();
		selection?.rebind();

		if (!Component) {
			return;
		};

		if (isMain && !account) {
			U.Router.go('/', routeParam);
			return;
		};

		if (pin && !keyboard.isPinChecked && !isPinCheck && !isAuth && !isIndex) {
			U.Router.go('/auth/pin-check', routeParam);
			return;
		};

		if (isMain && (S.Auth.accountIsDeleted() || S.Auth.accountIsPending())) {
			U.Router.go('/auth/deleted', routeParam);
			return;
		};

		if (refSidebar && rightSidebar.isOpen) {
			refSidebar.setState({ rootId: this.getRootId(), page: state.page });
		};

		this.setBodyClass();
		this.resize();
		this.event();
		this.rebind();

		Onboarding.start(U.Common.toCamelCase([ page, action ].join('-')), isPopup);
		Highlight.showAll();
	};

	rebind () {
		const { isPopup } = this.props;
		const { history } = U.Router;
		const ns = U.Common.getEventNamespace(isPopup);
		const key = String(history?.location?.key || '');

		this.unbind();
		$(window).on(`resize.page${ns}${key}`, () => this.resize());
	};

	unbind () {
		const { isPopup } = this.props;
		const { history } = U.Router;
		const ns = U.Common.getEventNamespace(isPopup);
		const key = String(history?.location?.key || '');

		$(window).off(`resize.page${ns}${key}`);
	};

	event () {
		analytics.event('page', { params: this.getMatchParams() });
	};

	isIndex () {
		const { page } = this.getMatchParams();
		return page == 'index';
	};

	isAuth () {
		const { page } = this.getMatchParams();
		return page == 'auth';
	};

	isAuthPinCheck () {
		const { action } = this.getMatchParams();
		return this.isAuth() && (action == 'pin-check');
	};

	isMain () {
		const { page } = this.getMatchParams();
		return page == 'main';
	};

	isMainIndex () {
		const { action } = this.getMatchParams();
		return this.isMain() && (action == 'index');
	};

	isMainType () {
		const { action } = this.getMatchParams();
		return this.isMain() && (action == 'type');
	};

	isMainRelation () {
		const { action } = this.getMatchParams();
		return this.isMain() && (action == 'relation');
	};

	getClass (prefix: string) {
		const { isPopup } = this.props;
		const { page, action, id } = this.getMatchParams();
		
		return [ 
			U.Common.toCamelCase([ prefix, page ].join('-')),
			U.Common.toCamelCase([ prefix, page, action, id ].join('-')),
			this.getId(prefix),
			U.Common.getContainerClassName(isPopup),
		].join(' ');
	};
	
	setBodyClass () {
		const { isPopup } = this.props;
	
		if (isPopup) {
			return;
		};

		const { config } = S.Common;
		const { showMenuBar } = config;
		const platform = U.Common.getPlatform();
		const cn = [ 
			this.getClass('body'), 
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

	getId (prefix: string) {
		const { isPopup } = this.props;
		const match = keyboard.getMatch(isPopup);
		const page = match.params.page || 'index';
		const action = match.params.action || 'index';

		return U.Common.toCamelCase([ prefix, page, action ].join('-'));
	};

	storageGet () {
		return Storage.get(this.getId('page')) || {};
	};

	storageSet (data) {
		Storage.set(this.getId('page'), data);
	};
	
	resize () {
		if (this.frame) {
			raf.cancel(this.frame);
			this.frame = 0;
		};

		this.frame = raf(() => {
			if (!this._isMounted) {
				return;
			};

			if (this.refChild && this.refChild.resize) {
				this.refChild.resize();			
			};

			sidebar.resizePage(null, null, false);
		});
	};
	
});

export default Page;
