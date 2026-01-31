import React, { forwardRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Frame, Button, Footer, Error } from 'Component';
import { I, S, C, U, J, Storage, translate, Action, Animation, analytics, Renderer, Survey, keyboard } from 'Lib';

const PageAuthSetup = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const [ error, setError ] = useState<I.Error>({ code: 0, description: '' });
	const { isPopup } = props;
	const { account } = S.Auth;
	const match = keyboard.getMatch(isPopup);
	const errorText = error.code ? error.description : '';

	const init = () => {
		const { dataPath } = S.Common;  
		const accountId = Storage.get('accountId');

		if (!accountId) {
			U.Router.go('/auth/select', { replace: true });
			return;
		};

		Renderer.send('keytarGet', accountId).then((phrase: string) => {
			// If phrase is null/empty (can happen on Windows after sleep/reboot when
			// Credential Manager fails), redirect to login
			if (!phrase) {
				console.warn('[Setup] Failed to retrieve phrase from keychain, redirecting to login');
				U.Router.go('/auth/select', { replace: true });
				return;
			};

			C.WalletRecover(dataPath, phrase, (message: any) => {
				if (setErrorHandler(message.error)) {
					return;
				};

				U.Data.createSession(phrase, '', '', (message: any) => {
					if (!setErrorHandler(message.error)) {
						select(accountId, false);
					};
				});
			});
		}).catch((err: any) => {
			console.error('[Setup] Error retrieving phrase from keychain:', err);
			U.Router.go('/auth/select', { replace: true });
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
			const routeParam = { 
				replace: true,
				animate,
				onFadeIn: () => {
					const whatsNew = Storage.get('whatsNew');
					const chatsOnboarding = Storage.get('multichatsOnboarding');

					[
						I.SurveyType.Register, 
						I.SurveyType.Object,
						I.SurveyType.Pmf,
					].forEach(it => Survey.check(it));

					const cb1 = () => {
						const { data } = S.Membership;
						const purchased = data?.getTopPurchasedProduct();
						const product = data?.getTopProduct();

						if (!purchased) {
							cb2();
						} else {
							if (purchased.isFinalization) {
								Action.finalizeMembership(product, analytics.route.authSetup, cb2);
							} else {
								cb2();
							};
						};
					};

					const cb2 = () => {
						if (!chatsOnboarding) {
							S.Popup.open('introduceChats', {
								onClose: () => {
									Storage.set('multichatsOnboarding', true);
									Storage.setHighlight('createSpace', true);

									window.setTimeout(() => U.Common.showWhatsNew(), J.Constant.delay.popup * 2);
								},
							});
						} else
						if (whatsNew) {
							U.Common.showWhatsNew();
						};
					};

					Action.checkDiskSpace(cb1);
				},
			};

			U.Data.onInfo(account.info);
			U.Data.onAuthOnce();
		
			if (spaceId) {
				U.Router.switchSpace(spaceId, '', false, routeParam, true);
			} else {
				U.Router.go('/main/void/select', routeParam);
			};
			
			analytics.event('SelectAccount', { middleTime: message.middleTime });
		});
	};

	const setErrorHandler = (error: I.Error) => {
		if (!error.code) {
			return false;
		};

		if (error.code == J.Error.Code.ACCOUNT_STORE_NOT_MIGRATED) {
			U.Router.go('/auth/migrate', {});
			return;
		};

		setError(error);
		return U.Common.checkErrorCommon(error.code);
	};

	const onCancel = () => {
		S.Auth.logout(true, false);
		Animation.from(() => U.Router.go('/auth/select', { replace: true }));
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
		<div className="wrapper">
			<Frame>
				<Error text={errorText} />

				{!error.code ? (
					<div className="bubbleWrapper">
						<div className="bubble">
							<div className="img" />
						</div>
					</div>
				) : ''}

				{error.code ? (
					<div className="buttons">
						<div className="animation">
							<Button text={translate('commonBack')} className="c28" onClick={onCancel} />
						</div>
					</div>
				) : ''}
			</Frame>

			<Footer {...props} component="authIndex" />
		</div>
	);

}));

export default PageAuthSetup;
