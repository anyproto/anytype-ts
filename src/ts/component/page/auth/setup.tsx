import * as React from 'react';
import $ from 'jquery';
import { Frame, Cover, Title, Label, Error, Button, Header, Footer } from 'Component';
import { I, Storage, translate, C, DataUtil, Util, analytics, Renderer, ObjectUtil, Action } from 'Lib';
import { commonStore, authStore } from 'Store';
import { observer } from 'mobx-react';
import Constant from 'json/constant.json';
import Errors from 'json/error.json';

interface State {
	index: number;
	error: { description: string, code: number };
};

const PageAuthSetup = observer(class PageAuthSetup extends React.Component<I.PageComponent, State> {

	node: any = null;
	i = 0;
	t = 0;
	state = {
		index: 0,
		error: null,
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onBackup = this.onBackup.bind(this);
	};

	render () {
		const { cover } = commonStore;
		const { match } = this.props;
		const error = this.state.error || {};
		const tcn = [];
		
		let title = '';
		let content = null;

		if (error.code) {
			tcn.push('withError');

			if (error.code == Errors.Code.FAILED_TO_FIND_ACCOUNT_INFO) {
				title = 'Account not found';

				content = (
					<React.Fragment>
						<Label text="If you are migrating from Anytype Legacy version you can restore your account from backup" />

						<div className="buttons">
							<Button text="Restore from backup" onClick={this.onBackup} />
						</div>
					</React.Fragment>
				);
			} else {
				title = 'Error';

				content = (
					<React.Fragment>
						<Error text={error.description} />
						<div className="buttons">
							<Button text={translate('commonBack')} onClick={() => Util.route('/')} />
						</div>
					</React.Fragment>
				);
			};
		} else {
			switch (match.params.id) {
				case 'init':
					title = translate('authSetupLogin'); 
					break;

				case 'register':
					title = translate('authSetupRegister');
					break;

				case 'select': 
					title = translate('authSetupSelect');
					break;

				case 'share': 
					title = translate('authSetupShare');
					break;
			};
		};
		
		return (
			<div ref={node => this.node = node}>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame>
					<Title className={tcn.join(' ')} text={title} />
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

			case 'register':
				this.add();
				break;

			case 'select': 
				this.select();
				break;

			case 'share': 
				this.share();
				break;
		};
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
	
	add () {
		const { match } = this.props;
		const { walletPath, accountPath, name, icon, code } = authStore;

		commonStore.defaultTypeSet(Constant.typeId.note);

		C.WalletCreate(walletPath, (message: any) => {
			if (message.error.code) {
				this.setError(message.error);
			} else {
				authStore.phraseSet(message.mnemonic);

				DataUtil.createSession(() => {
					C.AccountCreate(name, icon, accountPath, code, Util.rand(1, Constant.iconCnt), (message: any) => {
						const description = Errors.AccountCreate[message.error.code] || message.error.description;

						if (this.setError({ code: message.error, description }) || !message.account) {
							return;
						};

						if (message.config) {
							commonStore.configSet(message.config, false);
						};

						authStore.accountSet(message.account);
						authStore.previewSet('');

						Storage.set('timeRegister', Util.time());

						Renderer.send('keytarSet', message.account.id, authStore.phrase);
						analytics.event('CreateAccount');
						
						if (match.params.id == 'register') {
							Util.route('/auth/success');
						};
					});
				});
			};
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

	share () {
		const { location } = this.props;
		const param = Util.searchParam(location.search);

		C.ObjectAddWithObjectId(param.id, param.payload, (message: any) => {
			if (this.setError(message.error)) {
				return;
			};

			Storage.set('shareSuccess', 1);
			ObjectUtil.openHome('route');
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
		Action.openFile([ 'zip' ], paths => {
			C.AccountRecoverFromLegacyExport(paths[0], authStore.walletPath, (message: any) => {
				if (this.setError(message.error)) {
					return;
				};

				C.ObjectImport({ path: paths[0], address: message.address }, [], false, I.ImportType.Migration, I.ImportMode.AllOrNothing, (message: any) => {
					if (this.setError(message.error)) {
						return;
					};
				});
			});
		});
	};
	
	clear () {
		window.clearTimeout(this.t);
	};

});

export default PageAuthSetup;