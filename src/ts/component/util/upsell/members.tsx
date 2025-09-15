import React, { FC } from 'react';
import { Label, Button } from 'Component';
import { S, translate, U, I, Action, analytics } from 'Lib';

interface Props {
	tier: any;
	route: string;
	className?: string;
};

const UpsellMembers: FC<Props> = ({
	tier = {},
	route = '',
	className = '',
}) => {

	const cn = [
		'upsellBanner',
		'upsellMembers',
		'isRed',
		className,
	];
	const space = U.Space.getSpaceview();
	if (!space) {
		return null;
	};

	const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
	const editors = participants.filter(it => it.isWriter || it.isOwner);
	const readers = participants.filter(it => it.isReader);
	
	const limit = space.writersLimit;
	const show = editors.length >= Math.round(limit / 2);
	const isRed = editors.length >= limit;

	if (!show) {
		return null;
	};

	let usageText = U.Common.sprintf(translate('upsellBannerMembersUsageText'), editors.length, limit);
	if (isRed) {
		usageText = U.Common.sprintf(translate('upsellBannerMembersLimitUsageText'), limit);
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
