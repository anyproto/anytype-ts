import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { dispatcher, Storage, translate } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	authStore?: any;
};
interface State {
	error: string;
};

@inject('commonStore')
@inject('authStore')
@observer
class PageAuthSelect extends React.Component<Props, State> {

	state = {
		error: ''
	};

	constructor (props: any) {
        super(props);

		this.onLogin = this.onLogin.bind(this);
		this.onRegister = this.onRegister.bind(this);
	};
	
	render () {
		const { commonStore } = this.props;
		const { cover } = commonStore;
		const { error } = this.state;
		
        return (
			<div>
				<Cover num={cover} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text={translate('authSelectTitle')} />
					<Label text={translate('authSelectLabel')} />
					<Error text={error} />
								
					<div className="buttons">
						<Button text={translate('authSelectLogin')} type="input" className="orange" onClick={this.onLogin} />
						<Button text={translate('authSelectSignup')} type="input" className="grey" onClick={this.onRegister} />
					</div>
				</Frame>
			</div>
		);
    };

	onLogin (e: any) {
		this.props.history.push('/auth/login');
	};
	
	onRegister (e: any) {
		const { authStore, history } = this.props;
		const { path } = authStore;
		
		let request = { 
			rootPath: path
		};
		
		dispatcher.call('walletCreate', request, (errorCode: any, message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
			} else {
				authStore.phraseSet(message.mnemonic);
				history.push('/auth/register/register');
			};
		});
	};
	
};

export default PageAuthSelect;