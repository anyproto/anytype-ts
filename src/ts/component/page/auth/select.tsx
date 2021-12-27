import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { Util, translate, C } from 'ts/lib';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {}
interface State {
	error: string;
}

const PageAuthSelect = observer(class PageAuthSelect extends React.Component<Props, State> {

	state = {
		error: ''
	};

	constructor (props: any) {
        super(props);

		this.onLogin = this.onLogin.bind(this);
		this.onRegister = this.onRegister.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { error } = this.state;
		
        return (
			<div>
				<Cover {...cover} className="main" />
				<Header />
				<Footer />
				
				<Frame>
					<Title text={translate('authSelectTitle')} />
					<Label text={translate('authSelectLabel')} />
					<Error text={error} />
								
					<div className="buttons">
						<Button text={translate('authSelectLogin')} type="input" onClick={this.onLogin} />
						<Button text={translate('authSelectSignup')} type="input" color="grey" onClick={this.onRegister} />
					</div>
				</Frame>
			</div>
		);
	};
	
	onLogin (e: any) {
		Util.route('/auth/login');
	};
	
	onRegister (e: any) {
		const { path } = authStore;

		C.WalletCreate(path, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
			} else {
				authStore.phraseSet(message.mnemonic);
				Util.route('/auth/register/register');
			};
		});
	};
	
});

export default PageAuthSelect;