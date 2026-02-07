import React, { FC, useState, useRef, useEffect, useCallback } from 'react';
import * as hs from 'history';
import * as Sentry from '@sentry/browser';
import $ from 'jquery';
import raf from 'raf';
import { RouteComponentProps } from 'react-router';
import { Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { configure, spy } from 'mobx';
import { enableLogging } from 'mobx-logger';
import { Page, SelectionProvider, DragProvider, Progress, Toast, Preview as PreviewIndex, ListPopup, ListMenu, ListNotification, UpdateBanner, SidebarLeft } from 'Component';
import { I, C, S, U, J, M, keyboard, Storage, analytics, dispatcher, translate, Renderer, focus, Preview, Animation, Onboarding, Survey, Encode, Decode, sidebar, Action } from 'Lib';

configure({ enforceActions: 'never' });

import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism.css';
import 'css/theme/dark/prism.css';
import 'react-virtualized/styles.css';
import 'swiper/css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import 'scss/common.scss';

const memoryHistory = hs.createMemoryHistory;
const history = memoryHistory();
const electron = U.Common.getElectron();
const isPackaged = electron.isPackaged;

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
			M,
			J,
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
			Action,
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
	dsn: SENTRY_DSN,
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

const RoutePage: FC<RouteComponentProps> = (props) => {

	return <Page {...props} isPopup={false} />;

};

const App: FC = () => {

	const [ isLoading, setIsLoading ] = useState(true);
	const nodeRef = useRef(null);

	const init = () => {
		const { version, arch, getGlobal, tabId } = electron;

		U.Router.init(history);
		U.Smile.init();

		console.log('[App] Init', getGlobal('serverAddress'));

		dispatcher.init(getGlobal('serverAddress'));
		keyboard.init();
		registerIpcEvents();
		Renderer.send('getInitData', tabId()).then((data: any) => onInit(data));

		console.log('[Process] os version:', version.system, 'arch:', arch);
		console.log('[App] version:', version.app, 'isPackaged', isPackaged);
	};

	const registerIpcEvents = () => {
		unregisterIpcEvents();

		Renderer.on('route', (e: any, route: string) => onRoute(route));
		Renderer.on('popup', onPopup);
		Renderer.on('update-not-available', onUpdateUnavailable);
		Renderer.on('update-downloaded', onUpdateDownloaded);
		Renderer.on('update-error', onUpdateError);
		Renderer.on('download-progress', onUpdateProgress);
		Renderer.on('spellcheck', onSpellcheck);
		Renderer.on('pin-set', () => S.Common.pinInit());
		Renderer.on('pin-remove', () => S.Common.pinInit());
		Renderer.on('enter-full-screen', () => S.Common.fullscreenSet(true));
		Renderer.on('leave-full-screen', () => S.Common.fullscreenSet(false));
		Renderer.on('config', (e: any, config: any) => S.Common.configSet(config, true));
		Renderer.on('logout', () => S.Auth.logout(false, false));
		Renderer.on('data-path', (e: any, p: string) => S.Common.dataPathSet(p));
		Renderer.on('close-session', onCloseSession);
		Renderer.on('set-single-tab', (e: any, v: boolean) => {
			S.Common.singleTabSet(v);
			keyboard.setBodyClass();
		});
		Renderer.on('notification-callback', onNotificationCallback);
		Renderer.on('payload-broadcast', onPayloadBroadcast);

		Renderer.on('shutdownStart', () => {
			setIsLoading(true);
			Storage.delete('menuSearchText');
		});

		Renderer.on('zoom', () => {
			sidebar.resizePage(false, null, null, false);
			sidebar.resizePage(true, null, null, false);
		});

		Renderer.on('native-theme', (e: any, isDark: boolean) => {
			S.Common.nativeThemeSet(isDark);
			S.Common.themeSet(S.Common.theme);
		});

		Renderer.on('set-theme', (e: any, theme: string) => {
			S.Common.themeSet(theme);
		});

		Renderer.on('pin-check', () => {
			if (!S.Common.pin) {
				return;
			};

			S.Common.redirectSet(U.Router.getRoute());
			keyboard.setPinChecked(false);
			U.Router.go('/auth/pin-check', {});
		});

		Renderer.on('reload', () => {
			Renderer.send('reload', U.Router.getRoute());
		});

		Renderer.on('power-event', (e: any, state: string) => {
			C.AppSetDeviceState(state == 'suspend' ? I.AppDeviceState.Background : I.AppDeviceState.Foreground);
		});
	};
	
	const unregisterIpcEvents = () => {
		Renderer.remove('init');
		Renderer.remove('route');
		Renderer.remove('popup');
		Renderer.remove('update-not-available');
		Renderer.remove('update-downloaded');
		Renderer.remove('update-error');
		Renderer.remove('download-progress');
		Renderer.remove('spellcheck');
		Renderer.remove('pin-set');
		Renderer.remove('pin-remove');
		Renderer.remove('enter-full-screen');
		Renderer.remove('leave-full-screen');
		Renderer.remove('config');
		Renderer.remove('logout');
		Renderer.remove('data-path');
		Renderer.remove('will-close-window');
		Renderer.remove('shutdownStart');
		Renderer.remove('zoom');
		Renderer.remove('native-theme');
		Renderer.remove('pin-check');
		Renderer.remove('reload');
		Renderer.remove('power-event');
	};

	const onInit = (data: any) => {
		data = data || {};

		const { id, dataPath, config, isDark, languages, isPinChecked, css, isSingleTab } = data;
		const body = $('body');
		const node = $(nodeRef.current);
		const bubbleLoader = $('#bubble-loader');
		const rootLoader = node.find('#root-loader');
		const anim = rootLoader.find('.anim');
		const accountId = Storage.get('accountId');
		const redirect = Storage.get('redirect');
		const route = String(data.route || redirect || '');
		const tabId = electron.tabId();

		if (config) {
			S.Common.configSet(config, true);
			S.Common.themeSet(config.theme);
		};

		S.Common.nativeThemeSet(isDark);
		S.Common.languagesSet(languages);
		S.Common.dataPathSet(dataPath);
		S.Common.windowIdSet(id);
		S.Common.tabIdSet(tabId);
		S.Common.setLeftSidebarState('vault', '');
		S.Common.singleTabSet(isSingleTab);

		U.Data.updateTabsDimmer();

		Action.checkDefaultSpellingLang();
		keyboard.setBodyClass();

		sidebar.init(false);
		analytics.init();

		if (redirect) {
			Storage.delete('redirect');
		};

		if (css && !config.disableCss) {
			U.Common.injectCss('anytype-custom-css', css);
		};

		body.addClass('over');

		const hide = () => {
			rootLoader.remove();
			bubbleLoader.remove();
			body.removeClass('over');
		};
		const routeParam = { replace: true, onFadeIn: hide };

		const cb = () => {
			const t = 300;

			bubbleLoader.css({ transitionDuration: `${t}ms` });
			bubbleLoader.addClass('inflate');
			anim.css({ transitionDuration: `${t}ms` });

			window.setTimeout(() => {
				raf(() => anim.removeClass('from'));
				window.setTimeout(() => {
					anim.addClass('to');

					window.setTimeout(() => {
						rootLoader.css({ opacity: 0 });
						window.setTimeout(() => hide(), t);
					}, 0);
				}, t * 5);
			}, t * 3);
		};

		const onObtainToken = (token: string) => {
			if (!token) {
				return;
			};

			S.Auth.tokenSet(token);
			C.AccountSelect(accountId, '', 0, '', (message: any) => {
				if (message.error.code) {
					console.error('[App.onInit]:', message.error.description);
					return;
				};

				const { account } = message;

				if (!account) {
					console.error('[App.onInit]: Account not found');
					return;
				};

				keyboard.setPinChecked(isPinChecked);
				S.Auth.accountSet(account);
				S.Common.redirectSet(route);
				S.Common.configSet(account.config, false);

				U.Data.onInfo(account.info);
				S.Common.spaceSet('');
				U.Data.onAuthOnce();

				const param = route ? U.Router.getParam(route) : {};
				const spaceId = param.spaceId || Storage.get('spaceId');

				if (spaceId) {
					U.Router.switchSpace(spaceId, '', false, routeParam, true);
				} else {
					U.Router.go('/main/void/select', routeParam);
				};
			});
		};

		if (!accountId) {
			U.Router.go('/auth/select', { replace: true, onFadeIn: cb });
			return;
		};

		Renderer.send('getTab', tabId).then((tab: any) => {
			if (tab && tab.token) {
				onObtainToken(tab.token);
			} else {
				Renderer.send('keytarGet', accountId).then((phrase: string) => {
					// If phrase is null/empty (can happen on Windows after sleep/reboot when
					// Credential Manager fails), redirect to login
					if (!phrase) {
						console.warn('[App] Failed to retrieve phrase from keychain, redirecting to login');
						S.Common.redirectSet(route);
						U.Router.go('/auth/setup/init', routeParam);
						return;
					};

					U.Data.createSession(phrase, '', '', (message: any) => {
						if (message.error.code) {
							S.Common.redirectSet(route);
							U.Router.go('/auth/setup/init', routeParam);
							return;
						};

						onObtainToken(message.token);
					});
				}).catch((err: any) => {
					console.error('[App] Error retrieving phrase from keychain:', err);
					S.Common.redirectSet(route);
					U.Router.go('/auth/setup/init', routeParam);
				});
			};
		});
	};

	const onCloseSession = (e: any, tabId: string) => {
		const currentTabId = electron.tabId();

		U.Data.closeSession(() => {
			Renderer.sendIpc('tab-session-closed', tabId || currentTabId);
		});
	};

	const onNotificationCallback = (e: any, cmd: string, payload: any) => {
		switch (cmd) {
			case 'openChat': {
				U.Object.openRoute(payload);
				analytics.event('OpenChatFromNotification');
				break;
			};
		};
	};

	const onPayloadBroadcast = (e: any, payload: any) => {
		switch (payload.type) {
			case 'openObject': {
				const { object } = payload;

				U.Object.openAuto(object);
				analytics.createObject(object.type, object.layout, analytics.route.webclipper, 0);
				break;
			};

			case 'analyticsEvent': {
				const { code, param } = payload;

				analytics.event(code, param);
				break;
			};
		};
	};

	const onPopup = (e: any, id: string, param: any, close?: boolean) => {
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

	const onUpdateDownloaded = (e: any, info: any) => {
		console.log('[App.onUpdateDownloaded]', info);
		S.Common.updateVersionSet(info?.version);
		S.Progress.delete(I.ProgressType.Update);
	};

	const onUpdateUnavailable = (e: any, auto: boolean) => {
		if (auto) {
			return;
		};

		S.Popup.open('confirm', {
			data: {
				icon: 'updated',
				title: translate('popupConfirmUpdateDoneTitle'),
				text: U.String.sprintf(translate('popupConfirmUpdateDoneText'), electron.version.app),
				textConfirm: translate('popupConfirmUpdateDoneOk'),
				colorConfirm: 'blank',
				canCancel: false,
			},
		});
	};

	const onUpdateError = (e: any, err: string, auto: boolean) => {
		console.error(err);
		S.Common.updateVersionSet('');
		S.Progress.delete(I.ProgressType.Update);

		if (auto) {
			return;
		};

		S.Popup.open('confirm', {
			data: {
				icon: 'error',
				title: translate('popupConfirmUpdateErrorTitle'),
				text: U.String.sprintf(translate('popupConfirmUpdateErrorText'), J.Error[err] || err),
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

		analytics.event('UpgradeVersionError');
	};

	const onUpdateProgress = (e: any, progress: any) => {
		S.Progress.update({ 
			id: I.ProgressType.Update,
			type: I.ProgressType.Update,
			current: progress.transferred, 
			total: progress.total,
		});
	};

	const onRoute = (route: string) => {
		if (keyboard.isMain()) {
			U.Router.go(route, {});
		} else {
			S.Common.redirectSet(route);
		};
	};

	const onSpellcheck = (e: any, misspelledWord: string, dictionarySuggestions: string[], x: number, y: number, rect: any) => {
		U.Menu.spellcheck(misspelledWord, dictionarySuggestions, x, y, rect);
	};

	useEffect(() => {
		init();

		return () => {
			unregisterIpcEvents();
		};
	}, []);

	const sidebarLeftRef = useCallback(ref => S.Common.refSet('sidebarLeft', ref), []);
	
	return (
		<Router history={history}>
			<Provider {...S}>
				<div id="appContainer" ref={nodeRef}>
					{isLoading ? (
						<div id="root-loader" className="loaderWrapper">
							<div className="inner">
								<div className="logo anim from" />
								<div className="version anim from">{electron.version.app}</div>
							</div>
						</div>
					) : ''}

					<div id="dragPanel" />
					<div id="tooltipContainer" />
					<div id="globalFade" />

					<PreviewIndex />
					<Progress />
					<Toast />
					<ListNotification key="listNotification" />

					<SelectionProvider ref={ref => S.Common.refSet('selectionProvider', ref)}>
						<DragProvider ref={ref => S.Common.refSet('dragProvider', ref)}>
							<SidebarLeft ref={sidebarLeftRef} />
							<UpdateBanner />
							<ListPopup />
							<ListMenu />

							<Switch>
								{J.Route.map((path: string, i: number) => (
									<Route path={path} exact={true} key={i} component={RoutePage} />
								))}
							</Switch>
						</DragProvider>
					</SelectionProvider>
				</div>
			</Provider>
		</Router>
	);

};

export default App;
