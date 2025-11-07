import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Title } from 'Component';
import { I, S, translate, U } from 'Lib';

import Intro from './intro';
import Purchased from './purchased';
import Loader from './loader';

const PageMainSettingsMembership = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { data } = S.Membership;

	let content: any = null;

	if (!data) {
		content = <Loader />;
	} else {
		const product = data.getTopProduct();
		const showIntro = !product || product.product.isIntro;

		content = showIntro ? <Intro {...props} /> : <Purchased {...props} />;
	};

	return (
		<>
			<Title text={translate('popupSettingsMembershipTitle')} />

			{content}
		</>
	);

}));

export default PageMainSettingsMembership;
