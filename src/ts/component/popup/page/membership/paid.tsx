import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Input, Button } from 'Component';
import { I, C, translate, UtilCommon } from 'Lib';
import Constant from 'json/constant.json';

interface Props {
	tier: any;
};

interface State {
	status: string,
	statusText: string
};

const PopupMembershipPagePaid = observer(class PopupMembershipPagePaid extends React.Component<Props, State> {

	state = {
		status: '',
		statusText: '',
	};

	refName: any = null;
	refButtonCard: any = null;
	refButtonCrypto: any = null;
	timeout: any = null;

	constructor (props: Props) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
		this.onPay = this.onPay.bind(this);
	};

	render() {
		const { status, statusText } = this.state;
		const { tier } = this.props;

		let period = '';

		if (tier.period == 1) {
			period = translate('popupSettingsMembershipPerYear')
		} else {
			period = UtilCommon.sprintf(translate('popupSettingsMembershipPerYears'), tier.period);
		};

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
					<span className="price">{`$${tier.price}`}</span>{period}
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
		const { tier } = this.props;
		const { minNameLength } = tier;
		const name = this.refName.getValue();
		const l = name.length;

		if (this.timeout) {
			window.clearTimeout(this.timeout);
		};
		this.disableButtons(true);

		if (!l) {
			this.setState({ status: '', statusText: '' });
		} else if (l < minNameLength) {
			this.setState({ status: '', statusText: translate('popupMembershipStatusShortName') });
		} else {
			this.setState({ status: '', statusText: translate('popupMembershipStatusWaitASecond') });

			this.timeout = window.setTimeout(() => {
				C.NameServiceResolveName(name + Constant.anyNameSpace, (message) => {
					if (!message.available) {
						this.setState({ status: 'error', statusText: translate('popupMembershipStatusNameNotAvailable') });
						return;
					};

					this.disableButtons(false);
					this.setState({ status: 'ok', statusText: translate('popupMembershipStatusNameAvailable') });
				});
			}, Constant.delay.keyboard);
		};
	};

	disableButtons (v: boolean) {
		if (this.refButtonCard) {
			this.refButtonCard.setDisabled(v);
		};
		if (this.refButtonCrypto) {
			this.refButtonCrypto.setDisabled(v);
		};
	};

	onPay (method: I.PaymentMethod) {
		const { tier } = this.props;
		const name = this.refName.getValue() + Constant.anyNameSpace;

		let refButton;

		if (method == I.PaymentMethod.MethodCard) {
			refButton = this.refButtonCard;
		} else {
			refButton = this.refButtonCrypto;
		};

		refButton.setLoading(true);

		C.PaymentsSubscriptionGetPaymentUrl(tier.id, method, name, (message) => {
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
