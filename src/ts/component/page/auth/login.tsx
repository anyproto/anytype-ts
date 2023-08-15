import * as React from 'react';
import { Frame, Title, Error, Button, Header, Icon, Phrase } from 'Component';
import { I, UtilCommon, translate, C, keyboard, Animation } from 'Lib';
import { commonStore, authStore, popupStore } from 'Store';
import { observer } from 'mobx-react';

interface State {
	error: string;
};

const PageAuthLogin = observer(class PageAuthLogin extends React.Component<I.PageComponent, State> {

	node = null;
	refPhrase = null;

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
						<div className="buttons animation">
							<Button id="submit" type="input" text={translate('authLoginSubmit')} />

							<div className="small" onClick={this.onForgot}>{translate('authLoginLostPhrase')}</div>
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
		const { error } = this.state;

		this.focus();

		if (error) {
			window.setTimeout(() => {
				this.setState({ error: '' });
				this.refPhrase.setError(false);
			}, 1500);
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
		
		C.WalletRecover(walletPath, phrase, (message: any) => {
			if (message.error.code) {
				this.refPhrase.setError(true);
				this.setState({ error: translate('pageAuthLoginInvalidPhrase') });	
				return;
			};

			authStore.phraseSet(phrase);
			Animation.from(() => UtilCommon.route('/auth/account-select', { replace: true }));
		});
	};

	checkButton () {
		const node = $(this.node);
		const button = node.find('#submit');

		this.canSubmit() ? button.removeClass('disabled') : button.addClass('disabled');
	};

	canSubmit () {
		return this.refPhrase.getValue().length;
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter', e, () => { this.onSubmit(e); });
	};
	
	onCancel () {
		Animation.from(() => UtilCommon.route('/auth/select', { replace: true }));
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