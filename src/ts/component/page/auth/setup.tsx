import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, Smile, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { dispatcher, Storage } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	authStore?: any;
};
interface State {
	icon: number;
	error: string;
};

const Config: any = require('json/config.json');
const Icons: number[] = [
	12, 1230, 1, 130, 2, 230, 3, 330, 4, 430, 5, 530, 6, 630, 7, 730, 8, 830, 9, 930, 10, 1030, 11, 1130
];

@inject('commonStore')
@inject('authStore')
@observer
class PageAuthSetup extends React.Component<Props, State> {

	i: number = 0;
	state = {
		icon: 0,
		error: '',
	};

	render () {
		const { commonStore, match } = this.props;
		const { cover } = commonStore;
		const { icon, error } = this.state;
		
		let title = '';
		switch (match.params.id) {
			case 'init':
				title = 'Logging in...'; 
				break;
			case 'register':
			case 'add': 
				title = 'Creating profile...';
				break;
			case 'select': 
				title = 'Selecting profile...';
				break;
		};
		
        return (
			<div>
				<Cover num={cover} />
				<Header />
				<Footer />
				
				<Frame>
					<Smile icon={':clock' + Icons[icon] + ':'} size={36} />
					<Title text={title} />
					<Error text={error} />
				</Frame>
			</div>
		);
    };

	componentDidMount () {
		const { authStore, match } = this.props;
		
		this.clear();
		this.i = window.setInterval(() => {
			let { icon } = this.state;
			
			icon++;
			if (icon >= Icons.length) {
				icon = 0;
			};
			
			this.setState({ icon: icon });
		}, 1000);
		
		switch (match.params.id) {
			case 'init': 
				this.init(); 
				break;
			case 'register':
			case 'add': 
				this.add();
				break;
			case 'select': 
				this.select();
				break;
		};
	};
	
	componentWillUnmount () {
		this.clear();
	};
	
	init () {
		const { authStore, history } = this.props;
		
		let phrase = Storage.get('phrase');
		if (!phrase) {
			return;
		};
			
		let accountId = Storage.get('accountId');
		let request: any = { 
			rootPath: Config.root, 
			mnemonic: phrase
		};
			
		dispatcher.call('walletRecover', request, (errorCode: any, message: any) => {
			if (message.error.code) {
				return;
			};
			
			if (accountId) {
				request = { 
					rootPath: Config.root,
					id: accountId
				};
				
				dispatcher.call('accountSelect', request, (errorCode: any, message: any) => {
					if (message.error.code) {
						return;
					} else
					if (message.account) {
						authStore.accountSet(message.account);
						history.push('/main/index');
					};
				});
			} else {
				history.push('/auth/account-select');				
			};
		});
	};
	
	add () {
		const { authStore, history, match } = this.props;
		
		let request = { 
			name: authStore.name, 
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
						error = message.error.description;
						break;
				};
				if (error) {
					this.setState({ error: error });
				};
			} else
			if (message.account) {
				authStore.accountSet(message.account);
				
				if (match.params.id == 'register') {
					history.push('/auth/success');
				};
				
				if (match.params.id == 'add') {
					history.push('/auth/pin-select/add');
				};
			};
		});
	};
	
	select () {
		const { authStore, history } = this.props;
		const { account } = authStore; 
		
		let request = { 
			id: account.id 
		};
			
		dispatcher.call('accountSelect', request, (errorCode: any, message: any) => {
			if (message.error.code) {
				let error = message.error.description;
				if (error) {
					this.setState({ error: error });
				};
			} else {
				history.push('/main/index');
			};
		});
	};
	
	clear () {
		clearInterval(this.i);
	};

};

export default PageAuthSetup;