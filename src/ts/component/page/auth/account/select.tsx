import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Icon, Cover, Error, Title, IconUser, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';
import { Storage, I, C, Util } from 'ts/lib';

interface Props extends RouteComponentProps<any> {};

interface State {
	error: string;
};

@observer
class PageAccountSelect extends React.Component<Props, State> {

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
				<IconUser {...item} />
				<div className="name">{item.name}</div>
			</div>
		);
		
		return (
			<div>
				<Cover {...cover} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text="Choose profile" />
					<Error text={error} />
					
					<div className="list">
						{accounts.map((item: I.Account, i: number) => (
							<Item key={i} {...item} />	
						))}
						<div className="item add dn" onMouseDown={this.onAdd}>
							<Icon className="plus" />
							<div className="name">Add profile</div>
						</div>
					</div>
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		const { path } = authStore;
		const phrase = Storage.get('phrase');
		
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
		const { history } = this.props;
		const pin = Storage.get('pin');
		
		authStore.accountSet(account);
		
		if (pin) {
			history.push('/auth/pin-check/select');
		} else {
			history.push('/auth/setup/select');
		};
	};
	
	onAdd (e: any) {
		this.props.history.push('/auth/register/add');
	};
	
};

export default PageAccountSelect;