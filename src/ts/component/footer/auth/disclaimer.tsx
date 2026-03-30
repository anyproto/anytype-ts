import React, { forwardRef } from 'react';
import Label from 'Component/util/label';
import * as I from 'Interface';

const FooterAuthDisclaimer = forwardRef<{}, I.FooterComponent>(() => {

	return (
		<Label 
			className="disclaimer" 
			text={U.String.sprintf(translate('authDisclaimer'), J.Url.terms, J.Url.privacy)} 
		/>
	);

});

export default FooterAuthDisclaimer;