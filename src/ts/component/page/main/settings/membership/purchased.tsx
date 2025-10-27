import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon, Switch } from 'Component';
import { I, S, U, J, C, Action, translate, analytics, keyboard } from 'Lib';

const PageMainSettingsMembershipPurchased = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { membership } = S.Auth;
	const { status, tierItem } = membership;
	const tier = U.Data.getMembershipTier(membership.tier);

	console.log('TIER: ', tier)
	console.log('TIER ITEM: ', tierItem)

	//DEV: hardcoded values
	const color = 'blue';
	const plan = 'Plus annual';
	const payment = '$48';
	const date = 'July, 04, 2026';

	const currentCn = [ 'item', 'current', color ];

	const onNameSelect = () => {
		S.Popup.open('membershipFinalization', {});
	};

	return (
		<div className="membershipPurchased">
			<div className="section">
				<div className={currentCn.join(' ')}>
					<Title text={U.Common.sprintf(translate('popupSettingsMembershipCurrentTier'), plan)} />
					<Label text={U.Common.sprintf(translate('popupSettingsMembershipNextPayment'), payment, date)} />
					<Button text={translate('popupSettingsMembershipManage')} color="blank" />
				</div>

				<div className="item anyName">
					<Icon />
					<Title text={translate('popupSettingsMembershipSelectAnyNameTitle')} />
					<Label text={translate('popupSettingsMembershipSelectAnyNameText')} />
					<Button onClick={onNameSelect} text={translate('commonSelect')} color="accent" />
				</div>
			</div>
		</div>
	);

}));

export default PageMainSettingsMembershipPurchased;
