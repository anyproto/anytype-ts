import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconUser } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I } from 'ts/lib';

interface Props extends RouteComponentProps<any> {
	authStore?: any;
};

interface State {
};

@inject('authStore')
@observer
class PageMainIndex extends React.Component<Props, State> {
	
	state = {
	};

	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { authStore } = this.props;
		
        return (
			<div>
				<div id="body" className="wrapper">
					<div className="title">
						{authStore.account ? 'Hi, ' + authStore.account.name : ''}
						{authStore.account ? <IconUser name={authStore.account.name} image={authStore.account.icon} /> : ''}
					</div>
				</div>
			</div>
		);
	};
	
	resize () {
	};

};

export default PageMainIndex;