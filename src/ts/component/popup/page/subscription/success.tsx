import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Icon, Button } from 'Component';
import { I, C, translate, UtilCommon } from 'Lib';
import { popupStore } from 'Store';

interface Props {
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

				<Button onClick={() => popupStore.closeAll()} className="c36" color="blank" text={translate('commonContinue')} />
			</React.Fragment>
		);
	};

	onContinue () {
		popupStore.closeAll([], () => {
			popupStore.open('settings', { data: { page: 'membership' } });
		});
	};
});

export default PopupSubscriptionPlanPageSuccess;
