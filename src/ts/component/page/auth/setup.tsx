import * as React from 'react';
import { Frame, Title, Label, Error, Button, Header, Footer, Icon, Loader } from 'Component';
import { I, Storage, translate, C, UtilData, UtilCommon, Action, Animation, analytics } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';
import Errors from 'json/error.json';

interface State {
	index: number;
	error: { description: string, code: number };
};

const PageAuthSetup = observer(class PageAuthSetup extends React.Component<I.PageComponent, State> {

	node = null;
	refFrame = null;
	i = 0;
	state = {
		index: 0,
		error: null,
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onCancel = this.onCancel.bind(this);
		this.onBackup = this.onBackup.bind(this);
		this.setError = this.setError.bind(this);
	};

	render () {
		const error = this.state.error || {};
		const back = <Icon className="arrow back" onClick={this.onCancel} />;

		let content = null;

		if (error.code) {
			if (error.code == Errors.Code.FAILED_TO_FIND_ACCOUNT_INFO) {
				content = (
					<div className="importBackupWrap">
						{back}

						<Title className="animation" text={translate('pageAuthSetupCongratulations')} />
						<Label className="animation" text={translate('pageAuthSetupLongread')} />

						<div className="buttons">
							<div className="animation">
								<Button text={translate('pageAuthSetupImportBackup')} onClick={this.onBackup} />
							</div>
						</div>
					</div>
				);
			} else {
				content = (
					<React.Fragment>
						{back}

						<Title className="animation" text={translate('commonError')} />
						<Error className="animation" text={error.description} />

						<div className="buttons">
							<div className="animation">
								<Button text={translate('commonBack')} onClick={() => UtilCommon.route('/', {})} />
							</div>
						</div>
					</React.Fragment>
				);
			};
		} else {
			content = (
				<React.Fragment>
					<Title className="animation" text={translate('pageAuthSetupEnteringVoid')} />
					<Loader className="animation" />
				</React.Fragment>
			);
		};
		
		return (
			<div 
				ref={node => this.node = node} 
				className="wrapper"
			>
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame ref={ref => this.refFrame = ref}>
					{content}
				</Frame>
			</div>
		);
    };

	componentDidMount () {
		const { match } = this.props;
		const { account, walletPath } = authStore;

		switch (match.params.id) {
			case 'init': {
				this.init(); 
				break;
			};

			case 'select': {
				this.select(account.id, walletPath, true);
				break;
			};

		};

		Animation.to();
	};

	componentDidUpdate (): void {
		this.refFrame.resize();

		Animation.to();
	};
	
	init () {
		const { walletPath, phrase } = authStore;
		const accountId = Storage.get('accountId');

		if (!phrase) {
			return;
		};

		C.WalletRecover(walletPath, phrase, (message: any) => {
			if (this.setError(message.error)) {
				return;
			};

			UtilData.createSession((message: any) => {
				if (this.setError(message.error)) {
					return;
				};

				if (accountId) {
					authStore.phraseSet(phrase);
					this.select(accountId, walletPath, false);
				} else {
					UtilCommon.route('/auth/account-select', { replace: true });
				};
			});
		});
	};

	select (accountId: string, walletPath: string, animate: boolean) {
		C.AccountSelect(accountId, walletPath, (message: any) => {
			if (this.setError(message.error) || !message.account) {
				return;
			};

			UtilData.onAuth(message.account, { routeParam: { animate } });
			analytics.event('SelectAccount', { middleTime: message.middleTime });
		});
	};

	setError (error: { description: string, code: number}) {
		if (!error.code) {
			return false;
		};

		this.setState({ error });
		UtilCommon.checkError(error.code);
		return true;
	};

	onBackup () {
		Action.restoreFromBackup(this.setError);
	};

	onCancel () {
		UtilCommon.route('/auth/select', {});
	};
	
});

export default PageAuthSetup;