import * as React from 'react';
import { I, UtilCommon } from 'Lib';

class FooterAuthIndex extends React.Component<I.FooterComponent> {
	
	render () {
		return <div className="copy">{UtilCommon.date('Y', UtilCommon.time())}, Anytype</div>;
	};

};

export default FooterAuthIndex;