import * as React from 'react';
import { Icon, IconUser } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { I, C, Util } from 'ts/lib';

interface Props extends I.Menu {
	history: any;
	commonStore?: any;
	authStore?: any;
	blockStore?: any;
};

@inject('commonStore')
@inject('authStore')
@inject('blockStore')
@observer
class MenuAccount extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
		this.onAdd = this.onAdd.bind(this); 
	};
	
	render () {
		const { authStore } = this.props;
		const { account, accounts } = authStore;
		
		const Item = (item: any) => (
			<div className={'item ' + (item.id == account.id ? 'active' : '')} onClick={(e) => { this.onSelect(e, item.id); }}>
				<IconUser className="c40" {...item} />
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
					<Item key={i} {...item} />
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
		const { accounts } = authStore;
		
		if (!accounts.length) {
			authStore.accountClear();
			C.AccountRecover();			
		};
	};
	
	onSelect (e: any, id: string) {
		const { blockStore, commonStore, authStore } = this.props;
		const { path } = authStore;
		
		commonStore.menuClose(this.props.id);
		
		C.AccountSelect(id, path, (message: any) => {
			if (message.error.code) {
			} else
			if (message.account) {
				authStore.accountSet(message.account);
				Util.pageInit(this.props);
			};
		});
	};
	
	onAdd (e: any) {
		const { history } = this.props;
		history.push('/auth/register/add');
	};
	
};

export default MenuAccount;