import * as React from 'react';
import { Icon } from 'Component';
import { I } from 'Lib';

interface Props extends I.FooterComponent  {};

class FooterMainNavigation extends React.Component<Props, {}> {
	
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

export default FooterMainNavigation;