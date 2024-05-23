import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Input, Button } from 'Component';
import { I, C, translate, UtilCommon, UtilData, analytics, keyboard } from 'Lib';
import { commonStore, authStore } from 'Store';
const Constant = require('json/constant.json');

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
		const { config } = commonStore;
		const { testCryptoPayment } = config;
		const tierItem = UtilData.getMembershipTier(tier);

		if (!tierItem) {
			return null;
		};

		const { period } = tierItem;
		const { membership } = authStore;
		const { name, nameType } = membership;

		let periodText = '';
		let labelText = '';

		if (period) {
			if (period == 1) {
				periodText = translate('popupSettingsMembershipPerYear');
				labelText = translate('popupMembershipPaidTextPerYear');
			} else {
				periodText = UtilCommon.sprintf(translate('popupSettingsMembershipPerYears'), period, UtilCommon.plural(period, translate('pluralYear')));
				labelText = UtilCommon.sprintf(translate('popupMembershipPaidTextPerYears'), period, UtilCommon.plural(period, translate('pluralYear')));
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
							<div className="ns">{Constant.namespace[nameType]}</div>
						</div>

						<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>
					</React.Fragment>
				) : ''}

				<div className="priceWrapper">
					{tierItem.price ? <span className="price">{`$${tierItem.price}`}</span> : ''}
					{periodText}
				</div>

				<Button onClick={() => this.onPay(I.PaymentMethod.Stripe)} ref={ref => this.refButtonCard = ref} className="c36" text={translate('popupMembershipPayByCard')} />

				{testCryptoPayment ? (
					<Button onClick={() => this.onPay(I.PaymentMethod.Crypto)} ref={ref => this.refButtonCrypto = ref} className="c36" text={translate('popupMembershipPayByCrypto')} />
				) : ''}
			</form>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const tierItem = UtilData.getMembershipTier(tier);
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
		this.timeout = window.setTimeout(() => this.validateName(), Constant.delay.keyboard);
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
		const tierItem = UtilData.getMembershipTier(tier);
		const name = globalName || !tierItem.namesCount ? '' : this.getName();
		const refButton = method == I.PaymentMethod.Stripe ? this.refButtonCard : this.refButtonCrypto;

		refButton.setLoading(true);

		this.checkName(name, () => {
			C.MembershipRegisterPaymentRequest(tier, method, name, (message) => {
				refButton.setLoading(false);

				if (message.error.code) {
					this.setError(message.error.description);
					return;
				};

				if (message.url) {
					UtilCommon.onUrl(message.url);
				};

				analytics.event('ClickMembership', { params: { tier, method }});
			});
		});
	};

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
		return String(authStore.membership?.name || '');
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
