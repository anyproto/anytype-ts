import * as React from 'react';
import { I, UtilDate } from 'Lib';

class FooterAuthIndex extends React.Component<I.FooterComponent> {
	
	render () {
		return <div className="copy">{UtilDate.date('Y', UtilDate.now())}, Anytype</div>;
	};

};

export default FooterAuthIndex;