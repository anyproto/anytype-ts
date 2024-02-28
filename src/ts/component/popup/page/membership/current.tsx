import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, translate, UtilCommon, UtilDate } from 'Lib';
import { authStore } from 'Store';

interface Props {
	onChangeEmail: () => void;
};

const PopupMembershipPageCurrent = observer(class PopupMembershipPageCurrent extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onButton = this.onButton.bind(this);
	};

	render() {
		const { membership } = authStore;
		const { tier, dateEnds, paymentMethod } = membership;

		let dateText: string = '';
		let paidText: string = '';
		let buttonText: string = '';

		if (tier == I.MembershipTier.Explorer) {
			dateText = translate('popupMembershipForever');
			buttonText = translate('popupMembershipChangeEmail');
		} else {
			dateText = `${UtilDate.date('d F Y', dateEnds)}`;
			paidText = UtilCommon.sprintf(translate('popupMembershipPaidBy'), translate(`popupMembershipPaymentMethod${paymentMethod}`));

			if (paymentMethod == I.PaymentMethod.MethodCrypto) {
				buttonText = translate('popupMembershipWriteToAnyteam');
			} else {
				buttonText = translate('popupMembershipManagePayment');
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
					<Label className="paymentMethod" text={paidText} />
				</div>

				<Button onClick={this.onButton} text={buttonText} className="c36" color="blank" />
			</div>
		);
	};

	onButton () {
		const { membership } = authStore;
		const { onChangeEmail } = this.props;
		const { tier, paymentMethod } = membership;

		if (tier == I.MembershipTier.Explorer) {
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

export default PopupMembershipPageCurrent;
