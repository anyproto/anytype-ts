import * as React from 'react';
import { Icon } from 'Component';
import { I } from 'Lib';

interface Props extends I.FooterComponent  {};

class FooterMainIndex extends React.Component<Props, {}> {
	
	render () {
		const { onHelp } = this.props;

		return (
			<Icon id="button-help" className="help" tooltip="Help" tooltipY={I.MenuDirection.Top} onClick={onHelp} />
		);
	};

};

export default FooterMainIndex;