import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { S, translate, U, I, Action, analytics } from 'Lib';

interface Props {
	route: string;
	isRed: boolean;
	className?: string;
};

const UpsellMembers = observer(forwardRef<{}, Props>(({
	route = '',
	isRed = false,
	className = '',
}, ref) => {

	const space = U.Space.getSpaceview();
	if (!space) {
		return null;
	};

	const editors = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]).filter(it => it.isWriter || it.isOwner);
	const limit = space.writersLimit;
	const cn = [
		'upsellBanner',
		'upsellMembers',
		className,
	];

	let usageText = U.String.sprintf(translate('upsellBannerMembersUsageText'), editors.length, limit);
	if (isRed) {
		usageText = U.String.sprintf(translate('upsellBannerMembersLimitUsageText'), limit);
		cn.push('isRed');
	};

	const onClick = () => {
		Action.membershipUpgrade({ type: 'SpaceWarning', route });
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

}));

export default UpsellMembers;
