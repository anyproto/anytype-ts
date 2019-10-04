import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Icon, Cover, Error, Title, IconUser, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, Storage, I } from 'ts/lib';

interface Props extends RouteComponentProps<any> {
	authStore?: any;
};
interface State {
	error: string;
};

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
		const { authStore } = this.props;
		const { error } = this.state;
		
		const Item = (item: any) => (
			<div className="item" onClick={(e) => { this.onSelect(e, item as I.AccountInterface); }}>
				<IconUser {...item} />
				<div className="name">{item.name}</div>
			</div>
		);
		
		return (
			<div>
				<Cover num={3} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text="Choose profile" />
					<Error text={error} />
					
					<div className="list">
						{authStore.accounts.map((item: I.AccountInterface, i: number) => (
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
		dispatcher.call('accountRecover', {}, (errorCode: any, message: any) => {
			if (message.error.code) {
				let error = message.error.description;
				if (error) {
					this.setState({ error: error });
				};
			} else {
				
			};
		});
	};

	onSelect (e: any, account: I.AccountInterface) {
		const { authStore, history } = this.props;
		
		authStore.accountSet(account);
		history.push('/auth/pin-select/select');
	};
	
	onAdd (e: any) {
		this.props.history.push('/auth/register/add');
	};
	
};

export default PageAccountSelect;