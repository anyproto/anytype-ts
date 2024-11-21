import * as React from 'react';
import { Label, Checkbox, Input, Button, Icon, Pin } from 'Component';
import { analytics, C, I, J, S, translate, U } from 'Lib';

interface Props {
	onStepChange: () => void;
	onComplete: () => void;
};

interface State {
	countdown: number;
	status: string;
	statusText: string;
	email: string,
	subscribeNews: boolean,
	subscribeTips: boolean,
	pinDisabled: boolean,
	showCodeSent: boolean,
};

class EmailCollectionForm extends React.Component<Props, State> {

	state = {
		status: '',
		statusText: '',
		countdown: 60,
		email: '',
		subscribeNews: false,
		subscribeTips: false,
		pinDisabled: false,
		showCodeSent: false,
	};

	step = 0;
	node: any = null;
	refCheckboxTips: any = null;
	refCheckboxNews: any = null;
	refEmail: any = null;
	refButton: any = null;
	refCode: any = null;

	interval = null;
	timeout = null;

	constructor (props: Props) {
		super(props);

		this.onCheck = this.onCheck.bind(this);
		this.onSubmitEmail = this.onSubmitEmail.bind(this);
		this.verifyEmail = this.verifyEmail.bind(this);
		this.onConfirmEmailCode = this.onConfirmEmailCode.bind(this);
		this.onResend = this.onResend.bind(this);
		this.validateEmail = this.validateEmail.bind(this);
	};

	render () {
		const { status, statusText, countdown, subscribeNews, subscribeTips, pinDisabled, showCodeSent } = this.state;

		let content = null;
		let descriptionSuffix = 'Description';

		switch (this.step) {
			case 0: {
				content = (
					<div className="step step0">
						<form onSubmit={this.onSubmitEmail}>
							<div className="check" onClick={() => this.onCheck(this.refCheckboxTips, 'Tips')}>
								<Checkbox ref={ref => this.refCheckboxTips = ref} value={false} /> {translate('emailCollectionCheckboxTipsLabel')}
							</div>
							<div className="check" onClick={() => this.onCheck(this.refCheckboxNews, 'Updates')}>
								<Checkbox ref={ref => this.refCheckboxNews = ref} value={false} /> {translate('emailCollectionCheckboxNewsLabel')}
							</div>

							<div className="inputWrapper">
								<Input ref={ref => this.refEmail = ref} onKeyUp={this.validateEmail} placeholder={translate(`emailCollectionEnterEmail`)} />
							</div>

							{status ? <div className={[ 'statusBar', status ].join(' ')}>{statusText}</div> : ''}

							<div className="buttonWrapper">
								<Button ref={ref => this.refButton = ref} onClick={this.onSubmitEmail} className="c36" text={translate('commonSignUp')} />
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
							ref={ref => this.refCode = ref}
							pinLength={4}
							isVisible={true}
							onSuccess={this.onConfirmEmailCode}
							readonly={pinDisabled}
						/>

						{status ? <div className={[ 'statusBar', status ].join(' ')}>{statusText}</div> : ''}

						<div onClick={this.onResend} className={[ 'resend', (countdown ? 'countdown' : '') ].join(' ')}>
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
							<Button onClick={this.props.onComplete} className="c36" text={translate('emailCollectionGreat')} />
						</div>
					</div>
				);
				break;
			};
		};

		return (
			<div className="emailCollectionForm">
				<Label className="category" text={translate(`emailCollectionStep${this.step}Title`)} />
				<Label className="descr" text={translate(`emailCollectionStep${this.step}${descriptionSuffix}`)} />

				{content}
			</div>
		);
	};

	componentDidMount () {
		this.refButton?.setDisabled(true);

		analytics.event('EmailCollection', { route: 'OnboardingTooltip', step: 1 });
	};

	onCheck (ref, type) {
		const val = ref.getValue();
		ref.toggle();

		if (!val) {
			analytics.event('ClickEmailCollection', { route: 'OnboardingTooltip', step: 1, type });
		};
	};

	setStep (step: number) {
		if (this.step == step) {
			return;
		};

		this.step = step;
		this.props.onStepChange();
		this.forceUpdate();

		analytics.event('EmailCollection', { route: 'OnboardingTooltip', step: step + 1 });
	};

	setStatus (status: string, statusText: string) {
		this.setState({ status, statusText });

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.clearStatus(), 4000);
	};

	clearStatus () {
		this.setState({ status: '', statusText: '' });
	};

	validateEmail () {
		this.clearStatus();

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			const value = this.refEmail?.getValue();
			const isValid = U.Common.checkEmail(value);

			if (value && !isValid) {
				this.setStatus('error', translate('errorIncorrectEmail'));
			};

			this.refButton?.setDisabled(!isValid);
		}, J.Constant.delay.keyboard);
	};

	onSubmitEmail (e: any) {
		if (!this.refButton || !this.refEmail) {
			return;
		};

		if (this.refButton.isDisabled()) {
			return;
		};

		analytics.event('ClickEmailCollection', { route: 'OnboardingTooltip', step: 1, type: 'SignUp' });

		this.setState({
			email: this.refEmail.getValue(),
			subscribeNews: this.refCheckboxNews?.getValue(),
			subscribeTips: this.refCheckboxTips?.getValue(),
		}, () => {
			this.refButton.setLoading(true);
			this.verifyEmail(e)
		});
	};

	verifyEmail (e: any) {
		e.preventDefault();

		const { email, subscribeNews, subscribeTips } = this.state;

		C.MembershipGetVerificationEmail(email, subscribeNews, subscribeTips, true, (message) => {
			this.refButton?.setLoading(false);

			if (message.error.code) {
				this.setStatus('error', message.error.description);
				return;
			};

			this.setStep(1);
			this.startCountdown(60);
		});
	};

	onConfirmEmailCode () {
		const code = this.refCode.getValue();

		this.setState({ pinDisabled: true });

		C.MembershipVerifyEmailCode(code, (message) => {
			if (message.error.code) {
				this.setStatus('error', message.error.description);
				this.refCode.reset();
				this.setState({ pinDisabled: false });
				return;
			};

			this.setStep(2);
		});
	};

	onResend (e: any) {
		if (this.state.countdown) {
			return;
		};

		this.verifyEmail(e);

		analytics.event('ClickEmailCollection', { route: 'OnboardingTooltip', step: 2, type: 'Resend' });
	};

	startCountdown (seconds) {
		const { emailConfirmationTime } = S.Common;

		if (!emailConfirmationTime) {
			S.Common.emailConfirmationTimeSet(U.Date.now());
		};

		this.setState({ countdown: seconds, showCodeSent: true });

		window.setTimeout(() => {
			this.setState({ showCodeSent: false });
		}, 2000);

		this.interval = window.setInterval(() => {
			let { countdown } = this.state;

			countdown--;
			this.setState({ countdown });

			if (!countdown) {
				S.Common.emailConfirmationTimeSet(0);
				window.clearInterval(this.interval);
				this.interval = null;
			};
		}, 1000);
	};

};

export default EmailCollectionForm;
