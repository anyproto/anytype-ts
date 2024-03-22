import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Icon, Button } from 'Component';
import { I, translate, UtilCommon } from 'Lib';

const PopupMembershipPageSuccess = observer(class PopupMembershipPageSuccess extends React.Component<I.Popup> {

	render () {
		const { param, close } = this.props;
		const { data } = param;
		const { tier } = data;
		const text = tier == I.MembershipTier.Explorer ? translate('popupMembershipSuccessTextCuriosity') : translate('popupMembershipSuccessTextSupport');

		return (
			<React.Fragment>
				<Title text={UtilCommon.sprintf(translate(`popupMembershipSuccessTitle`), translate(`popupSettingsMembershipTitle${tier}`))} />
				<Icon className={`tier${tier}`} />
				<Label text={text} />

				<Button onClick={() => close()} className="c36" color="blank" text={translate('commonContinue')} />
			</React.Fragment>
		);
	};

});

export default PopupMembershipPageSuccess;
