import * as React from 'react';
import { Frame, Title, Input, Error, Button, Header, Footer, Icon } from 'Component';
import { I, Util, translate, C, keyboard, Animation } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';

interface State {
	error: string;
};

const PageAuthLogin = observer(class PageAuthLogin extends React.Component<I.PageComponent, State> {

	phraseRef: any;

	state = {
		error: ''
	};
	
	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
	};
	
	render () {
		const { error } = this.state;
		
        return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />

				<Icon className="arrow back animation" onClick={this.onCancel} />
				
				<Frame>
					<Title text={translate('authLoginTitle')} className="animation" />
					<Error text={error} className="animation" />
							
					<form onSubmit={this.onSubmit}>
						<Input 
							ref={ref => this.phraseRef = ref} 
							className="animation" 
							placeholder={translate('authLoginLabel')} 
							onKeyDown={this.onKeyDown} 
						/>

						<div className="buttons animation">
							<Button type="input" text={translate('authLoginLogin')} />
						</div>
					</form>
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		Animation.to();
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

			authStore.phraseSet(phrase);
			Animation.from(() => { Util.route('/auth/account-select'); });
		});
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter', e, () => { this.onSubmit(e); });
	};
	
	onCancel (e: any) {
		Animation.from(() => { Util.route('/auth/select'); });
	};
	
});

export default PageAuthLogin;