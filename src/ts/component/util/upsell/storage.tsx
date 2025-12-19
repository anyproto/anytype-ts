import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { S, translate, U, I, Action, analytics } from 'Lib';

interface Props {
	route: string;
	isRed: boolean;
	className?: string;
};

const UpsellStorage = observer(forwardRef<{}, Props>(({
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
	const isOwner = U.Space.isMyOwner();

	let incentiveText = '';
	let upsellText = '';

	if (isRed) {
		cn.push('isRed');

		if (notSyncedCounter) {
			incentiveText = U.String.sprintf(translate('upsellBannerStorageWithNotSyncedIncentiveText'), notSyncedCounter, U.Common.plural(notSyncedCounter, translate('pluralLCFile')));
		};
		upsellText = translate('upsellBannerStorageFullUpsellText');

		if (!isOwner) {
			incentiveText = translate('upsellBannerStorageNonOwnerIncentive');
			upsellText = translate('upsellBannerStorageNonOwnerUpsell');
		};
	} else {
		if (!isOwner) {
			return null;
		};
	};

	const onClick = () => {
		Action.membershipUpgrade({ type: 'StorageWarning', usage: Math.round(usagePercent), route });
	};

	return (
		<div className={cn.join(' ')}>
			<div className="text">
				{isOwner ? <Label className="usage" text={U.String.sprintf(translate('upsellBannerStorageUsageText'), `${output}%`)} /> : ''}
				{incentiveText ? <Label className="incentive" text={incentiveText} /> : ''}
				<Label className="upsell" text={upsellText} />
			</div>
			{isOwner ? <Button text={translate('commonUpgrade')} color={isRed ? 'black' : 'accent'} className="c28" onClick={onClick} /> : ''}
		</div>
	);

}));

export default UpsellStorage;
