import React, { FC, MouseEvent } from 'react';
import { Icon, Label, Button } from 'Component';
import { S, translate, U, I, Action } from 'Lib';

interface Props {
	className?: string;
};

const UpsellStorage: FC<Props> = ({
	className = '',
}) => {

	const cn = [
		'upsellBanner',
		'upsellStorage',
		className ? className : ''
	];
	const { membershipTiers } = S.Common;
	const { membership } = S.Auth;
	const { spaceStorage } = S.Common;
	const { bytesLimit } = spaceStorage;
	const bytesUsed = U.Common.calculateStorageUsage();
	const usagePercent = bytesUsed / bytesLimit;

	const show = (usagePercent > 0.55) && (usagePercent < 1)
		&& U.Common.checkCanMembershipUpgrade()
		&& membershipTiers[0]
		&& (membershipTiers[0].id != membership.tier);

	if (!show) {
		return null;
	};

	const tier: I.MembershipTier = membershipTiers[0];

	if (!tier.price || !tier.period || !tier.periodType) {
		return null;
	};

	const periodLabel = U.Common.getMembershipPeriodLabel(tier);

	let period = '';
	if (tier.period == 1) {
		period = `/ ${U.Common.plural(tier.period, periodLabel)}`;
	} else {
		period = U.Common.sprintf(translate('popupSettingsMembershipPerGenericMany'), tier.period, U.Common.plural(tier.period, periodLabel));
	};

	const onClick = () => {
		Action.membershipUpgrade(tier.id);
	};

	return (
		<div className={cn.join(' ')}>
			<div className="text">
				<Label className="usage" text={U.Common.sprintf(translate('upsellBannerStorageUsageText'), `${Math.ceil(usagePercent * 100 / 5) * 5}%`)} />
				<Label className="incentive" text={translate('upsellBannerStorageIncentiveText')} />
				<Label className="upsell" text={U.Common.sprintf(translate('upsellBannerStorageUpsellText'), `$${tier.price} ${period}`)} />
			</div>
			<Button text={translate('commonUpgrade')} color="accent" className="c28" onClick={onClick} />
		</div>
	);

};

export default UpsellStorage;
