import { hot } from 'react-hot-loader/root';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { enableLogging } from 'mobx-logger';
import { Page, ListPopup, ListMenu, Progress, Tooltip, Loader, LinkPreview } from './component';
import { commonStore, authStore, blockStore } from './store';
import { C, Util, DataUtil, keyboard, Storage, analytics, dispatcher } from 'ts/lib';
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
import 'scss/component/textarea.scss';
import 'scss/component/smile.scss';
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

import 'scss/page/auth.scss';
import 'scss/page/main/index.scss';
import 'scss/page/main/edit.scss';
import 'scss/page/help.scss';

import 'scss/block/common.scss';
import 'scss/block/dataview.scss';
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
import 'scss/block/title.scss';
import 'scss/block/cover.scss';

import 'scss/popup/common.scss';
import 'scss/popup/settings.scss';
import 'scss/popup/archive.scss';
import 'scss/popup/navigation.scss';
import 'scss/popup/prompt.scss';
import 'scss/popup/preview.scss';
import 'scss/popup/new.scss';
import 'scss/popup/feedback.scss';
import 'scss/popup/editor/page.scss';

import 'emoji-mart/css/emoji-mart.css';
import 'scss/menu/common.scss';
import 'scss/menu/account.scss';
import 'scss/menu/smile.scss';
import 'scss/menu/help.scss';
import 'scss/menu/select.scss';

import 'scss/menu/block/context.scss';
import 'scss/menu/block/common.scss';
import 'scss/menu/block/link.scss';
import 'scss/menu/block/icon.scss';
import 'scss/menu/block/cover.scss';
import 'scss/menu/block/mention.scss';

import 'scss/menu/dataview/common.scss';
import 'scss/menu/dataview/sort.scss';
import 'scss/menu/dataview/filter.scss';
import 'scss/menu/dataview/relation.scss';
import 'scss/menu/dataview/view.scss';
import 'scss/menu/dataview/calendar.scss';
import 'scss/menu/dataview/tag.scss';
import 'scss/menu/dataview/account.scss';

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
const memoryHistory = require('history').createMemoryHistory;
const history = memoryHistory();
const Routes: RouteElement[] = require('json/route.json');
const rootStore = {
	commonStore: commonStore,
	authStore: authStore,
	blockStore: blockStore,
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
		Dispatcher: any; 
	}
};

window.Store = () => { return rootStore; };
window.Cmd = () => { return C; };
window.Dispatcher = () => { return dispatcher; };

class App extends React.Component<Props, State> {
	
	state = {
		loading: true
	};

	constructor (props: any) {
		super(props);

		this.onImport = this.onImport.bind(this);
		this.onProgress = this.onProgress.bind(this);
		this.onCommand = this.onCommand.bind(this);
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
						
						<div id="drag" />
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
		analytics.init();
		analytics.setVersionName(version);
		analytics.setUserProperties({ deviceType: 'Desktop', platform: Util.getPlatform() });

		keyboard.init(history);
		DataUtil.init(history);

		const cover = Storage.get('cover');
		const coverImg = Storage.get('coverImg');
		const pageId = Storage.get('pageId');

		cover ? commonStore.coverSet(cover.id, cover.image, cover.type) : commonStore.coverSetDefault();
		if (coverImg) {
			commonStore.coverSetUploadedImage(coverImg);
		};
		
		this.setIpcEvents();
		this.setWindowEvents();

		if (pageId) {
			Storage.set('redirectTo', pageId);
		};
	};

	setIpcEvents () {
		const phrase = Storage.get('phrase');
		const accountId = Storage.get('accountId');
		const debug = Storage.get('debug') || {};
		const html = $('html');

		ipcRenderer.send('appLoaded', true);
		ipcRenderer.send('update');

		ipcRenderer.on('dataPath', (e: any, dataPath: string) => {
			authStore.pathSet(dataPath);
			this.setState({ loading: false });

			if (phrase && accountId) {
				history.push('/auth/setup/init');
			};
		});
		
		debug.ui ? html.addClass('debug') : html.removeClass('debug');
		ipcRenderer.on('toggleDebug', (e: any, key: string, value: boolean) => {
			console.log('[toggleDebug]', key, value);
			debug[key] = value;
			debug.ui ? html.addClass('debug') : html.removeClass('debug');
			Storage.set('debug', debug, true);
		});
		
		ipcRenderer.on('route', (e: any, route: string) => {
			history.push(route);
		});
		
		ipcRenderer.on('message', (e: any, text: string) => {
			console.log('[Message]', text);
		});
		
		ipcRenderer.on('progress', this.onProgress);
		ipcRenderer.on('updateReady', () => { 
			Storage.delete('popupNewBlock');
			commonStore.progressClear(); 
		});
		ipcRenderer.on('import', this.onImport);
		ipcRenderer.on('command', this.onCommand);
	};

	setWindowEvents () {
		const win = $(window);

		win.unbind('mousemove.common beforeunload.common blur.common');
		
		win.on('mousemove.common', throttle((e: any) => {
			keyboard.setPinCheck();
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
		const { root } = blockStore;
		const id = String(Storage.get('pageId') || root || '');
		if (!id) {
			return;
		};

		commonStore.popupOpen('settings', {
			data: {
				page: 'importIndex',
				rootId: id,
			}
		});
	};
	
};

export default App;