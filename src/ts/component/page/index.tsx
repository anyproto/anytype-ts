import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, Onboarding, Util, Storage, analytics, keyboard, sidebar } from 'ts/lib';
import { Sidebar } from 'ts/component';
import { authStore, commonStore, menuStore, popupStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

import PageAuthInvite from './auth/invite';
import PageAuthNotice from './auth/notice';
import PageAuthSelect from './auth/select';
import PageAuthLogin from './auth/login';
import PageAuthPinSelect from './auth/pin/select';
import PageAuthPinConfirm from './auth/pin/confirm';
import PageAuthPinCheck from './auth/pin/check';
import PageAuthSetup from './auth/setup';
import PageAuthAccountSelect from './auth/account/select';
import PageAuthRegister from './auth/register';
import PageAuthSuccess from './auth/success';
import PageAuthShare from './auth/share';
import PageAuthDeleted from './auth/deleted';

import PageMainIndex from './main/index';
import PageMainEdit from './main/edit';
import PageMainHistory from './main/history';
import PageMainSet from './main/set';
import PageMainSpace from './main/space';
import PageMainType from './main/type';
import PageMainMedia from './main/media';
import PageMainBookmark from './main/bookmark';
import PageMainRelation from './main/relation';
import PageMainStore from './main/store';
import PageMainGraph from './main/graph';
import PageMainNavigation from './main/navigation';

const Constant = require('json/constant.json');
const Url = require('json/url.json');
const $ = require('jquery');
const raf = require('raf');

const Components: any = {
	'/':					 PageAuthSelect,
	'auth/invite':			 PageAuthInvite,
	'auth/select':			 PageAuthSelect,
	'auth/register':		 PageAuthRegister,
	'auth/login':			 PageAuthLogin,
	'auth/pin-select':		 PageAuthPinSelect,
	'auth/pin-confirm':		 PageAuthPinConfirm,
	'auth/pin-check':		 PageAuthPinCheck,
	'auth/setup':			 PageAuthSetup,
	'auth/account-select':	 PageAuthAccountSelect,
	'auth/success':			 PageAuthSuccess,
	'auth/share':			 PageAuthShare,
	'auth/deleted':			 PageAuthDeleted,

	'object/share':			 PageAuthShare,
			
	'main/index':			 PageMainIndex,
	'main/edit':			 PageMainEdit,
	'main/history':			 PageMainHistory,
	'main/set':				 PageMainSet,
	'main/space':			 PageMainSpace,
	'main/type':			 PageMainType,
	'main/media':			 PageMainMedia,
	'main/bookmark':		 PageMainBookmark,
	'main/relation':		 PageMainRelation,
	'main/store':			 PageMainStore,
	'main/graph':			 PageMainGraph,
	'main/navigation':		 PageMainNavigation,
};

interface Props extends RouteComponentProps<any> {
	dataset?: any;
	isPopup?: boolean;
	matchPopup?: any;
	rootId?: string;
};

const Page = observer(class Page extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	refChild: any = null;
	refSidebar: any = null;

	render () {
		const { isPopup } = this.props;
		const { config, theme } = commonStore;
		const { account } = authStore;
		const match = this.getMatch();
		const { page, action } = match.params || {};
		const path = [ page, action ].join('/');
		const showNotice = !Boolean(Storage.get('firstRun'));
		const showSidebar = (page == 'main');

		console.log(JSON.stringify(account, null, 3));

		if (account) {
			const { status } = account || {};
			const { type } = status || {};
		};

		if (showNotice) {
			Components['/'] = PageAuthNotice;
		};

		const Component = Components[path];
		if (!Component) {
			return <div>Page component "{path}" not found</div>;
		};

		let sb = (
			<Sidebar 
				ref={(ref: any) => { 
					if (!this.refSidebar) {
						this.refSidebar = ref; 
						this.forceUpdate(); 
					};
				}} 
				{...this.props} 
			/>
		);
		let wrap = (
			<div id="page" className={'page ' + this.getClass('page')}>
				<Component ref={(ref: any) => this.refChild = ref} refSidebar={this.refSidebar} {...this.props} />
			</div>
		);
		let content = null;

		if (isPopup || !showSidebar) {
			content = wrap;
		} else {
			content = (
				<div className="pageFlex">
					{sb}
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
		Util.tooltipHide(true);
		Util.previewHide(true);
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
		const isIndex = !match.params.page;
		const isAuth = match.params.page == 'auth';
		const isMain = match.params.page == 'main';
		const isMainIndex = isMain && (match.params.action == 'index');
		const isPinCheck = isAuth && (match.params.action == 'pin-check');
		const pin = Storage.get('pin');
		const lastSurveyTime = Number(Storage.get('lastSurveyTime')) || 0;
		const lastSurveyCanceled = Number(Storage.get('lastSurveyCanceled')) || 0;
		const askSurvey = Number(Storage.get('askSurvey')) || 0;
		const days = lastSurveyTime ? 30 : 14;
		const win = $(window);
		const path = [ match.params.page, match.params.action ].join('/');
		const Component = Components[path];
		const renderer = Util.getRenderer();

		Util.tooltipHide(true);
		Util.previewHide(true);

		if (!Component) {
			Util.route('/main/index');
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

		this.setBodyClass();
		this.resize();
		this.event();
		this.unbind();

		win.on('resize.page' + (isPopup ? 'Popup' : ''), () => { this.resize(); });

		if (!isPopup) {
			keyboard.setMatch(match);
		};

		Onboarding.start(Util.toCamelCase([ match.params?.page, match.params?.action ].join('-')), isPopup);
		
		if (isPopup) {
			return;
		};
		
		window.setTimeout(() => {
			let popupNewBlock = Storage.get('popupNewBlock');
			let popupVideo = Storage.get('popupVideo');

			let onboarding = Storage.get('onboarding');

			if (isMain && account) {
				if (!onboarding || popupVideo) {
					popupNewBlock = true;
				};
				if (!popupNewBlock && onboarding) {
					popupStore.open('help', { data: { document: 'whatsNew' } });
					Storage.set('popupNewBlock', true);
				};
				if (popupVideo) {
					popupStore.open('video', { data: { type: 'onboarding' } });
					Storage.delete('popupVideo');
				};
				Storage.set('redirect', history.location.pathname);
			};

			if (isMainIndex) {
				if (account && askSurvey && !popupStore.isOpen() && !lastSurveyCanceled && (lastSurveyTime <= Util.time() - 86400 * days)) {
					analytics.event('SurveyShow');

					const onClose = () => {
						Storage.set('lastSurveyCanceled', 1);
						Storage.set('lastSurveyTime', Util.time());
					};

					popupStore.open('confirm', {
						onClose: onClose,
						data: {
							title: 'We need your opinion',
							text: 'Please, tell us what you think about Anytype. Participate in 1 min survey',
							textConfirm: 'Let\'s go!',
							textCancel: 'Skip',
							canCancel: true,
							onConfirm: () => {
								renderer.send('urlOpen', Util.sprintf(Url.survey, account.id));
								Storage.set('lastSurveyTime', Util.time());

								analytics.event('SurveyOpen');
							},
							onCancel: onClose,
						},
					});
				};

				this.shareCheck();

				Storage.delete('redirect');
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
					this.refChild.onTab(I.TabIndex.Shared);
				}
			},
		});
	};

	unbind () {
		const { isPopup } = this.props;
		$(window).unbind('resize.page' + (isPopup ? 'Popup' : ''));
	};
	
	event () {
		let match = this.getMatch();
		let page = String(match.params.page || 'index');
		let action = String(match.params.action || 'index');
		let id = String(match.params.id || '');
		let showNotice = !Boolean(Storage.get('firstRun'));
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
		const action = match.params.action || 'index';
		
		return [ 
			Util.toCamelCase([ prefix, page ].join('-')),
			Util.toCamelCase([ prefix, page, action ].join('-')),
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