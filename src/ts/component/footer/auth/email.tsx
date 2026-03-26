import React, { forwardRef } from 'react';
import Label from 'Component/util/label';
import { I, translate } from 'Lib';

const FooterAuthOnboardEmail = forwardRef<{}, I.FooterComponent>(() => {

	return (
		<Label 
			className="disclaimer" 
			text={translate('onboardEmailDisclaimer')}
		/>
	);

});

export default FooterAuthOnboardEmail;
