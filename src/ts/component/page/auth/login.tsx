import * as React from 'react';
import { Frame, Title, Error, Button, Header, Footer, Icon, KeyPhrase } from 'Component';
import { I, Util, translate, C, keyboard, Animation } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';

interface State {
	error: string;
	phrase: string,
};

const PageAuthLogin = observer(class PageAuthLogin extends React.Component<I.PageComponent, State> {

	phraseRef: any;

	state = {
		error: '',
		phrase: 'duck duck goose'
	};
	
	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
	};
	
	render () {
		const { error, phrase } = this.state;
		
        return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />

				<Icon className="arrow back animation" onClick={this.onCancel} />
				
				<Frame>
					<Title text={translate('authLoginTitle')} className="animation" />
					<Error text={error} className="animation" />
							
					<form onSubmit={this.onSubmit}>
						<KeyPhrase
							ref={ref => this.phraseRef = ref}
							phrase={phrase}
							isEditable
							onChange={phrase => { this.setState({ phrase }); console.log(this.state.phrase); }}
							/* placeholder={translate('authLoginLabel')}  */
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
		/* this.phraseRef.focus(); */
	};
	
	componentDidUpdate () {
		/* this.phraseRef.focus(); */
	};
	onSubmit (e: any) {
		e.preventDefault();
		
		const { walletPath } = authStore;
		const { phrase } = this.state;
		
		C.WalletRecover(walletPath, phrase, (message: any) => {
			if (message.error.code) {
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