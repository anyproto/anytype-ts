/** @format */

import * as React from 'react';
import { Label } from 'Component';
import { I, translate, UtilCommon } from 'Lib';
import Url from 'json/url.json';

class FooterAuthDisclaimer extends React.Component<I.FooterComponent> {
	render() {
		return (
			<Label
				className="disclaimer"
				text={UtilCommon.sprintf(
					translate('authDisclaimer'),
					Url.terms,
					Url.privacy
				)}
			/>
		);
	}
}

export default FooterAuthDisclaimer;
