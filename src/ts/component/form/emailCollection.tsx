import React, { FC, useState, useRef, useEffect } from 'react';
import { Label, Checkbox, Input, Button, Icon, Pin } from 'Component';
import { analytics, C, J, S, translate, U } from 'Lib';

interface Props {
	onStepChange: () => void;
	onComplete: () => void;
};

const EmailCollection: FC<Props> = ({ 
	onStepChange,
	onComplete, 
}) => {

	const checkboxTipsRef = useRef(null);
	const checkboxNewsRef = useRef(null);
	const emailRef = useRef(null);
	const buttonRef = useRef(null);
	const codeRef = useRef(null);
	const interval = useRef(0);
	const timeout = useRef(0);
	const [ step, setStep ] = useState(0);
	const [ status, setStatus ] = useState('');
	const [ statusText, setStatusText ] = useState('');
	const [ countdown, setCountdown ] = useState(0);
	const [ email, setEmail ] = useState('');
	const [ subscribeNews, setSubscribeNews ] = useState(false);
	const [ subscribeTips, setSubscribeTips ] = useState(false);
	const [ pinDisabled, setPinDisabled ] = useState(false);
	const [ showCodeSent, setShowCodeSent ] = useState(false);

	let content = null;
	let descriptionSuffix = 'Description';

	const onCheck = (ref, type: string) => {
		if (!ref.current) {
			return;
		};

		const val = ref.current.getValue();
		
		ref.current.toggle();

		if (!val) {
			analytics.event('ClickEmailCollection', { route: analytics.route.onboardingTooltip, step: 1, type });
		};
	};

	const setStepHandler = (newStep: number) => {
		if (step == newStep) {
			return;
		};

		setStep(newStep);
		onStepChange();
		analytics.event('EmailCollection', { route: analytics.route.onboardingTooltip, step: newStep });
	};

	const setStatusAndText = (status: string, statusText: string) => {
		setStatus(status);
		setStatusText(statusText);
	};

	const clearStatus = () => {
		setStatusAndText('', '');
	};

	const validateEmail = () => {
		clearStatus();

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			const value = emailRef.current?.getValue();
			const isValid = U.Common.checkEmail(value);

			if (value && !isValid) {
				setStatusAndText('error', translate('errorIncorrectEmail'));
			};

			buttonRef.current?.setDisabled(!isValid);
		}, J.Constant.delay.keyboard);
	};

	const onSubmitEmail = (e: any) => {
		e.preventDefault();

		if (!buttonRef.current || !emailRef.current) {
			return;
		};

		if (buttonRef.current.isDisabled()) {
			return;
		};

		analytics.event('ClickEmailCollection', { route: analytics.route.onboardingTooltip, step: 1, type: 'SignUp' });

		setEmail(emailRef.current?.getValue());
		setSubscribeNews(checkboxNewsRef.current?.getValue());
		setSubscribeTips(checkboxTipsRef.current?.getValue());
	};

	const verifyEmail = () => {
		buttonRef.current?.setLoading(true);

		C.MembershipGetVerificationEmail(email, subscribeNews, subscribeTips, true, (message) => {
			buttonRef.current?.setLoading(false);

			if (message.error.code) {
				setStatusAndText('error', message.error.description);
				return;
			};

			setStepHandler(1);
			startCountdown(60);
		});
	};

	const onConfirmEmailCode = () => {
		const code = codeRef.current?.getValue();

		setPinDisabled(true);

		C.MembershipVerifyEmailCode(code, (message) => {
			if (message.error.code) {
				setStatusAndText('error', message.error.description);
				setPinDisabled(false);
				codeRef.current?.reset();
				return;
			};

			setStepHandler(2);
		});
	};

	const onResend = (e: any) => {
		e.preventDefault();

		if (countdown) {
			return;
		};

		verifyEmail();
		analytics.event('ClickEmailCollection', { route: analytics.route.onboardingTooltip, step: 2, type: 'Resend' });
	};

	const startCountdown = (s: number) => {
		const { emailConfirmationTime } = S.Common;

		if (!emailConfirmationTime) {
			S.Common.emailConfirmationTimeSet(U.Date.now());
		};

		setCountdown(s);
		setShowCodeSent(true);
		window.setTimeout(() => setShowCodeSent(false), 2000);
	};

	const tick = () => {
		window.clearTimeout(interval.current);
		interval.current = window.setTimeout(() => setCountdown(countdown => countdown - 1), 1000);
	};

	const clear = () => {
		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => clearStatus(), 4000);
	};

	useEffect(() => {
		buttonRef.current?.setDisabled(true);
		analytics.event('EmailCollection', { route: analytics.route.onboardingTooltip, step: 1 });

		return () => {
			window.clearTimeout(timeout.current);
			window.clearTimeout(interval.current);
		};
	});

	useEffect(() => {
		if (interval.current) {
			tick();
		};
	}, [ showCodeSent ]);

	useEffect(() => {
		if (status || statusText) {
			clear();
		};
	}, [ status, statusText ]);

	useEffect(() => {
		if (timeout.current) {
			clear();
		};
	}, [ pinDisabled ]);

	useEffect(() => {
		if (email) {
			verifyEmail();
		};
	}, [ email, subscribeNews, subscribeTips ]);

	useEffect(() => {
		if (countdown) {
			tick();
		} else {
			window.clearTimeout(interval.current);
			S.Common.emailConfirmationTimeSet(0);
		};
	}, [ countdown ]);

	switch (step) {
		case 0: {
			content = (
				<div className="step step0">
					<form onSubmit={onSubmitEmail}>
						<div className="check" onClick={() => onCheck(checkboxTipsRef, 'Tips')}>
							<Checkbox ref={checkboxTipsRef} value={false} /> {translate('emailCollectionCheckboxTipsLabel')}
						</div>
						<div className="check" onClick={() => onCheck(checkboxNewsRef, 'Updates')}>
							<Checkbox ref={checkboxNewsRef} value={false} /> {translate('emailCollectionCheckboxNewsLabel')}
						</div>

						<div className="inputWrapper">
							<Input ref={emailRef} onKeyUp={validateEmail} placeholder={translate(`emailCollectionEnterEmail`)} />
						</div>

						{status ? <div className={[ 'statusBar', status ].join(' ')}>{statusText}</div> : ''}

						<div className="buttonWrapper">
							<Button ref={buttonRef} onClick={onSubmitEmail} className="c36" text={translate('commonSignUp')} />
						</div>
					</form>
				</div>
			);
			break;
		};

		case 1: {
			content = (
				<div className="step step1">
					<Pin
						ref={codeRef}
						pinLength={4}
						isVisible={true}
						onSuccess={onConfirmEmailCode}
						readonly={pinDisabled}
					/>

					{status ? <div className={[ 'statusBar', status ].join(' ')}>{statusText}</div> : ''}

					<div onClick={onResend} className={[ 'resend', (countdown ? 'countdown' : '') ].join(' ')}>
						{showCodeSent ? translate('emailCollectionCodeSent') : translate('popupMembershipResend')}
						{countdown && !showCodeSent ? U.Common.sprintf(translate('popupMembershipCountdown'), countdown) : ''}
					</div>
				</div>
			);
			break;
		};

		case 2: {
			descriptionSuffix = 'News';
			if (subscribeTips) {
				descriptionSuffix = 'Tips';
			};
			if (subscribeTips && subscribeNews) {
				descriptionSuffix = 'NewsAndTips';
			};

			content = (
				<div className="step step2">
					<Icon />

					<div className="buttonWrapper">
						<Button onClick={onComplete} className="c36" text={translate('emailCollectionGreat')} />
					</div>
				</div>
			);
			break;
		};
	};

	return (
		<div className="emailCollectionForm">
			<Label className="category" text={translate(`emailCollectionStep${step}Title`)} />
			<Label className="descr" text={translate(`emailCollectionStep${step}${descriptionSuffix}`)} />

			{content}
		</div>
	);
};

export default EmailCollection;
