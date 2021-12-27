import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, Onboarding, Util, Storage, analytics, keyboard } from 'ts/lib';
import { authStore, commonStore, menuStore, popupStore, blockStore } from 'ts/store';

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

const { ipcRenderer } = window.require('electron');
const Constant = require('json/constant.json');
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
	'object/share':			 PageAuthShare,
			
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
};

interface Props extends RouteComponentProps<any> {
	dataset?: any;
	isPopup?: boolean;
	matchPopup?: any;
	rootId?: string;
};

class Page extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	refChild: any;

	render () {
		const { isPopup } = this.props;
		const match = this.getMatch();
		const path = [ match.params.page, match.params.action ].join('/');
		const showNotice = !Boolean(Storage.get('firstRun'));

		if (showNotice) {
			Components['/'] = PageAuthNotice;
			Storage.set('firstRun', 1);
		};

		const Component = Components[path];
		if (!Component) {
			return <div>Page component "{path}" not found</div>;
		};

		return (
			<div className={'page ' + this.getClass('page')}>
				<Component ref={(ref: any) => this.refChild = ref} {...this.props} />
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
		const { isPopup, history, dataset } = this.props;
		const match = this.getMatch();
		const popupNewBlock = Storage.get('popupNewBlock');
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
			if (isMain && account) {
				if (!popupNewBlock) {
					popupStore.open('help', { data: { document: 'whatsNew' } });
					Storage.set('popupNewBlock', 1);
				};
				Storage.set('redirect', history.location.pathname);
			};

			if (isMainIndex) {
				if (account && askSurvey && !popupStore.isOpen() && !lastSurveyCanceled && (lastSurveyTime <= Util.time() - 86400 * days)) {
					popupStore.open('confirm', {
						data: {
							title: 'We need your opinion',
							text: 'Please, tell us what you think about Anytype. Participate in 1 min survey',
							textConfirm: 'Let\'s go!',
							textCancel: 'Skip',
							canCancel: true,
							onConfirm: () => {
								ipcRenderer.send('urlOpen', Util.sprintf(Constant.survey, account.id));
								Storage.set('lastSurveyTime', Util.time());
							},
							onCancel: () => {
								Storage.set('lastSurveyCanceled', 1);
								Storage.set('lastSurveyTime', Util.time());
							},
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
		const match = this.getMatch();
		const page = String(match.params.page || 'index');
		const action = String(match.params.action || 'index');
		const path = [ 'page', page, action ].join('-');
		
		analytics.event(Util.toUpperCamelCase(path));
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
		const { config, theme } = commonStore;
		const platform = Util.getPlatform();
		const cn = [ 
			this.getClass('body'), 
			Util.toCamelCase([ 'platform', platform ].join('-')),
		];
		const obj = $('html');

		if (theme) {
			cn.push(Util.toCamelCase(`theme-${theme}`));
		};

		if (config.debug.ui) {
			cn.push('debug');
		};
		obj.attr({ class: cn.join(' ') });
	};
	
	resize () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};

			if (this.refChild && this.refChild.resize) {
				this.refChild.resize();			
			};			
		});
	};

};

export default Page;