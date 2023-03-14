import * as React from 'react';
import $ from 'jquery';
import { Frame, Title, Error, Button, Header, Footer } from 'Component';
import { I, Storage, translate, C, DataUtil, Util, ObjectUtil } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';

interface State {
	index: number;
	error: string;
};

const PageAuthSetup = observer(class PageAuthSetup extends React.Component<I.PageComponent, State> {

	node: any = null;
	i = 0;
	t = 0;
	state = {
		index: 0,
		error: '',
	};

	render () {
		const { match } = this.props;
		const { error } = this.state;
		
		let title = '';
		switch (match.params.id) {
			case 'init':
				title = translate('authSetupLogin'); 
				break;

			case 'select': 
				title = translate('authSetupSelect');
				break;

			case 'share': 
				title = translate('authSetupShare');
				break;
		};
		
		return (
			<div ref={node => this.node = node}>
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame>
					<Title text={title} />
					<Error text={error} />
					{error ? <Button text={translate('commonBack')} onClick={() => { Util.route('/'); }} /> : ''}
				</Frame>
			</div>
		);
    };

	componentDidMount () {
		const { match } = this.props;
		const node = $(this.node);
		const label = node.find('#label');
		
		this.clear();
		this.t = window.setTimeout(() => { label.show(); }, 10000);
		
		switch (match.params.id) {
			case 'init': 
				this.init(); 
				break;

			case 'select': 
				this.select();
				break;

			case 'share': 
				this.share();
				break;
		};
	};
	
	componentWillUnmount () {
		this.clear();
	};
	
	init () {
		const { walletPath, phrase } = authStore;
		const accountId = Storage.get('accountId');

		if (!phrase) {
			return;
		};

		const setError = (message: any) => {
			if (message.error.code) {
				Util.checkError(message.error.code);
				this.setError(message.error.description);
				return true;
			};
			return false;
		};

		C.WalletRecover(walletPath, phrase, (message: any) => {
			if (setError(message)) {
				return;
			};

			DataUtil.createSession((message: any) => {
				if (setError(message)) {
					return;
				};

				if (accountId) {
					authStore.phraseSet(phrase);
					
					C.AccountSelect(accountId, walletPath, (message: any) => {
						if (setError(message)) {
							return;
						};

						if (message.account) {
							DataUtil.onAuth(message.account);
						};
					});
				} else {
					Util.route('/auth/account-select');
				};
			});
		});
	};

	select () {
		const { account, walletPath } = authStore;
		
		C.AccountSelect(account.id, walletPath, (message: any) => {
			if (message.error.code) {
				Util.checkError(message.error.code);
				this.setError(message.error.description);
			} else
			if (message.account) {
				DataUtil.onAuth(message.account);
			};
		}); 
	};

	share () {
		const { location } = this.props;
		const param = Util.searchParam(location.search);

		C.ObjectAddWithObjectId(param.id, param.payload, (message: any) => {
			if (message.error.code) {
				this.setError(message.error.description);
			} else {
				Storage.set('shareSuccess', 1);
				ObjectUtil.openHome('route');
			};
		});
	};
	
	setError (v: string) {
		if (!v) {
			return;
		};
		
		this.clear();
		this.setState({ error: v });
	};
	
	clear () {
		window.clearTimeout(this.t);
	};

});

export default PageAuthSetup;