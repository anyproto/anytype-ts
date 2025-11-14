import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Title } from 'Component';
import { I, S, translate, U } from 'Lib';

import Intro from './intro';
import Purchased from './purchased';
import Loader from './loader';

const PageMainSettingsMembership = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { data } = S.Membership;
	const products = S.Membership.products.filter(it => it.isTopLevel && !it.isHidden);

	let content: any = null;

	if (!data || !products.length) {
		content = <Loader />;
	} else {
		const product = data.getTopProduct();
		if (!product || product.isIntro) {
			content = <Intro {...props} />;
		} else {
			content = <Purchased {...props} />;
		};
	};

	return (
		<>
			<Title text={translate('popupSettingsMembershipTitle')} />
			{content}
		</>
	);

}));

export default PageMainSettingsMembership;
