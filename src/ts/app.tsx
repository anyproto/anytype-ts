import { hot } from 'react-hot-loader/root';
import * as React from 'react';
import { Router, Route } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { enableLogging } from 'mobx-logger';
import { Page, ListPopup, ListMenu, Progress, Tooltip, Loader, LinkPreview, Icon } from './component';
import { commonStore, authStore, blockStore, dbStore } from './store';
import { I, C, Util, DataUtil, keyboard, Storage, analytics, dispatcher, translate } from 'ts/lib';
import { throttle } from 'lodash';
import * as Sentry from '@sentry/browser';

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
import 'scss/component/linkPreview.scss';
import 'scss/component/drag.scss';
import 'scss/component/pager.scss';
import 'scss/component/pin.scss';
import 'scss/component/sync.scss';

import 'scss/page/auth.scss';
import 'scss/page/main/index.scss';
import 'scss/page/main/edit.scss';
import 'scss/page/main/history.scss';
import 'scss/page/main/set.scss';
import 'scss/page/main/objectType.scss';
import 'scss/page/main/relation.scss';

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

import 'scss/popup/common.scss';
import 'scss/popup/settings.scss';
import 'scss/popup/archive.scss';
import 'scss/popup/navigation.scss';
import 'scss/popup/search.scss';
import 'scss/popup/prompt.scss';
import 'scss/popup/preview.scss';
import 'scss/popup/help.scss';
import 'scss/popup/shortcut.scss';
import 'scss/popup/feedback.scss';
import 'scss/popup/confirm.scss';
import 'scss/popup/store.scss';
import 'scss/popup/editor/page.scss';

import 'emoji-mart/css/emoji-mart.css';
import 'scss/menu/common.scss';
import 'scss/menu/account.scss';
import 'scss/menu/smile.scss';
import 'scss/menu/help.scss';
import 'scss/menu/select.scss';
import 'scss/menu/button.scss';
import 'scss/menu/search.scss';
import 'scss/menu/thread.scss';
import 'scss/menu/relation.scss';

import 'scss/menu/block/context.scss';
import 'scss/menu/block/common.scss';
import 'scss/menu/block/link.scss';
import 'scss/menu/block/icon.scss';
import 'scss/menu/block/cover.scss';
import 'scss/menu/block/mention.scss';
import 'scss/menu/block/relation.scss';

import 'scss/menu/dataview/common.scss';
import 'scss/menu/dataview/sort.scss';
import 'scss/menu/dataview/filter.scss';
import 'scss/menu/dataview/relation.scss';
import 'scss/menu/dataview/object.scss';
import 'scss/menu/dataview/view.scss';
import 'scss/menu/dataview/calendar.scss';
import 'scss/menu/dataview/option.scss';
import 'scss/menu/dataview/media.scss';
import 'scss/menu/dataview/text.scss';

import 'scss/media/print.scss';

interface RouteElement { path: string; };
interface Props {
	commonStore?: any;
};

interface State {
	loading: boolean;
};

const THROTTLE = 20;
const Constant =  require('json/constant.json');
const $ = require('jquery');
const { ipcRenderer } = window.require('electron');
const fs = window.require('fs');
const memoryHistory = require('history').createMemoryHistory;
const history = memoryHistory();
const Routes: RouteElement[] = require('json/route.json');
const rootStore = {
	commonStore: commonStore,
	authStore: authStore,
	blockStore: blockStore,
	dbStore: dbStore,
};

const { app } = window.require('electron').remote;
const version = app.getVersion();

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
	}
};

window.Store = rootStore;
window.Cmd = C;
window.Util = Util;
window.Dispatcher = dispatcher;
window.Analytics = () => { return analytics.instance; };
window.I = I;
window.Go = (route: string) => { history.push(route); };

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
			return <Loader />
		};
		
		return (
			<Router history={history}>
				<Provider {...rootStore}>
					<div>
						<ListPopup history={history} />
						<ListMenu history={history} />
						<LinkPreview />
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

						<div id="selection-rect" />
							
						{Routes.map((item: RouteElement, i: number) => (
							<Route path={item.path} exact={true} key={i} component={Page} />
						))}
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
		const pageId = Storage.get('pageId');
		const lastSurveyTime = Number(Storage.get('lastSurveyTime')) || 0;

		if (!lastSurveyTime) {
			Storage.set('lastSurveyTime', Util.time());
		};

		cover ? commonStore.coverSet(cover.id, cover.image, cover.type) : commonStore.coverSetDefault();
		if (coverImg) {
			commonStore.coverSetUploadedImage(coverImg);
		};
		
		this.setIpcEvents();
		this.setWindowEvents();

		if (pageId) {
			Storage.set('redirectTo', '/main/edit/' + pageId);
		};
	};

	preload (callBack?: () => void) {
		const prefix = './dist/img';
		const folders = [ 'cover', 'emoji', 'help' ];
		
		let loaded = 0;
		let images: string[] = [];
		let cb = () => {
			loaded++;
			if (loaded == folders.length) {
				Util.cacheImages(images, callBack);
			};
		};

		folders.forEach(folder => {
			const path = [ prefix, folder ].join('/')
			fs.readdir(path, (err: any, files: any[]) => {
				if (err) {
					cb();
					return;
				};
				images = images.concat(files.map((it: string) => { return [ 'img', folder, it ].join('/') }));
				cb();
			});
		});
	};

	setIpcEvents () {
		const accountId = Storage.get('accountId');
		const html = $('html');
		const phrase = Storage.get('phrase');

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

			this.setState({ loading: false });
			this.preload();
		});
		
		ipcRenderer.on('route', (e: any, route: string) => {
			history.push(route);
		});

		ipcRenderer.on('popup', (e: any, id: string, data: any) => {
			commonStore.popupCloseAll();
			window.setTimeout(() => {
				commonStore.popupOpen(id, { data: data });
			}, Constant.delay.popup);
		});

		ipcRenderer.on('checking-for-update', (e: any, auto: boolean) => {
			if (!auto) {
				commonStore.progressSet({ status: 'Checking for update...', current: 0, total: 1 });
			};
		});

		ipcRenderer.on('update-available', (e: any, auto: boolean) => {
			commonStore.progressClear(); 

			if (!auto) {
				commonStore.popupOpen('confirm', {
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

		ipcRenderer.on('update-not-available', (e: any, auto: boolean) => {
			commonStore.progressClear(); 

			if (!auto) {
				commonStore.popupOpen('confirm', {
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
				commonStore.popupOpen('confirm', {
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
			console.log('[Config]', config);
			commonStore.configSet(config); 

			analytics.init();
		});

		ipcRenderer.on('enter-full-screen', () => {
			html.addClass('fullScreen')
		});

		ipcRenderer.on('leave-full-screen', () => {
			html.removeClass('fullScreen');
		});
	};

	setWindowEvents () {
		const win = $(window);

		win.unbind('mousemove.common beforeunload.common blur.common');
		
		win.on('mousemove.common', throttle((e: any) => {
			keyboard.initPinCheck();
			keyboard.disableMouse(false);
			keyboard.setCoords(e.pageX, e.pageY);
		}, THROTTLE));
		
		win.on('blur.common', () => {
			Util.tooltipHide();
			Util.linkPreviewHide(true);
		});
	};

	onCommand (e: any, key: string) {
		const id = String(Storage.get('pageId') || '');
		if (!id || keyboard.isFocused) {
			return;
		};

		switch (key) {
			case 'undo':
				C.BlockUndo(id);
				break;

			case 'redo':
				C.BlockUndo(id);
				break;
		};
	};

	onProgress (e: any, progress: any) {
		commonStore.progressSet({ 
			status: Util.sprintf('Downloading update... %s/%s', Util.fileSize(progress.transferred), Util.fileSize(progress.total)), 
			current: progress.transferred, 
			total: progress.total,
			isUnlocked: false,
		});
	};

	onImport () {
		commonStore.popupOpen('settings', {
			data: { page: 'importIndex' }
		});
	};

	onExport () {
		commonStore.popupOpen('settings', {
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