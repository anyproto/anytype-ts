import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, C, translate, UtilCommon, UtilDate } from 'Lib';
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
		const { dateEnds, paymentMethod } = membership;

		let dateText: string = '';
		let paidText: string = '';
		let buttonText: string = '';

		if (membership.isExplorer) {
			dateText = translate('popupMembershipForever');
			buttonText = translate('popupMembershipChangeEmail');
		} else {
			dateText = `${UtilDate.date('d F Y', dateEnds)}`;

			if (paymentMethod != I.PaymentMethod.None) {
				paidText = UtilCommon.sprintf(translate('popupMembershipPaidBy'), translate(`paymentMethod${paymentMethod}`));

				if (paymentMethod == I.PaymentMethod.Crypto) {
					buttonText = translate('popupMembershipWriteToAnyteam');
				} else
				if (paymentMethod == I.PaymentMethod.Card) {
					buttonText = translate('popupMembershipManagePayment');
				};
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
					{paidText ? <Label className="paymentMethod" text={paidText} /> : ''}
				</div>

				{buttonText ? <Button onClick={this.onButton} text={buttonText} className="c36" color="blank" /> : ''}
			</div>
		);
	};

	onButton () {
		const { membership } = authStore;
		const { onChangeEmail } = this.props;
		const { paymentMethod } = membership;

		if (membership.isExplorer) {
			onChangeEmail();
		} else {
			if (paymentMethod == I.PaymentMethod.Crypto) {
				// message to Anyteam
			} else {
				C.MembershipGetPortalLinkUrl((message: any) => {
					if (message.url) {
						UtilCommon.onUrl(message.url);
					};
				});
			};
		};
	};

});

export default PopupMembershipPageCurrent;
