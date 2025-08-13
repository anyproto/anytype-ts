import React, { FC, useState, useRef, useEffect } from 'react';
import * as hs from 'history';
import * as Sentry from '@sentry/browser';
import $ from 'jquery';
import raf from 'raf';
import { RouteComponentProps } from 'react-router';
import { Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { configure, spy } from 'mobx';
import { enableLogging } from 'mobx-logger';
import { Page, SelectionProvider, DragProvider, Progress, Toast, Preview as PreviewIndex, ListPopup, ListMenu, ListNotification, SidebarLeft, Vault, Loader } from 'Component';
import { I, C, S, U, J, M, keyboard, Storage, analytics, dispatcher, translate, Renderer, focus, Preview, Mark, Animation, Onboarding, Survey, Encode, Decode, sidebar, Action } from 'Lib';
import CanvasWorkerBridge from 'Component/page/auth/animation/canvasWorkerBridge';

require('pdfjs-dist/build/pdf.worker.entry.js');

configure({ enforceActions: 'never' });

import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism.css';
import 'react-virtualized/styles.css';
import 'swiper/scss';
import 'react-pdf/dist/cjs/Page/AnnotationLayer.css';
import 'react-pdf/dist/cjs/Page/TextLayer.css';
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

const RoutePage: FC<RouteComponentProps> = (props) => {

	const { page, action } = (props.match?.params || {}) as any;
	const noSidebar = 
		[ 'auth', 'object', 'invite', 'membership' ].includes(page) || 
		((page == 'main') && [ 'blank', 'object', 'invite', 'membership' ].includes(action));

	return (
		<SelectionProvider ref={ref => S.Common.refSet('selectionProvider', ref)}>
			<DragProvider ref={ref => S.Common.refSet('dragProvider', ref)}>
				<ListPopup key="listPopup" {...props} />
				<ListMenu key="listMenu" {...props} />

				{!noSidebar ? <SidebarLeft ref={ref => S.Common.refSet('sidebarLeft', ref)} key="sidebarLeft" {...props} /> : ''}
				<Page {...props} isPopup={false} />
			</DragProvider>
		</SelectionProvider>
	);

};

const App: FC = () => {

	const [ isLoading, setIsLoading ] = useState(false);
	const nodeRef = useRef(null);
	const drag = U.Common.isPlatformMac() ? <div id="drag" /> : '';

	const init = () => {
		const { version, arch, getGlobal } = electron;

		U.Router.init(history);
		U.Smile.init();

		dispatcher.init(getGlobal('serverAddress'));
		keyboard.init();

		registerIpcEvents();
		Renderer.send('appOnLoad');

		console.log('[Process] os version:', version.system, 'arch:', arch);
		console.log('[App] version:', version.app, 'isPackaged', isPackaged);
	};

	const registerIpcEvents = () => {
		Renderer.on('init', onInit);
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
		Renderer.on('will-close-window', onWillCloseWindow);

		Renderer.on('shutdownStart', () => {
			setIsLoading(true);
			Storage.delete('menuSearchText');
		});

		Renderer.on('zoom', () => {
			const resizable = $('.resizable');

			sidebar.resizePage(null, null, false);

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

	const onInit = (e: any, data: any) => {
		const { id, dataPath, config, isDark, isChild, languages, isPinChecked, css, token } = data;
		const win = $(window);
		const body = $('body');
		const node = $(nodeRef.current);
		const loader = node.find('#root-loader');
		const anim = loader.find('.anim');
		const accountId = Storage.get('accountId');
		const redirect = Storage.get('redirect');
		const route = String(data.route || redirect || '');

		S.Common.configSet(config, true);
		S.Common.nativeThemeSet(isDark);
		S.Common.themeSet(config.theme);
		S.Common.languagesSet(languages);
		S.Common.dataPathSet(dataPath);
		S.Common.windowIdSet(id);

		Action.checkDefaultSpellingLang();

		analytics.init();

		if (redirect) {
			Storage.delete('redirect');
		};

		if (css && !config.disableCss) {
			U.Common.injectCss('anytype-custom-css', css);
		};

		body.addClass('over');

		const hide = () => {
			loader.remove(); 
			body.removeClass('over');
		};

		const cb = () => {
			raf(() => anim.removeClass('from'));

			window.setTimeout(() => {
				anim.addClass('to');

				window.setTimeout(() => {
					loader.css({ opacity: 0 });
					window.setTimeout(() => hide(), 300);
				}, 450);
			}, 1000);
		};

		if (accountId) {
			if (isChild) {
				U.Data.createSession('', '', token, () => {
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

						const spaceId = Storage.get('spaceId');
						const routeParam = { 
							replace: true, 
							onRouteChange: hide,
						};

						if (spaceId) {
							U.Router.switchSpace(spaceId, '', false, routeParam, true);
						} else {
							U.Data.onAuthWithoutSpace(routeParam);
						};

						U.Data.onInfo(account.info);
						U.Data.onAuthOnce(false);
					});
				});

				win.off('unload').on('unload', (e: any) => {
					if (!S.Auth.token) {
						return;
					};

					e.preventDefault();
					U.Data.closeSession(() => window.close());
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

	const onWillCloseWindow = (e: any, windowId: string) => {
		Storage.deleteLastOpenedByWindowId([ windowId ]);
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
				text: U.Common.sprintf(translate('popupConfirmUpdateDoneText'), electron.version.app),
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
		if (!misspelledWord) {
			return;
		};

		keyboard.disableContextOpen(true);

		const { focused } = focus.state;
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

									// Find the first occurrence of the misspelled word in the value
									const wordIndex = value.indexOf(misspelledWord);
									if (wordIndex >= 0) {
										U.Data.blockInsertText(
											rootId,
											focused,
											item.id,
											wordIndex,
											wordIndex + misspelledWord.length
										);

										focus.set(focused, { from: wordIndex, to: wordIndex + item.id.length });
										focus.apply();
									};
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
								Action.setSpellingLang([]);
								break;
							};
						};
					});
				},
			}
		});
	};

	useEffect(() => init(), []);
	
	return (
		<Router history={history}>
			<Provider {...S}>
				<div ref={nodeRef}>
					{isLoading ? (
						<div id="root-loader" className="loaderWrapper">
							<div className="inner">
								<div className="logo anim from" />
								<div className="version anim from">{electron.version.app}</div>
							</div>
						</div>
					) : ''}

					{drag}
					<div id="floaterContainer" />
					<div id="tooltipContainer" />

					<div id="globalFade">
						<Loader id="loader" />
					</div>

					<PreviewIndex />
					<Progress />
					<Toast />
					<ListNotification key="listNotification" />
					<Vault ref={ref => S.Common.refSet('vault', ref)} />

					<Switch>
						{J.Route.map((path: string, i: number) => (
							<Route path={path} exact={true} key={i} component={RoutePage} />
						))}
					</Switch>

					<CanvasWorkerBridge ref={ref => S.Common.refSet('mainAnimation', ref)} state={0} />
				</div>
			</Provider>
		</Router>
	);

};

export default App;
