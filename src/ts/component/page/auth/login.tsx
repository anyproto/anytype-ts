import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Textarea, Button, Header, FooterAuth as Footer } from 'ts/component';
import { Util, translate, C, keyboard } from 'ts/lib';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {}
interface State {
	error: string;
}

const PageAuthLogin = observer(class PageAuthLogin extends React.Component<Props, State> {

	phraseRef: any;

	state = {
		error: ''
	};
	
	constructor (props: any) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { error } = this.state;
		
        return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer />
				
				<Frame>
					<Title text={translate('authLoginTitle')} />
					<Label text={translate('authLoginLabel')} />
					<Error text={error} />
							
					<form onSubmit={this.onSubmit}>
						<div className="textareaWrap">
							<Textarea 
								ref={(ref: any) => this.phraseRef = ref} 
								placeholder={translate('authLoginPhrase')} 
								onKeyDown={this.onKeyDown} 
							/>
						</div>
						<div className="buttons">
							<Button type="input" text={translate('authLoginLogin')} />
							<Button text={translate('authLoginBack')} color="grey" onClick={this.onCancel} />
						</div>
					</form>
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		this.phraseRef.focus();
	};
	
	componentDidUpdate () {
		this.phraseRef.focus();
	};

	onSubmit (e: any) {
		e.preventDefault();
		
		const { walletPath } = authStore;
		const phrase = this.phraseRef.getValue().trim();
		
		this.phraseRef.setError(false);
		
		C.WalletRecover(walletPath, phrase, (message: any) => {
			if (message.error.code) {
				this.phraseRef.setError(true);
				this.setState({ error: message.error.description });	
				return;
			};

			C.WalletCreateSession(phrase, (message: any) => {
				authStore.tokenSet(message.token);
				authStore.phraseSet(phrase);

				Util.route('/auth/account-select');
			});
		});
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter', e, (pressed: string) => {
			this.onSubmit(e);
		})
	};
	
	onCancel (e: any) {
		Util.route('/auth/select');
	};
	
});

export default PageAuthLogin;