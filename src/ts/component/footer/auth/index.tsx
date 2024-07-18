import * as React from 'react';
import { I, U } from 'Lib';

class FooterAuthIndex extends React.Component<I.FooterComponent> {
	
	render () {
		return <div className="copy">{U.Date.date('Y', U.Date.now())}, Anytype</div>;
	};

};

export default FooterAuthIndex;