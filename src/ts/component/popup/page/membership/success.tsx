import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Icon, Button } from 'Component';
import { I, U, translate } from 'Lib';

const PopupMembershipPageSuccess = observer(class PopupMembershipPageSuccess extends React.Component<I.Popup> {

	render () {
		const { param } = this.props;
		const { data } = param;
		const { tier, emailVerified, onContinue } = data;
		const tierItem = U.Data.getMembershipTier(tier);

		let title = '';
		let text = '';

		if (emailVerified) {
			title = translate('popupMembershipSuccessVerificationTitle');
			text = translate('popupMembershipSuccessVerificationText');
		} else {
			title = U.Common.sprintf(translate(`popupMembershipSuccessTitle`), tierItem.name);
			text = tier == I.TierType.Explorer ? translate('popupMembershipSuccessTextCuriosity') : translate('popupMembershipSuccessTextSupport');
		};

		if (!tierItem) {
			return null;
		};

		return (
			<>
				<Title text={title} />
				<Icon className="tierIcon" />
				<Label text={text} />

				{onContinue ? <Button onClick={onContinue} className="c36" color="blank" text={translate('commonContinue')} /> : ''}
			</>
		);
	};

});

export default PopupMembershipPageSuccess;
