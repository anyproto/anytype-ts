import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Frame, Button, Footer, Error, RecoveryStatus } from 'Component';
import * as I from 'Interface';
import Storage from 'Lib/storage';
import Animation from 'Lib/animation';

const PageAuthSetup = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const [ error, setError ] = useState<I.Error>({ code: 0, description: '' });
	const [ selected, setSelected ] = useState(false);
	const isCancelling = useRef(false);
	// Mirrors the `selected` state: the RPC callback runs before React commits it, and Cancel must
	// already be refused in that window
	const isSelected = useRef(false);
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
						select(accountId);
					};
				});
			});
		}).catch((err: any) => {
			console.error('[Setup] Error retrieving phrase from keychain:', err);
			U.Router.go('/auth/select', { replace: true });
		});
	};

	const select = (accountId: string) => {
		const { networkConfig } = S.Auth;
		const { dataPath, redirect } = S.Common;
		const { mode, path, preferYamux } = networkConfig;
		const param = redirect ? U.Router.getParam(redirect) : {};
		const preferredSpaceId = param.spaceId || Storage.getAccountKey('spaceId', false, accountId) || '';

		C.AccountSelect(accountId, dataPath, mode, path, preferYamux, preferredSpaceId, (message: any) => {
			const { account } = message;

			// A logout from here on would strand the boot that is already under way (the pending
			// switchSpace would route into the main UI on a logged-out store)
			isSelected.current = true;
			setSelected(true);

			// Cancelled from the status block: the logout already stopped the account and the
			// page is on its way to the auth landing, so neither the error nor a success matters
			if (isCancelling.current) {
				return;
			};

			if (setErrorHandler(message.error) || !account) {
				return;
			};

			S.Auth.accountSet(account);
			S.Common.configSet(account.config, false);
			Renderer.send('closeOtherWindows');

			const spaceId = Storage.get('spaceId');

			const onRouteChange = () => {
				const whatsNew = Storage.get('whatsNew');

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
					if (whatsNew) {
						U.Common.showWhatsNew();
					} else {
						Survey.checkCommon();
					};
				};

				Action.checkDiskSpace(cb1);
			};

			const routeParam = {
				replace: true,
				onRouteChange,
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

		// The routing does not ride Animation.from's callback: the helper drops it outright while
		// another animation is running, which would leave a logged-out page with nowhere to go
		Animation.from();
		U.Router.go('/auth/select', { replace: true });
	};

	// Cancel while AccountSelect is pending: logout calls AccountStop, which makes the pending
	// request return; the flag keeps that answer from being shown as an error
	const onCancelSelect = () => {
		if (isCancelling.current || isSelected.current) {
			return;
		};

		isCancelling.current = true;
		onCancel();
	};
	
	useEffect(() => {
		switch (match?.params?.id) {
			case 'init': {
				init(); 
				break;
			};

			case 'select': {
				select(account.id);
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
					<>
						<div className="bubbleWrapper">
							<div className="bubble">
								<div className="img" />
							</div>
						</div>

						<RecoveryStatus delay={J.Constant.delay.recoveryStatus} withLogo={true} onCancel={selected ? undefined : onCancelSelect} />
					</>
				) : ''}

				{error.code ? (
					<div className="buttons">
						<div className="animation">
							<Button text={translate('commonBack')} size={28} onClick={onCancel} />
						</div>
					</div>
				) : ''}
			</Frame>

			<Footer {...props} component="authIndex" />
		</div>
	);

});

export default PageAuthSetup;
