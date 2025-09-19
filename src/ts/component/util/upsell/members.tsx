import React, { FC } from 'react';
import { Label, Button } from 'Component';
import { S, translate, U, I, Action, analytics } from 'Lib';

interface Props {
	tier: any;
	route: string;
	isRed: boolean;
	className?: string;
};

const UpsellMembers: FC<Props> = ({
	tier = {},
	route = '',
	isRed = false,
	className = '',
}) => {

	const cn = [
		'upsellBanner',
		'upsellMembers',
		className,
	];
	const space = U.Space.getSpaceview();
	if (!space) {
		return null;
	};

	const editors = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]).filter(it => it.isWriter || it.isOwner);
	const limit = space.writersLimit;

	let usageText = U.Common.sprintf(translate('upsellBannerMembersUsageText'), editors.length, limit);
	if (isRed) {
		usageText = U.Common.sprintf(translate('upsellBannerMembersLimitUsageText'), limit);
		cn.push('isRed');
	};

	const onClick = () => {
		Action.membershipUpgrade(tier.id);

		analytics.event('ClickUpgradePlanTooltip', { type: `SpaceWarning`, route });
	};

	return (
		<div className={cn.join(' ')}>
			<div className="text">
				<Label className="usage" text={usageText} />
				<Label className="upsell" text={translate('upsellBannerMembersUpsellText')} />
			</div>
			<Button text={translate('commonUpgrade')} color="black" className="c28" onClick={onClick} />
		</div>
	);

};

export default UpsellMembers;
