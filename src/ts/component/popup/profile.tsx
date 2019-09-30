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
		
		return (
			<div>
				{authStore.account ? <IconUser name={authStore.account.name} image={authStore.account.icon} /> : ''}
			</div>
		);
	};
	
};

export default PopupProfile;