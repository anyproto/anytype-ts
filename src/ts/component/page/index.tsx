import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Util, Storage, analytics, keyboard } from 'ts/lib';
import { authStore, commonStore } from 'ts/store';
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

import PageMainIndex from './main/index';
import PageMainEdit from './main/edit';
import PageMainHistory from './main/history';
import PageMainSet from './main/set';

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
			
	'main/index':			 PageMainIndex,
	'main/edit':			 PageMainEdit,
	'main/history':			 PageMainHistory,
	'main/set':				 PageMainSet,
};

interface Props extends RouteComponentProps<any> {};

class Page extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	childRef: any;

	render () {
		const { match } = this.props;
		const path = [ match.params.page, match.params.action ].join('/');
		const showNotice = !Boolean(Storage.get('firstRun'));
		const { config } = commonStore;
		
		if (showNotice) {
			Components['/'] = PageAuthNotice;
			Storage.set('firstRun', 1);
		};

		const Component = Components[path];
		if (!Component) {
			return <div>Page component "{path}" not found</div>;
		};
		
		return (
			<div className={this.getClass('page')}>
				<Component ref={(ref: any) => this.childRef = ref} {...this.props} />
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
		this._isMounted = false;
		this.unbind();
	};
	
	init () {
		const { account } = authStore;
		const { match, history } = this.props;
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

		if (pin && !keyboard.isPinChecked && !isPinCheck && !isAuth && !isIndex) {
			history.push('/auth/pin-check');
			return;
		};

		this.setBodyClass();
		this.resize();
		this.event();
		this.unbind();
		
		commonStore.popupCloseAll();
		commonStore.menuCloseAll();
		Util.linkPreviewHide(true);
		
		keyboard.setMatch(match);

		if (isMain) {
			if (!popupNewBlock) {
				commonStore.popupOpen('help', { 
					data: { document: 'whatsNew' },
				});
			};

			if (account && isMainIndex && askSurvey && !commonStore.popupIsOpen() && !lastSurveyCanceled && (lastSurveyTime <= Util.time() - 86400 * days)) {
				Storage.delete('askSurvey');
				commonStore.popupOpen('confirm', {
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
		};

		$(window).on('resize.page', () => { this.resize(); });
	};
	
	unbind () {
		$(window).unbind('resize.page');
	};
	
	event () {
		const { match } = this.props;
		const page = String(match.params.page || 'index');
		const action = String(match.params.action || 'index');
		const path = [ 'page', page, action ].join('-');
		
		analytics.event(Util.toUpperCamelCase(path));
	};
	
	getClass (prefix: string) {
		const { match } = this.props;
		const page = match.params.page || 'index';
		const action = match.params.action || 'index';
		const platform = Util.getPlatform();

		return [ 
			Util.toCamelCase([ prefix, page ].join('-')),
			Util.toCamelCase([ prefix, page, action ].join('-')),
			Util.toCamelCase([ 'platform', platform ].join('-')),
		].join(' ');
	};
	
	setBodyClass () {
		const { config } = commonStore;
		const cn = [ this.getClass('body') ];
		
		if (config.debugUI) {
			cn.push('debug');
		};

		$('html').attr({ class: cn.join(' ') });
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