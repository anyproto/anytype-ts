import * as React from 'react';
import { Icon, IconUser } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { I, dispatcher } from 'ts/lib';

interface Props extends I.Menu {
	history: any;
	authStore?: any;
};

@inject('authStore')
@observer
class MenuAccount extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
		this.onAdd = this.onAdd.bind(this); 
	};
	
	render () {
		const { authStore } = this.props;
		const { accounts } = authStore;
		
		const Item = (item: any) => (
			<div className={'item ' + (item.index == 0 ? 'active' : '')} onClick={(e) => { this.onSelect(e, item.id); }}>
				<IconUser {...item} />
				<div className="info">
					<div className="name">{item.name}</div>
					<div className="description">
						<Icon className="check" />0/30 peers
					</div>
				</div>
			</div>
		);
		
		return (
			<div className="items">
				{accounts.map((item: I.Account, i: number) => (
					<Item key={item.id} {...item} index={i} />
				))}
				
				<div className="item add" onClick={this.onAdd}>
					<Icon className="plus" />
					<div className="name">Add profile</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { authStore } = this.props;
		
		dispatcher.call('accountRecover', {}, (errorCode: any, message: any) => {});
	};
	
	onSelect (e: any, id: string) {
	};
	
	onAdd (e: any) {
		const { history } = this.props;
		history.push('/auth/register/add');
	};
	
};

export default MenuAccount;