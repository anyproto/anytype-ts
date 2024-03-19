import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Input, Button } from 'Component';
import { I, C, translate, UtilCommon, UtilData } from 'Lib';
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
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const { status, statusText } = this.state;
		const tierItem = UtilData.getMembershipTier(tier);
		const period = tierItem.period == I.MembershipPeriod.Period1Year ? 
			translate('popupSettingsMembershipPerYear') : 
			UtilCommon.sprintf(translate('popupSettingsMembershipPerYears'), tierItem.period);

		return (
			<React.Fragment>
				<Title text={translate(`popupMembershipPaidTitle`)} />
				<Label text={translate(`popupMembershipPaidText`)} />

				<div className="inputWrapper">
					<Input ref={ref => this.refName = ref} onKeyUp={this.onKeyUp} placeholder={translate(`popupMembershipPaidPlaceholder`)} />
					<div className="ns">{Constant.anyNameSpace}</div>
				</div>

				<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

				<div className="priceWrapper">
					<span className="price">{`$${tierItem.price}`}</span>{period}
				</div>

				<Button onClick={() => this.onPay(I.PaymentMethod.MethodCard)} ref={ref => this.refButtonCard = ref} className="c36" text={translate('popupMembershipPayByCard')} />
				<Button onClick={() => this.onPay(I.PaymentMethod.MethodCrypto)} ref={ref => this.refButtonCrypto = ref} className="c36" text={translate('popupMembershipPayByCrypto')} />
			</React.Fragment>
		);
	};

	componentDidMount () {
		this.disableButtons(true);
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
		const tierItem = UtilData.getMembershipTier(tier);
		const name = this.refName.getValue();
		const l = name.length;

		this.disableButtons(true);

		this.setState({ statusText: '', status: '' });
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {

			if (l && (l < tierItem.minNameLength)) {
				this.setState({ statusText: translate('popupMembershipStatusShortName') });
				return;
			};

			this.setState({ statusText: translate('popupMembershipStatusWaitASecond') });
			C.NameServiceResolveName(name + Constant.anyNameSpace, (message) => {
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
		}, Constant.delay.keyboard);
	};

	disableButtons (v: boolean) {
		this.refButtonCard?.setDisabled(v);
		this.refButtonCrypto?.setDisabled(v);
	};

	onPay (method: I.PaymentMethod) {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const name = this.refName.getValue() + Constant.anyNameSpace;
		const refButton = method == I.PaymentMethod.MethodCard ? this.refButtonCard : this.refButtonCrypto;

		refButton.setLoading(true);

		C.MembershipGetPaymentUrl(tier, method, name, (message) => {
			refButton.setLoading(false);

			if (message.error.code) {
				this.setState({ status: 'error', statusText: message.error.description });
				return;
			};

			if (message.paymentUrl) {
				UtilCommon.onUrl(message.paymentUrl);
			};
		});
	};

});

export default PopupMembershipPagePaid;
