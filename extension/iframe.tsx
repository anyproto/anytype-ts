import * as React from 'react';
import * as hs from 'history';
import $ from 'jquery';
import { Router, Route, Switch } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { Provider } from 'mobx-react';
import { configure } from 'mobx';
import { ListMenu } from 'Component';
import { S, C, U } from 'Lib'; 

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

class RoutePage extends React.Component<RouteComponentProps> {
	
	render () {
		const { match } = this.props;
		const params = match.params as any;
		const page = params.page || 'index';
		const Component = Components[page];

		return (
			<>
				<ListMenu key="listMenu" {...this.props} />

				{Component ? <Component /> : null}
			</>
		);
	};

};

class Iframe extends React.Component {

	node: any = null;

	render () {
		return (
			<Router history={history}>
				<Provider {...S}>
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
		U.Router.init(history);
		U.Smile.init();

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
					S.Extension.setTabUrl(msg.url);
					S.Extension.setHtml(msg.html);

					U.Router.go('/create', {});
					sendResponse({});
					break;
				};

			};
			return true;
		});

		win.off('beforeunload').on('beforeunload', (e: any) => {
			if (!S.Auth.token) {
				return;
			};

			U.Data.destroySubscriptions(() => U.Data.closeSession());
		});
	};

};

export default Iframe;