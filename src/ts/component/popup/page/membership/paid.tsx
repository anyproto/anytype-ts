import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Input, Button } from 'Component';
import { I, C, S, U, J, translate, analytics } from 'Lib';
import FooterAuthDisclaimer from '../../../footer/auth/disclaimer';

interface State {
	status: string;
	statusText: string;
};

const PopupMembershipPagePaid = observer(class PopupMembershipPagePaid extends React.Component<I.Popup, State> {

	state = {
		status: '',
		statusText: '',
	};

	refName: any = null;
	refButtonCard: any = null;
	refButtonCrypto: any = null;
	timeout: any = null;

	constructor (props: I.Popup) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
		this.onPay = this.onPay.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const { status, statusText } = this.state;
		const { config } = S.Common;
		const { testCryptoPayment } = config;
		const tierItem = U.Data.getMembershipTier(tier);

		if (!tierItem) {
			return null;
		};

		const { period } = tierItem;
		const { membership } = S.Auth;
		const { name, nameType, paymentMethod } = membership;

		let periodText = '';
		let labelText = '';
		let paidOnOtherPlatform = false;

		if ((membership.tier == I.TierType.Builder) && (paymentMethod != I.PaymentMethod.Stripe)) {
			paidOnOtherPlatform = true;
		};

		if (period) {
			if (period == 1) {
				periodText = translate('popupSettingsMembershipPerYear');
				labelText = translate('popupMembershipPaidTextPerYear');
			} else {
				periodText = U.Common.sprintf(translate('popupSettingsMembershipPerYears'), period, U.Common.plural(period, translate('pluralYear')));
				labelText = U.Common.sprintf(translate('popupMembershipPaidTextPerYears'), period, U.Common.plural(period, translate('pluralYear')));
			};
		};

		return (
			<form className="anyNameForm" onSubmit={this.onSubmit}>
				{tierItem.namesCount ? (
					<React.Fragment>
						<Title text={translate(`popupMembershipPaidTitle`)} />
						<Label text={labelText} />

						<div className="inputWrapper">
							<Input
								ref={ref => this.refName = ref}
								value={name}
								onKeyUp={this.onKeyUp}
								readonly={!!name}
								className={name ? 'disabled' : ''}
								placeholder={translate(`popupMembershipPaidPlaceholder`)}
							/>
							<div className="ns">{J.Constant.namespace[nameType]}</div>
						</div>

						<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>
					</React.Fragment>
				) : ''}

				<div className="priceWrapper">
					{tierItem.price ? <span className="price">{`$${tierItem.price}`}</span> : ''}
					{periodText}
				</div>

				{paidOnOtherPlatform ? (
					<Label className="paidOnOtherPlatform" text={translate('popupMembershipPaidOnOtherPlatform')} />
				) : (
					<React.Fragment>
						<Button onClick={() => this.onPay(I.PaymentMethod.Stripe)} ref={ref => this.refButtonCard = ref} className="c36" text={translate('popupMembershipPayByCard')} />

						{testCryptoPayment ? (
							<Button onClick={() => this.onPay(I.PaymentMethod.Crypto)} ref={ref => this.refButtonCrypto = ref} className="c36" text={translate('popupMembershipPayByCrypto')} />
						) : ''}

						<FooterAuthDisclaimer />
					</React.Fragment>
				)}
			</form>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const tierItem = U.Data.getMembershipTier(tier);
		const globalName = this.getGlobalName();

		if (!globalName && tierItem.namesCount) {
			this.disableButtons(true);
		};
	};

	componentWillUnmount () {
		if (this.timeout) {
			window.clearTimeout(this.timeout);
		};
	};

	onKeyUp (e: any) {
		this.disableButtons(true);
		this.setState({ statusText: '', status: '' });

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.validateName(), J.Constant.delay.keyboard);
	};

	onSubmit (e: any) {
		e.preventDefault();

		if (this.state.status != I.InterfaceStatus.Error) {
			this.validateName(() => this.onPay(I.PaymentMethod.Stripe));
		};
	};

	onPay (method: I.PaymentMethod) {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const globalName = this.getGlobalName();
		const tierItem = U.Data.getMembershipTier(tier);
		const name = globalName || !tierItem.namesCount ? '' : this.getName();
		const refButton = method == I.PaymentMethod.Stripe ? this.refButtonCard : this.refButtonCrypto;

		refButton.setLoading(true);

		if (tierItem.nameMinLength==0) {
			// do not check name if the tier does not feature it
			return this.onPayContinued(tier, method, name, refButton);
		}

		this.checkName(name, () => {
			this.onPayContinued(tier, method, name, refButton);
		});
	};

	onPayContinued(tier: I.TierType, method: I.PaymentMethod, name: string, refButton: any) {
		C.MembershipRegisterPaymentRequest(tier, method, name, (message) => {
			refButton.setLoading(false);

			if (message.error.code) {
				this.setError(message.error.description);
				return;
			};

			if (message.url) {
				U.Common.onUrl(message.url);
			};

			analytics.event('ClickMembership', { params: { tier, method }});
		});
	}

	validateName (callBack?: () => void) {
		const name = this.getName();

		this.checkName(name, () => {
			this.setState({ statusText: translate('popupMembershipStatusWaitASecond') });

			C.NameServiceResolveName(name, (message: any) => {
				let error = '';
				if (message.error.code) {
					error = message.error.description;
				} else
				if (!message.available) {
					error = translate('popupMembershipStatusNameNotAvailable');
				};

				if (error) {
					this.setError(error);
				} else {
					this.disableButtons(false);
					this.setOk(translate('popupMembershipStatusNameAvailable'));

					if (callBack) {
						callBack();
					};
				};
			});
		});
	};

	checkName (name: string, callBack: () => void) {
		name = String(name || '').trim();
		if (!name.length) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { tier } = data;

		C.MembershipIsNameValid(tier, name, (message: any) => {
			if (message.error.code) {
				this.setError(message.error.description);
				return;
			};

			if (callBack) {
				callBack();
			};
		});
	};

	getName () {
		return this.refName.getValue().trim();
	};

	getGlobalName () {
		return String(S.Auth.membership?.name || '');
	};

	disableButtons (v: boolean) {
		this.refButtonCard?.setDisabled(v);
		this.refButtonCrypto?.setDisabled(v);
	};

	setOk (t: string) {
		this.setState({ status: I.InterfaceStatus.Ok, statusText: t });
	};

	setError (t: string) {
		this.setState({ status: I.InterfaceStatus.Error, statusText: t });
	};

});

export default PopupMembershipPagePaid;
