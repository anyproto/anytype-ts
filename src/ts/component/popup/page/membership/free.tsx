import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Icon, Label, Input, Button, Checkbox, Pin } from 'Component';
import { I, C, translate, UtilCommon, UtilRouter } from 'Lib';

interface State {
	verificationStep: number;
	countdown: number;
	status: string;
	statusText: string;
};

const PopupMembershipPageFree = observer(class PopupMembershipPageFree extends React.Component<I.Popup, State> {

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

	render () {
		const { verificationStep, countdown, status, statusText } = this.state;

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

						<div className="check" onClick={this.onCheck}>
							<Checkbox ref={ref => this.refCheckbox = ref} value={true} /> {translate('popupMembershipFreeCheckboxText')}
						</div>

						<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

						<Button ref={ref => this.refButton = ref} onClick={this.onVerifyEmail} className="c36" text={translate('commonSubmit')} />
					</form>
				);
				break;
			};
			case 2: {
				content = (
					<React.Fragment>
						<div onClick={() => this.setState({ verificationStep: 1 })} className="back"><Icon />{translate('commonBack')}</div>
						<Title text={translate(`popupMembershipFreeTitleStep2`)} />

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
		this.validateEmail();
	};

	componentWillUnmount () {
		if (this.interval) {
			window.clearInterval(this.interval);
		};
		if (this.timeout) {
			window.clearTimeout(this.timeout);
		};
	};

	onCheck () {
		this.refCheckbox.toggle();
	};

	onVerifyEmail (e: any) {
		e.preventDefault();

		this.refButton?.setLoading(true);

		C.MembershipGetVerificationEmail(this.email, this.refCheckbox?.getValue(), (message) => {
			this.refButton?.setLoading(false);

			if (message.error.code) {
				this.setStatus('error', message.error.description);
				return;
			};

			this.setState({ verificationStep: 2 });
			this.startCountdown();
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
		if (!this.refButton || !this.refEmail) {
			return;
		};

		const email = this.refEmail.getValue();
		const valid = UtilCommon.emailCheck(email);

		if (valid) {
			this.email = email;
		};
		this.refButton.setDisabled(!valid);
	};

	startCountdown () {
		this.setState({ countdown: 60 });

		this.interval = window.setInterval(() => {
			let { countdown } = this.state;

			countdown--;
			this.setState({ countdown });

			if (!countdown) {
				window.clearInterval(this.interval);
				this.interval = null;
			};
		}, 1000);
	};

});

export default PopupMembershipPageFree;
