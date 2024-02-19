import * as React from 'react';
import { Title, Icon, Label, Input, Button, Checkbox, Pin } from 'Component';
import { I, C, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';

const PopupSubscriptionPlanPageFree = observer(class PopupSubscriptionPlanPageFree extends React.Component<I.Popup> {

	state = {
		verificationStep: 1,
		countdown: 60,
		status: '',
		statusText: '',
	};
	refCheckbox: any = null;
	refEmail: any = null;
	refButton: any = null;
	refCode: any = null;

	interval: any = null;
	timeout: any = null;

	email: string = '';

	constructor (props: I.Popup) {
		super(props);

		this.onCheck = this.onCheck.bind(this);
		this.onVerifyEmail = this.onVerifyEmail.bind(this);
		this.onConfirmEmailCode = this.onConfirmEmailCode.bind(this);
		this.onResend = this.onResend.bind(this);
		this.validateEmail = this.validateEmail.bind(this);
	};

	render() {
		const { verificationStep, countdown, status, statusText } = this.state;

		let content: any = null;

		switch (verificationStep) {
			case 1: {
				content = (
					<React.Fragment>
						<Title text={translate(`popupSubscriptionPlanFreeTitleStep1`)} />
						<Label text={translate(`popupSubscriptionPlanFreeText`)} />

						<div className="inputWrapper">
							<Input ref={ref => this.refEmail = ref} onKeyUp={this.validateEmail} placeholder={translate(`commonEmail`)} />
						</div>

						<div className="check" onClick={this.onCheck}>
							<Checkbox ref={ref => this.refCheckbox = ref} value={false} /> {translate('popupSubscriptionPlanFreeCheckboxText')}
						</div>

						<Button ref={ref => this.refButton = ref} onClick={this.onVerifyEmail} className="c36" text={translate('commonSubmit')} />
					</React.Fragment>
				);
				break;
			};
			case 2: {
				content = (
					<React.Fragment>
						<div onClick={() => this.setState({ verificationStep: 1 })} className="back"><Icon />{translate('commonBack')}</div>
						<Title text={translate(`popupSubscriptionPlanFreeTitleStep2`)} />
						<Pin
							ref={ref => this.refCode = ref}
							pinLength={4}
							visibleValue={true}
							onSuccess={this.onConfirmEmailCode}
						/>

						<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

						<div onClick={this.onResend} className={[ 'resend', countdown ? 'countdown' : '' ].join(' ')}>
							{translate('popupSubscriptionPlanResend')}
							{countdown ? UtilCommon.sprintf(translate('popupSubscriptionPlanCountdown'), countdown) : ''}
						</div>
					</React.Fragment>
				);
				break;
			};
		};

		return content;
	};

	componentDidMount () {
		this.validateEmail();
	};

	componentWillUnmount () {
		if (this.interval) {
			clearInterval(this.interval);
		};
		if (this.timeout) {
			clearTimeout(this.timeout);
		};
	};

	onCheck () {
		const value = !this.refCheckbox.getValue();

		this.refCheckbox.setValue(value);
	};

	onVerifyEmail () {
		this.setButtonLoading(this.refButton, true);

		C.PaymentsSubscriptionGetVerificationEmail(this.email, (message) => {
			this.setButtonLoading(this.refButton, false);

			if (!message.error.code) {
				this.setState({ verificationStep: 2 });
				this.startCountdown();
			};
		});
	};

	onConfirmEmailCode () {
		const code = this.refCode.getValue();

		C.PaymentsSubscriptionVerifyEmailCode(code, (message) => {
			if (message.error.code) {
				this.setStatus('error', message.error.description);
				return;
			};

			console.log('MESSAGE: ', message);
		});
	};

	onResend () {
		const { countdown } = this.state;

		if (countdown) {
			return;
		};

		this.onVerifyEmail();
	};

	setStatus (status: string, text: string) {
		this.setState({ status, statusText: text });

		if (this.timeout) {
			clearTimeout(this.timeout);
		};

		this.timeout = window.setTimeout(() => {
			this.clearStatus();
		}, 4000);
	};

	clearStatus () {
		this.setState({ status: '', statusText: '' });
	};

	setButtonLoading (ref: any, v: boolean) {
		if (ref) {
			ref.setLoading(v);
		};
	};

	validateEmail () {
		if (!this.refButton || !this.refEmail) {
			return;
		};

		const email = this.refEmail.getValue();
		const re = /\S+@\S+\.\S+/;
		const valid = !re.test(email);

		if (valid) {
			this.email = email;
		};
		this.refButton.setDisabled(valid);
	};

	startCountdown () {
		this.setState({ countdown: 60 });

		this.interval = window.setInterval(() => {
			let countdown = this.state.countdown;
			countdown -= 1;

			this.setState({ countdown });

			if (!countdown) {
				clearInterval(this.interval);
				this.interval = null;
			};
		}, 1000);
	};
});

export default PopupSubscriptionPlanPageFree;
