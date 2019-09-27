import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { Page, ListPopup, ListMenu } from './component';
import { commonStore, authStore } from './store';
import { dispatcher, Storage } from 'ts/lib';

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

import 'scss/page/auth.scss';
import 'scss/page/main/index.scss';

interface RouteElement { path: string; };

const { ipcRenderer } = window.require('electron');
const memoryHistory = require('history').createMemoryHistory;
const history = memoryHistory();
const Config: any = require('json/config.json');
const Routes: RouteElement[] = require('json/route.json');
const rootStore = {
	commonStore: commonStore,
	authStore: authStore
};

class App extends React.Component<{}, {}> {
	
	render () {
		return (
			<Router history={history}>
				<Provider {...rootStore}>
					<div>
						<ListPopup />
						<ListMenu />
						<div id="drag" />
						{Routes.map((item, i) => (
							<Route path={item.path} exact={true} key={i} component={Page} />
						))}
					</div>
				</Provider>
			</Router>
		);
	};

	componentDidMount () {
		ipcRenderer.send('appLoaded', true);
		//this.init();
	};
	
	init () {
		let phrase = Storage.get('phrase');
		if (!phrase) {
			return;
		};
		
		history.push('/auth/setup/init');
	};
	
};

ReactDOM.render(<App />, document.getElementById('root'));