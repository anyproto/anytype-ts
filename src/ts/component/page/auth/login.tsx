import * as React from 'react';
import { Frame, Error, Button, Header, Icon, Phrase } from 'Component';
import { I, UtilRouter, UtilData, UtilCommon, translate, C, keyboard, Animation, Renderer, analytics } from 'Lib';
import { commonStore, authStore, popupStore } from 'Store';
import { observer } from 'mobx-react';

interface State {
	error: string;
};

const PageAuthLogin = observer(class PageAuthLogin extends React.Component<I.PageComponent, State> {

	node = null;
	refPhrase = null;
	refSubmit = null;

	state = {
		error: '',
	};
	
	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onChange = this.onChange.bind(this);
		this.canSubmit = this.canSubmit.bind(this);
		this.onSelfHost = this.onSelfHost.bind(this);
		this.onForgot = this.onForgot.bind(this);
	};
	
	render () {
		const { error } = this.state;
		const { config } = commonStore;
		const { accounts } = authStore;
		const length = accounts.length;
		
        return (
			<div ref={ref => this.node = ref} onKeyDown={this.onKeyDown}>
				<Header {...this.props} component="authIndex" />
				<Icon className="arrow back" onClick={this.onCancel} />
				
				<Frame>
					<form className="form" onSubmit={this.onSubmit}>
						<Error text={error} className="animation" />

						<div className="animation">
							<Phrase ref={ref => this.refPhrase = ref} onChange={this.onChange} isHidden={true} />
						</div>
						<div className="buttons">
							<div className="animation">
								<Button ref={ref => this.refSubmit = ref} text={translate('authLoginSubmit')} onClick={this.onSubmit} />
							</div>

							<div className="animation">
								<div className="small" onClick={this.onForgot}>{translate('authLoginLostPhrase')}</div>
							</div>
						</div>
					</form>
				</Frame>

				{config.experimental ? (
					<div className="animation small bottom" onClick={this.onSelfHost}>
						<Icon />
						{translate('authLoginSelfHost')}
					</div>
				) : ''}
			</div>
		);
	};

	componentDidMount () {
		Animation.to();
		this.focus();
	};
	
	componentDidUpdate () {
		const { accounts, phrase } = authStore;

		this.focus();

		if (accounts && accounts.length) {
			const account = accounts[0];

			authStore.accountSet(account);
			Renderer.send('keytarSet', account.id, phrase);

			this.select();
		};
	};

	focus () {
		if (this.refPhrase) {
			this.refPhrase.focus();
		};
	};

	onSubmit (e: any) {
		e.preventDefault();

		if (!this.canSubmit()) {
			return;
		};
		
		const { walletPath } = authStore;
		const phrase = this.refPhrase.getValue();

		this.refSubmit.setLoading(true);
		
		C.WalletRecover(walletPath, phrase, (message: any) => {
			if (this.setError({ ...message.error, description: translate('pageAuthLoginInvalidPhrase')})) {
				return;
			};

			authStore.phraseSet(phrase);
			authStore.accountListClear();

			UtilData.createSession(() => {
				C.AccountRecover(message => this.setError(message.error));
			});
		});
	};

	select () {
		const { account, walletPath } = authStore;

		C.AccountSelect(account.id, walletPath, (message: any) => {
			if (this.setError(message.error) || !message.account) {
				return;
			};

			authStore.accountSet(message.account);
			commonStore.configSet(message.account.config, false);

			UtilData.onInfo(message.account.info);
			Animation.from(() => UtilData.onAuth());
			analytics.event('SelectAccount', { middleTime: message.middleTime });
		});
	};

	setError (error: { description: string, code: number}) {
		if (!error.code) {
			return false;
		};

		this.setState({ error: error.description });
		this.refPhrase?.setError(true);
		this.refSubmit.setLoading(false);

		authStore.accountListClear();

		UtilCommon.checkError(error.code);
		return true;
	};

	checkButton () {
		this.refSubmit.setDisabled(!this.canSubmit());
	};

	canSubmit () {
		return this.refPhrase.getValue().length;
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter', e, () => this.onSubmit(e));
	};
	
	onCancel () {
		authStore.logout(true, false);
		Animation.from(() => UtilRouter.go('/auth/select', { replace: true }));
	};

	onSelfHost () {
	};

	onChange () {
		this.checkButton();
	};

	onForgot () {
		popupStore.open('confirm', {
            data: {
                text: translate('authLoginLostPhrasePopupContent'),
				textConfirm: translate('commonOkay'),
				canConfirm: true,
				canCancel: false,
            },
        });
	};

});

export default PageAuthLogin;