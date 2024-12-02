import * as React from 'react';
import { observer } from 'mobx-react';
import { Frame, Error, Button, Header, Icon, Phrase } from 'Component';
import { I, C, S, U, J, translate, keyboard, Animation, Renderer, analytics, Preview, Storage } from 'Lib';

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
		this.onKeyDownPhrase = this.onKeyDownPhrase.bind(this);
		this.onForgot = this.onForgot.bind(this);
	};
	
	render () {
		const { error } = this.state;
		const { accounts } = S.Auth;
		const length = accounts.length;
		
		return (
			<div ref={ref => this.node = ref}>
				<Header {...this.props} component="authIndex" />
				<Icon className="arrow back" onClick={this.onCancel} />
				
				<Frame>
					<form className="form" onSubmit={this.onSubmit}>
						<Error text={error} className="animation" />

						<div className="animation">
							<Phrase 
								ref={ref => this.refPhrase = ref} 
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

		const phrase = this.refPhrase.getValue();
		const length = phrase.split(' ').length;

		if (length < J.Constant.count.phrase.word) {
			this.setError({ code: 1, description: translate('pageAuthLoginShortPhrase')});
			return;
		};

		this.refSubmit?.setLoading(true);
		
		C.WalletRecover(S.Common.dataPath, phrase, (message: any) => {
			if (this.setError({ ...message.error, description: translate('pageAuthLoginInvalidPhrase')})) {
				return;
			};

			S.Auth.accountListClear();
			U.Data.createSession(phrase, '', () => {
				C.AccountRecover(message => {
					this.setError(message.error);
				});
			});
		});
	};

	select () {
		const { accounts, networkConfig } = S.Auth;
		if (this.isSelecting || !accounts.length) {
			return;
		};

		this.isSelecting = true;

		const { mode, path } = networkConfig;
		const account = accounts[0];
		const { shareTooltip } = S.Common;

		S.Auth.accountSet(account);
		Renderer.send('keytarSet', account.id, this.refPhrase.getValue());

		C.AccountSelect(account.id, S.Common.dataPath, mode, path, (message: any) => {
			if (this.setError(message.error) || !message.account) {
				this.isSelecting = false;
				return;
			};

			S.Auth.accountSet(message.account);
			S.Common.configSet(message.account.config, false);

			const spaceId = Storage.get('spaceId');
			const routeParam = {
				replace: true, 
				onRouteChange: () => {
					if (!shareTooltip) {
						S.Common.shareTooltipSet(false);
						analytics.event('OnboardingTooltip', { id: 'ShareApp' });
					};
				},
			};

			if (spaceId) {
				U.Router.switchSpace(spaceId, '', false, routeParam);
			} else {
				Animation.from(() => {
					U.Data.onAuthWithoutSpace(routeParam);
					this.isSelecting = false;
				});
			};

			U.Data.onInfo(account.info);
			U.Data.onAuthOnce(true);
			analytics.event('SelectAccount', { middleTime: message.middleTime });
		});
	};

	setError (error: { description: string, code: number}) {
		if (!error.code) {
			return false;
		};

		if (error.code == J.Error.Code.FAILED_TO_FIND_ACCOUNT_INFO) {
			U.Router.go('/auth/setup/select', {});
			return;
		};

		this.setState({ error: error.description });
		this.refPhrase?.setError(true);
		this.refSubmit?.setLoading(false);

		S.Auth.accountListClear();

		return U.Common.checkErrorCommon(error.code);
	};

	onKeyDownPhrase (e: React.KeyboardEvent) {
		const { error } = this.state;

		if (error) {
			this.refPhrase?.setError(false);
			this.setState({ error: '' });
		};

		keyboard.shortcut('enter', e, () => this.onSubmit(e));
	};
	
	onCancel () {
		S.Auth.logout(true, false);
		Animation.from(() => U.Router.go('/', { replace: true }));
	};

	onForgot () {
		const platform = U.Common.getPlatform();

		S.Popup.open('confirm', {
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
