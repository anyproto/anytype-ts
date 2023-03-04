import * as React from 'react';
import { Icon } from 'Component';
import { I } from 'Lib';

const FooterMainEdit = class FooterMainEdit extends React.Component<I.FooterComponent> {
	
	render () {
		const { onHelp, onAdd } = this.props;

		return (
			<React.Fragment>
				<Icon
					id="button-add"
					className="big disabled"
					tooltip="Add new object"
					tooltipY={I.MenuDirection.Top} 
				/>
				<Icon 
					id="button-help" 
					className="big help" 
					tooltip="Help" 
					tooltipY={I.MenuDirection.Top} 
					onClick={onHelp} 
				/>
			</React.Fragment>
		);
	};

};

export default FooterMainEdit;