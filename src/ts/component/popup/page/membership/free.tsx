import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Icon, Label, Input, Button, Checkbox, Pin } from 'Component';
import { I, C, S, U, J, translate, analytics } from 'Lib';

const PopupMembershipPageFree = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const [ verificationStep, setVerificationStep ] = useState(1);
	const [ countdown, setCountdown ] = useState(60);
	const [ hasCountdown, setHasCountdown ] = useState(false);
	const [ status, setStatus ] = useState('');
	const [ statusText, setStatusText ] = useState('');

	const checkboxRef = useRef(null);
	const emailRef = useRef(null);
	const buttonRef = useRef(null);
	const codeRef = useRef(null);

	const intervalRef = useRef(null);
	const timeoutRef = useRef(null);

	const setStatusFunc = (statusVal: string, statusTextVal: string) => {
		setStatus(statusVal);
		setStatusText(statusTextVal);

		window.clearTimeout(timeoutRef.current);
		timeoutRef.current = window.setTimeout(() => clearStatusFunc(), 4000);
	};

	const clearStatusFunc = () => {
		setStatus('');
		setStatusText('');
	};

	const onCheck = () => {
		if (!checkboxRef.current?.getValue()) {
			analytics.event('ClickMembership', { type: 'GetUpdates', params: { tier: I.TierType.Explorer } });
		};
		checkboxRef.current?.toggle();
	};

	const onResetCode = () => {
		const { emailConfirmationTime } = S.Common;
		if (!emailConfirmationTime) {
			return;
		};

		const now = U.Date.now();

		setVerificationStep(2);
		startCountdown(60 - (now - emailConfirmationTime));
	};

	const onVerifyEmail = (e: any) => {
		e.preventDefault();

		if (!buttonRef.current || !emailRef.current) {
			return;
		};

		if (buttonRef.current.isDisabled()) {
			return;
		};

		buttonRef.current.setLoading(true);

		C.MembershipGetVerificationEmail(emailRef.current.getValue(), checkboxRef.current?.getValue(), false, false, (message) => {
			buttonRef.current.setLoading(false);

			if (message.error.code) {
				setStatusFunc('error', message.error.description);
				return;
			};

			setVerificationStep(2);
			startCountdown(60);

			analytics.event('ClickMembership', { type: 'Submit', params: { tier: I.TierType.Explorer } });
		});
	};

	const onConfirmEmailCode = () => {
		const code = codeRef.current?.getValue();

		C.MembershipVerifyEmailCode(code, (message) => {
			if (message.error.code) {
				setStatusFunc('error', message.error.description);
				codeRef.current?.reset();
				return;
			};

			U.Router.go('/main/membership', {});
		});
	};

	const onResend = (e: any) => {
		if (!countdown) {
			onVerifyEmail(e);
		};
	};

	const validateEmail = () => {
		clearStatusFunc();

		window.clearTimeout(timeoutRef.current);
		timeoutRef.current = window.setTimeout(() => {
			const value = emailRef.current?.getValue();
			const isValid = U.Common.matchEmail(value);

			if (value && !isValid) {
				setStatusFunc('error', translate('errorIncorrectEmail'));
			};

			buttonRef.current?.setDisabled(!isValid);
		}, J.Constant.delay.keyboard);
	};

	const checkCountdown = () => {
		const { emailConfirmationTime } = S.Common;
		if (!emailConfirmationTime) {
			return;
		};

		const now = U.Date.now();
		const hasCountdownVal = now - emailConfirmationTime < 60;

		setHasCountdown(hasCountdownVal);
	};

	const startCountdown = (seconds) => {
		const { emailConfirmationTime } = S.Common;

		if (!emailConfirmationTime) {
			S.Common.emailConfirmationTimeSet(U.Date.now());
		};

		setCountdown(seconds);
		setHasCountdown(true);

		intervalRef.current = window.setInterval(() => {
			setCountdown(prev => {
				const newCountdown = prev - 1;
				if (!newCountdown) {
					S.Common.emailConfirmationTimeSet(0);
					setHasCountdown(false);
					window.clearInterval(intervalRef.current);
					intervalRef.current = null;
				}
				return newCountdown;
			});
		}, 1000);
	};

	useEffect(() => {
		buttonRef.current?.setDisabled(true);
		checkCountdown();

		return () => {
			window.clearInterval(intervalRef.current);
			window.clearTimeout(timeoutRef.current);
		};
	}, []);

	let content: any = null;

	switch (verificationStep) {
		case 1: {
			content = (
				<form onSubmit={onVerifyEmail}>
					<Title text={translate(`popupMembershipFreeTitleStep1`)} />
					<Label text={translate(`popupMembershipFreeText`)} />

					<div className="inputWrapper">
						<Input ref={emailRef} onKeyUp={validateEmail} placeholder={translate(`commonEmail`)} />
					</div>

					<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

					<div className="check" onClick={onCheck}>
						<Checkbox ref={checkboxRef} value={false} /> {translate('popupMembershipFreeCheckboxText')}
					</div>

					<Button ref={buttonRef} onClick={onVerifyEmail} className="c36" text={translate('commonSubmit')} />
					{hasCountdown ? <Button onClick={onResetCode} className="c36" text={translate('popupMembershipFreeEnterCode')} /> : ''}
				</form>
			);
			break;
		};

		case 2: {
			content = (
				<>
					<div onClick={() => setVerificationStep(1)} className="back"><Icon />{translate('commonBack')}</div>
					<Title className="step2" text={translate(`popupMembershipFreeTitleStep2`)} />

					<Pin
						ref={codeRef}
						pinLength={4}
						isVisible={true}
						onSuccess={onConfirmEmailCode}
					/>

					<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

					<div onClick={onResend} className={[ 'resend', (countdown ? 'countdown' : '') ].join(' ')}>
						{translate('popupMembershipResend')}
						{countdown ? U.Common.sprintf(translate('popupMembershipCountdown'), countdown) : ''}
					</div>
				</>
			);
			break;
		};
	};

	return content;

}));

export default PopupMembershipPageFree;