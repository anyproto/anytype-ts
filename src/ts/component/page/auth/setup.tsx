import React, { forwardRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, Footer, Icon, Loader } from 'Component';
import { I, S, C, U, J, Storage, translate, Action, Animation, analytics, Renderer } from 'Lib';

const PageAuthSetup = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const [ error, setError ] = useState<I.Error>({ code: 0, description: '' });
	const cn = [ 'animation' ];
	const { match } = props;
	const { account } = S.Auth;

	const init = () => {
		const { dataPath } = S.Common;  
		const accountId = Storage.get('accountId');

		if (!accountId) {
			U.Router.go('/auth/select', { replace: true });
			return;
		};

		Renderer.send('keytarGet', accountId).then((phrase: string) => {
			C.WalletRecover(dataPath, phrase, (message: any) => {
				if (setErrorHandler(message.error)) {
					return;
				};

				if (phrase) {
					U.Data.createSession(phrase, '' ,(message: any) => {
						if (setErrorHandler(message.error)) {
							return;
						};

						select(accountId, false);
					});
				} else {
					U.Router.go('/auth/select', { replace: true });
				};
			});
		});
	};

	const select = (accountId: string, animate: boolean) => {
		const { networkConfig } = S.Auth;
		const { dataPath } = S.Common;
		const { mode, path } = networkConfig;

		C.AccountSelect(accountId, dataPath, mode, path, (message: any) => {
			const { account } = message;

			if (setErrorHandler(message.error) || !account) {
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

	const setErrorHandler = (error: I.Error) => {
		if (!error.code) {
			return false;
		};

		setError(error);
		return U.Common.checkErrorCommon(error.code);
	};

	const onBackup = () => {
		Action.restoreFromBackup(setErrorHandler);
	};

	const onCancel = () => {
		S.Auth.logout(true, false);
		Animation.from(() => U.Router.go('/', { replace: true }));
	};

	const back = <Icon className="arrow back" onClick={onCancel} />;

	let loader = null;
	let title = '';
	let label = '';
	let buttonText = translate('commonBack');
	let buttonClick = onCancel;

	if (error.code) {
		if (error.code == J.Error.Code.FAILED_TO_FIND_ACCOUNT_INFO) {
			title = translate('pageAuthSetupImportTitle');
			label = translate('pageAuthSetupImportText');
			buttonText = translate('pageAuthSetupImportBackup');
			buttonClick = onBackup;
			cn.push('fromBackup');
		} else {
			title = translate('commonError');
			label = error.description;
			buttonText = translate('commonBack');
			buttonClick = onCancel;
		};
	} else {
		title = translate('pageAuthSetupEntering');
		loader = <Loader className="animation" />;
	};

	useEffect(() => {
		switch (match?.params?.id) {
			case 'init': {
				init(); 
				break;
			};

			case 'select': {
				select(account.id, true);
				break;
			};
		};
	}, []);

	useEffect(() => {
		Animation.to();
	});
	
	return (
		<div 
			className="wrapper"
		>
			<Frame>
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

			<Footer {...props} component="authIndex" />
		</div>
	);

}));

export default PageAuthSetup;