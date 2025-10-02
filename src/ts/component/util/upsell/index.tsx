import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I, S, U } from 'Lib';

import UpsellStorage from './storage';
import UpsellSpace from './space';
import UpsellMembers from './members';

interface Props {
	components: string[];
	route: string;
	className?: string;
};

const Components = {
	storage: UpsellStorage,
	space: UpsellSpace,
	members: UpsellMembers,
};

const UpsellBanner = observer(forwardRef<{}, Props>(({
	components = [],
	route = '',
	className = '',
}, ref) => {

	if (!components.length) {
		return null;
	};

	const { membershipTiers } = S.Common;

	if (!membershipTiers.length) {
		return null;
	};

	const tier: I.MembershipTier = membershipTiers[0];
	const { membership } = S.Auth;

	const getConditions = (item): { isShown: boolean; isRed: boolean } => {
		let isShown = false;
		let isRed = false;

		switch (item) {
			case 'storage': {
				const { spaceStorage } = S.Common;
				const { bytesLimit } = spaceStorage;
				const bytesUsed = U.Common.calculateStorageUsage();
				const notSyncedCounter = S.Auth.getNotSynced().total;
				const usagePercent = bytesUsed / bytesLimit * 100;

				isShown = usagePercent > 55;
				isRed = usagePercent >= 100 || !!notSyncedCounter;
				break;
			};

			case 'members': {
				const space = U.Space.getSpaceview();
				if (!space || space.isChat) {
					return { isShown, isRed };
				};

				const editors = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]).filter(it => it.isWriter || it.isOwner);
				const limit = space.writersLimit;

				isShown = editors.length >= Math.round(limit / 2);
				isRed = editors.length >= limit;
				break;
			};

			case 'space': {
				const mySharedSpaces = U.Space.getMySharedSpacesList();
				const { sharedSpacesLimit } = U.Space.getProfile();

				isShown = sharedSpacesLimit && (mySharedSpaces.length >= sharedSpacesLimit);
				isRed = isShown;
				break;
			};
		};

		return { isShown, isRed };
	};

	const getComponent = ():string => {
		let component = '';

		if (components.length == 1) {
			const { isShown } = getConditions(components[0]);
			if (!isShown) {
				return '';
			};

			component = components[0];
		} else {
			const conditions = [];

			components.forEach((item) => {
				if (getConditions(item).isShown) {
					conditions.push({ ...getConditions(item), component: item });
				};
			});

			if (!conditions.length) {
				return '';
			};

			const isRed = conditions.filter(it => it.isRed);

			if (isRed.length) {
				component = isRed[0].component;
			} else {
				component = conditions[0].component;
			};
		};

		return component;
	};

	const c = getComponent();
	if (!c) {
		return null;
	};

	const Component = Components[c] || null;
	const { isShown, isRed } = getConditions(c);
	const canShow = U.Common.checkCanMembershipUpgrade()
		&& U.Space.isMyOwner()
		&& U.Data.isAnytypeNetwork()
		&& tier
		&& (tier.id != membership.tier)
		&& isShown;
	const tierCanNotUpgrade = !tier.price || !tier.period || !tier.periodType;

	if (!Component || !canShow || tierCanNotUpgrade) {
		return null;
	};

	return <Component className={className} route={route} tier={tier} isRed={isRed} />;

}));

export default UpsellBanner;
