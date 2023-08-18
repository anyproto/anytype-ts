import * as React from 'react';
import * as hs from 'history';
import { Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { configure } from 'mobx';
import { dispatcher, C } from 'Lib'; 
import { commonStore, authStore, blockStore, detailStore, dbStore, menuStore, popupStore } from 'Store';

import Index from './popup/index';
import Util from './lib/util';

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

class Popup extends React.Component {

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
		console.log('isPopup', Util.isPopup());

		commonStore.configSet({ debug: { mw: true } }, false);

		// @ts-ignore: saying 'chrome' is not found
		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			console.log(msg);
			return true;
		});

		// @ts-ignore: saying 'chrome' is not found
		chrome.runtime.sendMessage({ type: 'initNative' }, (response) => {
			dispatcher.init(`http://127.0.0.1:${response.port}`);
			C.AppGetVersion((message: any) => {
				console.log(message);
			});
		});
	};

	componentDidUpdate () {
	};

};

export default Popup;