import React, { FC } from 'react';
import { Label, Button } from 'Component';
import { S, translate, U, I, Action, analytics } from 'Lib';

interface Props {
	tier: any;
	route: string;
	className?: string;
};

const UpsellStorage: FC<Props> = ({
	tier = {},
	route = '',
	className = '',
}) => {

	const cn = [
		'upsellBanner',
		'upsellStorage',
		className,
	];
	const { spaceStorage } = S.Common;
	const { bytesLimit } = spaceStorage;
	const bytesUsed = U.Common.calculateStorageUsage();
	const notSyncedCounter = S.Auth.getNotSynced().total;
	const usagePercent = bytesUsed / bytesLimit * 100;
	const roundedUsagePercent = Math.ceil(usagePercent / 5) * 5;
	const output = usagePercent < 90 ? roundedUsagePercent : Math.round(usagePercent);
	const show = usagePercent > 55;
	const isRed = usagePercent >= 100 || notSyncedCounter;

	if (!show) {
		return null;
	};

	let incentiveText = '';
	let upsellText = '';

	if (isRed) {
		cn.push('isRed');

		if (notSyncedCounter) {
			incentiveText = U.Common.sprintf(translate('upsellBannerStorageWithNotSyncedIncentiveText'), notSyncedCounter, U.Common.plural(notSyncedCounter, translate('pluralLCFile')));
		};
		upsellText = translate('upsellBannerStorageFullUpsellText');
	} else {
		const periodLabel = U.Common.getMembershipPeriodLabel(tier);

		let period = '';
		if (tier.period == 1) {
			period = `/ ${U.Common.plural(tier.period, periodLabel)}`;
		} else {
			period = U.Common.sprintf(translate('popupSettingsMembershipPerGenericMany'), tier.period, U.Common.plural(tier.period, periodLabel));
		};

		incentiveText = translate('upsellBannerStorageIncentiveText');
		upsellText = U.Common.sprintf(translate('upsellBannerStorageUpsellText'), `$${tier.price} ${period}`);
	};

	const onClick = () => {
		Action.membershipUpgrade(tier.id);

		analytics.event('ClickUpgradePlanTooltip', { type: `StorageWarning`, usage: Math.round(usagePercent), route });
	};

	return (
		<div className={cn.join(' ')}>
			<div className="text">
				<Label className="usage" text={U.Common.sprintf(translate('upsellBannerStorageUsageText'), `${output}%`)} />
				{incentiveText ? <Label className="incentive" text={incentiveText} /> : ''}
				<Label className="upsell" text={upsellText} />
			</div>
			<Button text={translate('commonUpgrade')} color={isRed ? 'black' : 'accent'} className="c28" onClick={onClick} />
		</div>
	);

};

export default UpsellStorage;
