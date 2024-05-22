import * as React from 'react';
import { observer } from 'mobx-react';
import { Frame, Error, Button, Header, Icon, Phrase } from 'Component';
import { I, UtilRouter, UtilData, UtilCommon, translate, C, keyboard, Animation, Renderer, analytics } from 'Lib';
import { commonStore, authStore, popupStore } from 'Store';
const Constant = require('json/constant.json');
const Errors = require('json/error.json');

interface State {
	error: string;
};

const PageAuthLogin = observer(class PageAuthLogin extends React.Component<I.PageComponent, State> {

	node = null;
	refPhrase = null;
	refSubmit = null;
	isSelecting = false;

	state = {
		error: '',
	};
	
	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyDownPhrase = this.onKeyDownPhrase.bind(this);
		this.onChange = this.onChange.bind(this);
		this.canSubmit = this.canSubmit.bind(this);
		this.onForgot = this.onForgot.bind(this);
	};
	
	render () {
		const { error } = this.state;
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
							<Phrase 
								ref={ref => this.refPhrase = ref} 
								onChange={this.onChange} 
								onKeyDown={this.onKeyDownPhrase}
								isHidden={true} 
								placeholder={translate('phrasePlaceholder')}
							/>
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
			</div>
		);
	};

	componentDidMount () {
		Animation.to();
		this.focus();
	};
	
	componentDidUpdate () {
		this.focus();
		this.select();
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
		
		const phrase = this.refPhrase.getValue();
		const length = phrase.split(' ').length;

		if (length < Constant.limit.phrase.word) {
			this.setError({ code: 1, description: translate('pageAuthLoginInvalidPhrase')})
			return;
		};

		this.refSubmit?.setLoading(true);
		
		C.WalletRecover(commonStore.dataPath, phrase, (message: any) => {
			if (this.setError({ ...message.error, description: translate('pageAuthLoginInvalidPhrase')})) {
				return;
			};

			authStore.accountListClear();
			UtilData.createSession(phrase, '', () => {
				C.AccountRecover(message => this.setError(message.error));
			});
		});
	};

	select () {
		const { accounts, networkConfig } = authStore;
		if (this.isSelecting || !accounts.length) {
			return;
		};

		this.isSelecting = true;

		const { mode, path } = networkConfig;
		const account = accounts[0];

		authStore.accountSet(account);
		Renderer.send('keytarSet', account.id, this.refPhrase.getValue());

		C.AccountSelect(account.id, commonStore.dataPath, mode, path, (message: any) => {
			if (this.setError(message.error) || !message.account) {
				this.isSelecting = false;
				return;
			};

			authStore.accountSet(message.account);
			commonStore.configSet(message.account.config, false);

			UtilData.onInfo(message.account.info);
			Animation.from(() => {
				UtilData.onAuth();
				UtilData.onAuthOnce(true);

				this.isSelecting = false;
			});
			analytics.event('SelectAccount', { middleTime: message.middleTime });
		});
	};

	setError (error: { description: string, code: number}) {
		if (!error.code) {
			return false;
		};

		if (error.code == Errors.Code.FAILED_TO_FIND_ACCOUNT_INFO) {
			UtilRouter.go('/auth/setup/select', {});
			return;
		};

		this.setState({ error: error.description });
		this.refPhrase?.setError(true);
		this.refSubmit?.setLoading(false);

		authStore.accountListClear();

		return UtilCommon.checkErrorCommon(error.code);
	};

	checkButton () {
		this.refSubmit.setDisabled(!this.canSubmit());
	};

	canSubmit () {
		return this.refPhrase.getValue().length;
	};

	onKeyDown (e: React.KeyboardEvent) {
		keyboard.shortcut('enter', e, () => this.onSubmit(e));
	};

	onKeyDownPhrase (e: React.KeyboardEvent) {
		const { error } = this.state;

		if (error) {
			this.refPhrase?.setError(false);
			this.setState({ error: '' });
		};
	};
	
	onCancel () {
		authStore.logout(true, false);
		Animation.from(() => UtilRouter.go('/', { replace: true }));
	};

	onChange () {
		this.checkButton();
	};

	onForgot () {
		const platform = UtilCommon.getPlatform();

		popupStore.open('confirm', {
			className: 'lostPhrase isLeft',
            data: {
				title: translate('popupConfirmLostPhraseTitle'),
                text: translate(`popupConfirmLostPhraseText${platform}`),
				textConfirm: translate('commonOkay'),
				canConfirm: true,
				canCancel: false,
            },
        });
	};

});

export default PageAuthLogin;