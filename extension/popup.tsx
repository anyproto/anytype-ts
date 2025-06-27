import { FC, useEffect } from 'react';
import * as hs from 'history';
import { Router, Route, Switch } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { Provider } from 'mobx-react';
import { configure } from 'mobx';
import { ListMenu } from 'Component';
import { S, U, J } from 'Lib'; 

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

const RoutePage: FC<RouteComponentProps> = (props) => {

	const { match } = props;
	const params = match.params as any;
	const page = params.page || 'index';
	const Component = Components[page];

	return (
		<>
			<ListMenu key="listMenu" {...props} />

			{Component ? <Component /> : null}
		</>
	);

};

const Popup: FC = () => {

	useEffect(() => {
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

			U.Data.destroySubscriptions(() => U.Data.closeSession());
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

export default Popup;