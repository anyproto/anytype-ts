import * as React from 'react';
import { I, UtilCommon } from 'Lib';

class FooterAuthIndex extends React.Component<I.FooterComponent> {
	
	render () {
		return (
			<React.Fragment>
				<div className="copy">{UtilCommon.date('Y', UtilCommon.time())}, Anytype</div>
			</React.Fragment>
		);
	};

};

export default FooterAuthIndex;