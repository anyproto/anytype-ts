import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router-dom';

const memoryHistory = require('history').createMemoryHistory;
const history = memoryHistory();

import 'scss/font.scss';
import 'scss/common.scss';

import 'scss/component/cover.scss';
import 'scss/component/input.scss';
import 'scss/component/button.scss';
import 'scss/component/icon.scss';
import 'scss/component/textArea.scss';

import 'scss/page/auth.scss';

import Page from './component/page';

interface RouteElement { path: string; };

const Routes: Array<RouteElement> = require('json/route.json');

class App extends React.Component<{}, {}> {
	
	render () {
		return (
			<Router history={history}>
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
			</Router>
		);
    };

};

ReactDOM.render(<App />, document.getElementById('root'));