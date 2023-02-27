import * as React from 'react';
import { Icon } from 'Component';
import { I } from 'Lib';

class FooterMainGraph extends React.Component<I.FooterComponent> {
	
	render () {
		const { onAdd } = this.props;

		return (
			<React.Fragment>
				<Icon
					id="button-add"
					className="big"
					tooltip="Add new object"
					tooltipY={I.MenuDirection.Top} 
					onClick={onAdd}
				/>
			</React.Fragment>
		);
	};

};

export default FooterMainGraph;