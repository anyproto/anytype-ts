import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, Smile, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { I, Storage, translate, keyboard, C, DataUtil } from 'ts/lib';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {};
interface State {
	icon: string;
	index: number;
	error: string;
};

const Errors = require('json/error.json');
const com = require('proto/commands.js');
const Icons: number[] = [
	12, 1230, 1, 130, 2, 230, 3, 330, 4, 430, 5, 530, 6, 630, 7, 730, 8, 830, 9, 930, 10, 1030, 11, 1130
];

@observer
class PageAuthSetup extends React.Component<Props, State> {

	i: number = 0;
	state = {
		icon: '',
		index: 0,
		error: '',
	};

	render () {
		const { match, history } = this.props;
		const { coverId, coverImg } = commonStore;
		const { icon, error } = this.state;
		
		let title = '';
		switch (match.params.id) {
			case 'init':
				title = translate('authSetupLogin'); 
				break;
			case 'register':
			case 'add': 
				title = translate('authSetupRegister');
				break;
			case 'select': 
				title = translate('authSetupSelect');
				break;
		};
		
		return (
			<div>
				<Cover type={I.CoverType.Image} num={coverId} image={coverImg} />
				<Header />
				<Footer />
				
				<Frame>
					<Smile className="c64" icon={icon} size={36} />
					<Title text={title} />
					<Error text={error} />
					{error ? <Button className="orange" text="Back" onClick={() => { history.goBack(); }} /> : ''}
				</Frame>
			</div>
		);
    };

	componentDidMount () {
		const { match } = this.props;
		
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
		const { history } = this.props;
		const { path } = authStore;
		const debug = Boolean(Storage.get('debugUI'));
		const phrase = Storage.get('phrase');
		const accountId = Storage.get('accountId');
		const pin = debug ? '' : Storage.get('pin');
		const pageId = Storage.get('pageId');
		const popupNewBlock = Storage.get('popupNewBlock');

		if (!phrase) {
			return;
		};
		
		C.WalletRecover(path, phrase, (message: any) => {
			if (message.error.code) {
				this.setError(message.error.description);
			} else 
			if (accountId) {
				authStore.phraseSet(phrase);
				
				C.AccountSelect(accountId, path, (message: any) => {
					if (message.error.code) {
						this.setError(message.error.description);
					} else
					if (message.account) {
						authStore.accountSet(message.account);
						
						DataUtil.pageInit(() => {
							if (pin) {
								history.push('/auth/pin-check');
								keyboard.setPinCheck();
							} else 
							if (pageId) {
								history.push('/main/edit/' + pageId);
							} else {
								history.push('/main/index');
							};
						});
					};
				});
			} else {
				history.push('/auth/account-select');
			};
		});
	};
	
	add () {
		const { history, match } = this.props;
		
		C.AccountCreate(authStore.name, authStore.icon, authStore.code, (message: any) => {
			if (message.error.code) {
				const error = Errors.AccountCreate[message.error.code] || message.error.description;
				
				this.setError(error);
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
		const { history } = this.props;
		const { account, path } = authStore;
		
		C.AccountSelect(account.id, path, (message: any) => {
			if (message.error.code) {
				this.setError(message.error.description);
			} else
			if (message.account) {
				authStore.accountSet(account);
				
				DataUtil.pageInit(() => {
					history.push('/main/index');
				});
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