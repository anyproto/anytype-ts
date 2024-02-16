import * as React from 'react';
import { Title, Icon, Label, Input, Button, Checkbox, Pin } from 'Component';
import { I, C, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';

const PopupSubscriptionPlan = observer(class PopupSubscriptionPlan extends React.Component<I.Popup> {

	state = {
		verificationStep: 1,
		countdown: 60,
		status: '',
		statusText: '',
	};
	refCheckbox: any = null;
	refEmail: any = null;
	refButtonEmail: any = null;
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
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const tierContent = this.getTierContent(tier);
		const tiers = {
			1: { idx: 1 },
			2: { idx: 2, price: 99, period: 1 },
			3: { idx: 3, price: 399, period: 5 },
		};
		const current = tiers[tier];

		let content: any = null;

		if (tier == 1) {
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

							<Button ref={ref => this.refButtonEmail = ref} onClick={this.onVerifyEmail} className="c36" text={translate('commonSubmit')} />
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
		} else {
			let period = '';

			if (current.period == 1) {
				period = translate('popupSettingsPaymentItemPerYear')
			} else {
				period = UtilCommon.sprintf(translate('popupSettingsPaymentItemPerYears'), current.period);
			};

			content = (
				<React.Fragment>
					<Title text={translate(`popupSubscriptionPlanPaidTitle`)} />
					<Label text={translate(`popupSubscriptionPlanPaidText`)} />

					<div className="inputWrapper">
						<Input placeholder={translate(`popupSubscriptionPlanPaidPlaceholder`)} />
						<div className="ns">.any</div>
					</div>

					<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

					<div className="priceWrapper">
						<span className="price">{`$${current.price}`}</span>{period}
					</div>

					<Button className="c36" text={translate('popupSubscriptionPlanPayByCard')} />
					<Button className="c36" text={translate('popupSubscriptionPlanPayByCrypto')} />
				</React.Fragment>
			);
		}

		return (
			<div className={[ 'sides', `tier${tier}`, `step${verificationStep}` ].join(' ')}>
				<div className="side left">
					<Icon />
					<Title text={translate(`popupSettingsPaymentItemTitle${tier}`)} />
					<Label text={translate(`popupSettingsPaymentItemDescription${tier}`)} />

					<div className="contentList">
						<Label text={translate('popupSubscriptionPlanWhatsIncluded')} />
						<ul>
							{tierContent.map((text, idx) => (
								<li key={idx}>{translate(text)}</li>
							))}
						</ul>
					</div>
				</div>

				<div className="side right">{content}</div>
			</div>
		);
	};

	componentDidMount () {
		this.validateEmail();
	};

	componentWillUnmount () {
		if (this.interval) {
			clearInterval(this.interval);
		};
	};

	getTierContent (tier) {
		const content = {
			1: [
				'popupSubscriptionPlanTier1Content1',
				'popupSubscriptionPlanTier1Content2',
				'popupSubscriptionPlanTier1Content3',
			],
			2: [
				'popupSubscriptionPlanTier2Content1',
				'popupSubscriptionPlanTier2Content2',
				'popupSubscriptionPlanTier2Content3',
				'popupSubscriptionPlanTier2Content4',
			],
			3: [
				'popupSubscriptionPlanTier3Content1',
				'popupSubscriptionPlanTier3Content2',
				'popupSubscriptionPlanTier3Content3',
				'popupSubscriptionPlanTier3Content4',
				'popupSubscriptionPlanTier3Content5',
			]
		};

		return content[tier];
	};

	onCheck () {
		const value = !this.refCheckbox.getValue();

		this.refCheckbox.setValue(value);
	};

	onVerifyEmail () {
		this.setButtonLoading(this.refButtonEmail, true);

		C.PaymentsSubscriptionGetVerificationEmail(this.email, (message) => {
			this.setButtonLoading(this.refButtonEmail, false);

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
		if (!this.refButtonEmail || !this.refEmail) {
			return;
		};

		const email = this.refEmail.getValue();
		const re = /\S+@\S+\.\S+/;
		const valid = !re.test(email);

		if (valid) {
			this.email = email;
		};
		this.refButtonEmail.setDisabled(valid);
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

export default PopupSubscriptionPlan;
