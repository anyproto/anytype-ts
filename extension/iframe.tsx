import * as React from 'react';
import * as hs from 'history';
import $ from 'jquery';
import { Router, Route, Switch } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { Provider } from 'mobx-react';
import { configure } from 'mobx';
import { ListMenu } from 'Component';
import { dispatcher, C, UtilCommon } from 'Lib'; 
import { commonStore, authStore, blockStore, detailStore, dbStore, menuStore, popupStore } from 'Store';
import Extension from 'json/extension.json';

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
		Store: any;
		$: any;
		Lib: any;
		Graph: any;

		isWebVersion: boolean;
		Config: any;
		Renderer: any;
	}
};

window.$ = $;
window.Store = rootStore;
window.Lib = {
	C,
	UtilCommon,
	dispatcher,
	Storage,
	Animation,
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
		console.log('isIframe', Util.isIframe());

		UtilCommon.init(history);
		commonStore.configSet({ debug: { mw: true } }, false);
		
		/* @ts-ignore */
		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			console.log('Iframe message', msg, sender);

			if (sender.id != Extension.clipper.id) {
				return false;
			};

			sendResponse({ type: msg.type, ref: 'iframe' });
			return true;
		});

		Util.sendMessage({ type: 'getPorts' }, (response) => {
			if (!response.ports || !response.ports.length) {
				return;
			};

			authStore.tokenSet('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWVkIjoic2xNeUVvUEgifQ.p-bYr8Sp0pfwnIeZzc7bEsMnIwbuS87sQNPbSf_WlNI');
			commonStore.gatewaySet(`http://127.0.0.1:${response.ports[0]}`);
			dispatcher.init(`http://127.0.0.1:${response.ports[1]}`);

			UtilCommon.route('/create', {});
		});
	};

};

export default Iframe;