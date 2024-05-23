import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Icon, Label, Input, Button, Checkbox, Pin } from 'Component';
import { I, C, translate, UtilCommon, UtilRouter, analytics, UtilDate } from 'Lib';
import { commonStore } from 'Store';
const Constant = require('json/constant.json');

interface State {
	verificationStep: number;
	countdown: number;
	hasCountdown: boolean;
	status: string;
	statusText: string;
};

const PopupMembershipPageFree = observer(class PopupMembershipPageFree extends React.Component<I.Popup, State> {

	state = {
		verificationStep: 1,
		countdown: 60,
		hasCountdown: false,
		status: '',
		statusText: '',
	};

	refCheckbox = null;
	refEmail = null;
	refButton = null;
	refCode = null;

	interval = null;
	timeout = null;

	constructor (props: I.Popup) {
		super(props);

		this.onCheck = this.onCheck.bind(this);
		this.onVerifyEmail = this.onVerifyEmail.bind(this);
		this.onConfirmEmailCode = this.onConfirmEmailCode.bind(this);
		this.onResend = this.onResend.bind(this);
		this.validateEmail = this.validateEmail.bind(this);
		this.onResetCode = this.onResetCode.bind(this);
	};

	render () {
		const { verificationStep, countdown, hasCountdown, status, statusText } = this.state;

		let content: any = null;

		switch (verificationStep) {
			case 1: {
				content = (
					<form onSubmit={this.onVerifyEmail}>
						<Title text={translate(`popupMembershipFreeTitleStep1`)} />
						<Label text={translate(`popupMembershipFreeText`)} />

						<div className="inputWrapper">
							<Input ref={ref => this.refEmail = ref} onKeyUp={this.validateEmail} placeholder={translate(`commonEmail`)} />
						</div>

						<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

						<div className="check" onClick={this.onCheck}>
							<Checkbox ref={ref => this.refCheckbox = ref} value={false} /> {translate('popupMembershipFreeCheckboxText')}
						</div>

						<Button ref={ref => this.refButton = ref} onClick={this.onVerifyEmail} className="c36" text={translate('commonSubmit')} />
						{hasCountdown ? <Button onClick={this.onResetCode} className="c36" text={translate('popupMembershipFreeEnterCode')} /> : ''}
					</form>
				);
				break;
			};
			case 2: {
				content = (
					<React.Fragment>
						<div onClick={() => this.setState({ verificationStep: 1 })} className="back"><Icon />{translate('commonBack')}</div>
						<Title className="step2" text={translate(`popupMembershipFreeTitleStep2`)} />

						<Pin
							ref={ref => this.refCode = ref}
							pinLength={4}
							isVisible={true}
							onSuccess={this.onConfirmEmailCode}
						/>

						<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

						<div onClick={this.onResend} className={[ 'resend', (countdown ? 'countdown' : '') ].join(' ')}>
							{translate('popupMembershipResend')}
							{countdown ? UtilCommon.sprintf(translate('popupMembershipCountdown'), countdown) : ''}
						</div>
					</React.Fragment>
				);
				break;
			};
		};

		return content;
	};

	componentDidMount () {
		this.refButton?.setDisabled(true);
		this.checkCountdown();
	};

	componentWillUnmount () {
		window.clearInterval(this.interval);
		window.clearTimeout(this.timeout);
	};

	onCheck () {
		if (!this.refCheckbox.getValue()) {
			analytics.event('ClickMembership', { type: 'GetUpdates', params: { tier: I.TierType.Explorer } });
		};
		this.refCheckbox.toggle();
	};

	onResetCode () {
		const { emailConfirmationTime } = commonStore;
		if (!emailConfirmationTime) {
			return;
		};

		const now = UtilDate.now();

		this.setState({ verificationStep: 2 });
		this.startCountdown(60 - (now - emailConfirmationTime));
	};

	onVerifyEmail (e: any) {
		e.preventDefault();

		if (!this.refButton || !this.refEmail) {
			return;
		};

		if (this.refButton.isDisabled()) {
			return;
		};

		this.refButton.setLoading(true);

		C.MembershipGetVerificationEmail(this.refEmail.getValue(), this.refCheckbox?.getValue(), (message) => {
			this.refButton.setLoading(false);

			if (message.error.code) {
				this.setStatus('error', message.error.description);
				return;
			};

			this.setState({ verificationStep: 2 });
			this.startCountdown(60);

			analytics.event('ClickMembership', { type: 'Submit', params: { tier: I.TierType.Explorer } });
		});
	};

	onConfirmEmailCode () {
		const code = this.refCode.getValue();

		C.MembershipVerifyEmailCode(code, (message) => {
			if (message.error.code) {
				this.setStatus('error', message.error.description);
				this.refCode.reset();
				return;
			};

			UtilRouter.go('/main/membership', {});
		});
	};

	onResend (e: any) {
		if (!this.state.countdown) {
			this.onVerifyEmail(e);
		};
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
			const isValid = UtilCommon.checkEmail(value);

			if (value && !isValid) {
				this.setStatus('error', translate('errorIncorrectEmail'));
			};

			this.refButton?.setDisabled(!isValid);
		}, Constant.delay.keyboard);
	};

	checkCountdown () {
		const { emailConfirmationTime } = commonStore;
		if (!emailConfirmationTime) {
			return;
		};

		const now = UtilDate.now();
		const hasCountdown = now - emailConfirmationTime < 60;

		this.setState({ hasCountdown });
	};

	startCountdown (seconds) {
		const { emailConfirmationTime } = commonStore;

		if (!emailConfirmationTime) {
			commonStore.emailConfirmationTimeSet(UtilDate.now());
		};

		this.setState({ countdown: seconds, hasCountdown: true });
		this.interval = window.setInterval(() => {
			let { countdown } = this.state;

			countdown--;
			this.setState({ countdown });

			if (!countdown) {
				commonStore.emailConfirmationTimeSet(0);
				this.setState({ hasCountdown: false });
				window.clearInterval(this.interval);
				this.interval = null;
			};
		}, 1000);
	};

});

export default PopupMembershipPageFree;
