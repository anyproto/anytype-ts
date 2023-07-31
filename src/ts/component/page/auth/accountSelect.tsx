import * as React from 'react';
import { Frame, Error, Header, Footer } from 'Component';
import { I, C, UtilCommon, UtilData, Renderer } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';
import Errors from 'json/error.json';

interface State {
	error: string;
};

const PageAccountSelect = observer(class PageAccountSelect extends React.Component<I.PageComponent, State> {
	
	state: State = {
		error: '',
	};

	render () {
		const { error } = this.state;
		const { accounts } = authStore;
		const length = accounts.length;

		return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame>
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
					if (message.error.code) {
						UtilCommon.checkError(message.error.code);
						this.setState({ error: message.error.description });
					};
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
		UtilCommon.route('/auth/setup/select', { replace: true });
	};

});

export default PageAccountSelect;