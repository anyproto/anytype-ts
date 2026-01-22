import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon } from 'Component';
import { I, S, U, J, C, Action, translate, analytics } from 'Lib';

const PageMainSettingsMembershipPurchased = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const [ dummy, setDummy ] = useState(0);
	const { data } = S.Membership;
	const { account} = S.Auth;
	const { dateFormat } = S.Common;
	const { nextInvoice } = data;
	const purchased = data?.getTopPurchasedProduct();
	const product = data?.getTopProduct();
	const { info } = purchased;
	const { isAutoRenew, dateEnds, period } = info;
	const { name, colorStr } = product;
	const currentCn = [ 'item', 'current', colorStr ? colorStr : 'default' ];
	const participant = U.Space.getParticipant();
	const globalName = participant?.globalName;
	const nameCn = [ 'item', 'anyName' ];

	if (globalName) {
		nameCn.push('withName');
	};

	let membershipText = '';
	let date = '';
	let button = null;

	if (isAutoRenew && nextInvoice.date) {
		const price = U.Common.getMembershipPriceString(nextInvoice.total);

		date = U.Date.dateWithFormat(dateFormat, nextInvoice.date);
		membershipText = U.String.sprintf(translate('popupSettingsMembershipNextPayment'), price, date);
	} else 
	if (dateEnds) {
		date = U.Date.dateWithFormat(dateFormat, dateEnds);
		membershipText = U.String.sprintf(translate('popupSettingsMembershipValidUntil'), date);
	};

	const onManage = () => {
		C.MembershipV2GetPortalLink((message) => {
			if (message.url) {
				Action.openUrl(message.url);
			};
		});

		analytics.event('ClickMembershipManagePlan', { type: 'Manage' });
	};

	const onNameSelect = () => {
		Action.finalizeMembership(product, analytics.route.settingsMembership, () => setDummy(dummy + 1));
	};

	if (data.teamOwnerId && (data.teamOwnerId != account.id)) {
		button = <Label text={translate('popupSettingsMembershipTeamMessage')} />;
	} else 
	if ([ I.PaymentProvider.AppStore, I.PaymentProvider.GooglePlay ].includes(data.paymentProvider)) {
		button = <Label text={U.String.sprintf(translate('popupSettingsMembershipMarketMessage'), translate(`paymentProvider${data.paymentProvider}`))} />;
	} else
	if (data.paymentProvider == I.PaymentProvider.Crypto) {
		button = <Label text={translate('popupSettingsMembershipCryptoMessage')} />;
	} else {
		button = <Button onClick={onManage} text={translate('popupSettingsMembershipManage')} color="blank" />;
	};

	return (
		<div className="membershipPurchased">
			<div className="section">
				<div className={currentCn.join(' ')}>
					<div className="top">
						<Icon />
						<Title text={U.String.sprintf(translate('popupSettingsMembershipCurrentTier'), name, translate(`membershipPeriod${period}`))} />
						<Label text={membershipText} />
					</div>
					{button}
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
