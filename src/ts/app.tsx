import { hot } from 'react-hot-loader/root';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { enableLogging } from 'mobx-logger';
import { Page, ListPopup, ListMenu, Progress, Tooltip, Loader, LinkPreview } from './component';
import { commonStore, authStore, blockStore } from './store';
import { C, Util, keyboard, Storage, analytics, dispatcher } from 'ts/lib';
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

import 'scss/page/auth.scss';
import 'scss/page/main/index.scss';
import 'scss/page/main/edit.scss';
import 'scss/page/help.scss';

import 'scss/block/common.scss';
import 'scss/block/dataview.scss';
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
import 'scss/popup/tree.scss';
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

import 'scss/menu/dataview/sort.scss';
import 'scss/menu/dataview/filter.scss';
import 'scss/menu/dataview/property.scss';
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
const os = window.require('os');
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
const platforms: any = {
	win32:	 'Windows',
	darwin:	 'Mac',
	linux:	 'Linux',
};

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
		C.VersionGet((message: any) => {
			analytics.setVersionName(version);
			analytics.setUserProperties({
				middleVersion: message.version,
				deviceType: 'Desktop',
				platform: platforms[os.platform()],
			});
		});
		
		const win = $(window);
		const phrase = Storage.get('phrase');
		const html = $('html');
		
		let debugUI = Boolean(Storage.get('debugUI'));
		let debugMW = Boolean(Storage.get('debugMW'));
		let debugAN = Boolean(Storage.get('debugAN'));
		let coverNum = Number(Storage.get('coverNum'));
		let coverImg = Number(Storage.get('coverImg'));
		let noShutdown = Number(Storage.get('noShutdown'));
		
		if (!coverNum && !coverImg) {
			commonStore.coverSetNum(Constant.default.cover);
		};
		
		ipcRenderer.send('appLoaded', true);
		keyboard.init(history);
		analytics.init();
		
		ipcRenderer.on('dataPath', (e: any, dataPath: string) => {
			authStore.pathSet(dataPath + '/data');

			this.setState({ loading: false });
			if (phrase) {
				history.push('/auth/setup/init');
			};
		});
		
		debugUI ? html.addClass('debug') : html.removeClass('debug');
		
		ipcRenderer.on('toggleDebugUI', (e: any) => {
			debugUI = !debugUI;
			debugUI ? html.addClass('debug') : html.removeClass('debug');
			Storage.set('debugUI', Number(debugUI));
		});
		
		ipcRenderer.on('toggleDebugMW', (e: any) => {
			debugMW = !debugMW;
			Storage.set('debugMW', Number(debugMW));
		});
		
		ipcRenderer.on('toggleDebugAN', (e: any) => {
			debugAN = !debugAN;
			Storage.set('debugAN', Number(debugAN));
		});
		
		ipcRenderer.on('help', (e: any) => {
			history.push('/help/index');
		});
		
		ipcRenderer.on('message', (e: any, text: string, version: string) => {
			console.log('[Message]', text, version);
		});
		
		ipcRenderer.on('progress', (e: any, progress: any) => {
			commonStore.progressSet({ 
				status: 'Downloading update... %s/%s', 
				current: Util.fileSize(progress.transferred), 
				total: Util.fileSize(progress.total),
				isUnlocked: true,
			});
		});
		
		ipcRenderer.on('update', (e: any) => {
			Storage.delete('popupNewBlock');
		});
		
		win.unbind('mousemove.common beforeunload.common');
		
		win.on('mousemove.common', throttle((e: any) => {
			keyboard.setPinCheck();
			keyboard.disableMouse(false);
			keyboard.setCoords(e.pageX, e.pageY);
		}, THROTTLE));
		
		if (!noShutdown) {
			win.on('beforeunload', (e: any) => {
				C.Shutdown((message: any) => {
					ipcRenderer.send('appClose');
				});
				return false;
			});
		};
	};
	
};

export default App;