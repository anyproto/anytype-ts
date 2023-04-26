import * as React from 'react';
import $ from 'jquery';
import { Frame, Title, Label, Error, Button, Header, Footer, Icon } from 'Component';
import { I, Storage, translate, C, DataUtil, Util, Action } from 'Lib';
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
	t = 0;
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
		const { match } = this.props;
		const error = this.state.error || {};
		
		let content = null;
		const back = (
			<div className="authBackWrap" onClick={this.onCancel}>
				<Icon className="back" />
				<div className="name">{translate('commonBack')}</div>
			</div>
		);

		if (error.code) {
			if (error.code == Errors.Code.FAILED_TO_FIND_ACCOUNT_INFO) {
				content = (
					<div className="importBackupWrap">
						{back}

						<Title text="⚡️ Congratulations!" />
						<Label text="You're now using the new & improved version of Anytype. It's still encrypted, offline-first and the safest app for your personal information. We're excited to hear your feedback about the new features. First, let's get your data imported." />

						<div className="buttons">
							<Button text="Import backup" onClick={this.onBackup} />
						</div>
					</div>
				);
			} else {
				content = (
					<React.Fragment>
						{back}

						<Title text="Error" />
						<Error text={error.description} />
						<div className="buttons">
							<Button text={translate('commonBack')} onClick={() => Util.route('/')} />
						</div>
					</React.Fragment>
				);
			};
		} else {
			let title = '';

			switch (match.params.id) {
				case 'init': {
					title = translate('authSetupLogin'); 
					break;
				};

				case 'select': {
					title = translate('authSetupSelect');
					break;
				};
			};

			content = <Title text={title} />;
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
		const node = $(this.node);
		const label = node.find('#label');
		
		this.clear();
		this.t = window.setTimeout(() => { label.show(); }, 10000);
		
		switch (match.params.id) {
			case 'init': 
				this.init(); 
				break;

			case 'select': 
				this.select();
				break;

		};
	};

	componentDidUpdate (): void {
		this.refFrame.resize();
	};
	
	componentWillUnmount () {
		this.clear();
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

			DataUtil.createSession((message: any) => {
				if (this.setError(message.error)) {
					return;
				};

				if (accountId) {
					authStore.phraseSet(phrase);
					
					C.AccountSelect(accountId, walletPath, (message: any) => {
						if (this.setError(message.error) || !message.account) {
							return;
						};

						DataUtil.onAuth(message.account);
					});
				} else {
					Util.route('/auth/account-select');
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
				DataUtil.onAuth(message.account);
			};
		});
	};

	setError (error: { description: string, code: number}) {
		if (!error.code) {
			return false;
		};

		this.clear();
		this.setState({ error });

		Util.checkError(error.code);

		return true;
	};

	onBackup () {
		Action.restoreFromBackup(this.setError);
	};

	onCancel () {
		Util.route('/auth/select');
	};
	
	clear () {
		window.clearTimeout(this.t);
	};

});

export default PageAuthSetup;