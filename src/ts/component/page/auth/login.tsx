import React, { forwardRef, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Frame, Error, Button, Header, Phrase, Title, Label, RecoveryStatus } from 'Component';
import * as I from 'Interface';
import Storage from 'Lib/storage';
import Animation from 'Lib/animation';

const PageAuthLogin = forwardRef<I.PageRef, I.PageComponent>((props, ref: any) => {

	const nodeRef = useRef(null);
	const phraseRef = useRef(null);
	const submitRef = useRef(null);
	const frameRef = useRef(null);
	const [ error, setError ] = useState('');
	const [ selecting, setSelecting ] = useState(false);
	const [ selected, setSelected ] = useState(false);
	const isSelecting = useRef(false);
	const isCancelling = useRef(false);
	// Mirrors the `selected` state: the RPC callbacks run before React commits it, and Cancel must
	// already be refused in that window
	const isSelected = useRef(false);
	const phraseValue = useRef('');
	const { accounts } = S.Auth;
	const length = accounts.length;

	const focus = () => {
		phraseRef.current?.focus();
	};

	const getPhrase = () => {
		return String(phraseRef.current?.getValue() || '');
	};

	const onSubmit = (e: any) => {
		e.preventDefault();

		const phrase = getPhrase();
		const length = phrase.split(' ').length;

		if (length < J.Constant.count.phrase.word) {
			setErrorHandler(1, translate('pageAuthLoginShortPhrase'));
			return;
		};

		if (submitRef.current?.isLoading()) {
			return;
		};

		// The input unmounts while the account is being selected, so keep the key around
		phraseValue.current = phrase;
		submitRef.current?.setLoading(true);

		U.Data.closeSession(() => {
			C.WalletRecover(S.Common.dataPath, phrase, (message: any) => {
				if (setErrorHandler(message.error.code, translate('pageAuthLoginInvalidPhrase'))) {
					return;
				};

				S.Auth.accountListClear();
				U.Data.createSession(phrase, '', '', () => {
					C.AccountRecover(message => {
						setErrorHandler(message.error.code, message.error.description);
					});
				});
			});
		});
	};

	const select = () => {
		const { accounts, networkConfig } = S.Auth;

		// The key is what provisions the device below; without one this was not our submit
		if (isSelecting.current || !accounts.length || !phraseValue.current) {
			return;
		};

		isSelecting.current = true;
		setSelecting(true);

		const { mode, path } = networkConfig;
		const account = accounts[0];

		S.Auth.accountSet(account);
		Renderer.send('keytarSet', account.id, phraseValue.current);

		// A fresh login by key starts from the middleware's own priority: the channel stored for
		// this account on this device is from an earlier session and may not even exist any more
		Storage.delete('spaceId');

		C.AccountSelect(account.id, S.Common.dataPath, mode, path, '', (message: any) => {
			// Stopping the account from here on would strand a boot that is already under way,
			// with nothing to route back to: the run continues in the vault's progress block
			isSelected.current = true;
			setSelected(true);

			if (isCancelling.current) {
				// AccountStop made this request return (or it raced the stop): either way the
				// user asked to cancel, so the answer is not an error to show
				onCancelled();
				return;
			};

			if (setErrorHandler(message.error.code, message.error.description) || !message.account) {
				// Re-opening the guard while the list still holds the account would let the
				// next render select it again. The two error codes that route away, and a
				// success carrying no account, never clear the list on their own
				S.Auth.accountListClear();

				isSelecting.current = false;
				setSelecting(false);
				return;
			};

			S.Auth.accountSet(message.account);
			S.Common.configSet(message.account.config, false);
			Renderer.send('closeOtherWindows');

			const routeParam = {
				replace: true,
				onRouteChange: () => Action.checkDiskSpace(),
			};

			// The guard stays closed for the rest of this mount: routing only happens once the
			// global subscriptions answer (openFirstSpaceOrVoid), seconds later, and until then
			// every re-render re-runs the effect below - re-opening it here fired a second
			// AccountSelect on the same session, and each of those repeated the whole boot.
			// The routing does not ride Animation.from's callback: that helper drops it outright
			// while another animation is running, and with the guard closed nothing would retry
			Animation.from();
			U.Data.onAuthWithoutSpace(routeParam);

			U.Data.onInfo(account.info);
			U.Data.onAuthOnce();

			analytics.event('SelectAccount', { middleTime: message.middleTime });
		});
	};

	const onCancel = () => {
		if (isCancelling.current || isSelected.current) {
			return;
		};

		isCancelling.current = true;

		// Stops the account being selected; the pending AccountSelect then returns an error,
		// which its callback treats as the cancellation. The gRPC request itself is left
		// alone: there is no flow for cancelling it client-side
		C.AccountStop(false, (message: any) => {
			if (message.error.code) {
				// Nothing was stopped, so AccountSelect will answer normally: re-open the flag,
				// or its answer would be swallowed as a cancellation that never happened
				console.error('[Login.onCancel] AccountStop:', message.error.description);
				isCancelling.current = false;
			};
		});
	};

	const onCancelled = () => {
		const { account } = S.Auth;

		isCancelling.current = false;
		isSelecting.current = false;
		isSelected.current = false;
		setSelecting(false);
		setSelected(false);

		// The session belongs to the account that was just stopped; without this the stream keeps
		// reconnecting against it until the user submits again
		U.Data.closeSession();

		// select() provisions the device before AccountSelect (accountSet stores the account id,
		// keytarSet the key); left behind, the next launch would walk straight back into the
		// recovery that was just cancelled
		if (account) {
			Renderer.send('keytarDelete', account.id);
		};

		Storage.delete('accountId');

		// Otherwise the effect below would select the recovered account again right away
		S.Auth.accountListClear();

		// A different key may follow: the previous account's diagnostics must not travel with it
		S.Recovery.clear();
	};

	// The two states differ in height; re-centre the frame as the incoming one starts to show
	const onStateAnimation = () => {
		frameRef.current?.resize();
	};

	// Back from the status state: the input remounted empty, give the key back.
	// Also fires when the input block finishes its exit; nothing to restore then
	const onInputShown = () => {
		if (isSelecting.current) {
			return;
		};

		if (phraseValue.current) {
			phraseRef.current?.setValue(phraseValue.current);
		};

		focus();
	};

	const setErrorHandler = (code: number, text: string) => {
		if (!code) {
			return false;
		};

		if (code == J.Error.Code.FAILED_TO_FIND_ACCOUNT_INFO) {
			U.Router.go('/auth/setup/select', {});
			return;
		};

		if (code == J.Error.Code.ACCOUNT_STORE_NOT_MIGRATED) {
			U.Router.go('/auth/migrate', {});
			return;
		};

		setError(text);
		phraseRef.current?.setError(true);
		submitRef.current?.setLoading(false);

		S.Auth.accountListClear();
		return U.Common.checkErrorCommon(code);
	};

	const onKeyDownPhrase = (e: KeyboardEvent) => {
		if (error) {
			phraseRef.current?.setError(false);
			setError('');
		};

		keyboard.shortcut('enter', e, () => onSubmit(e));
	};

	const onForgot = () => {
		const platform = U.Common.getPlatform();

		S.Popup.open('confirm', {
			className: 'lostPhrase isLeft',
			data: {
				title: translate('popupConfirmLostPhraseTitle'),
				text: translate(`popupConfirmLostPhraseText${platform}`),
				textConfirm: translate('commonOkay'),
				canConfirm: true,
				canCancel: false,
			},
		});
	};

	useEffect(() => {
		U.Dom.removeClass(frameRef.current.getNode(), 'invisible');
		focus();
	}, []);

	useEffect(() => {
		focus();
	});

	// Accounts arrive as AccountShow events - AccountRecover's own response carries none - so
	// the store is the trigger, and the list length is what actually changes. Without the key
	// every render re-ran select(), leaving the isSelecting guard as the only thing between a
	// re-render and a second AccountSelect on the same session
	useEffect(() => {
		select();
	}, [ length ]);
	
	return (
		<div ref={nodeRef}>
			<Header {...props} component="authIndex" />
			
			<Frame ref={frameRef} className="invisible">
				<form className="form" onSubmit={onSubmit}>
					<Error text={error} className="animation" />

					<AnimatePresence mode="wait" initial={false}>
						{selecting ? (
							<motion.div
								key="status"
								className="state stateStatus"
								onAnimationStart={onStateAnimation}
								{...U.Common.animationProps()}
							>
								<div className="bubbleWrapper">
									<div className="bubble">
										<div className="img" />
									</div>
								</div>

								<RecoveryStatus onCancel={selected ? undefined : onCancel} />
							</motion.div>
						) : (
							<motion.div
								key="input"
								className="state stateInput"
								onAnimationStart={onStateAnimation}
								onAnimationComplete={onInputShown}
								{...U.Common.animationProps({ initial: { y: 8 }, animate: { y: 0 }, exit: { y: -8 } })}
							>
								<Title className="animation" text={translate('authLoginTitle')} />
								<Label id="label" className="description animation" text={translate('authLoginLabel')} />

								<div className="animation">
									<Phrase
										ref={phraseRef}
										onKeyDown={onKeyDownPhrase}
										isHidden={true}
										placeholder={translate('phrasePlaceholder')}
									/>
								</div>

								<div className="buttons">
									<div className="animation">
										<Button ref={submitRef} size={48} color="accent" text={translate('authLoginSubmit')} onClick={onSubmit} />
									</div>

									<div className="animation">
										<div className="small" onClick={onForgot}>{translate('authLoginLostPhrase')}</div>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</form>
			</Frame>
		</div>
	);

});

export default PageAuthLogin;
