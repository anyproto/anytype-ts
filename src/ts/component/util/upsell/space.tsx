import React, { forwardRef, useEffect } from 'react';
import { Label, Button } from 'Component';

interface Props {
	route: string;
	isRed: boolean;
	className?: string;
};

const UpsellSpace = forwardRef<{}, Props>(({
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

	useEffect(() => {
		analytics.event('ScreenHitShareSpaceLimit');
	}, []);

	const onClick = () => {
		Action.membershipUpgrade({ type: 'SpaceWarning', route });
	};

	return (
		<div className={cn.join(' ')}>
			<div className="text">
				<Label className="usage" text={U.String.sprintf(translate('upsellBannerSpaceUsageText'), mySharedSpaces.length)} />
				<Label className="upsell" text={translate('upsellBannerSpaceUpsellText')} />
			</div>
			<Button text={translate('commonUpgrade')} color="black" size={28} onClick={onClick} />
		</div>
	);

});

export default UpsellSpace;
