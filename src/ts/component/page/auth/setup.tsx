import * as React from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, Footer, Icon, Loader } from 'Component';
import { I, S, C, U, J, Storage, translate, Action, Animation, analytics, Renderer } from 'Lib';

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
		const cn = [ 'animation' ];

		let loader = null;
		let title = '';
		let label = '';
		let buttonText = translate('commonBack');
		let buttonClick = this.onCancel;

		if (error.code) {
			if (error.code == J.Error.Code.FAILED_TO_FIND_ACCOUNT_INFO) {
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
		const { account } = S.Auth;

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
		Animation.to();
	};
	
	init () {
		const { dataPath } = S.Common;  
		const accountId = Storage.get('accountId');

		if (!accountId) {
			U.Router.go('/auth/select', { replace: true });
			return;
		};

		Renderer.send('keytarGet', accountId).then((phrase: string) => {
			C.WalletRecover(dataPath, phrase, (message: any) => {
				if (this.setError(message.error)) {
					return;
				};

				if (phrase) {
					U.Data.createSession(phrase, '' ,(message: any) => {
						if (this.setError(message.error)) {
							return;
						};

						this.select(accountId, false);
					});
				} else {
					U.Router.go('/auth/select', { replace: true });
				};
			});
		});
	};

	select (accountId: string, animate: boolean) {
		const { networkConfig } = S.Auth;
		const { dataPath } = S.Common;
		const { mode, path } = networkConfig;

		C.AccountSelect(accountId, dataPath, mode, path, (message: any) => {
			const { account } = message;

			if (this.setError(message.error) || !account) {
				return;
			};

			S.Auth.accountSet(account);
			S.Common.configSet(account.config, false);

			const spaceId = Storage.get('spaceId');
			if (spaceId) {
				U.Router.switchSpace(spaceId, '', false, {});
			} else {
				U.Data.onAuthWithoutSpace({ replace: true });
			};

			U.Data.onInfo(account.info);
			U.Data.onAuthOnce(false);
			analytics.event('SelectAccount', { middleTime: message.middleTime });
		});
	};

	setError (error: { description: string, code: number}) {
		if (!error.code) {
			return false;
		};

		this.setState({ error });
		return U.Common.checkErrorCommon(error.code);
	};

	onBackup () {
		Action.restoreFromBackup(this.setError);
	};

	onCancel () {
		S.Auth.logout(true, false);
		Animation.from(() => U.Router.go('/', { replace: true }));
	};

});

export default PageAuthSetup;
