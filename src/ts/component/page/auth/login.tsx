import * as React from 'react';
import $ from 'jquery';
import { Frame, Title, Error, Button, Header, Icon, KeyPhrase } from 'Component';
import { I, Util, translate, C, keyboard, Animation } from 'Lib';
import { authStore, popupStore, commonStore } from 'Store';
import { observer } from 'mobx-react';

interface State {
	error: string;
	showPhrase: boolean;
};

const PageAuthLogin = observer(class PageAuthLogin extends React.Component<I.PageComponent, State> {

	node = null;
	refPhrase = null;

	state = {
		error: '',
		showPhrase: false,
	};
	
	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onChange = this.onChange.bind(this);
		this.canSubmit = this.canSubmit.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onSelfHost = this.onSelfHost.bind(this);
		this.onForgot = this.onForgot.bind(this);
	};
	
	render () {
		const { error, showPhrase } = this.state;
		const { config } = commonStore;
		
        return (
			<div ref={ref => this.node = ref}>
				<Header {...this.props} component="authIndex" />
				<Icon className="arrow back animation" onClick={this.onCancel} />
				
				<Frame>
					<Title text={translate('authLoginTitle')} className="animation" />	

					<form className="form" onSubmit={this.onSubmit}>
						<Error text={error} className="animation" />

						<div className="keyPhraseContainer animation">
							<KeyPhrase
								ref={ref => this.refPhrase = ref}
								isEditable
								isBlurred={!showPhrase}
								isInvalid={error.length > 0}
								onChange={this.onChange}
							/>
							<Icon className={showPhrase ? 'see' : 'hide' } onClick={this.onToggle} />
						</div>
						<div className="buttons animation">
							<Button id="submit" type="input" text={translate('authLoginSubmit')} />

							<span className="small" onClick={this.onForgot}>{translate('authLoginLostPhrase')}</span>
						</div>
					</form>
				</Frame>

				{config.experimental ? (
					<span className="animation small bottom" onClick={this.onSelfHost}>
						<Icon />
						{translate('authLoginSelfHost')}
					</span>
				) : ''}
			</div>
		);
	};

	componentDidMount () {
		Animation.to();
		this.focus();
	};
	
	componentDidUpdate () {
		this.focus();
	};

	focus () {
		if (this.refPhrase) {
			this.refPhrase.focus();
		};
	};

	onSubmit (e: any) {
		if (!this.canSubmit()) {
			return;
		};
		
		e.preventDefault();
		
		const { walletPath } = authStore;
		const phrase = this.refPhrase.getValue();
		
		C.WalletRecover(walletPath, phrase, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });	
				return;
			};

			authStore.phraseSet(phrase);
			Animation.from(() => { Util.route('/auth/account-select'); });
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
		Animation.from(() => { Util.route('/auth/select'); });
	};

	onSelfHost () {
	};

	onChange () {
		this.checkButton();
	};

	onToggle () {
		this.setState({ showPhrase: !this.state.showPhrase });
	};

	onForgot () {
		popupStore.open('confirm', {
            data: {
                title: translate('authLoginLostPhrasePopupTitle'),
                text: translate('authLoginLostPhrasePopupContent'),
				canConfirm: true,
				canCancel: false,
            },
        });
	};

});

export default PageAuthLogin;