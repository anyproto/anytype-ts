import * as React from 'react';
import { Icon } from 'Component';
import { I } from 'Lib';

class FooterMainIndex extends React.Component<I.FooterComponent> {

	render () {
		const { onHelp } = this.props;

		return (
			<Icon 
				id="button-help"
				className="help big light"
				tooltip="Help"
				tooltipY={I.MenuDirection.Top}
				onClick={onHelp}
			/>
		);
	};

};

export default FooterMainIndex;