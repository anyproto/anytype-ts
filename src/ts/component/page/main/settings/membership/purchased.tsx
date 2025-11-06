import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon } from 'Component';
import { I, S, U, J, C, Action, translate } from 'Lib';

const PageMainSettingsMembershipPurchased = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { data } = S.Membership;
	const { nextInvoice } = data;
	const purchased = data?.getTopProduct();
	const { info, product } = purchased;
	const { isAutoRenew, dateEnds, isYearly } = info;
	const { name, colorStr } = product;
	const period = isYearly ? translate('popupSettingsMembershipCurrentTierAnnual') : translate('popupSettingsMembershipCurrentTierMonthly');

	console.log('PURCHASED: ', purchased)
	console.log('INVOICE: ', nextInvoice)

	const currentCn = [ 'item', 'current', colorStr ? colorStr : 'default' ];

	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const { globalName } = participant;
	const nameCn = [ 'item', 'anyName' ];

	if (globalName) {
		nameCn.push('withName');
	};

	let membershipText = '';
	let date = '';
	if (isAutoRenew) {
		const price = U.Common.getMembershipPriceString(nextInvoice.total);

		date = U.Date.dateWithFormat(S.Common.dateFormat, nextInvoice.date);
		membershipText = U.Common.sprintf(translate('popupSettingsMembershipNextPayment'), price, date);
	} else {
		date = U.Date.dateWithFormat(S.Common.dateFormat, dateEnds);
		membershipText = U.Common.sprintf(translate('popupSettingsMembershipValidUntil'), date);
	};

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
						<Title text={U.Common.sprintf(translate('popupSettingsMembershipCurrentTier'), name, period)} />
						<Label text={membershipText} />
					</div>
					<Button onClick={onManage} text={translate('popupSettingsMembershipManage')} color="blank" />
				</div>

				<div className={nameCn.join(' ')}>
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
