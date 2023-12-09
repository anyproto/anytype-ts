import * as React from 'react';
import * as hs from 'history';
import * as Sentry from '@sentry/browser';
import $ from 'jquery';
import raf from 'raf';
import { RouteComponentProps } from 'react-router';
import { Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { configure, spy } from 'mobx';
import { enableLogging } from 'mobx-logger';
import { Page, SelectionProvider, DragProvider, Progress, Toast, Preview as PreviewIndex, Navigation, ListPopup, ListMenu, ListNotification } from 'Component';
import { commonStore, authStore, blockStore, detailStore, dbStore, menuStore, popupStore, notificationStore } from 'Store';
import { 
	I, C, UtilCommon, UtilRouter, UtilFile, UtilData, UtilObject, UtilMenu, keyboard, Storage, analytics, dispatcher, translate, Renderer, 
	focus, Preview, Mark, Animation, Onboarding, Survey, UtilDate, UtilSmile, Encode, Decode,
} from 'Lib';
import * as Docs from 'Docs';

configure({ enforceActions: 'never' });

import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism.css';
import 'react-virtualized/styles.css';
import 'swiper/scss';

import 'scss/common.scss';
import 'scss/component/common.scss';
import 'scss/page/common.scss';
import 'scss/block/common.scss';
import 'scss/form/common.scss';
import 'scss/list/common.scss';
import 'scss/widget/common.scss';
import 'scss/popup/common.scss';
import 'scss/menu/common.scss';
import 'scss/notification/common.scss';

import 'scss/media/print.scss';
import 'scss/theme/dark/common.scss';

import Constant from 'json/constant.json';
import Errors from 'json/error.json';
import Routes from 'json/route.json';

const memoryHistory = hs.createMemoryHistory;
const history = memoryHistory();

interface RouteElement { path: string; };

interface State {
	loading: boolean;
};

declare global {
	interface Window {
		$: any;
		Electron: any;
		Anytype: any;

		isWebVersion: boolean;
		Config: any;
		AnytypeGlobalConfig: any;
	}
};

declare global {
	namespace JSX {
		interface IntrinsicElements {
			['em-emoji']: any;
		}
	}
};

const rootStore = {
	commonStore,
	authStore,
	blockStore,
	detailStore,
	dbStore,
	menuStore,
	popupStore,
	notificationStore,
};

window.$ = $;

if (!window.Electron.isPackaged) {
	window.Anytype = {
		Store: rootStore,
		Lib: {
			I,
			C,
			UtilCommon,
			UtilData,
			UtilFile,
			UtilObject,
			UtilMenu,
			UtilRouter,
			UtilSmile,
			analytics,
			dispatcher,
			keyboard,
			Renderer,
			Preview,
			Storage,
			Animation,
			Onboarding,
			Survey,
			Docs,
			Encode, 
			Decode,
		},
	};
};

/*
spy(event => {
	if (event.type == 'action') {
		console.log('[Mobx].event', event.name, event.arguments);
	};
});
enableLogging({
	predicate: () => true,
	action: true,
	reaction: true,
	transaction: true,
	compute: true,
});
*/

Sentry.init({
	release: UtilCommon.getElectron().version.app,
	environment: UtilCommon.getElectron().isPackaged ? 'production' : 'development',
	dsn: Constant.sentry,
	maxBreadcrumbs: 0,
	beforeSend: (e: any) => {
		e.request.url = '';
		return e;
	},
	integrations: [
		new Sentry.Integrations.GlobalHandlers({
			onerror: true,
			onunhandledrejection: true,
		}),
	],
});

class RoutePage extends React.Component<RouteComponentProps> {
	render () {
		return (
			<SelectionProvider>
				<DragProvider>
					<ListPopup key="listPopup" {...this.props} />
					<ListMenu key="listMenu" {...this.props} />

					<Page {...this.props} />
				</DragProvider>
			</SelectionProvider>
		);
	};
};

class App extends React.Component<object, State> {

	state = {
		loading: true
	};
	node: any = null;
	timeoutMaximize = 0;

	constructor (props: any) {
		super(props);

		this.onInit = this.onInit.bind(this);
		this.onKeytarGet = this.onKeytarGet.bind(this);
		this.onPopup = this.onPopup.bind(this);
		this.onUpdateCheck = this.onUpdateCheck.bind(this);
		this.onUpdateConfirm = this.onUpdateConfirm.bind(this);
		this.onUpdateAvailable = this.onUpdateAvailable.bind(this);
		this.onUpdateUnavailable = this.onUpdateUnavailable.bind(this);
		this.onUpdateProgress = this.onUpdateProgress.bind(this);
		this.onUpdateError = this.onUpdateError.bind(this);
		this.onSpellcheck = this.onSpellcheck.bind(this);
	};

	render () {
		const { loading } = this.state;
		
		return (
			<Router history={history}>
				<Provider {...rootStore}>
					<div ref={node => this.node = node}>
						{loading ? (
							<div id="root-loader" className="loaderWrapper">
								<div className="inner">
									<div className="logo anim from" />
									<div className="version anim from">{UtilCommon.getElectron().version.app}</div>
								</div>
							</div>
						) : ''}

						<PreviewIndex />
						<Progress />
						<Toast />
						<Navigation />
						<ListNotification key="listNotification" />

						<div id="tooltipContainer" />
						<div id="drag" />
						<div id="globalFade" />

						<Switch>
							{Routes.map((item: RouteElement, i: number) => (
								<Route path={item.path} exact={true} key={i} component={RoutePage} />
							))}
						</Switch>
					</div>
				</Provider>
			</Router>
		);
	};

	componentDidMount () {
		this.init();
	};

	init () {
		UtilRouter.init(history);

		dispatcher.init(UtilCommon.getElectron().getGlobal('serverAddress'));
		keyboard.init();

		this.registerIpcEvents();
		Renderer.send('appOnLoad');

		console.log('[Process] os version:', UtilCommon.getElectron().version.system, 'arch:', UtilCommon.getElectron().arch);
		console.log('[App] version:', UtilCommon.getElectron().version.app, 'isPackaged', UtilCommon.getElectron().isPackaged);
	};

	initStorage () {
		const lastSurveyTime = Number(Storage.get('lastSurveyTime')) || 0;

		if (!lastSurveyTime) {
			Storage.set('lastSurveyTime', UtilDate.now());
		};

		Storage.delete('lastSurveyCanceled');
	};

	registerIpcEvents () {
		Renderer.on('init', this.onInit);
		Renderer.on('keytarGet', this.onKeytarGet);
		Renderer.on('route', (e: any, route: string) => UtilRouter.go(route, {}));
		Renderer.on('popup', this.onPopup);
		Renderer.on('checking-for-update', this.onUpdateCheck);
		Renderer.on('update-available', this.onUpdateAvailable);
		Renderer.on('update-confirm', this.onUpdateConfirm);
		Renderer.on('update-not-available', this.onUpdateUnavailable);
		Renderer.on('update-downloaded', () => commonStore.progressClear());
		Renderer.on('update-error', this.onUpdateError);
		Renderer.on('download-progress', this.onUpdateProgress);
		Renderer.on('spellcheck', this.onSpellcheck);
		Renderer.on('enter-full-screen', () => commonStore.fullscreenSet(true));
		Renderer.on('leave-full-screen', () => commonStore.fullscreenSet(false));
		Renderer.on('config', (e: any, config: any) => commonStore.configSet(config, true));
		Renderer.on('enter-full-screen', () => commonStore.fullscreenSet(true));
		Renderer.on('leave-full-screen', () => commonStore.fullscreenSet(false));
		Renderer.on('logout', () => authStore.logout(false, false));
		Renderer.on('shutdownStart', () => {
			this.setState({ loading: true });

			Storage.delete('menuSearchText');
		});

		Renderer.on('zoom', () => {
			const resizable = $('.resizable');

			if (resizable.length) {
				resizable.trigger('resizeInit');
			};
		});

		Renderer.on('native-theme', (e: any, isDark: boolean) => {
			commonStore.nativeThemeSet(isDark);
			commonStore.themeSet(commonStore.theme);
		});

		Renderer.on('pin-check', () => {
			keyboard.setPinChecked(false);
			UtilRouter.go('/auth/pin-check', { replace: true, animate: true });
		});
	};

	onInit (e: any, data: any) {
		const { dataPath, config, isDark, isChild, route, account, phrase, languages, isPinChecked } = data;
		const win = $(window);
		const node = $(this.node);
		const loader = node.find('#root-loader');
		const anim = loader.find('.anim');
		const accountId = Storage.get('accountId');
		const redirect = Storage.get('redirect');

		commonStore.configSet(config, true);
		commonStore.nativeThemeSet(isDark);
		commonStore.themeSet(config.theme);
		commonStore.languagesSet(languages);

		authStore.walletPathSet(dataPath);
		authStore.accountPathSet(dataPath);

		analytics.init();
		this.initStorage();

		if (redirect) {
			Storage.delete('redirect');
		};

		raf(() => { anim.removeClass('from'); });

		const cb = () => {
			window.setTimeout(() => {
				anim.addClass('to');

				window.setTimeout(() => {
					loader.css({ opacity: 0 });
					window.setTimeout(() => { loader.remove(); }, 500);
				}, 750);
			}, 2000);
		};

		if (accountId) {
			if (isChild) {
				authStore.phraseSet(phrase);

				UtilData.createSession(() => {
					authStore.accountSet(account);
					keyboard.setPinChecked(isPinChecked);
					commonStore.redirectSet(route || redirect || '');
					commonStore.configSet(account.config, false);

					UtilData.onInfo(account.info);
					UtilData.onAuth({}, cb);
				});

				win.off('unload').on('unload', (e: any) => {
					if (!authStore.token) {
						return;
					};

					e.preventDefault();
					C.WalletCloseSession(authStore.token, () => {
						authStore.tokenSet('');
						window.close();
					});
					return false;
				});
			} else {
				commonStore.redirectSet(redirect || '');
				Renderer.send('keytarGet', accountId);

				cb();
			};
		} else {
			cb();
		};
	};

	onKeytarGet (e: any, key: string, value: string) {
		const accountId = Storage.get('accountId');
		const phrase = Storage.get('phrase');

		if (!accountId || (key != accountId)) {
			return;
		};

		if (phrase) {
			value = phrase;
			Renderer.send('keytarSet', accountId, phrase);
			Storage.delete('phrase');
		};

		if (value) {
			authStore.phraseSet(value);
			UtilRouter.go('/auth/setup/init', { replace: true });
		} else {
			Storage.logout();
		};
	};

	onPopup (e: any, id: string, param: any, close?: boolean) {
		if (Constant.popupPinIds.includes(id) && !keyboard.isPinChecked) {
			return;
		};

		param = param || {};
		param.data = param.data || {};
		param.data.rootId = keyboard.getRootId();

		if (close) {
			popupStore.closeAll();
		};

		window.setTimeout(() => { popupStore.open(id, param); }, Constant.delay.popup);
	};

	onUpdateCheck (e: any, auto: boolean) {
		if (!auto) {
			commonStore.progressSet({ status: translate('progressUpdateCheck'), current: 0, total: 1, isUnlocked: true });
		};
	};

	onUpdateConfirm (e: any, auto: boolean) {
		commonStore.progressClear();
		Storage.setHighlight('whatsNew', true);

		if (auto) {
			return;
		};

		popupStore.open('confirm', {
			data: {
				title: translate('popupConfirmUpdatePromptTitle'),
				text: translate('popupConfirmUpdatePromptText'),
				textConfirm: translate('popupConfirmUpdatePromptRestartOk'),
				textCancel: translate('popupConfirmUpdatePromptCancel'),
				onConfirm: () => {
					Renderer.send('updateConfirm');
				},
				onCancel: () => {
					Renderer.send('updateCancel');
				},
			},
		});
	};

	onUpdateAvailable (e: any, auto: boolean) {
		commonStore.progressClear();

		if (auto) {
			return;
		};

		popupStore.open('confirm', {
			data: {
				title: translate('popupConfirmUpdatePromptTitle'),
				text: translate('popupConfirmUpdatePromptText'),
				textConfirm: translate('popupConfirmUpdatePromptOk'),
				textCancel: translate('popupConfirmUpdatePromptCancel'),
				onConfirm: () => {
					Renderer.send('updateDownload');
				},
				onCancel: () => {
					Renderer.send('updateCancel');
				},
			},
		});
	};

	onUpdateUnavailable (e: any, auto: boolean) {
		commonStore.progressClear();

		if (auto) {
			return;
		};

		popupStore.open('confirm', {
			data: {
				title: translate('popupConfirmUpdateDoneTitle'),
				text: UtilCommon.sprintf(translate('popupConfirmUpdateDoneText'), UtilCommon.getElectron().version.app),
				textConfirm: translate('popupConfirmUpdateDoneOk'),
				canCancel: false,
			},
		});
	};

	onUpdateError (e: any, err: string, auto: boolean) {
		console.error(err);
		commonStore.progressClear();

		if (auto) {
			return;
		};

		popupStore.open('confirm', {
			data: {
				title: translate('popupConfirmUpdateErrorTitle'),
				text: UtilCommon.sprintf(translate('popupConfirmUpdateErrorText'), Errors[err] || err),
				textConfirm: translate('commonRetry'),
				textCancel: translate('commonLater'),
				onConfirm: () => {
					Renderer.send('updateDownload');
				},
				onCancel: () => {
					Renderer.send('updateCancel');
				},
			},
		});
	};

	onUpdateProgress (e: any, progress: any) {
		commonStore.progressSet({ 
			status: UtilCommon.sprintf('Downloading update... %s/%s', UtilFile.size(progress.transferred), UtilFile.size(progress.total)), 
			current: progress.transferred, 
			total: progress.total,
			isUnlocked: true,
		});
	};

	onSpellcheck (e: any, param: any) {
		if (!param.misspelledWord) {
			return;
		};

		keyboard.disableContextOpen(true);

		const win = $(window);
		const rootId = keyboard.getRootId();
		const { focused, range } = focus.state;
		const options: any = param.dictionarySuggestions.map(it => ({ id: it, name: it }));
		const obj = Mark.cleanHtml($(`#block-${focused} #value`).html());
		const value = String(obj.get(0).innerText || '');

		options.push({ id: 'add-to-dictionary', name: translate('spellcheckAdd') });

		menuStore.open('select', {
			recalcRect: () => { 
				const rect = UtilCommon.getSelectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null; 
			},
			onOpen: () => { menuStore.close('blockContext'); },
			onClose: () => { keyboard.disableContextOpen(false); },
			data: {
				options,
				onSelect: (e: any, item: any) => {
					raf(() => {
						focus.apply();

						switch (item.id) {
							default: {
								blockStore.updateContent(rootId, focused, { text: value });
								UtilData.blockInsertText(rootId, focused, item.id, range.from, range.to);
								break;
							};

							case 'add-to-dictionary': {
								Renderer.send('spellcheckAdd', param.misspelledWord);
								break;
							};

							case 'disable-spellcheck': {
								Renderer.send('setSpellingLang', []);
								break;
							};
						};
					});
				},
			}
		});
	};

};

export default App;
