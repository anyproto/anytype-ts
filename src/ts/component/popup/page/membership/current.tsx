import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Input, Pin } from 'Component';
import { I, C, S, U, J, translate, analytics, Action } from 'Lib';

interface Props extends I.Popup {
	onChangeEmail: () => void;
};

const PopupMembershipPageCurrent = observer(forwardRef<{}, Props>((props, ref) => {

	const { onChangeEmail, position } = props;
	const [ verificationStep, setVerificationStep ] = useState(1);
	const [ countdown, setCountdown ] = useState(60);
	const [ status, setStatus ] = useState('');
	const [ statusText, setStatusText ] = useState('');

	const emailRef = useRef(null);
	const codeRef = useRef(null);
	const buttonRef = useRef(null);

	const intervalRef = useRef(0);
	const timeoutRef = useRef(0);

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

	const onButton = () => {
		const { membership } = S.Auth;
		const tier = U.Data.getMembershipTier(membership.tier);

		if (!tier.price) {
			onChangeEmail();
		} else {
			if (membership.paymentMethod == I.PaymentMethod.Crypto) {
				Action.membershipUpgradeViaEmail();
			} else {
				C.MembershipGetPortalLinkUrl((message: any) => {
					if (message.url) {
						Action.openUrl(message.url);
					};
				});
			};
		};
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

		C.MembershipGetVerificationEmail(emailRef.current.getValue(), true, false, false, (message) => {
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
		C.MembershipVerifyEmailCode(codeRef.current?.getValue(), (message) => {
			if (message.error.code) {
				setStatusFunc('error', message.error.description);
				codeRef.current?.reset();
				return;
			};

			U.Data.getMembershipStatus();
			S.Popup.updateData('membership', { success: true, emailVerified: true });
			position();
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

		if (now - emailConfirmationTime < 60) {
			setVerificationStep(2);
		};
	};

	const startCountdown = (seconds: number) => {
		const { emailConfirmationTime } = S.Common;

		if (!emailConfirmationTime) {
			S.Common.emailConfirmationTimeSet(U.Date.now());
		};

		setCountdown(seconds);
		intervalRef.current = window.setInterval(() => {
			setCountdown(prev => {
				const newCountdown = prev - 1;
				if (!newCountdown) {
					S.Common.emailConfirmationTimeSet(0);
					window.clearInterval(intervalRef.current);
					intervalRef.current = null;
				};
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

	const { membership } = S.Auth;
	const { dateEnds, paymentMethod, userEmail } = membership;
	const tier = U.Data.getMembershipTier(membership.tier);

	let dateText = '';
	let paidText = '';
	let buttonText = '';
	let manageText = '';
	let verificationForm: any = null;

	if (tier.period && membership.dateEnds) {
		dateText = `${U.Date.date('d F Y', dateEnds)}`;
	} else {
		dateText = translate('popupMembershipForever');
	};

	if (!tier.price) {
		buttonText = translate('popupMembershipChangeEmail');

		if (!userEmail) {
			let content: any = '';

			switch (verificationStep) {
				case 1: {
					content = (
						<form onSubmit={onVerifyEmail}>
							<Title text={translate(`popupMembershipCurrentEmailTitle`)} />
							<Label text={translate(`popupMembershipCurrentEmailText`)} />

							<div className="inputWrapper">
								<Input ref={emailRef} onKeyUp={validateEmail} placeholder={translate(`commonEmail`)} />
							</div>

							<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

							<Button ref={buttonRef} onClick={onVerifyEmail} className="c36" text={translate('commonSubmit')} />
						</form>
					);
					break;
				};

				case 2: {
					content = (
						<>
							<Title text={translate(`popupMembershipFreeTitleStep2`)} />

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

			buttonText = '';
			verificationForm = <div className="emailVerification">{content}</div>;
		};
	} else {
		if (paymentMethod != I.PaymentMethod.None) {
			paidText = U.Common.sprintf(translate('popupMembershipPaidBy'), translate(`paymentMethod${paymentMethod}`));

			if (paymentMethod == I.PaymentMethod.Crypto) {
				buttonText = translate('popupMembershipWriteToAnyteam');
			} else
			if (paymentMethod == I.PaymentMethod.Stripe) {
				buttonText = translate('popupMembershipManagePayment');
			} else {
				manageText = translate('popupMembershipManageOnMobilePlatform');
			};
		};
	};

	return (
		<div className="currentMembership">
			<Title text={translate('popupMembershipCurrentStatus')} />

			<div className="valid">
				<div>
					<Label text={translate('popupMembershipValidUntil')} />
					<Label className="date" text={dateText} />
				</div>
				{paidText ? <Label className="paymentMethod" text={paidText} /> : ''}
			</div>

			{buttonText ? <Button onClick={onButton} text={buttonText} className="c36" color="blank" /> : ''}
			{manageText ? <Label className="manageText" text={manageText} /> : ''}
			{verificationForm}
		</div>
	);

}));

export default PopupMembershipPageCurrent;