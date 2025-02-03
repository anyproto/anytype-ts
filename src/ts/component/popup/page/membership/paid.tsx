import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Input, Button, FooterAuthDisclaimer } from 'Component';
import { I, C, S, U, J, translate, analytics, Action } from 'Lib';

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
		const tierItem = U.Data.getMembershipTier(tier);

		if (!tierItem) {
			return null;
		};

		const { period, periodType } = tierItem;
		const { membership } = S.Auth;
		const { name, nameType, paymentMethod } = membership;

		let platformText = '';
		let withContactButton = false;
		let canEnterName = !name;

		if (membership.tier == I.TierType.Builder) {
			switch (paymentMethod) {
				case I.PaymentMethod.Apple:
				case I.PaymentMethod.Google: {
					platformText = translate('popupMembershipPaidOnOtherPlatform');
					canEnterName = false;
					break;
				};
				case I.PaymentMethod.Crypto: {
					platformText = translate('popupMembershipPaidByCrypto');
					withContactButton = true;
					canEnterName = false;
					break;
				};
			};
		};

		let labelText = translate('popupMembershipPaidTextUnlimited');

		// default is year
		let periodLabel = translate('pluralYear');
		let periodText = U.Common.sprintf(translate('popupSettingsMembershipPerGenericSingle'), U.Common.plural(period, periodLabel));

		if (periodType) {
			switch (periodType) {
				case I.MembershipTierDataPeriodType.PeriodTypeDays: {
					periodLabel = translate('pluralDay');
					break;
				};
				case I.MembershipTierDataPeriodType.PeriodTypeWeeks: {
					periodLabel = translate('pluralWeek');
					break;
				};
				case I.MembershipTierDataPeriodType.PeriodTypeMonths: {
					periodLabel = translate('pluralMonth');
					break;
				};
			};
		};

		if (period) {
			if (period == 1) {
				// one {day, week, month, year}
				periodText = U.Common.sprintf(translate('popupSettingsMembershipPerGenericSingle'), U.Common.plural(period, periodLabel));
				labelText = U.Common.sprintf(translate('popupMembershipPaidTextPerGenericSingle'), U.Common.plural(period, periodLabel));
			} else {
				// N {days, weeks, months, years}
				periodText = U.Common.sprintf(translate('popupSettingsMembershipPerGenericMany'), period, U.Common.plural(period, periodLabel));
				labelText = U.Common.sprintf(translate('popupMembershipPaidTextPerGenericMany'), period, U.Common.plural(period, periodLabel));
			};
		};

		return (
			<form className="anyNameForm" onSubmit={this.onSubmit}>
				{tierItem.namesCount ? (
					<>
						<Title text={translate(`popupMembershipPaidTitle`)} />
						<Label text={labelText} />

						<div className="inputWrapper">
							<Input
								ref={ref => this.refName = ref}
								value={name}
								onKeyUp={this.onKeyUp}
								readonly={!canEnterName}
								className={!canEnterName ? 'disabled' : ''}
								placeholder={translate(`popupMembershipPaidPlaceholder`)}
							/>
							<div className="ns">{J.Constant.namespace[nameType]}</div>
						</div>

						<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>
					</>
				) : ''}

				<div className="priceWrapper">
					{tierItem.price ? <span className="price">{`$${tierItem.price}`}</span> : ''}
					{periodText}
				</div>

				{platformText ? (
					<div className="platformLabel">
						<Label className="paidOnOtherPlatform" text={platformText} />
						{withContactButton ? <Button onClick={() => Action.membershipUpgrade()} text={translate('popupMembershipWriteToAnyteam')} className="c36" color="blank" /> : ''}
					</div>
				) : (
					<>
						<Button onClick={() => this.onPay(I.PaymentMethod.Stripe)} ref={ref => this.refButtonCard = ref} className="c36" text={translate('popupMembershipPayByCard')} />
						<Button onClick={() => this.onPay(I.PaymentMethod.Crypto)} ref={ref => this.refButtonCrypto = ref} className="c36" text={translate('popupMembershipPayByCrypto')} />

						<FooterAuthDisclaimer />
					</>
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
		const cb = () => {
			C.MembershipRegisterPaymentRequest(tier, method, name, (message) => {
				refButton.setLoading(false);

				if (message.error.code) {
					this.setError(message.error.description);
					return;
				};

				if (message.url) {
					Action.openUrl(message.url);
				};

				analytics.event('ClickMembership', { params: { tier, method }});
			});
		};

		refButton.setLoading(true);
		tierItem.nameMinLength ? this.validateName(cb) : cb();
	};

	validateName (callBack?: () => void) {
		const name = this.getName();
		const globalName = this.getGlobalName();

		// if the name was already set, i.e. user had a subscription before
		// then we don't need to check the name again, just go ahead
		if (!globalName.length) {
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
		} else {
			// go ahead without checking the name
			// it was set before
			this.disableButtons(false);

			if (callBack) {
				callBack();
			};
		}
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
