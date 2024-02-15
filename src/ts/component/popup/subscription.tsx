import * as React from 'react';
import { Title, Icon, Label, Input, Button, Checkbox } from 'Component';
import { I, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';

const PopupSubscriptionPlan = observer(class PopupSubscriptionPlan extends React.Component<I.Popup> {

	refCheckbox: any = null;

	render() {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;

		let content: any = null;

		if (tier == 1) {
			content = (
				<React.Fragment>
					<Title text={translate(`popupSubscriptionPlanFreeTitleStep1`)} />
					<Label text={translate(`popupSubscriptionPlanFreeText`)} />
					<Input placeholder={translate('commonEmail')} />

					<div className="check" onClick={this.onCheck}>
						<Checkbox ref={ref => this.refCheckbox = ref} value={false} /> {translate('popupSubscriptionPlanFreeCheckboxText')}
					</div>

					<Button text={translate('commonSubmit')} />
				</React.Fragment>
			);
		} else {
			content = (
				<React.Fragment>
					<Title text={translate(`popupSubscriptionPlanPaidTitle`)} />
					<Label text={translate(`popupSubscriptionPlanPaidText`)} />
				</React.Fragment>
			);
		}

		return (
			<div className="sides">
				<div className="side left">
					<Icon className={`tier${tier}`} />
					<Title text={translate(`popupSettingsPaymentItemTitle${tier}`)} />
					<Label text={translate(`popupSettingsPaymentItemDescription${tier}`)} />

					<div className="contains">
						<Label text={translate('popupSubscriptionPlanWhatsIncluded')} />
					</div>
				</div>
				<div className="side left">{content}</div>
			</div>
		);
	};

	onCheck () {
		const value = !this.refCheckbox.getValue();

		this.refCheckbox.setValue(value);
	};
});

export default PopupSubscriptionPlan;
