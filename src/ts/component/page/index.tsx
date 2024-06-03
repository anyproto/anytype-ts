import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { I, Onboarding, UtilCommon, Storage, analytics, keyboard, sidebar, Survey, Preview, Highlight, UtilSpace, translate, UtilRouter } from 'Lib';
import { Sidebar, Label, Frame } from 'Component';
import { authStore, commonStore, menuStore, popupStore } from 'Store';
const Constant = require('json/constant.json');

import PageAuthSelect from './auth/select';
import PageAuthLogin from './auth/login';
import PageAuthPinCheck from './auth/pinCheck';
import PageAuthSetup from './auth/setup';
import PageAuthOnboard from './auth/onboard';
import PageAuthDeleted from './auth/deleted';

import PageMainBlank from './main/blank';
import PageMainEmpty from './main/empty';
import PageMainEdit from './main/edit';
import PageMainHistory from './main/history';
import PageMainSet from './main/set';
import PageMainType from './main/type';
import PageMainMedia from './main/media';
import PageMainRelation from './main/relation';
import PageMainStore from './main/store';
import PageMainGraph from './main/graph';
import PageMainNavigation from './main/navigation';
import PageMainCreate from './main/create';
import PageMainArchive from './main/archive';
import PageMainBlock from './main/block';
import PageMainImport from './main/import';
import PageMainInvite from './main/invite';
import PageMainMembership from './main/membership';
import PageMainObject from './main/object';

const Components = {
	'index/index':			 PageAuthSelect,

	'auth/select':			 PageAuthSelect,
	'auth/login':			 PageAuthLogin,
	'auth/pin-check':		 PageAuthPinCheck,
	'auth/setup':			 PageAuthSetup,
	'auth/onboard':			 PageAuthOnboard,
	'auth/deleted':			 PageAuthDeleted,

	'main/blank':			 PageMainBlank,		
	'main/empty':			 PageMainEmpty,		
	'main/edit':			 PageMainEdit,
	'main/history':			 PageMainHistory,
	'main/set':				 PageMainSet,
	'main/type':			 PageMainType,
	'main/media':			 PageMainMedia,
	'main/relation':		 PageMainRelation,
	'main/store':			 PageMainStore,
	'main/graph':			 PageMainGraph,
	'main/navigation':		 PageMainNavigation,
	'main/create':			 PageMainCreate,
	'main/archive':			 PageMainArchive,
	'main/block':			 PageMainBlock,
	'main/import':			 PageMainImport,
	'main/invite':			 PageMainInvite,
	'main/membership':		 PageMainMembership,
	'main/object':			 PageMainObject,
};

const Page = observer(class Page extends React.Component<I.PageComponent> {

	_isMounted = false;
	refChild: any = null;
	frame = 0;

	render () {
		const { isPopup } = this.props;
		const { config, theme } = commonStore;
		const { account } = authStore;
		const { page, action } = this.getMatchParams();
		const path = [ page, action ].join('/');
		const isMain = this.isMain();
		const showSidebar = isMain;

		if (account) {
			const { status } = account || {};
			const { type } = status || {};
		};

		if (isMain && !account) {
			return null;
		};

		const Component = Components[path];
		if (!Component) {
			return (
				<Frame>
					<Label text={UtilCommon.sprintf(translate('pageMainIndexComponentNotFound'), path)} />
				</Frame>
			);
		};

		const wrap = (
			<div id="page" className={'page ' + this.getClass('page')}>
				<Component ref={ref => this.refChild = ref} {...this.props} />
			</div>
		);

		let content = null;
		if (isPopup || !showSidebar) {
			content = wrap;
		} else {
			content = (
				<div className="pageFlex">
					<Sidebar key="sidebar" {...this.props} />
					<div id="sidebarDummyLeft" className="sidebarDummy left" />
					{wrap}
					<div id="sidebarDummyRight" className="sidebarDummy right" />
				</div>
			);
		};
		return content;
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
			popupStore.closeAll();
		};

		menuStore.closeAll();
		Preview.tooltipHide(true);
		Preview.previewHide(true);
	};

	getMatch () {
		const { match, matchPopup, isPopup } = this.props;
		const { history } = this.props;
		const data = UtilCommon.searchParam(history?.location?.search);
		const pathname = String(history?.location?.pathname || '');
		const ret = (isPopup ? matchPopup : match) || { params: {} };

		// Universal object route
		if (pathname.match('/object')) {
			ret.params.page = 'main';
			ret.params.action = 'object';
			ret.params.id = data.objectId;
			ret.params.spaceId = data.spaceId;
		};

		// Invite route
		if (pathname.match('/invite')) {
			ret.params.page = 'main';
			ret.params.action = 'invite';
		};

		return ret;
	};

	getMatchParams () {
		const match = this.getMatch();
		const page = String(match?.params?.page || 'index');
		const action = String(match?.params?.action || 'index');
		const id = String(match?.params?.id || '');
		const spaceId = String(match?.params?.spaceId || '');

		return { page, action, id, spaceId };
	};

	getRootId () {
		const { id } = this.getMatchParams();
		const home = UtilSpace.getDashboard();

		return id || home?.id;
	};

	init () {
		const { account } = authStore;
		const { isPopup } = this.props;
		const match = this.getMatch();
		const { page, action } = this.getMatchParams();
		const isIndex = this.isIndex();
		const isAuth = this.isAuth();
		const isMain = this.isMain();
		const isPinCheck = this.isAuthPinCheck();
		const pin = Storage.get('pin');
		const win = $(window);
		const path = [ page, action ].join('/');
		const Component = Components[path];
		const routeParam = { replace: true };

		Preview.tooltipHide(true);
		Preview.previewHide(true);

		if (!Component) {
			return;
		};

		if (isMain && !account) {
			UtilRouter.go('/', routeParam);
			return;
		};

		if (pin && !keyboard.isPinChecked && !isPinCheck && !isAuth && !isIndex) {
			UtilRouter.go('/auth/pin-check', routeParam);
			return;
		};

		if (isMain && (authStore.accountIsDeleted() || authStore.accountIsPending())) {
			UtilRouter.go('/auth/deleted', routeParam);
			return;
		};

		this.setBodyClass();
		this.resize();
		this.event();
		this.unbind();

		win.on('resize.page' + (isPopup ? 'Popup' : ''), () => this.resize());

		if (!isPopup) {
			keyboard.setMatch(match);
		};

		Onboarding.start(UtilCommon.toCamelCase([ page, action ].join('-')), isPopup);
		Highlight.showAll();
	};

	unbind () {
		const { isPopup } = this.props;
		$(window).off('resize.page' + (isPopup ? 'Popup' : ''));
	};
	
	event () {
		const { page, action, id } = this.getMatchParams();
		const params = { page, action, id: undefined };
		const isMainType = this.isMainType();
		const isMainRelation = this.isMainRelation();

		if (isMainType || isMainRelation) {
			params.id = id;
		};

		analytics.event('page', { params });
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
		const { page } = this.getMatchParams();
		
		return [ 
			UtilCommon.toCamelCase([ prefix, page ].join('-')),
			this.getId(prefix),
			(isPopup ? 'isPopup' : 'isFull'),
		].join(' ');
	};
	
	setBodyClass () {
		const { isPopup } = this.props;
	
		if (isPopup) {
			return;
		};

		const { config } = commonStore;
		const platform = UtilCommon.getPlatform();
		const cn = [ 
			this.getClass('body'), 
			UtilCommon.toCamelCase([ 'platform', platform ].join('-')),
		];
		const obj = $('html');

		if (config.debug.ui) {
			cn.push('debug');
		};

		obj.attr({ class: cn.join(' ') });
		commonStore.setThemeClass();
	};

	getId (prefix: string) {
		const match = this.getMatch();
		const page = match.params.page || 'index';
		const action = match.params.action || 'index';

		return UtilCommon.toCamelCase([ prefix, page, action ].join('-'));
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
		};

		this.frame = raf(() => {
			if (!this._isMounted) {
				return;
			};

			if (this.refChild && this.refChild.resize) {
				this.refChild.resize();			
			};

			sidebar.resizePage();
		});
	};
	
});

export default Page;
