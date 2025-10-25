import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Title } from 'Component';
import { I, S, translate, U } from 'Lib';

import Free from './free';
import Purchased from './purchased';

const PageMainSettingsMembership = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { membership } = S.Auth;
	const tier = U.Data.getMembershipTier(membership.tier);

	return (
		<>
			<Title text={translate('popupSettingsMembershipTitle')} />

			{tier.isIntro ? <Free {...props} /> : <Purchased {...props} />}
		</>
	);

}));

export default PageMainSettingsMembership;
