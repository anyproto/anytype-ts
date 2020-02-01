import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Icon, Cover, Error, Title, IconUser, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { Storage, I, C } from 'ts/lib';

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	authStore?: any;
};
interface State {
	error: string;
};

@inject('commonStore')
@inject('authStore')
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
		const { commonStore, authStore } = this.props;
		const { coverId, coverImg } = commonStore;
		const { error } = this.state;
		
		const Item = (item: any) => (
			<div className="item" onClick={(e) => { this.onSelect(e, item as I.Account); }}>
				<IconUser {...item} />
				<div className="name">{item.name}</div>
			</div>
		);
		
		return (
			<div>
				<Cover num={coverId} image={coverImg} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text="Choose profile" />
					<Error text={error} />
					
					<div className="list">
						{authStore.accounts.map((item: I.Account, i: number) => (
							<Item key={i} {...item} />	
						))}
						<div className="item add" onMouseDown={this.onAdd}>
							<Icon className="plus" />
							<div className="name">Add profile</div>
						</div>
					</div>
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		C.AccountRecover((message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
			};
		});
	};

	onSelect (e: any, account: I.Account) {
		const { authStore, history } = this.props;
		const pin = Storage.get('pin');
		
		authStore.accountSet(account);
		
		if (pin) {
			history.push('/auth/pin-check/select');
		} else {
			history.push('/auth/pin-select/select');
		};
	};
	
	onAdd (e: any) {
		this.props.history.push('/auth/register/add');
	};
	
};

export default PageAccountSelect;