import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { enableLogging } from 'mobx-logger';
import { Page, SelectionProvider, DragProvider, Progress, Tooltip, Preview, Icon, ListPopup, ListMenu } from './component';
import { commonStore, authStore, blockStore, detailStore, dbStore, menuStore, popupStore } from './store';
import { I, C, Util, FileUtil, keyboard, Storage, analytics, dispatcher, translate, Action } from 'ts/lib';
import * as Sentry from '@sentry/browser';
import { configure } from 'mobx';

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
import 'scss/page/main/store.scss';
import 'scss/page/main/media.scss';
import 'scss/page/main/graph.scss';
import 'scss/page/main/navigation.scss';

import 'scss/block/common.scss';
import 'scss/block/dataview.scss';
import 'scss/block/dataview/cell.scss';
import 'scss/block/dataview/view/common.scss';
import 'scss/block/dataview/view/grid.scss';
import 'scss/block/dataview/view/board.scss';
import 'scss/block/dataview/view/list.scss';
import 'scss/block/dataview/view/gallery.scss';
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
import 'scss/menu/dataview/object.scss';
import 'scss/menu/dataview/calendar.scss';
import 'scss/menu/dataview/option.scss';
import 'scss/menu/dataview/file.scss';
import 'scss/menu/dataview/text.scss';
import 'scss/menu/dataview/view.scss';
import 'scss/menu/dataview/source.scss';

import 'scss/media/print.scss';

import 'scss/theme/dark/common.scss';

interface RouteElement { path: string; };
interface Props {};

interface State {
	loading: boolean;
};

const $ = require('jquery');
const path = require('path');
const { app, dialog, process, BrowserWindow } = window.require('@electron/remote');
const version = app.getVersion();
const userPath = app.getPath('userData');
const fs = window.require('fs');
const hs = require('history');
const memoryHistory = hs.createMemoryHistory;
const history = memoryHistory();
const Constant =  require('json/constant.json');
const Error = require('json/error.json');

const Routes: RouteElement[] = require('json/route.json');
const rootStore = {
	commonStore,
	authStore,
	blockStore,
	detailStore,
	dbStore,
	menuStore,
	popupStore,
};

console.log('[OS Version]', process.getSystemVersion());
console.log('[APP Version]', version, 'isPackaged', app.isPackaged, 'Arch', process.arch);

/*
enableLogging({
	predicate: () => true,
	action: true,
	reaction: true,
	transaction: true,
	compute: true,
});
*/

Sentry.init({
	release: version,
	environment: (app.isPackaged ? 'production' : 'development'),
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

declare global {
	interface Window { 
		Store: any; 
		Cmd: any; 
		Util: any;
		Dispatcher: any;
		Analytics: any;
		I: any;
		Go: any;
		Graph: any;
		$: any;

		isWebVersion: boolean;
		Config: any;
		Renderer: any;
	}
};

window.Store = rootStore;
window.Cmd = C;
window.Dispatcher = dispatcher;
window.Analytics = () => { return analytics.instance; };
window.I = I;
window.Go = (route: string) => { Util.route(route); };
window.$ = $;

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

		this.onImport = this.onImport.bind(this);
		this.onProgress = this.onProgress.bind(this);
		this.onCommand = this.onCommand.bind(this);
		this.onMenu = this.onMenu.bind(this);
		this.onMin = this.onMin.bind(this);
		this.onMax = this.onMax.bind(this);
		this.onClose = this.onClose.bind(this);
	};
	
	render () {
		const { loading } = this.state;
		const isMaximized = BrowserWindow.getFocusedWindow()?.isMaximized();
		
		if (loading) {
			return (
				<div id="loader" className="loaderWrapper">
					<div id="logo" className="logo" />
				</div>
			);
		};

		return (
			<Router history={history}>
				<Provider {...rootStore}>
					<div>
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
		keyboard.init();
		analytics.init();
		
		this.setIpcEvents();
	};

	initStorage () {
		const cover = Storage.get('cover');
		const lastSurveyTime = Number(Storage.get('lastSurveyTime')) || 0;
		const redirect = Storage.get('redirect');
		const accountId = Storage.get('accountId');
		const phrase = Storage.get('phrase');
		const renderer = Util.getRenderer();
		const restoreKeys = [
			'pinTime', 'defaultType', 'autoSidebar', 'timezone',
		];

		// Check auth phrase with keytar
		if (accountId) {
			renderer.send('keytarGet', accountId);
			renderer.on('keytarGet', (e: any, key: string, value: string) => {
				if (accountId && (key == accountId)) {
					if (phrase) {
						value = phrase;
						renderer.send('keytarSet', accountId, phrase);
						Storage.delete('phrase');
					};

					if (value) {
						authStore.phraseSet(value);
						Util.route('/auth/setup/init', true);
					} else {
						Storage.logout();
					};
				};
			});
		};

		if (!lastSurveyTime) {
			Storage.set('lastSurveyTime', Util.time());
		};

		if (redirect) {
			Storage.set('redirectTo', redirect);
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

	setIpcEvents () {
		const node = $(ReactDOM.findDOMNode(this));
		const logo = node.find('#logo');
		const logsDir = path.join(userPath, 'logs');
		const renderer = Util.getRenderer();

		try { fs.mkdirSync(logsDir); } catch (err) {};

		renderer.send('appLoaded', true);

		renderer.on('init', (e: any, dataPath: string, config: any, isDark: boolean) => {
			authStore.walletPathSet(dataPath);
			authStore.accountPathSet(dataPath);

			Storage.init(dataPath);

			this.initStorage();

			commonStore.nativeThemeSet(isDark);
			commonStore.configSet(config, true);
			commonStore.themeSet(config.theme);

			this.initTheme(config.theme);

			window.setTimeout(() => {
				logo.css({ opacity: 0 });
				window.setTimeout(() => { this.setState({ loading: false }); }, 600);
			}, 2000);
		});
		
		renderer.on('route', (e: any, route: string) => {
			Util.route(route);
		});

		renderer.on('popup', (e: any, id: string, param: any, close?: boolean) => {
			param = param || {};
			param.data = param.data || {};
			param.data.rootId = keyboard.getRootId();

			if (close) {
				popupStore.closeAll();
			};
			
			window.setTimeout(() => { popupStore.open(id, param); }, Constant.delay.popup);
		});

		renderer.on('checking-for-update', (e: any, auto: boolean) => {
			if (!auto) {
				commonStore.progressSet({ 
					status: 'Checking for update...', 
					current: 0, 
					total: 1, 
					isUnlocked: true 
				});
			};
		});

		renderer.on('update-available', (e: any, auto: boolean) => {
			commonStore.progressClear(); 

			if (!auto) {
				popupStore.open('confirm', {
					data: {
						title: 'Update available',
						text: 'Do you want to update on a new version?',
						textConfirm: 'Update',
						textCancel: 'Later',
						onConfirm: () => {
							renderer.send('updateDownload');
						},
						onCancel: () => {
							renderer.send('updateCancel');
						}, 
					},
				});
			};
		});

		renderer.on('update-confirm', (e: any, auto: boolean) => {
			commonStore.progressClear(); 

			if (!auto) {
				popupStore.open('confirm', {
					data: {
						title: 'Update available',
						text: 'Do you want to update on a new version?',
						textConfirm: 'Restart and update',
						textCancel: 'Later',
						onConfirm: () => {
							renderer.send('updateConfirm');
							Storage.delete('popupNewBlock');
						},
						onCancel: () => {
							renderer.send('updateCancel');
						}, 
					},
				});
			};
		});

		renderer.on('update-not-available', (e: any, auto: boolean) => {
			commonStore.progressClear(); 

			if (!auto) {
				popupStore.open('confirm', {
					data: {
						title: 'You are up-to-date',
						text: Util.sprintf('You are on the latest version: %s', version),
						textConfirm: 'Great!',
						canCancel: false,
					},
				});
			};
		});

		renderer.on('download-progress', this.onProgress);

		renderer.on('update-downloaded', (e: any, text: string) => {
			commonStore.progressClear(); 
		});

		renderer.on('update-error', (e: any, err: string, auto: boolean) => {
			console.error(err);
			commonStore.progressClear();

			if (!auto) {
				popupStore.open('confirm', {
					data: {
						title: translate('popupConfirmUpdateErrorTitle'),
						text: Util.sprintf(translate('popupConfirmUpdateErrorText'), Error[err] || err),
						textConfirm: 'Retry',
						textCancel: 'Later',
						onConfirm: () => {
							renderer.send('updateDownload');
						},
						onCancel: () => {
							renderer.send('updateCancel');
						}, 
					},
				});
			};
		});

		renderer.on('import', this.onImport);
		renderer.on('export', this.onExport);
		renderer.on('command', this.onCommand);

		renderer.on('config', (e: any, config: any) => { 
			commonStore.configSet(config, true);
			this.initTheme(config.theme);
		});

		renderer.on('enter-full-screen', () => {
			commonStore.fullscreenSet(true);
		});

		renderer.on('leave-full-screen', () => {
			commonStore.fullscreenSet(false);
		});

		renderer.on('native-theme', (e: any, isDark: boolean) => {
			commonStore.nativeThemeSet(isDark);
			commonStore.themeSet(commonStore.theme);
  		});

		renderer.on('debugSync', (e: any) => {
			C.DebugSync(100, (message: any) => {
				if (!message.error.code) {
					this.logToFile('sync', message);
				};
			});
		});

		renderer.on('debugTree', (e: any) => {
			const rootId = keyboard.getRootId();

			C.DebugTree(rootId, logsDir, (message: any) => {
				if (!message.error.code) {
					renderer.send('pathOpen', logsDir);
				};
			});
		});

		renderer.on('shutdownStart', (e, relaunch) => {
			this.setState({ loading: true });
		});

		renderer.on('shutdown', (e, relaunch) => {
			C.AppShutdown(() => {
				renderer.send('shutdown', relaunch);
			});
		});
	};

	logToFile (name: string, message: any) {
		const logsDir = path.join(userPath, 'logs');
		const log = path.join(logsDir, name + '_' + FileUtil.date() + '.json');
		const renderer = Util.getRenderer();

		try {
			fs.writeFileSync(log, JSON.stringify(message, null, 5), 'utf-8');
		} catch(e) {
			console.log('[DebugSync] Failed to save a file');
		};

		renderer.send('pathOpen', logsDir);
	};

	onCommand (e: any, key: string) {
		const rootId = keyboard.getRootId();
		const renderer = Util.getRenderer();

		let options: any = {};

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
				options = { 
					properties: [ 'openDirectory' ],
				};

				dialog.showOpenDialog(options).then((result: any) => {
					const files = result.filePaths;
					if ((files == undefined) || !files.length) {
						return;
					};

					C.TemplateExportAll(files[0], (message: any) => {
						if (message.error.code) {
							return;
						};

						renderer.send('pathOpen', files[0]);
					});
				});
				break;

			case 'exportLocalstore':
				options = { 
					properties: [ 'openDirectory' ],
				};

				dialog.showOpenDialog(options).then((result: any) => {
					const files = result.filePaths;
					if ((files == undefined) || !files.length) {
						return;
					};

					C.DebugExportLocalstore(files[0], [], (message: any) => {
						if (message.error.code) {
							return;
						};

						renderer.send('pathOpen', files[0]);
					});
				});
				break;
		};
	};

	onProgress (e: any, progress: any) {
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
		const renderer = Util.getRenderer();
		renderer.send('winCommand', 'menu');
	};

	onMin (e: any) {
		const renderer = Util.getRenderer();
		renderer.send('winCommand', 'minimize');
	};

	onMax (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const icon = node.find('#minmax');
		const renderer = Util.getRenderer();
		const isMaximized = BrowserWindow.getFocusedWindow().isMaximized();

		icon.removeClass('max window');
		!isMaximized ? icon.addClass('max') : icon.addClass('window');
		renderer.send('winCommand', 'maximize');
	};

	onClose (e: any) {
		const renderer = Util.getRenderer();
		renderer.send('winCommand', 'close');
	};

};

export default App;