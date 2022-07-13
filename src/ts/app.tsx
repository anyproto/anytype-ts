import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { enableLogging } from 'mobx-logger';
import { Page, SelectionProvider, DragProvider, Progress, Tooltip, Preview, Icon, ListPopup, ListMenu } from './component';
import { commonStore, authStore, blockStore, detailStore, dbStore, menuStore, popupStore } from './store';
import { I, C, Util, FileUtil, keyboard, Storage, analytics, dispatcher, translate, Action, Renderer, DataUtil } from 'ts/lib';
import * as Sentry from '@sentry/browser';
import { configure, spy } from 'mobx';

configure({ enforceActions: 'never' });

import 'react-virtualized/styles.css';
import 'katex/dist/katex.min.css';

import 'prismjs/themes/prism.css';

import 'scss/font.scss';
import 'scss/common.scss';
import 'scss/debug.scss';

import 'scss/component/header.scss';
import 'scss/component/headSimple.scss';
import 'scss/component/footer.scss';
import 'scss/component/cover.scss';
import 'scss/component/input.scss';
import 'scss/component/inputWithFile.scss';
import 'scss/component/button.scss';
import 'scss/component/icon.scss';
import 'scss/component/iconObject.scss';
import 'scss/component/textarea.scss';
import 'scss/component/error.scss';
import 'scss/component/frame.scss';
import 'scss/component/switch.scss';
import 'scss/component/title.scss';
import 'scss/component/select.scss';
import 'scss/component/tag.scss';
import 'scss/component/dragLayer.scss';
import 'scss/component/dragbox.scss';
import 'scss/component/selection.scss';
import 'scss/component/loader.scss';
import 'scss/component/deleted.scss';
import 'scss/component/progress.scss';
import 'scss/component/editor.scss';
import 'scss/component/tooltip.scss';
import 'scss/component/drag.scss';
import 'scss/component/pager.scss';
import 'scss/component/pin.scss';
import 'scss/component/sync.scss';
import 'scss/component/filter.scss';
import 'scss/component/sidebar.scss';
import 'scss/component/list/previewObject.scss';

import 'scss/component/preview/common.scss';
import 'scss/component/preview/link.scss';
import 'scss/component/preview/object.scss';

import 'scss/page/auth.scss';
import 'scss/page/main/index.scss';
import 'scss/page/main/edit.scss';
import 'scss/page/main/history.scss';
import 'scss/page/main/set.scss';
import 'scss/page/main/space.scss';
import 'scss/page/main/type.scss';
import 'scss/page/main/relation.scss';
import 'scss/page/main/media.scss';
import 'scss/page/main/bookmark.scss';
import 'scss/page/main/store.scss';
import 'scss/page/main/graph.scss';
import 'scss/page/main/navigation.scss';

import 'scss/block/common.scss';
import 'scss/block/text.scss';
import 'scss/block/media.scss';
import 'scss/block/file.scss';
import 'scss/block/link.scss';
import 'scss/block/bookmark.scss';
import 'scss/block/div.scss';
import 'scss/block/layout.scss';
import 'scss/block/iconPage.scss';
import 'scss/block/iconUser.scss';
import 'scss/block/cover.scss';
import 'scss/block/relation.scss';
import 'scss/block/featured.scss';
import 'scss/block/type.scss';
import 'scss/block/latex.scss';
import 'scss/block/table.scss';
import 'scss/block/tableOfContents.scss';
import 'scss/block/dataview.scss';
import 'scss/block/dataview/cell.scss';
import 'scss/block/dataview/view/common.scss';
import 'scss/block/dataview/view/grid.scss';
import 'scss/block/dataview/view/board.scss';
import 'scss/block/dataview/view/list.scss';
import 'scss/block/dataview/view/gallery.scss';

import 'scss/popup/common.scss';
import 'scss/popup/settings.scss';
import 'scss/popup/search.scss';
import 'scss/popup/prompt.scss';
import 'scss/popup/preview.scss';
import 'scss/popup/help.scss';
import 'scss/popup/shortcut.scss';
import 'scss/popup/confirm.scss';
import 'scss/popup/page.scss';
import 'scss/popup/template.scss';
import 'scss/popup/export.scss';
import 'scss/popup/video.scss';

import 'emoji-mart/css/emoji-mart.css';
import 'scss/menu/common.scss';
import 'scss/menu/account.scss';
import 'scss/menu/smile.scss';
import 'scss/menu/help.scss';
import 'scss/menu/onboarding.scss';
import 'scss/menu/select.scss';
import 'scss/menu/button.scss';
import 'scss/menu/thread.scss';
import 'scss/menu/type.scss';
import 'scss/menu/relation.scss';

import 'scss/menu/search/text.scss';
import 'scss/menu/search/object.scss';

import 'scss/menu/preview/object.scss';

import 'scss/menu/block/context.scss';
import 'scss/menu/block/common.scss';
import 'scss/menu/block/link.scss';
import 'scss/menu/block/linkSettings.scss';
import 'scss/menu/block/icon.scss';
import 'scss/menu/block/cover.scss';
import 'scss/menu/block/mention.scss';
import 'scss/menu/block/relation.scss';
import 'scss/menu/block/latex.scss';

import 'scss/menu/dataview/common.scss';
import 'scss/menu/dataview/sort.scss';
import 'scss/menu/dataview/filter.scss';
import 'scss/menu/dataview/relation.scss';
import 'scss/menu/dataview/group.scss';
import 'scss/menu/dataview/object.scss';
import 'scss/menu/dataview/calendar.scss';
import 'scss/menu/dataview/option.scss';
import 'scss/menu/dataview/file.scss';
import 'scss/menu/dataview/text.scss';
import 'scss/menu/dataview/view.scss';
import 'scss/menu/dataview/source.scss';
import 'scss/menu/dataview/create/bookmark.scss';

import 'scss/media/print.scss';

import 'scss/theme/dark/common.scss';

const $ = require('jquery');
const path = require('path');
const hs = require('history');
const memoryHistory = hs.createMemoryHistory;
const history = memoryHistory();
const Constant =  require('json/constant.json');
const Error = require('json/error.json');

const Routes: RouteElement[] = require('json/route.json');

interface RouteElement { path: string; };
interface Props {};

interface State {
	loading: boolean;
};

declare global {
	interface Window { 
		Electron: any;
		Store: any; 
		$: any;
		Lib: any;

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
	Util,
	analytics,
	dispatcher,
	keyboard,
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
	environment: (window.Electron.isPackaged ? 'production' : 'development'),
	dsn: Constant.sentry,
	maxBreadcrumbs: 0,
	beforeSend: (e: any) => {
		e.request.url = '';
		return e;
	},
	integrations: [
		new Sentry.Integrations.GlobalHandlers({
			onerror: true,
			onunhandledrejection: true
		})
	]
});

class RoutePage extends React.Component<RouteComponentProps, {}> { 

	constructor (props: any) {
		super(props);
	};

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

class App extends React.Component<Props, State> {
	
	state = {
		loading: true
	};

	constructor (props: any) {
		super(props);

		this.onInit = this.onInit.bind(this);
		this.onKeytarGet = this.onKeytarGet.bind(this);
		this.onImport = this.onImport.bind(this);
		this.onPopup = this.onPopup.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
		this.onUpdateConfirm = this.onUpdateConfirm.bind(this);
		this.onUpdateAvailable = this.onUpdateAvailable.bind(this);
		this.onUpdateUnavailable = this.onUpdateUnavailable.bind(this);
		this.onUpdateProgress = this.onUpdateProgress.bind(this);
		this.onUpdateError = this.onUpdateError.bind(this);
		this.onCommand = this.onCommand.bind(this);
		this.onMenu = this.onMenu.bind(this);
		this.onMin = this.onMin.bind(this);
		this.onMax = this.onMax.bind(this);
		this.onClose = this.onClose.bind(this);
	};
	
	render () {
		const { loading } = this.state;
		const isMaximized = window.Electron.isMaximized();
		
		return (
			<Router history={history}>
				<Provider {...rootStore}>
					<div>
						{loading ? (
							<div id="root-loader" className="loaderWrapper">
								<div id="logo" className="logo" />
							</div>
						) : ''}

						<Preview />
						<Progress />
						<Tooltip />
						
						<div id="drag">
							<div className="sides">
								<div className="side left">
									<Icon className="menu" onClick={this.onMenu} />
									<div className="name">{translate('commonTitle')}</div>
								</div>

								<div className="side right">
									<Icon className="min" onClick={this.onMin} />
									<Icon id="minmax" className={isMaximized ? 'window' : 'max'} onClick={this.onMax} />
									<Icon className="close" onClick={this.onClose} />
								</div>
							</div>
						</div>

						<Switch>
							{Routes.map((item: RouteElement, i: number) => (
								<Route path={item.path} exact={true} key={i} component={RoutePage} />
							))}
							<Redirect to='/main/index' />
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
		this.initTheme(commonStore.theme);
	};
	
	init () {
		Util.init(history);

		dispatcher.init();
		keyboard.init();
		analytics.init();
		
		this.registerIpcEvents();
		Renderer.send('appOnLoad');

		console.log('[Process] os version:', window.Electron.version.system, 'arch:', window.Electron.arch);
		console.log('[App] version:', window.Electron.version.app, 'isPackaged', window.Electron.isPackaged);
	};

	initStorage () {
		const cover = Storage.get('cover');
		const lastSurveyTime = Number(Storage.get('lastSurveyTime')) || 0;
		const redirect = Storage.get('redirect');
		const restoreKeys = [ 'pinTime', 'defaultType', 'autoSidebar' ];

		if (!lastSurveyTime) {
			Storage.set('lastSurveyTime', Util.time());
		};

		if (redirect) {
			commonStore.redirectSet(redirect);
			Storage.delete('redirect');
		};

		Storage.delete('lastSurveyCanceled');

		cover ? commonStore.coverSet(cover.id, cover.image, cover.type) : commonStore.coverSetDefault();

		restoreKeys.forEach((it: string) => {
			commonStore[Util.toCamelCase(it + '-Set')](Storage.get(it));
		});
	};

	initTheme (theme: string) {
		const head = $('head');

		head.find('#link-prism').remove();

		if (theme == 'system') {
			theme = commonStore.nativeTheme;
		};

		if (theme) {
			head.append(`<link id="link-prism" rel="stylesheet" href="./css/theme/${theme}/prism.css" />`);
		};

		Util.addBodyClass('theme', theme);
	};

	registerIpcEvents () {
		Renderer.on('init', this.onInit);
		Renderer.on('keytarGet', this.onKeytarGet);
		Renderer.on('route', (e: any, route: string) => { Util.route(route); });
		Renderer.on('popup', this.onPopup);
		Renderer.on('checking-for-update', this.onUpdate);
		Renderer.on('update-available', this.onUpdateAvailable);
		Renderer.on('update-confirm', this.onUpdateConfirm);
		Renderer.on('update-not-available', this.onUpdateUnavailable);
		Renderer.on('download-progress', this.onUpdateProgress);
		Renderer.on('update-downloaded', (e: any, text: string) => { commonStore.progressClear(); });
		Renderer.on('update-error', this.onUpdateError);
		Renderer.on('import', this.onImport);
		Renderer.on('export', this.onExport);
		Renderer.on('command', this.onCommand);
		Renderer.on('enter-full-screen', () => { commonStore.fullscreenSet(true); });
		Renderer.on('leave-full-screen', () => { commonStore.fullscreenSet(false); });
		Renderer.on('shutdownStart', (e: any) => { this.setState({ loading: true }); });

		Renderer.on('config', (e: any, config: any) => { 
			commonStore.configSet(config, true);
			this.initTheme(config.theme);
		});

		Renderer.on('native-theme', (e: any, isDark: boolean) => {
			commonStore.nativeThemeSet(isDark);
			commonStore.themeSet(commonStore.theme);
  		});
	};

	onInit (e: any, dataPath: string, config: any, isDark: boolean, windowData: any) {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const loader = node.find('#root-loader');
		const logo = loader.find('#logo');
		const accountId = Storage.get('accountId');

		commonStore.configSet(config, true);
		commonStore.nativeThemeSet(isDark);
		commonStore.themeSet(config.theme);

		authStore.walletPathSet(dataPath);
		authStore.accountPathSet(dataPath);

		this.initStorage();
		this.initTheme(config.theme);

		const cb = () => {
			logo.css({ opacity: 0 });
			window.setTimeout(() => { loader.css({ opacity: 0 }); }, 500);
			window.setTimeout(() => { loader.remove(); }, 1000);
		};

		if (accountId) {
			if (windowData.isChild) {
				authStore.phraseSet(windowData.phrase);

				DataUtil.createSession(() => {
					commonStore.redirectSet(windowData.route || '');
					DataUtil.onAuth(windowData.account, cb);
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
			Util.route('/auth/setup/init', true);
		} else {
			Storage.logout();
		};
	};

	onPopup (e: any, id: string, param: any, close?: boolean) {
		param = param || {};
		param.data = param.data || {};
		param.data.rootId = keyboard.getRootId();

		if (close) {
			popupStore.closeAll();
		};
		
		window.setTimeout(() => { popupStore.open(id, param); }, Constant.delay.popup);
	};

	onUpdate (e: any, auto: boolean) {
		if (auto) {
			return;
		};

		commonStore.progressSet({ 
			status: 'Checking for update...', 
			current: 0, 
			total: 1, 
			isUnlocked: true 
		});
	};

	onUpdateConfirm (e: any, auto: boolean) {
		commonStore.progressClear(); 

		if (auto) {
			return;
		};

		popupStore.open('confirm', {
			data: {
				title: 'Update available',
				text: 'Do you want to update on a new version?',
				textConfirm: 'Restart and update',
				textCancel: 'Later',
				onConfirm: () => {
					Renderer.send('updateConfirm');
					Storage.delete('popupNewBlock');
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
				title: 'Update available',
				text: 'Do you want to update on a new version?',
				textConfirm: 'Update',
				textCancel: 'Later',
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
				title: 'You are up-to-date',
				text: Util.sprintf('You are on the latest version: %s', window.Electron.version.app),
				textConfirm: 'Great!',
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
				text: Util.sprintf(translate('popupConfirmUpdateErrorText'), Error[err] || err),
				textConfirm: 'Retry',
				textCancel: 'Later',
				onConfirm: () => {
					Renderer.send('updateDownload');
				},
				onCancel: () => {
					Renderer.send('updateCancel');
				}, 
			},
		});
	};

	onCommand (e: any, key: string) {
		const rootId = keyboard.getRootId();
		const logPath = this.getLogPath();
		const options: any = {};

		switch (key) {
			case 'undo':
				keyboard.onUndo(rootId);
				break;

			case 'redo':
				keyboard.onRedo(rootId);
				break;

			case 'create':
				keyboard.pageCreate();
				break;

			case 'saveAsHTML':
				keyboard.onSaveAsHTML();
				break;

			case 'saveAsHTMLSuccess':
				keyboard.printRemove();
				break;

			case 'save':
				Action.export([ rootId ], I.ExportFormat.Protobuf, true, true, true);
				break;

			case 'exportTemplates':
				options.properties = [ 'openDirectory' ];

				window.Electron.showOpenDialog(options).then((result: any) => {
					const files = result.filePaths;
					if ((files == undefined) || !files.length) {
						return;
					};

					C.TemplateExportAll(files[0], (message: any) => {
						if (message.error.code) {
							return;
						};

						Renderer.send('pathOpen', files[0]);
					});
				});
				break;

			case 'exportLocalstore':
				options.properties = [ 'openDirectory' ];

				window.Electron.showOpenDialog.showOpenDialog(options).then((result: any) => {
					const files = result.filePaths;
					if ((files == undefined) || !files.length) {
						return;
					};

					C.DebugExportLocalstore(files[0], [], (message: any) => {
						if (!message.error.code) {
							Renderer.send('pathOpen', files[0]);
						};
					});
				});
				break;

			case 'debugSync':
				C.DebugSync(100);
				break;

			case 'debugTree':
				C.DebugTree(rootId, logPath, (message: any) => {
					if (!message.error.code) {
						Renderer.send('pathOpen', logPath);
					};
				});
				break;

		};
	};

	onUpdateProgress (e: any, progress: any) {
		commonStore.progressSet({ 
			status: Util.sprintf('Downloading update... %s/%s', FileUtil.size(progress.transferred), FileUtil.size(progress.total)), 
			current: progress.transferred, 
			total: progress.total,
			isUnlocked: true,
		});
	};

	onImport () {
		popupStore.open('settings', {
			data: { page: 'importIndex' }
		});
	};

	onExport () {
		popupStore.open('settings', {
			data: { page: 'exportMarkdown' }
		});
	};

	onMenu (e: any) {
		Renderer.send('winCommand', 'menu');
	};

	onMin (e: any) {
		Renderer.send('winCommand', 'minimize');
	};

	onMax (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const icon = node.find('#minmax');
		const isMaximized = window.Electron.isMaximized();

		icon.removeClass('max window');
		!isMaximized ? icon.addClass('max') : icon.addClass('window');
		Renderer.send('winCommand', 'maximize');
	};

	onClose (e: any) {
		Renderer.send('winCommand', 'close');
	};

	getLogPath () {
		return path.join(window.Electron.userPath, 'logs');
	};

};

export default App;