import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, Smile, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { dispatcher } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	authStore?: any
};
interface State {
	icon: number;
	error: string;
};

const Config: any = require('json/config.json');
const Icons: number[] = [
	12, 1230, 1, 130, 2, 230, 3, 330, 4, 430, 5, 530, 6, 630, 7, 730, 8, 830, 9, 930, 10, 1030, 11, 1130
];

@inject('authStore')
@observer
class PageAuthSetup extends React.Component<Props, State> {

	i: number = 0;
	t: number = 0;
	state = {
		icon: 0,
		error: '',
	};

	render () {
		const { icon, error } = this.state;
		
        return (
			<div>
				<Cover num={3} />
				<Header />
				<Footer />
				
				<Frame>
					<Smile icon={':clock' + Icons[icon] + ':'} size={36} />
					<Title text="Setting up the account..." />
					<Error text={error} />
				</Frame>
			</div>
		);
    };

	componentDidMount () {
		const { authStore, match } = this.props;
		const isRegister = match.params.id == 'register';
		const isAdd = match.params.id == 'add';
		const isSelect = match.params.id == 'select';
		
		this.clear();
		this.i = window.setInterval(() => {
			let { icon } = this.state;
			
			icon++;
			if (icon >= Icons.length) {
				icon = 0;
			};
			
			this.setState({ icon: icon });
		}, 1000);
		
		if (isRegister || isAdd) {
			let request = { 
				username: authStore.name, 
				avatarLocalPath: authStore.icon 
			};
		
			dispatcher.call('accountCreate', request, (errorCode: any, message: any) => {
				if (message.error.code) {
					let error = '';
					switch (message.error.code) {
						case errorCode.FAILED_TO_SET_AVATAR:
							error = 'Please select profile picture';
							break; 
						default:
							error = message.error.desc;
							break;
					};
					if (error) {
						this.setState({ error: error });
					};
				} else
				if (message.account) {
					let account = message.account;
					
					authStore.accountSet({
						id: account.id,
						name: account.name,
						icon: account.avatar,
					});
					
					if (isRegister) {
						this.props.history.push('/auth/success');
					};
					
					if (isAdd) {
						this.props.history.push('/auth/pin-select/add');
					};
				};
			});
		};
		
		if (isSelect) {
			let request = { 
				index: authStore.index 
			};
			
			dispatcher.call('accountSelect', request, (errorCode: any, message: any) => {
				console.log(message);
			});
		};
	};
	
	componentWillUnmount () {
		this.clear();
	};
	
	clear () {
		clearInterval(this.i);
		clearTimeout(this.t);
	};

};

export default PageAuthSetup;