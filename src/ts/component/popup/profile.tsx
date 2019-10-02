import * as React from 'react';
import { Icon, IconUser } from 'ts/component';
import { observer, inject } from 'mobx-react';

interface Props {
	authStore?: any;
};

@inject('authStore')
@observer
class PopupProfile extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { authStore } = this.props;
		const { account } = authStore;
		
		return (
			<div>
				{authStore.account ? <IconUser name={account.name} image={account.icon} /> : ''}
			</div>
		);
	};
	
};

export default PopupProfile;