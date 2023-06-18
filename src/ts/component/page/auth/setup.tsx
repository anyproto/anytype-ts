import * as React from 'react';
import { Frame, Title, Label, Error, Button, Header, Footer, Icon, Loader } from 'Component';
import { I, Storage, translate, C, UtilData, UtilCommon, Action, Animation } from 'Lib';
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

						<Title className="animation" text="⚡️ Congratulations!" />
						<Label className="animation" text="You're now using the new & improved version of Anytype. It's still encrypted, offline-first and the safest app for your personal information. We're excited to hear your feedback about the new features. First, let's get your data imported." />

						<div className="buttons">
							<div className="animation">
								<Button text="Import backup" onClick={this.onBackup} />
							</div>
						</div>
					</div>
				);
			} else {
				content = (
					<React.Fragment>
						{back}

						<Title className="animation" text="Error" />
						<Error className="animation" text={error.description} />

						<div className="buttons">
							<div className="animation">
								<Button text={translate('commonBack')} onClick={() => UtilCommon.route('/')} />
							</div>
						</div>
					</React.Fragment>
				);
			};
		} else {
			content = <Loader />;
		};
		
		return (
			<div ref={node => this.node = node}>
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

		switch (match.params.id) {
			case 'init': 
				this.init(); 
				break;

			case 'select': 
				this.select();
				break;

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
					
					C.AccountSelect(accountId, walletPath, (message: any) => {
						if (this.setError(message.error) || !message.account) {
							return;
						};

						UtilData.onAuth(message.account);
					});
				} else {
					UtilCommon.route('/auth/account-select');
				};
			});
		});
	};

	select () {
		const { account, walletPath } = authStore;
		
		C.AccountSelect(account.id, walletPath, (message: any) => {
			if (this.setError(message.error)) {
				return;
			};

			if (message.account) {
				UtilData.onAuth(message.account);
			};
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
		UtilCommon.route('/auth/select');
	};
	
});

export default PageAuthSetup;