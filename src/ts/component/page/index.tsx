import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { I, S, U, Onboarding, Storage, analytics, keyboard, sidebar, Preview, Highlight, translate } from 'Lib';
import { Label, Frame } from 'Component';

import PageAuthSelect from './auth/select';
import PageAuthLogin from './auth/login';
import PageAuthPinCheck from './auth/pinCheck';
import PageAuthSetup from './auth/setup';
import PageAuthOnboard from './auth/onboard';
import PageAuthDeleted from './auth/deleted';
import PageAuthMigrate from './auth/migrate';

import PageMainBlank from './main/blank';
import PageMainEmpty from './main/empty';
import PageMainVoid from './main/void';
import PageMainEdit from './main/edit';
import PageMainHistory from './main/history';
import PageMainSet from './main/set';
import PageMainType from './main/type';
import PageMainMedia from './main/media';
import PageMainRelation from './main/relation';
import PageMainGraph from './main/graph';
import PageMainNavigation from './main/navigation';
import PageMainArchive from './main/archive';
import PageMainImport from './main/import';
import PageMainInvite from './main/invite';
import PageMainMembership from './main/membership';
import PageMainObject from './main/object';
import PageMainOnboarding from './main/onboarding';
import PageMainChat from './main/chat';
import PageMainDate from './main/date';

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
	'main/empty':			 PageMainEmpty,		
	'main/edit':			 PageMainEdit,
	'main/history':			 PageMainHistory,
	'main/set':				 PageMainSet,
	'main/type':			 PageMainType,
	'main/media':			 PageMainMedia,
	'main/relation':		 PageMainRelation,
	'main/graph':			 PageMainGraph,
	'main/navigation':		 PageMainNavigation,
	'main/archive':			 PageMainArchive,
	'main/import':			 PageMainImport,
	'main/invite':			 PageMainInvite,
	'main/membership':		 PageMainMembership,
	'main/object':			 PageMainObject,
	'main/onboarding':		 PageMainOnboarding,
	'main/chat':			 PageMainChat,
	'main/void':			 PageMainVoid,
	'main/date':			 PageMainDate,
};

const Page = observer(class Page extends React.Component<I.PageComponent> {

	_isMounted = false;
	refChild: any = null;
	frame = 0;

	render () {
		const { isPopup } = this.props;
		const { config, theme } = S.Common;
		const { account } = S.Auth;
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
					<Label text={U.Common.sprintf(translate('pageMainIndexComponentNotFound'), path)} />
				</Frame>
			);
		};

		const wrap = (
			<div id="page" className={`page ${this.getClass('page')}`}>
				<Component ref={ref => this.refChild = ref} {...this.props} />
			</div>
		);

		let content = null;
		if (isPopup || !showSidebar) {
			content = wrap;
		} else {
			content = (
				<div id="pageFlex" className="pageFlex">
					<div id="sidebarDummy" className="sidebarDummy" />
					{wrap}
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
			S.Popup.closeAll();
		};

		S.Menu.closeAll();
		Preview.tooltipHide(true);
		Preview.previewHide(true);
	};

	getMatch () {
		const { match, matchPopup, isPopup } = this.props;
		const { history } = this.props;
		const data = U.Common.searchParam(history?.location?.search);
		const pathname = String(history?.location?.pathname || '');
		const ret = (isPopup ? matchPopup : match) || { params: {} };

		// Universal object route
		if (pathname.match(/^\/object/)) {
			ret.params.page = 'main';
			ret.params.action = 'object';
			ret.params.id = data.objectId;
			ret.params.spaceId = data.spaceId;
			ret.params.cid = data.cid;
			ret.params.key = data.key;
		};

		// Invite route
		if (pathname.match(/^\/invite/)) {
			ret.params.page = 'main';
			ret.params.action = 'invite';
		};

		// Membership route
		if (pathname.match(/^\/membership/)) {
			ret.params.page = 'main';
			ret.params.action = 'membership';
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
		const home = U.Space.getDashboard();

		return id || home?.id;
	};

	init () {
		const { account } = S.Auth;
		const { pin } = S.Common;
		const { isPopup } = this.props;
		const match = this.getMatch();
		const { page, action } = this.getMatchParams();
		const isIndex = this.isIndex();
		const isAuth = this.isAuth();
		const isMain = this.isMain();
		const isPinCheck = this.isAuthPinCheck();
		const win = $(window);
		const path = [ page, action ].join('/');
		const Component = Components[path];
		const routeParam = { replace: true };

		Preview.tooltipHide(true);
		Preview.previewHide(true);
		keyboard.setWindowTitle();

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

		this.setBodyClass();
		this.resize();
		this.event();
		this.unbind();

		win.on('resize.page' + (isPopup ? 'Popup' : ''), () => this.resize());

		if (!isPopup) {
			keyboard.setMatch(match);
		};

		Onboarding.start(U.Common.toCamelCase([ page, action ].join('-')), isPopup);
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
			U.Common.toCamelCase([ prefix, page ].join('-')),
			this.getId(prefix),
			(isPopup ? 'isPopup' : 'isFull'),
		].join(' ');
	};
	
	setBodyClass () {
		const { isPopup } = this.props;
	
		if (isPopup) {
			return;
		};

		const { config } = S.Common;
		const platform = U.Common.getPlatform();
		const cn = [ 
			this.getClass('body'), 
			U.Common.toCamelCase([ 'platform', platform ].join('-')),
		];
		const obj = $('html');

		if (config.debug.ui) {
			cn.push('debug');
		};

		obj.attr({ class: cn.join(' ') });
		S.Common.setThemeClass();
	};

	getId (prefix: string) {
		const match = this.getMatch();
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
		};

		this.frame = raf(() => {
			if (!this._isMounted) {
				return;
			};

			if (this.refChild && this.refChild.resize) {
				this.refChild.resize();			
			};

			sidebar.resizePage(null, false);
		});
	};
	
});

export default Page;
