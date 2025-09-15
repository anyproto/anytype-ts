import React, { FC } from 'react';
import { I, S, U } from 'Lib';

import UpsellStorage from './storage';
import UpsellSpace from './space';
import UpsellMembers from './members';

interface Props {
	component: string;
	route: string;
	className?: string;
};

const Components = {
	storage: UpsellStorage,
	space: UpsellSpace,
	members: UpsellMembers,
};

const UpsellBanner: FC<Props> = ({
	component = '',
	route = '',
	className = '',
}) => {

	if (!component) {
		return null;
	};

	const { membershipTiers } = S.Common;
	const tier: I.MembershipTier = membershipTiers[0];
	const { membership } = S.Auth;
	const Component = Components[component] || null;
	const canShow = U.Common.checkCanMembershipUpgrade()
		&& U.Data.isAnytypeNetwork()
		&& membershipTiers[0]
		&& (membershipTiers[0].id != membership.tier);
	const tierCanNotUpgrade = !tier.price || !tier.period || !tier.periodType;

	if (!Component || !canShow || tierCanNotUpgrade) {
		return null;
	};

	return <Component className={className} route={route} tier={tier} />;

};

export default UpsellBanner;
