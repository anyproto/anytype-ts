import * as React from 'react';
import { Frame, Cover, Error, Header, Footer, Loader, Title, Label, Button } from 'Component';
import { I, C, UtilCommon, UtilData, Renderer, Action } from 'Lib';
import { commonStore, authStore } from 'Store';
import { observer } from 'mobx-react';
import Errors from 'json/error.json';

interface State {
	error: string;
	loading: boolean;
};

const PageAccountSelect = observer(class PageAccountSelect extends React.Component<I.PageComponent, State> {
	
	state: State = {
		loading: true,
		error: '',
	};

	render () {
		const { cover } = commonStore;
		const { loading, error } = this.state;
		const { accounts } = authStore;
		const length = accounts.length;

		return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame>
					{loading ? <Loader />  : null}
					<Error text={error} />
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		const { walletPath, phrase } = authStore;
		
		authStore.accountListClear();

		C.WalletRecover(walletPath, phrase, () => {
			UtilData.createSession(() => {
				C.AccountRecover((message) => {
					let error = '';
					
					if (message.error.code) {
						UtilCommon.checkError(message.error.code);
						error = Errors.AccountRecover[message.error.code] || message.error.description;
					};

					this.setState({ loading: false, error });
				});
			});
		});
	};

	componentDidUpdate () {
		const { accounts, phrase } = authStore;
		
		if (!accounts || !accounts.length) {
			return;
		};

		const account = accounts[0];

		authStore.accountSet(account);

		Renderer.send('keytarSet', account.id, phrase);
		UtilCommon.route('/auth/setup/select');
	};

});

export default PageAccountSelect;