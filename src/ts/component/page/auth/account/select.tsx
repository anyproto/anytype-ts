import * as React from 'react';
import { Frame, Icon, Cover, Error, Title, IconObject, Header, Footer, Loader, Button } from 'Component';
import { I, C, Util, translate, DataUtil, Renderer } from 'Lib';
import { commonStore, authStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends I.PageComponent {};

interface State {
	error: string;
	loading: boolean;
};

const Errors = require('json/error.json');

const PageAccountSelect = observer(class PageAccountSelect extends React.Component<Props, State> {

	state = {
		error: '',
		loading: false,
	};

	constructor (props: any) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { error, loading } = this.state;
		const { accounts } = authStore;

		const Item = (item: any) => (
			<div className="item" onClick={(e) => { this.onSelect(item as I.Account); }}>
				<IconObject object={{ ...item, layout: I.ObjectLayout.Human }} size={64} />
				<div className="name">{item.name}</div>
			</div>
		);
		
		return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame>
					{loading ? <Loader /> : (
						<React.Fragment>
							<Error text={error} />

							<div className="list dn">
								<Title text={translate('authAccountSelectTitle')} />

								{accounts.map((item: I.Account, i: number) => (
									<Item key={i} {...item} />	
								))}
								<div className="item add dn" onMouseDown={this.onAdd}>
									<Icon className="plus" />
									<div className="name">{translate('authAccountSelectAdd')}</div>
								</div>
							</div>

							{error ? <Button text={translate('authSetupBack')} onClick={() => { Util.route('/'); }} /> : ''}
						</React.Fragment>
					)}
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		const { walletPath, phrase } = authStore;
		
		authStore.accountListClear();

		this.setState({ loading: true });
		
		C.WalletRecover(walletPath, phrase, (message: any) => {
			DataUtil.createSession(() => {
				C.AccountRecover((message: any) => {
					const state: any = { loading: false };

					if (message.error.code) {
						Util.checkError(message.error.code);
						state.error = Errors.AccountRecover[message.error.code] || message.error.description;
					};

					this.setState(state);
				});
			});
		});
	};
	
	componentDidUpdate () {
		const { accounts } = authStore;
		
		if (accounts && accounts.length) {
			this.onSelect(accounts[0]);
		};
	};

	onSelect (account: I.Account) {
		const { phrase } = authStore;
		
		authStore.accountSet(account);
		Renderer.send('keytarSet', account.id, phrase);
		Util.route('/auth/setup/select');
	};
	
	onAdd (e: any) {
		Util.route('/auth/register/add');
	};
	
});

export default PageAccountSelect;