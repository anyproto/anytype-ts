import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router-dom';

const memoryHistory = require('history').createMemoryHistory;
const history = memoryHistory();

import 'scss/font.scss';
import 'scss/common.scss';

import 'scss/component/input.scss';
import 'scss/component/button.scss';

import 'scss/page/auth.scss';

import Page from './component/page';

interface RouteElement { path: string; };

const Routes: Array<RouteElement> = require('json/route.json');

class App extends React.Component<{}, {}> {
	
	render () {
		return (
			<Router history={history}>
				<div>
					<div id="drag"></div>
					<nav>
						<ul>
							<li>
								<Link to="/auth/code">auth/code</Link>
							</li>
							<li>
								<Link to="/auth/notice">auth/notice</Link>
							</li>
							<li>
								<Link to="/main/edit/123">main/edit/123</Link>
							</li>
						</ul>
					</nav>
					{Routes.map((item, i) => (
						<Route path={item.path} exact key={i} component={Page} />
					))}
				</div>
			</Router>
		);
    };

};

ReactDOM.render(<App />, document.getElementById('root'));