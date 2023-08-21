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

import Index from './popup/index';
import Create from './popup/create';
import Success from './popup/success';
import Util from './lib/util';

import './scss/popup.scss';

configure({ enforceActions: 'never' });

const Routes = [
	{ path: '/' },
	{ path: '/:page' },
];

const Components = {
	index: Index,
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
								<Route path={item.path} exact={true} key={i} component={RoutePage} />
							))}
						</Switch>
					</div>
				</Provider>
			</Router>
		);
	};

	componentDidMount () {
		console.log('isPopup', Util.isPopup());

		UtilCommon.init(history);
		commonStore.configSet({ debug: { mw: true } }, false);

		/* @ts-ignore */
		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			console.log('Popup message', msg, sender);

			if (sender.id != Extension.clipper.id) {
				return;
			};
			return true;
		});

		Util.sendMessage({ type: 'initNative' }, (response) => {
			authStore.tokenSet('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWVkIjoib1dQc3hQaWoifQ.FcfYkCJPbzCFYP5mryoYNdebgLaTWl04wa-Zu4IPTyk');

			dispatcher.init(`http://127.0.0.1:${response.port}`);

			C.AppGetVersion();
		});
	};

};

export default Popup;