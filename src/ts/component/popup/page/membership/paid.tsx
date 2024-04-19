import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Input, Button } from 'Component';
import { I, C, translate, UtilCommon, UtilData, analytics } from 'Lib';
import { authStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	status: string,
	statusText: string
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
				{/*<Button onClick={() => this.onPay(I.PaymentMethod.Crypto)} ref={ref => this.refButtonCrypto = ref} className="c36" text={translate('popupMembershipPayByCrypto')} />*/}
			</form>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const tierItem = UtilData.getMembershipTier(tier);
		const globalName = this.getName();

		if (!globalName && tierItem.namesCount) {
			this.disableButtons(true);
		};
	};

	componentWillUnmount () {
		if (this.timeout) {
			window.clearTimeout(this.timeout);
		};
	};

	onKeyUp () {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const name = this.refName.getValue();

		this.disableButtons(true);
		this.setState({ statusText: '', status: '' });

		window.clearTimeout(this.timeout);

		if (!name.length) {
			return;
		};

		this.timeout = window.setTimeout(() => {
			C.MembershipIsNameValid(tier, name, (message: any) => {
				if (message.error.code) {
					this.setState({ status: 'error', statusText: translate(`popupMembershipCode${message.error.code}`) });
					return;
				};

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
						this.setState({ status: 'error', statusText: error });
					} else {
						this.disableButtons(false);
						this.setState({ status: 'ok', statusText: translate('popupMembershipStatusNameAvailable') });
					};
				});
			});
		}, Constant.delay.keyboard);
	};

	disableButtons (v: boolean) {
		this.refButtonCard?.setDisabled(v);
		this.refButtonCrypto?.setDisabled(v);
	};

	onSubmit (e: any) {
		e.preventDefault();

		this.onPay(I.PaymentMethod.Stripe);
	};

	onPay (method: I.PaymentMethod) {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const globalName = this.getName();
		const tierItem = UtilData.getMembershipTier(tier);
		const { namesCount } = tierItem;
		const name = globalName || !namesCount ? '' : this.refName.getValue();
		const refButton = method == I.PaymentMethod.Stripe ? this.refButtonCard : this.refButtonCrypto;

		refButton.setLoading(true);

		C.MembershipGetPaymentUrl(tier, method, name, (message) => {
			refButton.setLoading(false);

			if (message.error.code) {
				this.setState({ status: 'error', statusText: message.error.description });
				return;
			};

			if (message.url) {
				UtilCommon.onUrl(message.url);
			};

			analytics.event('ClickMembership', { params: { tier, method }});
		});
	};

	getName () {
		return String(authStore.membership?.name || '');
	};

});

export default PopupMembershipPagePaid;
