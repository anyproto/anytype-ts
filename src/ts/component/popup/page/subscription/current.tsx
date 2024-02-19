import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Input, Button } from 'Component';
import { I, C, translate, UtilCommon, UtilDate } from 'Lib';
import Constant from 'json/constant.json';

interface Props {
	current: any;
	onChangeEmail: () => void;
};

const PopupSubscriptionPlanPageCurrent = observer(class PopupSubscriptionPlanPageCurrent extends React.Component<Props, {}> {

	constructor (props: Props) {
		super(props);

		this.onButton = this.onButton.bind(this);
	};

	render() {
		const { current } = this.props;
		const { tier, dateEnds, paymentMethod } = current;

		console.log('CURRENT: ', current)

		let dateText: string = '';
		let paidText: string = '';
		let buttonText: string = '';

		if (tier == I.SubscriptionTier.Explorer) {
			dateText = translate('popupSubscriptionPlanForever');
			buttonText = translate('popupSubscriptionPlanChangeEmail');
		} else {
			dateText = `${UtilDate.date('d F', dateEnds)}<br />${UtilDate.date('Y', dateEnds)}`;
			paidText = UtilCommon.sprintf(translate('popupSubscriptionPlanPaidBy'), translate(`popupSubscriptionPlanPaymentMethod${paymentMethod}`));

			if (paymentMethod == I.PaymentMethod.MethodCrypto) {
				buttonText = translate('popupSubscriptionPlanWriteToAnyteam');
			} else {
				buttonText = translate('popupSubscriptionPlanManagePayment');
			};
		};

		return (
			<div className="currentSubscription">
				<Title text={translate('popupSubscriptionPlanCurrentStatus')} />

				<div className="valid">
					<Label text={translate('popupSubscriptionPlanValidUntil')} />
					<Label className="date" text={dateText} />
					<Label className="paymentMethod" text={paidText} />
				</div>

				<Button onClick={this.onButton} text={buttonText} className="c36" color="blank" />
			</div>
		);
	};

	onButton () {
		const { current, onChangeEmail } = this.props;
		const { tier, paymentMethod } = current;

		if (tier == I.SubscriptionTier.Explorer) {
			onChangeEmail();
		} else {
			if (paymentMethod == I.PaymentMethod.MethodCrypto) {
				// message to Anyteam
			} else {
				// manage payment on Stripe
			};
		};
	};
});

export default PopupSubscriptionPlanPageCurrent;
