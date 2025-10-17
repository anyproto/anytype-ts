import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { translate, U, Action, analytics } from 'Lib';

interface Props {
	tier: any;
	route: string;
	isRed: boolean;
	className?: string;
};

const UpsellSpace = observer(forwardRef<{}, Props>(({
	tier = {},
	route = '',
	className = '',
}, ref) => {

	const cn = [
		'upsellBanner',
		'upsellSpace',
		'isRed',
		className,
	];

	const mySharedSpaces = U.Space.getMySharedSpacesList();
	const onClick = () => {
		Action.membershipUpgrade(tier.id);

		analytics.event('ClickUpgradePlanTooltip', { type: `SpaceWarning`, route });
	};

	return (
		<div className={cn.join(' ')}>
			<div className="text">
				<Label className="usage" text={U.Common.sprintf(translate('upsellBannerSpaceUsageText'), mySharedSpaces.length)} />
				<Label className="upsell" text={translate('upsellBannerSpaceUpsellText')} />
			</div>
			<Button text={translate('commonUpgrade')} color="black" className="c28" onClick={onClick} />
		</div>
	);

}));

export default UpsellSpace;