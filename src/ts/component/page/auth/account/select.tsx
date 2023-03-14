import * as React from 'react';
import { Frame, Cover, Error, Header, Footer, Loader } from 'Component';
import { I, C, Util, DataUtil } from 'Lib';
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
		error: ''
	}
	
	render () {
		const { cover } = commonStore;
		const { loading, error } = this.state;
		
		return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame>
					{ loading ? <Loader />  : null }
					{ error ? <Error text={error} /> : null }
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		const { walletPath, phrase } = authStore;
		
		authStore.accountListClear();

		C.WalletRecover(walletPath, phrase, () => {
			DataUtil.createSession(() => {
				C.AccountRecover((message) => {
					let error = '';
					if (message.error.code) {
						Util.checkError(message.error.code);
						error = Errors.AccountRecover[message.error.code] || message.error.description;
					};
					this.setState({ loading: false, error });
				});
			});
		});
	};
});

export default PageAccountSelect;