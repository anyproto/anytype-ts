import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { Page, ListPopup, ListMenu } from './component';
import { commonStore, authStore, blockStore, editorStore } from './store';
import { dispatcher, keyboard, Storage } from 'ts/lib';

import 'scss/font.scss';
import 'scss/common.scss';

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

import 'scss/page/auth.scss';
import 'scss/page/main/index.scss';
import 'scss/page/main/edit.scss';

import 'scss/block/common.scss';
import 'scss/block/dataview.scss';
import 'scss/block/text.scss';
import 'scss/block/image.scss';
import 'scss/block/video.scss';
import 'scss/block/file.scss';
import 'scss/block/page.scss';

import 'scss/popup/common.scss';
import 'scss/popup/settings.scss';
import 'scss/popup/tree.scss';
import 'scss/popup/prompt.scss';
import 'scss/popup/editor/page.scss';

import 'emoji-mart/css/emoji-mart.css';
import 'scss/menu/common.scss';
import 'scss/menu/account.scss';
import 'scss/menu/smile.scss';
import 'scss/menu/help.scss';

import 'scss/menu/block/action.scss';

import 'scss/menu/dataview/sort.scss';
import 'scss/menu/dataview/filter.scss';
import 'scss/menu/dataview/property.scss';
import 'scss/menu/dataview/view.scss';
import 'scss/menu/dataview/calendar.scss';
import 'scss/menu/dataview/tag.scss';
import 'scss/menu/dataview/account.scss';

interface RouteElement { path: string; };

const { ipcRenderer } = window.require('electron');
const memoryHistory = require('history').createMemoryHistory;
const history = memoryHistory();
const Routes: RouteElement[] = require('json/route.json');
const rootStore = {
	commonStore: commonStore,
	authStore: authStore,
	blockStore: blockStore,
	editorStore: editorStore,
};

class App extends React.Component<{}, {}> {
	
	render () {
		return (
			<Router history={history}>
				<Provider {...rootStore}>
					<div>
						<ListPopup history={history} />
						<ListMenu history={history} />
						<div id="drag" />
						<div id="rect" />
						
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
		ipcRenderer.send('appLoaded', true);
		keyboard.init(history);
		
		let phrase = Storage.get('phrase');
		if (phrase) {
			history.push('/auth/setup/init');
		};
	};
	
};

ReactDOM.render(<App />, document.getElementById('root'));