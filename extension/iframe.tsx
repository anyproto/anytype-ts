import * as React from 'react';
import * as hs from 'history';
import { Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'mobx-react';
import { configure } from 'mobx';
import { dispatcher, C, UtilCommon } from 'Lib'; 
import { commonStore, authStore, blockStore, detailStore, dbStore, menuStore, popupStore } from 'Store';
import { Icon } from 'Component';
import Extension from 'json/extension.json';

import Index from './iframe/index';
import Util from './lib/util';

require('./scss/iframe.scss');

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

class Iframe extends React.Component {

	node: any = null;

	constructor (props: any) {
		super(props);

		this.onClose = this.onClose.bind(this);
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
		console.log('isIframe', Util.isIframe());

		UtilCommon.init(history);
		commonStore.configSet({ debug: { mw: true } }, false);

		/* @ts-ignore */
		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			console.log('Iframe message', msg, sender);

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

	componentDidUpdate () {
	};

	onClose () {
		parent.postMessage({ type: 'clickClose' }, '*');
	};

};

export default Iframe;