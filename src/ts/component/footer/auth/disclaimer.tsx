import * as React from 'react';
import { Label } from 'Component';
import { I, U, J, translate } from 'Lib';

class FooterAuthDisclaimer extends React.Component<I.FooterComponent> {
	
	render () {
		return <Label className="disclaimer" text={U.Common.sprintf(translate('authDisclaimer'), J.Url.terms, J.Url.privacy)} />;
	};

};

export default FooterAuthDisclaimer;
