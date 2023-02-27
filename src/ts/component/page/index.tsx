import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { I, Onboarding, Util, Storage, analytics, keyboard, sidebar, Survey, Preview, Highlight, DataUtil } from 'Lib';
import { Sidebar } from 'Component';
import { authStore, commonStore, menuStore, popupStore, blockStore } from 'Store';
import Constant from 'json/constant.json';

import PageAuthSelect from './auth/select';
import PageAuthInvite from './auth/invite';
import PageAuthOnboard from './auth/onboard';

import PageAuthNotice from './auth/notice';
import PageAuthLogin from './auth/login';
import PageAuthPinCheck from './auth/pin/check';
import PageAuthAccountSelect from './auth/account/select';
// import PageAuthSetup from './auth/setup';
// import PageAuthRegister from './auth/register';
import PageAuthShare from './auth/share';
import PageAuthDeleted from './auth/deleted';

import PageMainEmpty from './main/empty';
import PageMainIndex from './main/index';
import PageMainEdit from './main/edit';
import PageMainHistory from './main/history';
import PageMainSet from './main/set';
import PageMainSpace from './main/space';
import PageMainType from './main/type';
import PageMainMedia from './main/media';
import PageMainRelation from './main/relation';
import PageMainStore from './main/store';
import PageMainGraph from './main/graph';
import PageMainNavigation from './main/navigation';
import PageMainCreate from './main/create';
import PageMainArchive from './main/archive';
import PageMainBlock from './main/block';

const Components: any = {
	'/':					 PageAuthSelect,
	'auth/select':			 PageAuthSelect,
	
	'auth/invite':			 PageAuthInvite,
	'auth/onboard':			 PageAuthOnboard,

	'auth/login':			 PageAuthLogin,
	'auth/pin-check':		 PageAuthPinCheck,
	'auth/account-select':	 PageAuthAccountSelect,
	
	'auth/deleted':			 PageAuthDeleted,
	'auth/share':			 PageAuthShare,

	'object/share':			 PageAuthShare,

	'main/empty':			 PageMainEmpty,		
	'main/index':			 PageMainIndex,
	'main/edit':			 PageMainEdit,
	'main/history':			 PageMainHistory,
	'main/set':				 PageMainSet,
	'main/space':			 PageMainSpace,
	'main/type':			 PageMainType,
	'main/media':			 PageMainMedia,
	'main/relation':		 PageMainRelation,
	'main/store':			 PageMainStore,
	'main/graph':			 PageMainGraph,
	'main/navigation':		 PageMainNavigation,
	'main/create':			 PageMainCreate,
	'main/archive':			 PageMainArchive,
	'main/block':			 PageMainBlock,
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

	render () {
		const { isPopup } = this.props;
		const { config, theme } = commonStore;
		const { account } = authStore;
		const match = this.getMatch();
		const { page, action } = match.params || {};
		const path = [ page, action ].join('/');
		const showNotice = !Storage.get('firstRun');
		const showSidebar = page == 'main';

		if (account) {
			const { status } = account || {};
			const { type } = status || {};
		};

		if (showNotice) {
			Components['/'] = PageAuthNotice;
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

	getRootId () {
		const match = this.getMatch();
		return match?.params?.id || blockStore.root;
	};

	init () {
		const { account } = authStore;
		const { isPopup, history } = this.props;
		const match = this.getMatch();
		const { page, action } = match.params || {};
		const isIndex = !page;
		const isAuth = page == 'auth';
		const isMain = page == 'main';
		const isMainIndex = isMain && (action == 'index');
		const isPinCheck = isAuth && (action == 'pin-check');
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

		win.on('resize.page' + (isPopup ? 'Popup' : ''), () => { this.resize(); });

		if (!isPopup) {
			keyboard.setMatch(match);
		};

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

				this.shareCheck();
				Storage.delete('redirect');
			} else {
				Storage.set('survey', { askPmf: true });
				Storage.set('redirect', history.location.pathname);
			};
		}, Constant.delay.popup);
	};

	shareCheck () {
		const shareSuccess = Storage.get('shareSuccess');
		if (!shareSuccess) {
			return;
		};

		Storage.delete('shareSuccess');

		popupStore.open('confirm', {
			data: {
				title: 'You\'ve got shared objects!',
				text: 'They will be accessible in the "Shared" tab in Home within a minute',
				textConfirm: 'Ok',
				canCancel: false,
				onConfirm: () => {
				}
			},
		});
	};

	unbind () {
		const { isPopup } = this.props;
		$(window).off('resize.page' + (isPopup ? 'Popup' : ''));
	};
	
	event () {
		let match = this.getMatch();
		let page = String(match.params.page || 'index');
		let action = String(match.params.action || 'index');
		let id = String(match.params.id || '');
		let showNotice = !Storage.get('firstRun');
		let params: any = { page, action };
		let isMain = page == 'main';
		let isMainType = isMain && (action == 'type');
		let isMainRelation = isMain && (action == 'relation');

		if (showNotice) {
			params.page = 'auth';
			params.action = 'notice';
			Storage.set('firstRun', 1);
		};

		if (isMainType || isMainRelation) {
			params.id = id;
		};

		analytics.event('page', { params });
	};
	
	getClass (prefix: string) {
		const { isPopup } = this.props;
		const match = this.getMatch();
		const page = match.params.page || 'index';
		
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
		const match = this.getMatch();
		const page = match.params.page || 'index';
		const action = match.params.action || 'index';

		return Util.toCamelCase([ prefix, page, action ].join('-'));
	};

	storageGet () {
		return Storage.get(this.getId('page')) || {};
	};

	storageSet (data: any) {
		Storage.set(this.getId('page'), data);
	};
	
	resize () {
		raf(() => {
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