import React, { FC } from 'react';
import { Label, Button } from 'Component';
import { S, translate, U, I, Action, analytics } from 'Lib';

interface Props {
	route: string;
	className?: string;
};

const UpsellStorage: FC<Props> = ({
	route = '',
	className = '',
}) => {

	const cn = [
		'upsellBanner',
		'upsellStorage',
		className,
	];
	const { membershipTiers, spaceStorage } = S.Common;
	const { membership } = S.Auth;
	const { bytesLimit } = spaceStorage;
	const bytesUsed = U.Common.calculateStorageUsage();
	const notSyncedCounter = S.Auth.getNotSynced().total;
	const usagePercent = bytesUsed / bytesLimit * 100;
	const roundedUsagePercent = Math.ceil(usagePercent / 5) * 5;
	const output = usagePercent < 90 ? roundedUsagePercent : Math.round(usagePercent);

	const show = (usagePercent > 55) && (usagePercent < 100)
		&& U.Common.checkCanMembershipUpgrade()
		&& U.Data.isAnytypeNetwork()
		&& membershipTiers[0]
		&& (membershipTiers[0].id != membership.tier)
		&& !notSyncedCounter;

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

		analytics.event('ClickUpgradePlanTooltip', { type: `Storage${output}`, route });
	};

	return (
		<div className={cn.join(' ')}>
			<div className="text">
				<Label className="usage" text={U.Common.sprintf(translate('upsellBannerStorageUsageText'), `${output}%`)} />
				<Label className="incentive" text={translate('upsellBannerStorageIncentiveText')} />
				<Label className="upsell" text={U.Common.sprintf(translate('upsellBannerStorageUpsellText'), `$${tier.price} ${period}`)} />
			</div>
			<Button text={translate('commonUpgrade')} color="accent" className="c28" onClick={onClick} />
		</div>
	);

};

export default UpsellStorage;
