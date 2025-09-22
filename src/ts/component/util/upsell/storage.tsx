import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { S, translate, U, I, Action, analytics } from 'Lib';

interface Props {
	tier: any;
	route: string;
	isRed: boolean;
	className?: string;
};

const UpsellStorage = observer(forwardRef<{}, Props>(({
	tier = {},
	route = '',
	isRed = false,
	className = '',
}, ref) => {

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

}));

export default UpsellStorage;