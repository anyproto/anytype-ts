import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Input, Button } from 'Component';
import { I, C, translate, UtilCommon, UtilData } from 'Lib';
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
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const globalName = this.getName();
		const { status, statusText } = this.state;
		const tierItem = UtilData.getMembershipTier(tier);

		if (!tierItem) {
			return null;
		};

		const { namesCount } = tierItem;
		const period = tierItem.period == I.MembershipPeriod.Period1Year ? 
			translate('popupSettingsMembershipPerYear') : 
			UtilCommon.sprintf(translate('popupSettingsMembershipPerYears'), tierItem.period);

		return (
			<div className="anyNameForm">
				{namesCount ? (
					<React.Fragment>
						<Title text={translate(`popupMembershipPaidTitle`)} />
						<Label text={translate(`popupMembershipPaidText`)} />

						<div className="inputWrapper">
							<Input
								ref={ref => this.refName = ref}
								value={globalName}
								onKeyUp={this.onKeyUp}
								readonly={!!globalName}
								className={globalName ? 'disabled' : ''}
								placeholder={translate(`popupMembershipPaidPlaceholder`)}
							/>
							{!globalName ? <div className="ns">{Constant.anyNameSpace}</div> : ''}
						</div>

						<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>
					</React.Fragment>
				) : ''}

				<div className="priceWrapper">
					<span className="price">{`$${tierItem.price}`}</span>{period}
				</div>

				<Button onClick={() => this.onPay(I.PaymentMethod.Card)} ref={ref => this.refButtonCard = ref} className="c36" text={translate('popupMembershipPayByCard')} />
				<Button onClick={() => this.onPay(I.PaymentMethod.Crypto)} ref={ref => this.refButtonCrypto = ref} className="c36" text={translate('popupMembershipPayByCrypto')} />
			</div>
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
			C.MembershipIsNameValid(tier, name + Constant.anyNameSpace, (message: any) => {
				if (message.error.code) {
					this.setState({ status: 'error', statusText: translate(`popupMembershipCode${message.error.code}`) });
					return;
				};

				this.setState({ statusText: translate('popupMembershipStatusWaitASecond') });
				C.NameServiceResolveName(name + Constant.anyNameSpace, (message: any) => {
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

	onPay (method: I.PaymentMethod) {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const globalName = this.getName();
		const tierItem = UtilData.getMembershipTier(tier);
		const { namesCount } = tierItem;
		const name = globalName || !namesCount ? '' : this.refName.getValue() + Constant.anyNameSpace;
		const refButton = method == I.PaymentMethod.Card ? this.refButtonCard : this.refButtonCrypto;

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
		});
	};

	getName () {
		return String(authStore.membership?.requestedAnyName || '');
	};

});

export default PopupMembershipPagePaid;
