import * as React from 'react';
import { Frame, Title, Error, Button, Header, Icon, KeyPhrase } from 'Component';
import { I, Util, translate, C, keyboard, Animation } from 'Lib';
import { authStore, popupStore } from 'Store';
import { observer } from 'mobx-react';

interface State {
	error: string;
	phrase: string;
	showPhrase: boolean;
};

const ANIMATION_CN = 'animation';

const PageAuthLogin = observer(class PageAuthLogin extends React.Component<I.PageComponent, State> {

	phraseRef: any;

	state = {
		error: '',
		phrase: '',
		showPhrase: false,
	};
	
	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onChangePhrase = this.onChangePhrase.bind(this);
		this.canSubmit = this.canSubmit.bind(this);
		this.togglePhraseVisibility = this.togglePhraseVisibility.bind(this);
		this.onSelfHost = this.onSelfHost.bind(this);
		this.showLostPhrasePopup = this.showLostPhrasePopup.bind(this);
	};
	
	render () {
		const { error, phrase, showPhrase } = this.state;
		
        return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Icon className={['arrow', 'back', ANIMATION_CN].join(' ')} onClick={this.onCancel} />
				
				<Frame>
					<Title text={translate('authLoginTitle')} className={ANIMATION_CN} />							
					<form onSubmit={this.onSubmit}>
						<Error text={error} className={ANIMATION_CN} />
						<div className={['keyPhraseContainer', ANIMATION_CN].join(' ')}>
							<KeyPhrase
								ref={ref => this.phraseRef = ref}
								phrase={phrase}
								isEditable
								isBlurred={!showPhrase}
								isInvalid={error.length > 0}
								onChange={this.onChangePhrase}
							/>
							<Icon className={showPhrase ? 'see' : 'hide' } onClick={this.togglePhraseVisibility} />
						</div>
						<div className={['buttons', ANIMATION_CN].join(' ')}>
							<Button className={this.canSubmit() ? '' : 'disabled'} type="input" text={translate('authLoginSubmit')} />
							<span
								className="lostPhrase"
								onClick={this.showLostPhrasePopup}
							>{translate('authLoginLostPhrase')}
							</span>
						</div>
					</form>
				</Frame>
				<span
					className={[ANIMATION_CN, 'selfHost', 'bottom'].join(' ')}
					onClick={this.onSelfHost}
				>
						<Icon className="selfHost" />
						{translate('authLoginSelfHost')}
				</span>
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

	canSubmit () {
		const { phrase } = this.state;
		return phrase.length > 0;
	}

	onSubmit (e: any) {
		if (!this.canSubmit()) {
			return;
		}
		
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

	onSelfHost () {
		alert("feature not implemented");
	}

	onChangePhrase (phrase: string) {
		this.setState({ phrase, error: '' });
	}

	togglePhraseVisibility () {
		this.setState({ showPhrase: !this.state.showPhrase })
	}

	/** Shows a Popup that explains to the user that the phrase cannot be recovered */
	showLostPhrasePopup = () => {
		popupStore.open('confirm', {
            data: {
                title: translate('authLoginLostPhrasePopupTitle'),
                text: translate('authLoginLostPhrasePopupContent'),
                textConfirm: 'Okay',
				canConfirm: true,
				canCancel: false,
                onConfirm: () => { popupStore.close('confirm'); },
            },
        });
	};
});

export default PageAuthLogin;