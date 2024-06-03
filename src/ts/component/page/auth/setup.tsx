import * as React from 'react';
import { Frame, Title, Label, Error, Button, Header, Footer, Icon, Loader } from 'Component';
import { I, Storage, translate, C, UtilData, UtilCommon, Action, Animation, analytics, UtilRouter, Renderer } from 'Lib';
import { authStore, commonStore } from 'Store';
import { observer } from 'mobx-react';
const Errors = require('json/error.json');

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
		let loader = null;
		let title = '';
		let label = '';
		let cn = [ 'animation' ];
		let buttonText = translate('commonBack');
		let buttonClick = this.onCancel;

		if (error.code) {
			if (error.code == Errors.Code.FAILED_TO_FIND_ACCOUNT_INFO) {
				title = translate('pageAuthSetupImportTitle');
				label = translate('pageAuthSetupImportText');
				buttonText = translate('pageAuthSetupImportBackup');
				buttonClick = this.onBackup;
				cn.push('fromBackup');
			} else {
				title = translate('commonError');
				label = error.description;
				buttonText = translate('commonBack');
				buttonClick = this.onCancel;
			};
		} else {
			title = translate('pageAuthSetupEntering');
			loader = <Loader className="animation" />;
		};
		
		return (
			<div 
				ref={node => this.node = node} 
				className="wrapper"
			>
				<Footer {...this.props} component="authIndex" />
				
				<Frame ref={ref => this.refFrame = ref}>
					{back}

					{title ? <Title className={cn.join(' ')} text={title} /> : ''}
					{label ? <Label className={cn.join(' ')} text={label} /> : ''}
					{loader}

					<div className="buttons">
						<div className="animation">
							<Button text={buttonText} className="c28" onClick={buttonClick} />
						</div>
					</div>
				</Frame>
			</div>
		);
    };

	componentDidMount () {
		const { match } = this.props;
		const { account } = authStore;

		switch (match?.params?.id) {
			case 'init': {
				this.init(); 
				break;
			};

			case 'select': {
				this.select(account.id, true);
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
		const { dataPath } = commonStore;  
		const accountId = Storage.get('accountId');

		if (!accountId) {
			UtilRouter.go('/auth/select', { replace: true });
			return;
		};

		Renderer.send('keytarGet', accountId).then((phrase: string) => {
			C.WalletRecover(dataPath, phrase, (message: any) => {
				if (this.setError(message.error)) {
					return;
				};

				if (phrase) {
					UtilData.createSession(phrase, '' ,(message: any) => {
						if (this.setError(message.error)) {
							return;
						};

						this.select(accountId, false);
					});
				} else {
					UtilRouter.go('/auth/select', { replace: true });
				};
			});
		});
	};

	select (accountId: string, animate: boolean) {
		const { networkConfig } = authStore;
		const { dataPath } = commonStore;
		const { mode, path } = networkConfig;
		const spaceId = Storage.get('spaceId');

		C.AccountSelect(accountId, dataPath, mode, path, (message: any) => {
			if (this.setError(message.error) || !message.account) {
				return;
			};

			authStore.accountSet(message.account);
			commonStore.configSet(message.account.config, false);

			if (spaceId) {
				UtilRouter.switchSpace(spaceId);
			} else {
				UtilData.onInfo(message.account.info);
				UtilData.onAuth({ routeParam: { animate } });
			};

			UtilData.onAuthOnce(false);
			analytics.event('SelectAccount', { middleTime: message.middleTime });
		});
	};

	setError (error: { description: string, code: number}) {
		if (!error.code) {
			return false;
		};

		this.setState({ error });
		return UtilCommon.checkErrorCommon(error.code);
	};

	onBackup () {
		Action.restoreFromBackup(this.setError);
	};

	onCancel () {
		authStore.logout(true, false);
		Animation.from(() => UtilRouter.go('/', { replace: true }));
	};

});

export default PageAuthSetup;
