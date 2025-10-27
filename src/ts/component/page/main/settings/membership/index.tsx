import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Title } from 'Component';
import { I, S, translate, U } from 'Lib';

import Intro from './intro';
import Purchased from './purchased';

const PageMainSettingsMembership = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { membership } = S.Auth;
	const tier = U.Data.getMembershipTier(membership.tier);

	return (
		<>
			<Title text={translate('popupSettingsMembershipTitle')} />

			{tier.isIntro ? <Intro {...props} /> : <Purchased {...props} />}
		</>
	);

}));

export default PageMainSettingsMembership;
