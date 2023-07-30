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
import { Page, SelectionProvider, DragProvider, Progress, Toast, Preview as PreviewIndex, Navigation, ListPopup, ListMenu } from './component';
import { commonStore, authStore, blockStore, detailStore, dbStore, menuStore, popupStore } from './store';
import { 
	I, C, UtilCommon, UtilFile, UtilData, UtilObject, UtilMenu, keyboard, Storage, analytics, dispatcher, translate, Renderer, 
	focus, Preview, Mark, Animation, Onboarding, Survey
} from 'Lib';
import * as Docs from 'Docs';

configure({ enforceActions: 'never' });

import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism.css';
import 'react-virtualized/styles.css';
import 'emoji-mart/css/emoji-mart.css';

import 'scss/common.scss';
import 'scss/debug.scss';
import 'scss/font.scss';

import 'scss/component/cover.scss';
import 'scss/component/deleted.scss';
import 'scss/component/dragbox.scss';
import 'scss/component/dragLayer.scss';
import 'scss/component/dotIndicator.scss';
import 'scss/component/editor.scss';
import 'scss/component/emptySearch.scss';
import 'scss/component/error.scss';
import 'scss/component/footer.scss';
import 'scss/component/frame.scss';
import 'scss/component/header.scss';
import 'scss/component/headSimple.scss';
import 'scss/component/icon.scss';
import 'scss/component/iconObject.scss';
import 'scss/component/loader.scss';
import 'scss/component/pager.scss';
import 'scss/component/progress.scss';
import 'scss/component/selection.scss';
import 'scss/component/sidebar.scss';
import 'scss/component/sync.scss';
import 'scss/component/tag.scss';
import 'scss/component/title.scss';
import 'scss/component/toast.scss';
import 'scss/component/tooltip.scss';
import 'scss/component/navigation.scss';

import 'scss/component/preview/common.scss';
import 'scss/component/preview/link.scss';
import 'scss/component/preview/object.scss';

import 'scss/component/media/audio.scss';
import 'scss/component/media/video.scss';

import 'scss/component/hightlight.scss';
import 'scss/component/progressBar.scss';

import 'scss/page/auth.scss';
import 'scss/page/main/edit.scss';
import 'scss/page/main/graph.scss';
import 'scss/page/main/history.scss';
import 'scss/page/main/media.scss';
import 'scss/page/main/navigation.scss';
import 'scss/page/main/relation.scss';
import 'scss/page/main/set.scss';
import 'scss/page/main/space.scss';
import 'scss/page/main/store.scss';
import 'scss/page/main/type.scss';
import 'scss/page/main/archive.scss';
import 'scss/page/main/graph.scss';
import 'scss/page/main/navigation.scss';
import 'scss/page/main/block.scss';
import 'scss/page/main/empty.scss';
import 'scss/page/main/usecase.scss';

import 'scss/block/bookmark.scss';
import 'scss/block/common.scss';
import 'scss/block/cover.scss';
import 'scss/block/dataview.scss';
import 'scss/block/dataview/cell.scss';
import 'scss/block/dataview/view/board.scss';
import 'scss/block/dataview/view/common.scss';
import 'scss/block/dataview/view/gallery.scss';
import 'scss/block/dataview/view/grid.scss';
import 'scss/block/dataview/view/list.scss';
import 'scss/block/div.scss';
import 'scss/block/featured.scss';
import 'scss/block/file.scss';
import 'scss/block/iconPage.scss';
import 'scss/block/iconUser.scss';
import 'scss/block/latex.scss';
import 'scss/block/layout.scss';
import 'scss/block/link.scss';
import 'scss/block/media.scss';
import 'scss/block/relation.scss';
import 'scss/block/table.scss';
import 'scss/block/tableOfContents.scss';
import 'scss/block/text.scss';
import 'scss/block/type.scss';

import 'scss/form/button.scss';
import 'scss/form/drag.scss';
import 'scss/form/filter.scss';
import 'scss/form/input.scss';
import 'scss/form/inputWithFile.scss';
import 'scss/form/phrase.scss';
import 'scss/form/pin.scss';
import 'scss/form/select.scss';
import 'scss/form/switch.scss';
import 'scss/form/textarea.scss';

import 'scss/list/object.scss';
import 'scss/list/widget.scss';
import 'scss/list/previewObject.scss';
import 'scss/list/objectManager.scss';

import 'scss/widget/common.scss';
import 'scss/widget/space.scss';
import 'scss/widget/list.scss';
import 'scss/widget/tree.scss';

import 'scss/popup/common.scss';
import 'scss/popup/confirm.scss';
import 'scss/popup/export.scss';
import 'scss/popup/help.scss';
import 'scss/popup/page.scss';
import 'scss/popup/preview.scss';
import 'scss/popup/prompt.scss';
import 'scss/popup/search.scss';
import 'scss/popup/settings.scss';
import 'scss/popup/shortcut.scss';
import 'scss/popup/template.scss';
import 'scss/popup/migration.scss';
import 'scss/popup/pin.scss';

import 'scss/menu/common.scss';
import 'scss/menu/button.scss';
import 'scss/menu/common.scss';
import 'scss/menu/help.scss';
import 'scss/menu/onboarding.scss';
import 'scss/menu/relation.scss';
import 'scss/menu/select.scss';
import 'scss/menu/smile.scss';
import 'scss/menu/thread.scss';
import 'scss/menu/type.scss';
import 'scss/menu/widget.scss';

import 'scss/menu/account/path.scss';

import 'scss/menu/search/object.scss';
import 'scss/menu/search/text.scss';

import 'scss/menu/preview/object.scss';

import 'scss/menu/block/common.scss';
import 'scss/menu/block/context.scss';
import 'scss/menu/block/cover.scss';
import 'scss/menu/block/icon.scss';
import 'scss/menu/block/latex.scss';
import 'scss/menu/block/link.scss';
import 'scss/menu/block/linkSettings.scss';
import 'scss/menu/block/mention.scss';
import 'scss/menu/block/relation.scss';

import 'scss/menu/dataview/calendar.scss';
import 'scss/menu/dataview/common.scss';
import 'scss/menu/dataview/create/bookmark.scss';
import 'scss/menu/dataview/file.scss';
import 'scss/menu/dataview/filter.scss';
import 'scss/menu/dataview/group.scss';
import 'scss/menu/dataview/object.scss';
import 'scss/menu/dataview/option.scss';
import 'scss/menu/dataview/relation.scss';
import 'scss/menu/dataview/sort.scss';
import 'scss/menu/dataview/source.scss';
import 'scss/menu/dataview/text.scss';
import 'scss/menu/dataview/view.scss';

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
		Electron: any;
		Store: any;
		$: any;
		Lib: any;
		Graph: any;

		isWebVersion: boolean;
		Config: any;
		Renderer: any;
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
};

window.Store = rootStore;
window.$ = $;
window.Lib = {
	I,
	C,
	UtilCommon,
	UtilData,
	UtilFile,
	UtilObject,
	UtilMenu,
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
	release: window.Electron.version.app,
	environment: window.Electron.isPackaged ? 'production' : 'development',
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
					<ListPopup key='listPopup' {...this.props} />
					<ListMenu key='listMenu' {...this.props} />

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
									<div className="version anim from">{window.Electron.version.app}</div>
								</div>
							</div>
						) : ''}

						<PreviewIndex />
						<Progress />
						<Toast />
						<Navigation />

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

	componentDidUpdate () {
	};

	init () {
		UtilCommon.init(history);

		dispatcher.init(window.Electron.getGlobal('serverAddress'));
		keyboard.init();

		this.registerIpcEvents();
		Renderer.send('appOnLoad');

		console.log('[Process] os version:', window.Electron.version.system, 'arch:', window.Electron.arch);
		console.log('[App] version:', window.Electron.version.app, 'isPackaged', window.Electron.isPackaged);
	};

	initStorage () {
		const lastSurveyTime = Number(Storage.get('lastSurveyTime')) || 0;

		if (!lastSurveyTime) {
			Storage.set('lastSurveyTime', UtilCommon.time());
		};

		Storage.delete('lastSurveyCanceled');
	};

	registerIpcEvents () {
		Renderer.on('init', this.onInit);
		Renderer.on('keytarGet', this.onKeytarGet);
		Renderer.on('route', (e: any, route: string) => UtilCommon.route(route, {}));
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
		Renderer.on('enter-full-screen', () => { commonStore.fullscreenSet(true); });
		Renderer.on('leave-full-screen', () => { commonStore.fullscreenSet(false); });
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
					commonStore.redirectSet(route || redirect || '');
					keyboard.setPinChecked(isPinChecked);

					UtilData.onAuth(account, {}, cb);
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
			UtilCommon.route('/auth/setup/init', { replace: true });
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
				text: UtilCommon.sprintf(translate('popupConfirmUpdateDoneText'), window.Electron.version.app),
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
								Renderer.send('setLanguage', []);
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
