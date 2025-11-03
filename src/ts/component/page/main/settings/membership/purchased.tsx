import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon, Switch } from 'Component';
import { I, S, U, J, C, Action, translate, analytics, keyboard, Relation } from 'Lib';

const PageMainSettingsMembershipPurchased = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { data } = S.Membership;
	const product = data?.getTopProduct();
	const { status } = product;
	const { isYearly } = product.info;
	const { name, colorStr, price, priceMonthly } = product.product;
	const nextPaymentAmount = isYearly ? price : priceMonthly;
	const payment = `$${nextPaymentAmount}`;
	const date = 'July, 04, 2026'; // TODO: change when data is available
	const currentCn = [ 'item', 'current', colorStr ];

	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const globalName = Relation.getStringValue(participant?.globalName);
	const anyNameCn = [ 'item', 'anyName', globalName ? '' : 'noName' ];

	const onManage = () => {
		C.MembershipGetPortalLinkUrl((message) => {
			if (message.url) {
				Action.openUrl(message.url);
			};
		});
	};

	const onNameSelect = () => {
		S.Popup.open('membershipFinalization', {});
	};

	return (
		<div className="membershipPurchased">
			<div className="section">
				<div className={currentCn.join(' ')}>
					<div className="top">
						<Icon />
						<Title text={U.Common.sprintf(translate('popupSettingsMembershipCurrentTier'), name, 'PERIOD TYPE')} />
						<Label text={U.Common.sprintf(translate('popupSettingsMembershipNextPayment'), payment, date)} />
					</div>
					<Button onClick={onManage} text={translate('popupSettingsMembershipManage')} color="blank" />
				</div>

				<div className={anyNameCn.join(' ')}>
					<div className="top">
						<Icon />
						<Title text={globalName ? globalName : translate('popupSettingsMembershipSelectAnyNameTitle')} />
						<Label text={translate('popupSettingsMembershipSelectAnyNameText')} />
					</div>
					{globalName ? '' : <Button onClick={onNameSelect} text={translate('commonSelect')} color="accent" />}
				</div>
			</div>
		</div>
	);

}));

export default PageMainSettingsMembershipPurchased;