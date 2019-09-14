import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { Page } from './component';
import { authStore } from './store';
import { Dispatcher } from 'ts/lib';

const { ipcRenderer } = window.require('electron');
const memoryHistory = require('history').createMemoryHistory;
const history = memoryHistory();

import 'scss/font.scss';
import 'scss/common.scss';

import 'scss/component/cover.scss';
import 'scss/component/input.scss';
import 'scss/component/button.scss';
import 'scss/component/icon.scss';
import 'scss/component/textArea.scss';
import 'scss/component/smile.scss';
import 'scss/component/error.scss';

import 'scss/page/auth.scss';
import 'scss/page/main/index.scss';

interface RouteElement { path: string; };
const Routes: Array<RouteElement> = require('json/route.json');
const rootStore = {
	authStore: authStore
};

class App extends React.Component<{}, {}> {
	
	render () {
		return (
			<Router history={history}>
				<Provider {...rootStore}>
					<div>
						<div id="drag" />
						<nav>
							<ul>
								{Routes.map((item, i) => (
									<li key={i}>
										<Link to={item.path}>{item.path}</Link>
									</li>
								))}
							</ul>
						</nav>
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
		
		ipcRenderer.on('pipeEvent', (e: any, data: any) => {
			Dispatcher.event(data);
		});
	};

};

ReactDOM.render(<App />, document.getElementById('root'));