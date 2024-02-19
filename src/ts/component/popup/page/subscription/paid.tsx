import * as React from 'react';
import { Title, Label, Input, Button } from 'Component';
import { I, C, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';

interface Props {
	current: any
};

const PopupSubscriptionPlanPagePaid = observer(class PopupSubscriptionPlanPagePaid extends React.Component<Props, {}> {

	constructor (props: Props) {
		super(props);
	};

	render() {
		const { current } = this.props;

		let period = '';

		if (current.period == 1) {
			period = translate('popupSettingsMembershipPerYear')
		} else {
			period = UtilCommon.sprintf(translate('popupSettingsMembershipPerYears'), current.period);
		};

		return (
			<React.Fragment>
				<Title text={translate(`popupSubscriptionPlanPaidTitle`)} />
				<Label text={translate(`popupSubscriptionPlanPaidText`)} />

				<div className="inputWrapper">
					<Input placeholder={translate(`popupSubscriptionPlanPaidPlaceholder`)} />
					<div className="ns">.any</div>
				</div>

				<div className={[ 'statusBar' ].join(' ')}></div>

				<div className="priceWrapper">
					<span className="price">{`$${current.price}`}</span>{period}
				</div>

				<Button className="c36" text={translate('popupSubscriptionPlanPayByCard')} />
				<Button className="c36" text={translate('popupSubscriptionPlanPayByCrypto')} />
			</React.Fragment>
		);
	};

});

export default PopupSubscriptionPlanPagePaid;
