import * as React from 'react';
import * as hs from 'history';
import $ from 'jquery';
import { Router, Route, Switch } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { Provider } from 'mobx-react';
import { configure } from 'mobx';
import { ListMenu } from 'Component';
import { dispatcher, C, UtilCommon, UtilRouter } from 'Lib'; 
import { commonStore, authStore, blockStore, detailStore, dbStore, menuStore, popupStore, extensionStore } from 'Store';

import Index from './iframe/index';
import Create from './iframe/create';
import Util from './lib/util';

require('./scss/iframe.scss');

configure({ enforceActions: 'never' });

const Routes = [
	{ path: '/' },
	{ path: '/:page' },
];

const Components = {
	index: Index,
	create: Create,
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

declare global {
	interface Window {
		Electron: any;
		$: any;
		Anytype: any;
		isWebVersion: boolean;
		AnytypeGlobalConfig: any;
	}
};

window.$ = $;
window.$ = $;
window.Anytype = {
	Store: rootStore,
	Lib: {
		C,
		UtilCommon,
		dispatcher,
		Storage,
	},
};

class RoutePage extends React.Component<RouteComponentProps> {
	render () {
		const { match } = this.props;
		const params = match.params as any;
		const page = params.page || 'index';
		const Component = Components[page];

		return (
			<React.Fragment>
				<ListMenu key="listMenu" {...this.props} />

				{Component ? <Component /> : null}
			</React.Fragment>
		);
	};
};

class Iframe extends React.Component {

	node: any = null;

	render () {
		return (
			<Router history={history}>
				<Provider {...rootStore}>
					<div ref={node => this.node = node}>
						<Switch>
							{Routes.map((item: any, i: number) => (
								<Route path={item.path} exact={true} key={i} component={RoutePage} />
							))}
						</Switch>
					</div>
				</Provider>
			</Router>
		);
	};

	componentDidMount () {
		UtilRouter.init(history);
		
		/* @ts-ignore */
		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			console.log('[Iframe]', msg, sender);

			switch (msg.type) {
				case 'init':
					const { appKey, gatewayPort, serverPort } = msg;

					Util.init(serverPort, gatewayPort);
					Util.authorize(appKey, () => UtilRouter.go('/create', {}));
					break;
			};

			/*
			let res = null;
			if (res) {
				sendResponse({ type: msg.type, ref: 'iframe' });
			};
			*/
			return true;
		});
	};

};

export default Iframe;