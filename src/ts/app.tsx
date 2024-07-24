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
import { Page, SelectionProvider, DragProvider, Progress, Toast, Preview as PreviewIndex, Navigation, ListPopup, ListMenu, ListNotification, Sidebar, Vault, Share, Loader } from 'Component';
import { I, C, S, U, J, keyboard, Storage, analytics, dispatcher, translate, Renderer, focus, Preview, Mark, Animation, Onboarding, Survey, Encode, Decode, sidebar } from 'Lib';

require('pdfjs-dist/build/pdf.worker.entry.js');

configure({ enforceActions: 'never' });

import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism.css';
import 'react-virtualized/styles.css';
import 'swiper/scss';
import 'react-pdf/dist/cjs/Page/AnnotationLayer.css';
import 'react-pdf/dist/cjs/Page/TextLayer.css';

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

const memoryHistory = hs.createMemoryHistory;
const history = memoryHistory();
const electron = U.Common.getElectron();
const isPackaged = electron.isPackaged;

interface State {
	isLoading: boolean;
};

declare global {
	interface Window {
		isExtension: boolean;
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

window.$ = $;

if (!isPackaged) {
	window.Anytype = {
		Lib: {
			I,
			C,
			S,
			U,
			analytics,
			dispatcher,
			keyboard,
			Renderer,
			Preview,
			Storage,
			Animation,
			Onboarding,
			Survey,
			Encode, 
			Decode,
			translate,
			sidebar,
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
	release: electron.version.app,
	environment: isPackaged ? 'production' : 'development',
	dsn: J.Constant.sentry,
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

Sentry.setContext('info', {
	network: I.NetworkMode[S.Auth.networkConfig?.mode],
	isPackaged: isPackaged,
});

class RoutePage extends React.Component<RouteComponentProps> {

	render () {
		return (
			<SelectionProvider ref={ref => S.Common.refSet('selectionProvider', ref)}>
				<DragProvider ref={ref => S.Common.refSet('dragProvider', ref)}>
					<ListPopup key="listPopup" {...this.props} />
					<ListMenu key="listMenu" {...this.props} />

					<Sidebar key="sidebar" {...this.props} />
					<Page {...this.props} />
				</DragProvider>
			</SelectionProvider>
		);
	};

};

class App extends React.Component<object, State> {

	state = {
		isLoading: true
	};
	node: any = null;
	timeoutMaximize = 0;

	constructor (props: any) {
		super(props);

		this.onInit = this.onInit.bind(this);
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
		const { isLoading } = this.state;
		const platform = U.Common.getPlatform();

		let drag = null;
		if (platform == I.Platform.Mac) {
			drag = <div id="drag" />;
		};
		
		return (
			<Router history={history}>
				<Provider {...S}>
					<div ref={node => this.node = node}>
						{isLoading ? (
							<div id="root-loader" className="loaderWrapper">
								<div className="inner">
									<div className="logo anim from" />
									<div className="version anim from">{electron.version.app}</div>
								</div>
							</div>
						) : ''}

						{drag}
						<div id="tooltipContainer" />
						<div id="globalFade">
							<Loader id="loader" />
						</div>

						<PreviewIndex />
						<Progress />
						<Toast />
						<ListNotification key="listNotification" />
						<Share showOnce={true} />
						<Vault ref={ref => S.Common.refSet('vault', ref)} />
						<Navigation ref={ref => S.Common.refSet('navigation', ref)} key="navigation" {...this.props} />

						<Switch>
							{J.Route.map((path: string, i: number) => (
								<Route path={path} exact={true} key={i} component={RoutePage} />
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
		const { version, arch, getGlobal } = electron;

		U.Router.init(history);
		U.Smile.init();

		dispatcher.init(getGlobal('serverAddress'));
		dispatcher.listenEvents();
		keyboard.init();

		this.registerIpcEvents();
		Renderer.send('appOnLoad');

		console.log('[Process] os version:', version.system, 'arch:', arch);
		console.log('[App] version:', version.app, 'isPackaged', isPackaged);
	};

	initStorage () {
		const lastSurveyTime = Number(Storage.get('lastSurveyTime')) || 0;

		if (!lastSurveyTime) {
			Storage.set('lastSurveyTime', U.Date.now());
		};

		Storage.delete('lastSurveyCanceled');
	};

	registerIpcEvents () {
		Renderer.on('init', this.onInit);
		Renderer.on('route', (e: any, route: string) => this.onRoute(route));
		Renderer.on('popup', this.onPopup);
		Renderer.on('checking-for-update', this.onUpdateCheck);
		Renderer.on('update-available', this.onUpdateAvailable);
		Renderer.on('update-confirm', this.onUpdateConfirm);
		Renderer.on('update-not-available', this.onUpdateUnavailable);
		Renderer.on('update-downloaded', () => S.Common.progressClear());
		Renderer.on('update-error', this.onUpdateError);
		Renderer.on('download-progress', this.onUpdateProgress);
		Renderer.on('spellcheck', this.onSpellcheck);
		Renderer.on('enter-full-screen', () => S.Common.fullscreenSet(true));
		Renderer.on('leave-full-screen', () => S.Common.fullscreenSet(false));
		Renderer.on('config', (e: any, config: any) => S.Common.configSet(config, true));
		Renderer.on('enter-full-screen', () => S.Common.fullscreenSet(true));
		Renderer.on('leave-full-screen', () => S.Common.fullscreenSet(false));
		Renderer.on('logout', () => S.Auth.logout(false, false));
		Renderer.on('data-path', (e: any, p: string) => S.Common.dataPathSet(p));
		Renderer.on('will-close-window', this.onWillCloseWindow);

		Renderer.on('shutdownStart', () => {
			this.setState({ isLoading: true });

			Storage.delete('menuSearchText');
			Storage.delete('lastOpenedObject');
		});

		Renderer.on('zoom', () => {
			const resizable = $('.resizable');

			if (resizable.length) {
				resizable.trigger('resizeInit');
			};
		});

		Renderer.on('native-theme', (e: any, isDark: boolean) => {
			S.Common.nativeThemeSet(isDark);
			S.Common.themeSet(S.Common.theme);
		});

		Renderer.on('pin-check', () => {
			keyboard.setPinChecked(false);
			U.Router.go('/auth/pin-check', { replace: true, animate: true });
		});

		Renderer.on('reload', () => {
			Renderer.send('reload', U.Router.getRoute());
		});
	};

	onInit (e: any, data: any) {
		const { dataPath, config, isDark, isChild, account, languages, isPinChecked, css } = data;
		const win = $(window);
		const body = $('body');
		const node = $(this.node);
		const loader = node.find('#root-loader');
		const anim = loader.find('.anim');
		const accountId = Storage.get('accountId');
		const redirect = Storage.get('redirect');
		const route = String(data.route || redirect || '');
		const spaceId = Storage.get('spaceId');

		S.Common.configSet(config, true);
		S.Common.nativeThemeSet(isDark);
		S.Common.themeSet(config.theme);
		S.Common.languagesSet(languages);
		S.Common.dataPathSet(dataPath);

		analytics.init();
		this.initStorage();

		if (redirect) {
			Storage.delete('redirect');
		};

		raf(() => anim.removeClass('from'));

		if (css) {
			U.Common.injectCss('anytype-custom-css', css);
		};

		body.addClass('over');

		const cb = () => {
			window.setTimeout(() => {
				anim.addClass('to');

				window.setTimeout(() => {
					loader.css({ opacity: 0 });
					window.setTimeout(() => { 
						loader.remove(); 
						body.removeClass('over');
					}, 300);
				}, 450);
			}, 1000);
		};

		if (accountId) {
			if (isChild) {
				Renderer.send('keytarGet', accountId).then((phrase: string) => {
					U.Data.createSession(phrase, '', () => {
						keyboard.setPinChecked(isPinChecked);
						S.Common.redirectSet(route);

						if (account) {
							S.Auth.accountSet(account);
							S.Common.configSet(account.config, false);

							if (spaceId) {
								U.Router.switchSpace(spaceId, '', false, cb);
							} else {
								U.Data.onInfo(account.info);
								U.Data.onAuth({}, cb);
							};

							U.Data.onAuthOnce(false);
						};
					});
				});

				win.off('unload').on('unload', (e: any) => {
					if (!S.Auth.token) {
						return;
					};

					e.preventDefault();
					C.WalletCloseSession(S.Auth.token, () => {
						S.Auth.tokenSet('');
						window.close();
					});
					return false;
				});
			} else {
				S.Common.redirectSet(route);
				U.Router.go('/auth/setup/init', { replace: true });
				cb();
			};
		} else {
			cb();
		};
	};

	onWillCloseWindow (e: any, windowId: string) {
		Storage.deleteLastOpenedByWindowId([ windowId ]);
	};

	onPopup (e: any, id: string, param: any, close?: boolean) {
		if (J.Constant.popupPinIds.includes(id) && !keyboard.isPinChecked) {
			return;
		};

		param = param || {};
		param.data = param.data || {};
		param.data.rootId = keyboard.getRootId();

		if (close) {
			S.Popup.closeAll();
		};

		window.setTimeout(() => S.Popup.open(id, param), S.Popup.getTimeout());
	};

	onUpdateCheck (e: any, auto: boolean) {
		if (!auto) {
			S.Common.progressSet({ status: translate('progressUpdateCheck'), current: 0, total: 1, isUnlocked: true });
		};
	};

	onUpdateConfirm (e: any, auto: boolean) {
		S.Common.progressClear();
		Storage.setHighlight('whatsNew', true);

		if (auto) {
			return;
		};

		S.Popup.open('confirm', {
			data: {
				icon: 'update',
				bgColor: 'green',
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
		S.Common.progressClear();

		if (auto) {
			return;
		};

		S.Popup.open('confirm', {
			data: {
				icon: 'update',
				bgColor: 'green',
				title: translate('popupConfirmUpdatePromptTitle'),
				text: translate('popupConfirmUpdatePromptText'),
				textConfirm: translate('commonUpdate'),
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
		S.Common.progressClear();

		if (auto) {
			return;
		};

		S.Popup.open('confirm', {
			data: {
				icon: 'updated',
				bgColor: 'green',
				title: translate('popupConfirmUpdateDoneTitle'),
				text: U.Common.sprintf(translate('popupConfirmUpdateDoneText'), electron.version.app),
				textConfirm: translate('popupConfirmUpdateDoneOk'),
				colorConfirm: 'blank',
				canCancel: false,
			},
		});
	};

	onUpdateError (e: any, err: string, auto: boolean) {
		console.error(err);
		S.Common.progressClear();

		if (auto) {
			return;
		};

		S.Popup.open('confirm', {
			data: {
				icon: 'error',
				bgColor: 'red',
				title: translate('popupConfirmUpdateErrorTitle'),
				text: U.Common.sprintf(translate('popupConfirmUpdateErrorText'), J.Error[err] || err),
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
		S.Common.progressSet({ 
			status: U.Common.sprintf(translate('commonUpdateProgress'), U.File.size(progress.transferred), U.File.size(progress.total)), 
			current: progress.transferred, 
			total: progress.total,
			isUnlocked: true,
		});
	};

	onRoute (route: string) {
		if (keyboard.isMain()) {
			U.Router.go(route, {});
		} else {
			S.Common.redirectSet(route);
		};
	};

	onSpellcheck (e: any, misspelledWord: string, dictionarySuggestions: string[], x: number, y: number, rect: any) {
		if (!misspelledWord) {
			return;
		};

		keyboard.disableContextOpen(true);

		const { focused, range } = focus.state;
		const win = $(window);
		const options: any = dictionarySuggestions.map(it => ({ id: it, name: it }));
		const element = $(document.elementFromPoint(x, y));
		const isInput = element.is('input');
		const isTextarea = element.is('textarea');
		const isEditable = element.is('.editable');

		options.push({ id: 'add-to-dictionary', name: translate('spellcheckAdd') });

		S.Menu.open('select', {
			className: 'fromBlock',
			classNameWrap: 'fromPopup',
			recalcRect: () => rect ? { ...rect, y: rect.y + win.scrollTop() } : null,
			onOpen: () => S.Menu.close('blockContext'),
			onClose: () => keyboard.disableContextOpen(false),
			data: {
				options,
				onSelect: (e: any, item: any) => {
					raf(() => {
						switch (item.id) {
							default: {
								const rootId = keyboard.getRootId();
								const block = S.Block.getLeaf(rootId, focused);

								if (block && block.isText()) {
									const obj = Mark.cleanHtml($(`#block-${focused} #value`).html());
									const value = String(obj.get(0).innerText || '');

									S.Block.updateContent(rootId, focused, { text: value });
									U.Data.blockInsertText(rootId, focused, item.id, range.from, range.to);

									focus.set(focused, { from: range.from, to: range.from + item.id.length });
									focus.apply();
								} else 
								if (isInput || isTextarea || isEditable) {
									let value = '';
									if (isInput || isTextarea) {
										value = String(element.val());
									} else 
									if (isEditable) {
										value = String((element.get(0) as any).innerText || '');
									};
;
									value = value.replace(new RegExp(`${misspelledWord}`, 'g'), item.id);

									if (isInput || isTextarea) {
										element.val(value);
									} else 
									if (isEditable) {
										element.text(value);
									};
								};
								break;
							};

							case 'add-to-dictionary': {
								Renderer.send('spellcheckAdd', misspelledWord);
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
