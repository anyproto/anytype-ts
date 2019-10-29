import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { Page, ListPopup, ListMenu } from './component';
import { commonStore, authStore, blockStore } from './store';
import { dispatcher, keyBoard, Storage } from 'ts/lib';

import 'scss/font.scss';
import 'scss/common.scss';

import 'scss/component/header.scss';
import 'scss/component/footer.scss';
import 'scss/component/cover.scss';
import 'scss/component/input.scss';
import 'scss/component/button.scss';
import 'scss/component/icon.scss';
import 'scss/component/textArea.scss';
import 'scss/component/smile.scss';
import 'scss/component/error.scss';
import 'scss/component/frame.scss';
import 'scss/component/popup.scss';
import 'scss/component/menu.scss';
import 'scss/component/switch.scss';
import 'scss/component/title.scss';
import 'scss/component/select.scss';
import 'scss/component/tag.scss';

import 'scss/page/auth.scss';
import 'scss/page/main/index.scss';
import 'scss/page/main/edit.scss';

import 'scss/block/common.scss';
import 'scss/block/dataview.scss';
import 'scss/block/text.scss';
import 'scss/block/image.scss';
import 'scss/block/video.scss';
import 'scss/block/file.scss';

import 'scss/popup/settings.scss';

import 'scss/menu/account.scss';
import 'scss/menu/property.scss';
import 'scss/menu/view.scss';
import 'scss/menu/smile.scss';
import 'scss/menu/sort.scss';
import 'scss/menu/filter.scss';
import 'scss/menu/help.scss';
import 'emoji-mart/css/emoji-mart.css';

interface RouteElement { path: string; };

const { ipcRenderer } = window.require('electron');
const memoryHistory = require('history').createMemoryHistory;
const history = memoryHistory();
const Routes: RouteElement[] = require('json/route.json');
const rootStore = {
	commonStore: commonStore,
	authStore: authStore,
	blockStore: blockStore,
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
		keyBoard.init(history);
		
		let phrase = Storage.get('phrase');
		if (phrase) {
			history.push('/auth/setup/init');
		};
	};
	
};

ReactDOM.render(<App />, document.getElementById('root'));