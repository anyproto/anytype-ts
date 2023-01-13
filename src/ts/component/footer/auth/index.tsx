import * as React from 'react';
import { Icon } from 'Component';
import { I, Util } from 'Lib';

class FooterAuthIndex extends React.Component<I.FooterComponent> {
	
	render () {
		const { onHelp } = this.props;

		return (
			<React.Fragment>
				<div className="copy">{Util.date('Y', Util.time())}, Anytype</div>
				<Icon id="button-help" className="help light" tooltip="Help" tooltipY={I.MenuDirection.Top} onClick={onHelp} />
			</React.Fragment>
		);
	};

};

export default FooterAuthIndex;