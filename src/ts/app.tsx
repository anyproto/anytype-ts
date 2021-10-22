import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { enableLogging } from 'mobx-logger';
import { Page, ListMenu, Progress, Tooltip, Preview, Icon } from './component';
import { commonStore, authStore, blockStore, detailStore, dbStore, menuStore, popupStore } from './store';
import { I, C, Util, DataUtil, keyboard, Storage, analytics, dispatcher, translate } from 'ts/lib';
import { throttle } from 'lodash';
import * as Sentry from '@sentry/browser';
import { configure } from "mobx"

configure({ enforceActions: 'never' });

import 'scss/font.scss';
import 'scss/common.scss';
import 'scss/debug.scss';

import 'scss/component/header.scss';
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
import 'scss/component/selection.scss';
import 'scss/component/loader.scss';
import 'scss/component/progress.scss';
import 'scss/component/editor.scss';
import 'scss/component/tooltip.scss';
import 'scss/component/drag.scss';
import 'scss/component/pager.scss';
import 'scss/component/pin.scss';
import 'scss/component/sync.scss';
import 'scss/component/filter.scss';
import 'scss/component/sidebar.scss';
import 'scss/component/list/template.scss';

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

import 'emoji-mart/css/emoji-mart.css';
import 'scss/menu/common.scss';
import 'scss/menu/account.scss';
import 'scss/menu/smile.scss';
import 'scss/menu/help.scss';
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
import 'scss/media/dark.scss';

interface RouteElement { path: string; };
interface Props {};

interface State {
	loading: boolean;
};

const $ = require('jquery');
const path = require('path');
const { app, dialog, process } = window.require('@electron/remote');
const version = app.getVersion();
const userPath = app.getPath('userData');
const { ipcRenderer } = window.require('electron');
const fs = window.require('fs');
const memoryHistory = require('history').createMemoryHistory;
const history = memoryHistory();
const Constant =  require('json/constant.json');

const THROTTLE = 20;
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

/*
enableLogging({
	predicate: () => true,
	action: true,
	reaction: true,
	transaction: true,
	compute: true,
});
*/

console.log('[Version]', version, 'isPackaged', app.isPackaged);

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
	}
};

window.Store = rootStore;
window.Cmd = C;
window.Util = Util;
window.Dispatcher = dispatcher;
window.Analytics = () => { return analytics.instance; };
window.I = I;
window.Go = (route: string) => { history.push(route); };
window.Graph = {};

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
						<ListMenu history={history} />
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
									<Icon className="max" onClick={this.onMax} />
									<Icon className="close" onClick={this.onClose} />
								</div>
							</div>
						</div>

						<Switch>
							{Routes.map((item: RouteElement, i: number) => (
								<Route path={item.path} exact={true} key={i} component={Page} />
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
	
	init () {
		keyboard.init(history);
		DataUtil.init(history);
		Storage.delete('lastSurveyCanceled');

		const cover = Storage.get('cover');
		const coverImg = Storage.get('coverImg');
		const lastSurveyTime = Number(Storage.get('lastSurveyTime')) || 0;
		const redirect = Storage.get('redirect');

		if (!lastSurveyTime) {
			Storage.set('lastSurveyTime', Util.time());
		};

		if (redirect) {
			Storage.set('redirectTo', redirect);
			Storage.delete('redirect');
		};

		cover ? commonStore.coverSet(cover.id, cover.image, cover.type) : commonStore.coverSetDefault();
		if (coverImg) {
			commonStore.coverSetUploadedImage(coverImg);
		};
		
		this.setIpcEvents();
		this.setWindowEvents();
	};

	preload () {
		const prefix = './dist/';
		const fr = new RegExp(/\.png|gif|jpg|svg/);
		
		const readDir = (prefix: string, folder: string) => {
			const fp = path.join(prefix, folder);
			fs.readdir(fp, (err: any, files: string[]) => {
				if (err) {
					return;
				};

				let images: string[] = [];
				for (let file of files) {
					const fn = path.join(fp, file);
					const isDir = fs.lstatSync(fn).isDirectory();
					if (isDir) {
						readDir(fp, file);
					} else 
					if (file.match(fr)) {
						images.push(fn.replace(/^dist\//, ''));
					};
				};
				Util.cacheImages(images);
			});
		};
		readDir(prefix, 'img');
	};

	setIpcEvents () {
		const accountId = Storage.get('accountId');
		const body = $('body');
		const phrase = Storage.get('phrase');
		const node = $(ReactDOM.findDOMNode(this));
		const logo = node.find('#logo');
		const logsDir = path.join(userPath, 'logs');

		try { fs.mkdirSync(logsDir); } catch (err) {};

		ipcRenderer.send('appLoaded', true);

		if (accountId) {
			ipcRenderer.send('keytarGet', accountId);
			ipcRenderer.on('keytarGet', (e: any, key: string, value: string) => {
				if (accountId && (key == accountId)) {
					if (phrase) {
						value = phrase;
						ipcRenderer.send('keytarSet', accountId, phrase);
						Storage.delete('phrase');
					};

					if (value) {
						authStore.phraseSet(value);
						history.push('/auth/setup/init');
					} else {
						Storage.logout();
					};
				};
			});
		};

		ipcRenderer.on('dataPath', (e: any, dataPath: string) => {
			authStore.pathSet(dataPath);
			this.preload();

			window.setTimeout(() => {
				logo.css({ opacity: 0 });
				window.setTimeout(() => {
					this.setState({ loading: false });
				}, 600);
			}, 2000);
		});
		
		ipcRenderer.on('route', (e: any, route: string) => {
			history.push(route);
		});

		ipcRenderer.on('popup', (e: any, id: string, param: any) => {
			param = param || {};
			param.data = param.data || {};
			param.data.rootId = keyboard.getRootId();

			popupStore.closeAll();
			window.setTimeout(() => { popupStore.open(id, param); }, Constant.delay.popup);
		});

		ipcRenderer.on('checking-for-update', (e: any, auto: boolean) => {
			if (!auto) {
				commonStore.progressSet({ status: 'Checking for update...', current: 0, total: 1 });
			};
		});

		ipcRenderer.on('update-available', (e: any, auto: boolean) => {
			commonStore.progressClear(); 

			if (!auto) {
				popupStore.open('confirm', {
					data: {
						title: 'Update available',
						text: 'Do you want to update on a new version?',
						textConfirm: 'Update',
						textCancel: 'Later',
						onConfirm: () => {
							ipcRenderer.send('updateDownload');
						},
						onCancel: () => {
							ipcRenderer.send('updateCancel');
						}, 
					},
				});
			};
		});

		ipcRenderer.on('update-confirm', (e: any, auto: boolean) => {
			commonStore.progressClear(); 

			if (!auto) {
				popupStore.open('confirm', {
					data: {
						title: 'Update available',
						text: 'Do you want to update on a new version?',
						textConfirm: 'Restart and update',
						textCancel: 'Later',
						onConfirm: () => {
							ipcRenderer.send('updateConfirm');
						},
						onCancel: () => {
							ipcRenderer.send('updateCancel');
						}, 
					},
				});
			};
		});

		ipcRenderer.on('update-not-available', (e: any, auto: boolean) => {
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

		ipcRenderer.on('download-progress', this.onProgress);

		ipcRenderer.on('update-downloaded', (e: any, text: string) => {
			Storage.delete('popupNewBlock');
			commonStore.progressClear(); 
		});

		ipcRenderer.on('update-error', (e: any, err: string, auto: boolean) => {
			console.error(err);
			commonStore.progressClear();

			if (!auto) {
				popupStore.open('confirm', {
					data: {
						title: translate('popupConfirmUpdateTitle'),
						text: Util.sprintf(translate('popupConfirmUpdateText'), err),
						textConfirm: 'Retry',
						textCancel: 'Later',
						onConfirm: () => {
							ipcRenderer.send('updateDownload');
						},
						onCancel: () => {
							ipcRenderer.send('updateCancel');
						}, 
					},
				});
			};
		});

		ipcRenderer.on('import', this.onImport);
		ipcRenderer.on('export', this.onExport);

		ipcRenderer.on('command', this.onCommand);

		ipcRenderer.on('config', (e: any, config: any) => { 
			commonStore.configSet(config, true); 
			analytics.init();
		});

		ipcRenderer.on('enter-full-screen', () => {
			body.addClass('fullScreen')
		});

		ipcRenderer.on('leave-full-screen', () => {
			body.removeClass('fullScreen');
		});

		ipcRenderer.on('debugSync', (e: any) => {
			C.DebugSync(100, (message: any) => {
				if (!message.error.code) {
					this.logToFile('sync', message);
				};
			});
		});

		ipcRenderer.on('debugTree', (e: any) => {
			const rootId = keyboard.getRootId();

			C.DebugTree(rootId, logsDir, (message: any) => {
				if (!message.error.code) {
					ipcRenderer.send('pathOpen', logsDir);
				};
			});
		});

		ipcRenderer.on('shutdownStart', (e, relaunch) => {
			this.setState({ loading: true });
		});

		ipcRenderer.on('shutdown', (e, relaunch) => {
			C.Shutdown(() => {
				ipcRenderer.send('shutdown', relaunch);
			});
		});
	};

	logToFile (name: string, message: any) {
		let logsDir = path.join(userPath, 'logs');
		let log = path.join(logsDir, name + '_' + Util.dateForFile() + '.json');
		try {
			fs.writeFileSync(log, JSON.stringify(message, null, 5), 'utf-8');
		} catch(e) {
			console.log('[DebugSync] Failed to save a file');
		};

		ipcRenderer.send('pathOpen', logsDir);
	};

	setWindowEvents () {
		const win = $(window);

		win.unbind('mousemove.common beforeunload.common blur.common');
		
		win.on('mousemove.common', throttle((e: any) => {
			keyboard.initPinCheck();
			keyboard.disableMouse(false);
			keyboard.setCoords(e);
		}, THROTTLE));
		
		win.on('blur.common', () => {
			Util.tooltipHide(true);
			Util.previewHide(true);
		});
	};

	onCommand (e: any, key: string) {
		const rootId = keyboard.getRootId();

		let options: any = {};

		switch (key) {
			case 'undo':
				C.BlockUndo(rootId);
				break;

			case 'redo':
				C.BlockRedo(rootId);
				break;

			case 'create':
				keyboard.pageCreate();
				break;

			case 'save':
				options = { 
					properties: [ 'openDirectory' ],
				};

				dialog.showOpenDialog(options).then((result: any) => {
					const files = result.filePaths;
					if ((files == undefined) || !files.length) {
						return;
					};

					C.Export(files[0], [ rootId ], I.ExportFormat.Protobuf, true, (message: any) => {
						if (message.error.code) {
							return;
						};

						ipcRenderer.send('pathOpen', files[0]);
					});
				});
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

					C.ExportTemplates(files[0], (message: any) => {
						if (message.error.code) {
							return;
						};

						ipcRenderer.send('pathOpen', files[0]);
					});
				});
				break;
		};
	};

	onProgress (e: any, progress: any) {
		commonStore.progressSet({ 
			status: Util.sprintf('Downloading update... %s/%s', Util.fileSize(progress.transferred), Util.fileSize(progress.total)), 
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
		ipcRenderer.send('winCommand', 'menu');
	};

	onMin (e: any) {
		ipcRenderer.send('winCommand', 'minimize');
	};

	onMax (e: any) {
		ipcRenderer.send('winCommand', 'maximize');
	};

	onClose (e: any) {
		ipcRenderer.send('winCommand', 'close');
	};

};

export default App;