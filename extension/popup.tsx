import * as React from 'react';
import * as hs from 'history';
import { Router, Route, Switch } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { Provider } from 'mobx-react';
import { configure } from 'mobx';
import { ListMenu } from 'Component';
import { S, U, C, J } from 'Lib'; 

import Index from './popup/index';
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
	create: Create,
	success: Success,
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

class Popup extends React.Component {

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
			if (!J.Extension.clipper.ids.includes(sender.id)) {
				return false;
			};

			//sendResponse({ type: msg.type, ref: 'popup' });
			return true;
		});

		win.off('beforeunload').on('beforeunload', (e: any) => {
			if (!S.Auth.token) {
				return;
			};

			U.Data.destroySubscriptions(() => {
				C.WalletCloseSession(S.Auth.token, () => S.Auth.tokenSet(''));
			});
		});
	};

};

export default Popup;