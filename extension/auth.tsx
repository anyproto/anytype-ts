import { FC, useEffect } from 'react';
import * as hs from 'history';
import { Router, Route, Switch } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { Provider } from 'mobx-react';
import { configure } from 'mobx';
import { S, U } from 'Lib'; 

import Index from './auth/index';
import Success from './auth/success';
import Util from './lib/util';

import './scss/auth.scss';

configure({ enforceActions: 'never' });

const Routes = [
	{ path: '/' },
	{ path: '/:page' },
];

const Components = {
	index: Index,
	success: Success,
};

const memoryHistory = hs.createMemoryHistory;
const history = memoryHistory();

const RoutePage: FC<RouteComponentProps> = (props) => {

	const { match } = props;
	const params = match.params as any;
	const page = params.page || 'index';
	const Component = Components[page];

	return Component ? <Component /> : null;

};

const Auth: FC = () => {

	useEffect(() => {
		U.Router.init(history);

		/* @ts-ignore */
		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			switch (msg.type) {
				case 'initAuth':
					const { appKey, gatewayPort, serverPort } = msg;

					Util.init(serverPort, gatewayPort);
					Util.authorize(appKey);

					sendResponse({});
					break;
			};
			return true;
		});
	}, []);

	return (
		<Router history={history}>
			<Provider {...S}>
				<div>
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

export default Auth;