import * as React from 'react';
import { Icon, IconUser, Button } from 'ts/component';
import { Storage } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props {
	history: any;
	authStore?: any;
};

@inject('authStore')
@observer
class PopupProfile extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onLogout = this.onLogout.bind(this);
	};
	
	render () {
		const { authStore } = this.props;
		const { account } = authStore;
		
		return (
			<div>
				{authStore.account ? <IconUser name={account.name} image={account.icon} /> : ''}
				<Button className="orange" text="Logout" onClick={this.onLogout} />
			</div>
		);
	};
	
	onLogout (e: any) {
		Storage.delete('phrase');
		Storage.delete('account');
		
		this.props.history.push('/');
	};
	
};

export default PopupProfile;