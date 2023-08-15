import * as React from 'react';
import * as hs from 'history';
import { Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { configure } from 'mobx';
import { commonStore, authStore, blockStore, detailStore, dbStore, menuStore, popupStore } from 'Store';

import Index from './page/index';

configure({ enforceActions: 'never' });

const Routes = [
	{ 'path': '/' },
];

const Components = {
	'/': Index,
};

const memoryHistory = hs.createMemoryHistory;
const history = memoryHistory();

const rootStore = {
	commonStore,
	authStore,
	blockStore,
	detailStore,
	dbStore,
	menuStore,
	popupStore,
};

class App extends React.Component {

	node: any = null;

	constructor (props: any) {
		super(props);
	};

	render () {
		return (
			<Router history={history}>
				<Provider {...rootStore}>
					<div ref={node => this.node = node}>
						<Switch>
							{Routes.map((item: any, i: number) => (
								<Route path={item.path} exact={true} key={i} component={Components[item.path]} />
							))}
						</Switch>
					</div>
				</Provider>
			</Router>
		);
	};

	componentDidMount () {
	};

	componentDidUpdate () {
	};

};

export default App;