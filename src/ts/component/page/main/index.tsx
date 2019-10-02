import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { IconUser, Cover, HeaderMainIndex as Header } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I } from 'ts/lib';

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	authStore?: any;
	documentStore?: any;
};

interface State {};

@inject('commonStore')
@inject('authStore')
@inject('documentStore')
@observer
class PageMainIndex extends React.Component<Props, State> {
	
	state = {
	};

	constructor (props: any) {
		super(props);
		
		this.onProfile = this.onProfile.bind(this);
	};
	
	render () {
		const { authStore, commonStore } = this.props;
		const { cover } = commonStore;
		
		return (
			<div>
				<Cover num={cover} />
				<Header />
				
				<div id="body" className="wrapper">
					<div className="title">
						{authStore.account ? 'Hi, ' + authStore.account.name : ''}
						{authStore.account ? <IconUser name={authStore.account.name} image={authStore.account.icon} onClick={this.onProfile} /> : ''}
					</div>
					<div className="documents">
					</div>
				</div>
			</div>
		);
	};
	
	onProfile (e: any) {
		const { commonStore } = this.props;
		commonStore.popupOpen('profile', {});
	};

};

export default PageMainIndex;