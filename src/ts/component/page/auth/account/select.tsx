import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Icon, Cover, Error, Title, IconObject, HeaderAuth as Header, FooterAuth as Footer, Loader } from 'ts/component';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, C, Util, translate } from 'ts/lib';

interface Props extends RouteComponentProps<any> {}

interface State {
	error: string;
}

const { ipcRenderer } = window.require('electron');

const PageAccountSelect = observer(class PageAccountSelect extends React.Component<Props, State> {

	state = {
		error: ''
	};

	constructor (props: any) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { error } = this.state;
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
				<Header />
				<Footer />
				
				<Frame>
					{!accounts.length ? <Loader /> : (
						<React.Fragment>
							<Title text={translate('authAccountSelectTitle')} />
							<Error text={error} />

							<div className="list">
								{accounts.map((item: I.Account, i: number) => (
									<Item key={i} {...item} />	
								))}
								<div className="item add dn" onMouseDown={this.onAdd}>
									<Icon className="plus" />
									<div className="name">{translate('authAccountSelectAdd')}</div>
								</div>
							</div>
						</React.Fragment>
					)}
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		const { path, phrase } = authStore;
		
		authStore.accountClear();
		
		C.WalletRecover(path, phrase, (message: any) => {
			C.AccountRecover((message: any) => {
				if (message.error.code) {
					Util.checkError(message.error.code);
					this.setState({ error: message.error.description });
				};
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
		ipcRenderer.send('keytarSet', account.id, phrase);
		Util.route('/auth/setup/select');
	};
	
	onAdd (e: any) {
		Util.route('/auth/register/add');
	};
	
});

export default PageAccountSelect;