import * as React from 'react';
import { I, Util } from 'Lib';

class FooterAuthIndex extends React.Component<I.FooterComponent> {
	
	render () {
		return (
			<React.Fragment>
				<div className="copy">{Util.date('Y', Util.time())}, Anytype</div>
			</React.Fragment>
		);
	};

};

export default FooterAuthIndex;