import * as React from 'react';
import { Frame, Title, Label, Button, Header, Footer, Error } from 'Component';
import { I, C, UtilRouter, UtilCommon, translate, Animation, analytics, UtilData, Renderer } from 'Lib';
import { authStore, commonStore } from 'Store';
import { observer } from 'mobx-react';
import Constant from 'json/constant.json';

interface State {
	error: string;
};

const PageAuthSelect = observer(class PageAuthSelect extends React.Component<I.PageComponent, State> {

	refLogin = null;
	state = {
		error: '',
	};

	constructor (props: I.PageComponent) {
        super(props);

		this.onLogin = this.onLogin.bind(this);
		this.onRegister = this.onRegister.bind(this);
	};

	render () {
		const { error } = this.state;

        return (
			<div>
				<Header {...this.props} className="animation" component="authIndex" />
				<Frame>
					<Title className="animation" text={translate('authSelectTitle')} />
					<Title className="grey animation" text={translate('authSelectLabel1')} />
					<Label className="descr animation" text={translate('authSelectLabel2')} />

					<div className="buttons">
						<div className="animation">
							<Button ref={ref => this.refLogin = ref} text={translate('authSelectSignup')} onClick={this.onRegister} />
						</div>
						<div className="animation">
							<Button text={translate('authSelectLogin')} color="blank" onClick={this.onLogin} />
						</div>
					</div>

					<Error text={error} />
				</Frame>
				<Footer {...this.props} className="animation" component="authDisclaimer" />
			</div>
		);
	};

	componentDidMount(): void {
		Animation.to();
		window.setTimeout(() => analytics.event('ScreenIndex'), 100);
	};

	componentDidUpdate(): void {
		Animation.to();
	};

	onLogin () {
		Animation.from(() => UtilRouter.go('/auth/login', {}));
	};

	onRegister () {
		this.accountCreate(() => {
			Animation.from(() => {
				UtilRouter.go('/auth/onboard', {});

				this.refLogin.setLoading(false);
			});
		});
	};

	accountCreate (callBack?: () => void) {
		this.refLogin.setLoading(true);

		C.WalletCreate(authStore.walletPath, (message) => {
			if (message.error.code) {
				this.setError(message.error.description);
				return;
			};

			authStore.phraseSet(message.mnemonic);

			UtilData.createSession((message) => {
				if (message.error.code) {
					this.setError(message.error.description);
					return;
				};

				const { accountPath, phrase } = authStore;

				C.AccountCreate('', '', accountPath, UtilCommon.rand(1, Constant.iconCnt), (message) => {
					if (message.error.code) {
						this.setError(message.error.description);
						return;
					};

					authStore.accountSet(message.account);
					commonStore.configSet(message.account.config, false);
					commonStore.redirectSet('/auth/onboard');

					Renderer.send('keytarSet', message.account.id, phrase);
					analytics.event('CreateAccount', { middleTime: message.middleTime });

					UtilData.onInfo(message.account.info);
					UtilData.onAuth(callBack);
				});
			});
		});
	};

	setError (error: string) {
		this.refLogin.setLoading(false);
		this.setState({ error });
	};

});

export default PageAuthSelect;
