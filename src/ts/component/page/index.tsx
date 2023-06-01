import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { I, Onboarding, Util, Storage, analytics, keyboard, sidebar, Survey, Preview, Highlight, DataUtil, ObjectUtil } from 'Lib';
import { Sidebar } from 'Component';
import { authStore, commonStore, menuStore, popupStore, blockStore } from 'Store';
import Constant from 'json/constant.json';

import PageAuthSelect from './auth/select';
import PageAuthLogin from './auth/login';
import PageAuthPinCheck from './auth/pinCheck';
import PageAuthSetup from './auth/setup';
import PageAuthAccountSelect from './auth/accountSelect';
import PageAuthOnboard from './auth/onboard';
import PageAuthDeleted from './auth/deleted';

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
import PageMainUsecase from './main/usecase';

const Components = {
	'index/index':			 PageAuthSelect,

	'auth/select':			 PageAuthSelect,
	'auth/login':			 PageAuthLogin,
	'auth/pin-check':		 PageAuthPinCheck,
	'auth/setup':			 PageAuthSetup,
	'auth/account-select':	 PageAuthAccountSelect,
	'auth/onboard':			 PageAuthOnboard,
	'auth/deleted':			 PageAuthDeleted,

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
	'main/usecase':			 PageMainUsecase,
};

const Titles = {
	index: 'Dashboard',
	graph: 'Graph',
	navigation: 'Flow',
	store: 'Library',
	archive: 'Bin',
};

const Page = observer(class Page extends React.Component<I.PageComponent> {

	_isMounted = false;
	refChild: any = null;
	refSidebar: any = null;
	frame = 0;

	render () {
		const { isPopup } = this.props;
		const { config, theme } = commonStore;
		const { account } = authStore;
		const { page, action } = this.getMatchParams();
		const path = [ page, action ].join('/');
		const showSidebar = this.isMain() && !this.isMainUsecase();

		if (account) {
			const { status } = account || {};
			const { type } = status || {};
		};

		const Component = Components[path];
		if (!Component) {
			return <div>Page component &quot;{path}&quot; not found</div>;
		};

		const wrap = (
			<div id="page" className={'page ' + this.getClass('page')}>
				<Component ref={ref => this.refChild = ref} refSidebar={this.refSidebar} {...this.props} />
			</div>
		);

		let content = null;
		if (isPopup || !showSidebar) {
			content = wrap;
		} else {
			content = (
				<div className="pageFlex">
					<Sidebar 
						ref={ref => { 
							if (!this.refSidebar) {
								this.refSidebar = ref; 
								this.forceUpdate(); 
							};
						}} 
						{...this.props} 
					/>
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
		return (isPopup ? matchPopup : match) || { params: {} };
	};

	getMatchParams () {
		const match = this.getMatch();
		const page = String(match?.params?.page || 'index');
		const action = String(match?.params?.action || 'index');
		const id = String(match?.params?.id || '');

		return { page, action, id };
	};

	getRootId () {
		const { id } = this.getMatchParams();
		const home = ObjectUtil.getSpaceDashboard();

		return id || home?.id;
	};

	init () {
		const { account } = authStore;
		const { isPopup, history } = this.props;
		const match = this.getMatch();
		const { page, action } = this.getMatchParams();
		const isIndex = this.isIndex();
		const isAuth = this.isAuth();
		const isMain = this.isMain();
		const isMainIndex = this.isMainIndex();
		const isPinCheck = this.isAuthPinCheck();
		const pin = Storage.get('pin');
		const win = $(window);
		const path = [ page, action ].join('/');
		const Component = Components[path];

		Preview.tooltipHide(true);
		Preview.previewHide(true);

		if (!Component) {
			return;
		};

		if (isMain && !account) {
			Util.route('/');
			return;
		};

		if (pin && !keyboard.isPinChecked && !isPinCheck && !isAuth && !isIndex) {
			Util.route('/auth/pin-check');
			return;
		};

		if (isMain && (authStore.accountIsDeleted() || authStore.accountIsPending())) {
			Util.route('/auth/deleted');
			return;
		};

		if (!isPopup && Titles[action]) {
			DataUtil.setWindowTitleText(Titles[action]);
		};

		this.setBodyClass();
		this.resize();
		this.event();
		this.unbind();

		win.on('resize.page' + (isPopup ? 'Popup' : ''), () => this.resize());

		if (!isPopup) {
			keyboard.setMatch(match);
		};

		this.onboardingCheck();
		Onboarding.start(Util.toCamelCase([ page, action ].join('-')), isPopup);
		Highlight.showAll();
		
		if (isPopup) {
			return;
		};
		
		window.setTimeout(() => {
			if (!isMain) {
				return;
			};

			if (isMainIndex) {
				Survey.check(I.SurveyType.Register);
				Survey.check(I.SurveyType.Pmf);
				Survey.check(I.SurveyType.Object);

				Storage.delete('redirect');
			} else {
				Storage.set('survey', { askPmf: true });
				Storage.set('redirect', history.location.pathname);
			};
		}, Constant.delay.popup);
	};

	onboardingCheck () {
		const home = ObjectUtil.getSpaceDashboard();
		const { id } = this.getMatchParams();
		const isPopup = keyboard.isPopup();

		if (!home || !id || (home.id != id) || isPopup || Storage.getOnboarding('dashboard')) {
			return;
		};

		Onboarding.start('dashboard', false);
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

	isMainUsecase () {
		const { action } = this.getMatchParams();
		return this.isMain() && (action == 'usecase');
	};

	getClass (prefix: string) {
		const { isPopup } = this.props;
		const { page } = this.getMatchParams();
		
		return [ 
			Util.toCamelCase([ prefix, page ].join('-')),
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
		const platform = Util.getPlatform();
		const cn = [ 
			this.getClass('body'), 
			Util.toCamelCase([ 'platform', platform ].join('-')),
		];
		const obj = $('html');

		if (config.debug.ui) {
			cn.push('debug');
		};

		obj.attr({ class: cn.join(' ') });
		commonStore.setThemeClass();
	};

	getId (prefix: string) {
		const { page, action } = this.getMatchParams();
		return Util.toCamelCase([ prefix, page, action ].join('-'));
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