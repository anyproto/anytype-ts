import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Input, Pin } from 'Component';
import { I, C, S, U, J, translate, analytics, Action } from 'Lib';

interface Props extends I.Popup {
	onChangeEmail: () => void;
};

interface State {
	verificationStep: number;
	countdown: number;
	hasCountdown: boolean;
	status: string;
	statusText: string;
};

const PopupMembershipPageCurrent = observer(class PopupMembershipPageCurrent extends React.Component<Props, State> {

	state = {
		verificationStep: 1,
		countdown: 60,
		hasCountdown: false,
		status: '',
		statusText: '',
	};

	refEmail = null;
	refCode = null;
	refButton = null;

	interval = 0;
	timeout = 0;

	constructor (props: Props) {
		super(props);

		this.onButton = this.onButton.bind(this);
		this.onVerifyEmail = this.onVerifyEmail.bind(this);
		this.onConfirmEmailCode = this.onConfirmEmailCode.bind(this);
		this.onResend = this.onResend.bind(this);
		this.validateEmail = this.validateEmail.bind(this);
	};

	render() {
		const { verificationStep, countdown, status, statusText } = this.state;
		const { membership } = S.Auth;
		const { tier, dateEnds, paymentMethod, userEmail } = membership;
		const tierItem = U.Data.getMembershipTier(tier);

		let dateText = '';
		let paidText = '';
		let buttonText = '';
		let manageText = '';
		let verificationForm: any = null;

		if (tierItem.period && membership.dateEnds) {
			dateText = `${U.Date.date('d F Y', dateEnds)}`;
		} else {
			dateText = translate('popupMembershipForever');
		};

		if (membership.isExplorer) {
			buttonText = translate('popupMembershipChangeEmail');

			if (!userEmail) {
				let content: any = '';

				switch (verificationStep) {
					case 1: {
						content = (
							<form onSubmit={this.onVerifyEmail}>
								<Title text={translate(`popupMembershipCurrentEmailTitle`)} />
								<Label text={translate(`popupMembershipCurrentEmailText`)} />

								<div className="inputWrapper">
									<Input ref={ref => this.refEmail = ref} onKeyUp={this.validateEmail} placeholder={translate(`commonEmail`)} />
								</div>

								<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

								<Button ref={ref => this.refButton = ref} onClick={this.onVerifyEmail} className="c36" text={translate('commonSubmit')} />
							</form>
						);
						break;
					};

					case 2: {
						content = (
							<>
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

				{buttonText ? <Button onClick={this.onButton} text={buttonText} className="c36" color="blank" /> : ''}
				{manageText ? <Label className="manageText" text={manageText} /> : ''}
				{verificationForm}
			</div>
		);
	};

	componentDidMount () {
		this.refButton?.setDisabled(true);
		this.checkCountdown();
	};

	componentWillUnmount(): void {
		window.clearInterval(this.interval);
		window.clearTimeout(this.timeout);	
	};

	onButton () {
		const { membership } = S.Auth;
		const { onChangeEmail } = this.props;

		if (membership.isExplorer) {
			onChangeEmail();
		} else {
			if (membership.paymentMethod == I.PaymentMethod.Crypto) {
				Action.membershipUpgrade();
			} else {
				C.MembershipGetPortalLinkUrl((message: any) => {
					if (message.url) {
						Action.openUrl(message.url);
					};
				});
			};
		};
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

		C.MembershipGetVerificationEmail(this.refEmail.getValue(), true, false, false, (message) => {
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
		C.MembershipVerifyEmailCode(this.refCode.getValue(), (message) => {
			if (message.error.code) {
				this.setStatus('error', message.error.description);
				this.refCode.reset();
				return;
			};

			U.Data.getMembershipStatus();
			S.Popup.updateData('membership', { success: true, emailVerified: true });
			this.props.position();
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
			const isValid = U.Common.checkEmail(value);

			if (value && !isValid) {
				this.setStatus('error', translate('errorIncorrectEmail'));
			};

			this.refButton?.setDisabled(!isValid);
		}, J.Constant.delay.keyboard);
	};

	checkCountdown () {
		const { emailConfirmationTime } = S.Common;
		if (!emailConfirmationTime) {
			return;
		};

		const now = U.Date.now();

		if (now - emailConfirmationTime < 60) {
			this.setState({ verificationStep: 2 });
		};
	};

	startCountdown (seconds) {
		const { emailConfirmationTime } = S.Common;

		if (!emailConfirmationTime) {
			S.Common.emailConfirmationTimeSet(U.Date.now());
		};

		this.setState({ countdown: seconds });
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

});

export default PopupMembershipPageCurrent;
