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
	icon: string;
	index: number;
	error: string;
};

const Icons: number[] = [
	12, 1230, 1, 130, 2, 230, 3, 330, 4, 430, 5, 530, 6, 630, 7, 730, 8, 830, 9, 930, 10, 1030, 11, 1130
];

@inject('commonStore')
@inject('authStore')
@observer
class PageAuthSetup extends React.Component<Props, State> {

	i: number = 0;
	state = {
		icon: '',
		index: 0,
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
					<Smile className="c64" icon={icon} size={36} />
					<Title text={title} />
					<Error text={error} />
				</Frame>
			</div>
		);
    };

	componentDidMount () {
		const { authStore, match } = this.props;
		
		this.clear();
		this.setClock();
		this.i = window.setInterval(() => { this.setClock(); }, 1000);
		
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
	
	setClock () {
		let { index } = this.state;
			
		index++;
		if (index >= Icons.length) {
			index = 0;
		};
			
		this.setState({ icon: ':clock' + Icons[index] + ':', index: index });
	};
	
	init () {
		const { authStore, history } = this.props;
		const { path } = authStore;
		
		let phrase = Storage.get('phrase');
		if (!phrase) {
			return;
		};
		
		let accountId = Storage.get('accountId');
		let request: any = { 
			rootPath: path, 
			mnemonic: phrase
		};
			
		dispatcher.call('walletRecover', request, (errorCode: any, message: any) => {
			if (message.error.code) {
				this.setError(message.error.description);
			} else 
			if (accountId) {
				authStore.phraseSet(phrase);
				
				request = { 
					rootPath: path,
					id: accountId
				};
				
				dispatcher.call('accountSelect', request, (errorCode: any, message: any) => {
					if (message.error.code) {
						this.setError(message.error.description);
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
			avatar: authStore.icon 
		};
		
		dispatcher.call('accountCreate', request, (errorCode: any, message: any) => {
			if (message.error.code) {
				this.setError(message.error.description);
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
				this.setError(message.error.description);
			} else {
				history.push('/main/index');
			};
		});
	};
	
	setError (v: string) {
		if (!v) {
			return;
		};
		
		this.clear();
		this.setState({ icon: ':skull_and_crossbones:', error: v });
	};
	
	clear () {
		clearInterval(this.i);
	};

};

export default PageAuthSetup;