import * as React from 'react';
import * as hs from 'history';
import { Router, Route, Switch } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { Provider } from 'mobx-react';
import { configure } from 'mobx';
import { ListMenu } from 'Component';
import { UtilRouter, C, UtilData } from 'Lib'; 
import { commonStore, authStore, blockStore, detailStore, dbStore, menuStore, popupStore, extensionStore } from 'Store';
const Extension = require('json/extension.json');

import Index from './popup/index';
import Challenge from './popup/challenge';
import Create from './popup/create';
import Success from './popup/success';

import './scss/popup.scss';

configure({ enforceActions: 'never' });

const Routes = [
	{ path: '/' },
	{ path: '/:page' },
];

const Components = {
	index: Index,
	challenge: Challenge,
	create: Create,
	success: Success,
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

class Popup extends React.Component {

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
			if (!Extension.clipper.ids.includes(sender.id)) {
				return false;
			};

			//sendResponse({ type: msg.type, ref: 'popup' });
			return true;
		});

		win.off('beforeunload').on('beforeunload', (e: any) => {
			if (!authStore.token) {
				return;
			};

			UtilData.destroySubscriptions(() => {
				C.WalletCloseSession(authStore.token, () => authStore.tokenSet(''));
			});
		});
	};

};

export default Popup;