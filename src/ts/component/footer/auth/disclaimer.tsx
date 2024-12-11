import React, { forwardRef } from 'react';
import { Label } from 'Component';
import { I, U, J, translate } from 'Lib';

const FooterAuthDisclaimer = forwardRef<{}, I.FooterComponent>(() => {

	return (
		<Label 
			className="disclaimer" 
			text={U.Common.sprintf(translate('authDisclaimer'), J.Url.terms, J.Url.privacy)} 
		/>
	);

});

export default FooterAuthDisclaimer;