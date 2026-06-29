import React, { FC, useState, useRef, useEffect, useCallback } from 'react';
import * as hs from 'history';
import * as Sentry from '@sentry/browser';
import raf from 'raf';
import { RouteComponentProps } from 'react-router';
import { Router, Route, Switch } from 'react-router-dom';
import { configure } from 'mobx';
import { Page, SelectionProvider, DragProvider, Toast, Preview as PreviewIndex, ListPopup, ListMenu, ListNotification, UpdateBanner, SidebarLeft } from 'Component';
import { scheduleReaction, clearReactionQueue } from 'Lib/reactionScheduler';
import * as I from 'Interface';
import * as M from 'Model';
import Storage from 'Lib/storage';
import Animation from 'Lib/animation';

configure({ enforceActions: 'never', reactionScheduler: (f) => scheduleReaction(f) });

import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism.css';
import 'css/theme/dark/prism.css';
import 'react-virtualized/styles.css';
import 'swiper/css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import 'scss/common.scss';

const memoryHistory = hs.createMemoryHistory;
const history = (window as any).__anytypeHistory || memoryHistory();
(window as any).__anytypeHistory = history;
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
		AnytypeGlobalConfig: I.AppConfig;
	}
};

declare global {
};

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
	maxBreadcrumbs: 20,
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

		U.Perf.step('boot:init', 'boot:entry');

		U.Router.init(history);
		U.Smile.init();

		// Keep <html> class in sync with history even if React Router's subscription
		// gets desynced (e.g. after HMR module swaps). Without this, the tree can end
		// up on the wrong page after an HMR full-reload with the tab route restored.
		history.listen(() => keyboard.setBodyClass());

		if (window.isWebVersion) {
			import('./lib/web/routeSync').then(({ initRouteSync }) => initRouteSync(history, U.Router));
		}

		keyboard.init();
		registerIpcEvents();

		const startWithAddress = (address: string) => {
			console.log('[App] Init', address);

			U.Perf.step('boot:server', 'boot:init');

			dispatcher.init(address);
			Renderer.send('getInitData', tabId()).then((data: any) => {
				U.Perf.step('boot:init-data', 'boot:init');
				onInit(data);
			});
		};

		// Windows are created in parallel with middleware startup: use the
		// address directly when the server is already up (also covers web
		// mode), otherwise await it from the main process
		const address = getGlobal('serverAddress');

		if (address) {
			startWithAddress(address);
		} else {
			// Rejection means the middleware failed to start — the main process
			// shows an error dialog in that case
			Renderer.send('getServerAddress').then(startWithAddress).catch((err: any) => {
				console.error('[App] Server failed to start:', err);
			});
		};

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
		Renderer.on('download-started', onDownloadStarted);
		Renderer.on('download-progress', onUpdateProgress);
		Renderer.on('spellcheck', onSpellcheck);
		Renderer.on('pin-set', () => S.Common.pinInit());
		Renderer.on('pin-remove', () => S.Common.pinInit());
		Renderer.on('pin-unlocked', () => {
			const wasPinChecked = keyboard.isPinChecked;

			keyboard.isPinChecked = true;

			if (wasPinChecked) {
				return;
			};

			const { redirect } = S.Common;
			const { account } = S.Auth;

			if (account) {
				redirect ? U.Router.go(redirect, {}) : U.Space.openDashboard();
			};

			S.Common.redirectSet('');
		});
		Renderer.on('enter-full-screen', () => S.Common.fullscreenSet(true));
		Renderer.on('leave-full-screen', () => S.Common.fullscreenSet(false));
		Renderer.on('config', (e: any, config: any) => S.Common.configSet(config, true));
		Renderer.on('logout', () => S.Auth.logout(false, false));
		Renderer.on('data-path', (e: any, p: string) => S.Common.dataPathSet(p));
		Renderer.on('close-session', onCloseSession);
		Renderer.on('set-pinned', (e: any, v: boolean) => S.Common.isPinnedSet(v));
		Renderer.on('set-single-tab', (e: any, v: boolean) => {
			S.Common.singleTabSet(v);
			keyboard.setBodyClass();
		});
		Renderer.on('notification-callback', onNotificationCallback);
		Renderer.on('payload-broadcast', onPayloadBroadcast);
		Renderer.on('set-active-tab', (e: any, id: string) => {
			const isActive = id === S.Common.tabId;

			S.Common.isActiveTabSet(isActive);

			if (isActive) {
				U.Data.updateTabsDimmer();
			};
		});

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

		Renderer.on('set-hide-sidebar', (e: any, v: boolean) => {
			S.Common.hideSidebarSet(v);
			sidebar.init(false);
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

		Renderer.on('tab-show-tooltip', (e: any, data: any) => U.Common.tabTooltipShow(data));
		Renderer.on('tab-hide-tooltip', () => U.Common.tabTooltipHide());
		Renderer.on('analytics', (e: any, code: string, data?: any) => analytics.event(code, data));
	};
	
	const unregisterIpcEvents = () => {
		Renderer.remove('init');
		Renderer.remove('route');
		Renderer.remove('popup');
		Renderer.remove('update-not-available');
		Renderer.remove('update-downloaded');
		Renderer.remove('update-error');
		Renderer.remove('download-started');
		Renderer.remove('download-progress');
		Renderer.remove('spellcheck');
		Renderer.remove('pin-set');
		Renderer.remove('pin-remove');
		Renderer.remove('pin-unlocked');
		Renderer.remove('enter-full-screen');
		Renderer.remove('leave-full-screen');
		Renderer.remove('config');
		Renderer.remove('logout');
		Renderer.remove('data-path');
		Renderer.remove('will-close-window');
		Renderer.remove('shutdownStart');
		Renderer.remove('zoom');
		Renderer.remove('native-theme');
		Renderer.remove('set-pinned');
		Renderer.remove('pin-check');
		Renderer.remove('reload');
		Renderer.remove('power-event');
		Renderer.remove('tab-show-tooltip');
		Renderer.remove('tab-hide-tooltip');
		Renderer.remove('set-active-tab');
		Renderer.remove('analytics');
	};

	const onInit = (data: any) => {
		data = data || {};

		const { id, dataPath, config, isDark, languages, isPinChecked, isPinned, css, isSingleTab, activeTabId } = data;
		const body = document.body;
		const node = nodeRef.current;
		const bubbleLoader = U.Dom.get('bubble-loader');
		const rootLoader = U.Dom.select('#root-loader', node);
		const anim = U.Dom.select('.anim', rootLoader);
		const accountId = Storage.get('accountId');
		const redirect = Storage.get('redirect');
		const tabId = electron.tabId();

		// Validate tab route — don't restore blank/void/auth routes
		let route = String(data.route || redirect || '');

		if (route) {
			const rp = U.Router.getParam(route);
			if (
				(rp.page == 'auth') ||
				((rp.page == 'main') && [ 'blank', 'void' ].includes(rp.action))
			) {
				route = '';
			};
		};

		if (config) {
			S.Common.configSet(config, true);
			S.Common.themeSet(config.theme);
		};

		S.Common.nativeThemeSet(isDark);
		S.Common.languagesSet(languages);
		S.Common.dataPathSet(dataPath);
		S.Common.windowIdSet(id);
		S.Common.tabIdSet(tabId);
		S.Common.isActiveTabSet(activeTabId === tabId);
		S.Common.setLeftSidebarState('vault', '');
		S.Common.isPinnedSet(isPinned || false);
		S.Common.singleTabSet(isSingleTab);

		U.Data.updateTabsDimmer();

		Action.checkDefaultSpellingLang();
		keyboard.setBodyClass();

		sidebar.init(false);
		analytics.init();

		U.Perf.step('boot:stores', 'boot:init-data');

		const lastAppVersion = Storage.get('lastAppVersion');
		const currentAppVersion = electron.version?.app;

		if (lastAppVersion && currentAppVersion && (lastAppVersion !== currentAppVersion)) {
			analytics.event('UpgradeVersion');
		};

		if (currentAppVersion) {
			Storage.set('lastAppVersion', currentAppVersion);
		};

		if (redirect) {
			Storage.delete('redirect');
		};

		if (css && !config.disableCss) {
			U.Dom.injectCss('anytype-custom-css', css);
		};

		U.Dom.addClass(body, 'over');

		let measured = false;
		const hide = () => {
			if (!measured) {
				measured = true;
				U.Perf.step('boot:ready', 'boot:entry');
			};

			rootLoader?.remove();
			bubbleLoader?.remove();
			U.Dom.removeClass(body, 'over');
		};
		const routeParam = { replace: true, onRouteChange: hide };

		const cb = () => {
			const t = 300;

			if (bubbleLoader) {
				U.Dom.css(bubbleLoader, { transitionDuration: `${t}ms` });
				U.Dom.addClass(bubbleLoader, 'inflate');
			};
			if (anim) {
				U.Dom.css(anim, { transitionDuration: `${t}ms` });
			};

			window.setTimeout(() => {
				raf(() => U.Dom.removeClass(anim, 'from'));
				window.setTimeout(() => {
					U.Dom.addClass(anim, 'to');

					window.setTimeout(() => {
						if (rootLoader) U.Dom.css(rootLoader, { opacity: '0' });
						window.setTimeout(() => hide(), t);
					}, 0);
				}, t * 5);
			}, t * 3);
		};

		const onObtainToken = (token: string) => {
			if (!token) {
				S.Common.redirectSet(route);
				U.Router.go('/auth/setup/init', routeParam);
				return;
			};

			const { dataPath } = S.Common;
			const { networkConfig } = S.Auth;
			const { mode, path: networkPath } = networkConfig;
			const param = route ? U.Router.getParam(route) : {};
			const spaceId = param.spaceId || data.spaceId || Storage.getAccountKey('spaceId', false, accountId) || '';

			S.Auth.tokenSet(token);
			C.AccountSelect(accountId, dataPath, mode, networkPath, spaceId, (message: any) => {
				if (message.error.code) {
					console.error('[App.onInit]:', message.error.description);
					S.Common.redirectSet(route);
					U.Router.go('/auth/setup/init', routeParam);
					return;
				};

				const { account } = message;

				if (!account) {
					console.error('[App.onInit]: Account not found');
					S.Common.redirectSet(route);
					U.Router.go('/auth/setup/init', routeParam);
					return;
				};

				U.Perf.step('boot:account', 'boot:init');

				keyboard.setPinChecked(isPinChecked);
				S.Auth.accountSet(account);
				S.Common.redirectSet(route);
				S.Common.configSet(account.config, false);

				U.Data.onInfo(account.info);
				S.Common.spaceSet('');
				U.Data.onAuthOnce();

				if (spaceId) {
					U.Router.switchSpace(spaceId, route, false, routeParam, true);
				} else {
					U.Data.onAuthWithoutSpace(routeParam);
				};
			});
		};

		if (!accountId) {
			U.Router.go('/auth/select', { replace: true, onRouteChange: cb });
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

		clearReactionQueue();
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
				iconParam: { name: 'popup/header/updated', color: 'lime' },
				title: translate('popupConfirmUpdateDoneTitle'),
				text: U.String.sprintf(translate('popupConfirmUpdateDoneText'), electron.version.app),
				textConfirm: translate('popupConfirmUpdateDoneOk'),
				colorConfirm: 'blank',
				canCancel: false,
			},
		});
	};

	const onDownloadStarted = () => {
		analytics.event('StartUpgradeDownload');
	};

	const onUpdateError = (e: any, err: string, auto: boolean, isDownloading: boolean) => {
		console.error(err);
		S.Common.updateVersionSet('');
		S.Progress.delete(I.ProgressType.Update);

		if (auto) {
			return;
		};

		S.Popup.open('confirm', {
			data: {
				iconParam: { name: 'popup/header/error', color: 'orange' },
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

		analytics.event('UpgradeVersionError', { type: isDownloading ? 'Download' : 'CheckFailed' });
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

					<PreviewIndex />
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
		</Router>
	);

};

export default App;
