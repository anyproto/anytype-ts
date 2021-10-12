import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Util, Storage, analytics, keyboard } from 'ts/lib';
import { ListPopup } from 'ts/component';
import { authStore, commonStore, menuStore, popupStore } from 'ts/store';

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
const { process } = window.require('@electron/remote');
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
	isPopup?: boolean;
	matchPopup?: any;
	rootId?: string;
};

class Page extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	childRef: any;

	render () {
		const { isPopup } = this.props;
		const match = this.getMatch();

		console.log(match);

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
			<React.Fragment>
				{!isPopup ? <ListPopup key="listPopup" {...this.props} /> : ''}
				<div className={'page ' + this.getClass('page')}>
					<Component ref={(ref: any) => this.childRef = ref} {...this.props} />
				</div>
			</React.Fragment>
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
		Util.linkPreviewHide(true);
	};

	getMatch () {
		const { match, matchPopup, isPopup } = this.props;
		return isPopup ? matchPopup : match;
	};

	init () {
		const { account } = authStore;
		const { isPopup, history } = this.props;
		const match = this.getMatch();
		const popupNewBlock = Storage.get('popupNewBlock');
		const popupIntroBlock = Storage.get('popupIntroBlock');
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

		if (pin && !keyboard.isPinChecked && !isPinCheck && !isAuth && !isIndex) {
			history.push('/auth/pin-check');
			return;
		};

		this.setBodyClass();
		this.resize();
		this.event();
		this.unbind();

		Util.linkPreviewHide(true);
		win.on('resize.page' + (isPopup ? 'Popup' : ''), () => { this.resize(); });
		
		if (isPopup) {
			return;
		};

		keyboard.setMatch(match);
		popupStore.closeAll();
		menuStore.closeAll();

		window.setTimeout(() => {
			if (isMain && account) {
				if (!popupIntroBlock) {
					popupStore.open('help', { data: { document: 'intro' } });
					Storage.set('popupIntroBlock', 1);
					Storage.set('popupNewBlock', 1);
				} else
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

				Storage.delete('redirect');
			};
		}, Constant.delay.popup);
		
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
		const { isPopup } = this.props;
		const { config } = commonStore;
		const platform = Util.getPlatform();
		const version = process.getSystemVersion();
		const cn = [ 
			this.getClass('body'), 
			Util.toCamelCase([ 'platform', platform ].join('-')),
		];
		const obj = $(isPopup ? '#popupPage #wrap' : 'html');
		const a = version.split('.');

		if (a.length) {
			cn.push('version' + a[0]);
		};

		if (config.debug.ui) {
			cn.push('debug');
		};
		if (config.debug.dm) {
			cn.push('dark');
		};

		obj.attr({ class: cn.join(' ') });
	};
	
	resize () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};

			if (this.childRef && this.childRef.resize) {
				this.childRef.resize();			
			};			
		});
	};
	
};

export default Page;