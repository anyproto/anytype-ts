import * as React from 'react';
import * as hs from 'history';
import { Router, Route, Switch } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { Provider } from 'mobx-react';
import { configure } from 'mobx';
import { ListMenu } from 'Component';
import { dispatcher, C, UtilCommon } from 'Lib'; 
import { commonStore, authStore, blockStore, detailStore, dbStore, menuStore, popupStore } from 'Store';

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
			console.log(msg);
			return true;
		});

		/* @ts-ignore */
		chrome.runtime.sendMessage({ type: 'initNative' }, (response) => {
			dispatcher.init(`http://127.0.0.1:${response.port}`);

			UtilCommon.route('/create', {});

			C.AppGetVersion((message: any) => {
				console.log(message);
			});
		});
	};

};

export default Popup;