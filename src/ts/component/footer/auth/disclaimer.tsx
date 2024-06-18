import * as React from 'react';
import { Label } from 'Component';
import { I, U, translate } from 'Lib';

const Url = require('json/url.json');

class FooterAuthDisclaimer extends React.Component<I.FooterComponent> {
	
	render () {
		return <Label className="disclaimer" text={U.Common.sprintf(translate('authDisclaimer'), Url.terms, Url.privacy)} />;
	};

};

export default FooterAuthDisclaimer;
