import * as React from 'react';
import { Label } from 'Component';
import { I, translate } from 'Lib';

class FooterAuthDisclaimer extends React.Component<I.FooterComponent> {
	
	render () {
		return <Label className="disclaimer" text={translate('authDisclaimer')} />;
	};

};

export default FooterAuthDisclaimer;
