import * as React from 'react';
import { Icon } from 'Component';
import { I, keyboard } from 'Lib';

const FooterMainEdit = class FooterMainEdit extends React.Component<I.FooterComponent> {
	
	render () {
		const { onHelp, onAdd } = this.props;
		const cmd = keyboard.cmdSymbol();

		return (
			<React.Fragment>
				<Icon
					id="button-add"
					className="big"
					tooltip="Add new object"
					tooltipY={I.MenuDirection.Top} 
					tooltipCaption={`${cmd} + N`}
					onClick={onAdd}
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