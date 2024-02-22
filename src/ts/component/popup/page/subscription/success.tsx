import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Icon, Button } from 'Component';
import { I, translate, UtilCommon } from 'Lib';
import { popupStore } from 'Store';

interface Props extends I.Popup {
	tier: any;
};

const PopupSubscriptionPlanPageSuccess = observer(class PopupSubscriptionPlanPageSuccess extends React.Component<Props, {}> {

	constructor (props: Props) {
		super(props);

		this.onContinue = this.onContinue.bind(this);
	};

	render() {
		const { tier } = this.props;
		const { id } = tier;

		let text: string = '';

		if (id == I.SubscriptionTier.Explorer) {
			text = translate('popupSubscriptionPlanSuccessTextCuriosity');
		} else {
			text = translate('popupSubscriptionPlanSuccessTextSupport');
		};

		return (
			<React.Fragment>
				<Title text={UtilCommon.sprintf(translate(`popupSubscriptionPlanSuccessTitle`), translate(`popupSettingsMembershipTitle${id}`))} />
				<Icon className={`tier${id}`} />
				<Label text={text} />

				<Button onClick={this.onContinue} className="c36" color="blank" text={translate('commonContinue')} />
			</React.Fragment>
		);
	};

	componentDidMount () {

	};

	onContinue () {
		this.props.close();
	};
});

export default PopupSubscriptionPlanPageSuccess;
