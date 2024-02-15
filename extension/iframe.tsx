import * as React from 'react';
import * as hs from 'history';
import $ from 'jquery';
import { Router, Route, Switch } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { Provider } from 'mobx-react';
import { configure } from 'mobx';
import { ListMenu } from 'Component';
import { C, UtilRouter } from 'Lib'; 
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
	extensionStore,
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

		const win = $(window);

		/* @ts-ignore */
		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			switch (msg.type) {
				case 'initIframe':
					const { appKey, gatewayPort, serverPort } = msg;

					Util.init(serverPort, gatewayPort);
					Util.authorize(appKey);

					sendResponse({});
					break;

				case 'clickMenu': {
					extensionStore.setTabUrl(msg.url);
					extensionStore.setHtml(msg.html);

					UtilRouter.go('/create', {});
					sendResponse({});
					break;
				};

			};
			return true;
		});

		win.off('beforeunload').on('beforeunload', (e: any) => {
			if (authStore.token) {
				C.WalletCloseSession(authStore.token, () => {
					authStore.tokenSet('');
				});
			};
		});
	};

};

export default Iframe;