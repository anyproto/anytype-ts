import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router-dom';

const memoryHistory = require('history').createMemoryHistory;
const history = memoryHistory();

import 'css/font.css';
import 'css/common.css';

import PageAuthCode from './component/page/auth/code';
import PageAuthNotice from './component/page/auth/notice';

class App extends React.Component<{}, {}> {
	
	render () {
		return (
			<Router history={history}>
				<div>
					<div id="drag"></div>
					<nav>
						<ul>
							<li>
								<Link to="/">Home</Link>
							</li>
							<li>
								<Link to="/auth/notice">About</Link>
							</li>
						</ul>
					</nav>
					<Route path="/" exact render={() => <PageAuthCode history={history} />} />
					<Route path="/auth/notice" exact render={() => <PageAuthNotice history={history} />} />
				</div>
			</Router>
		);
    }

}

ReactDOM.render(<App />, document.getElementById('root'));