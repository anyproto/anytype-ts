import * as React from 'react';
import { I } from 'Lib';

class HeaderMainEmpty extends React.Component<I.HeaderComponent> {

	render () {
		return (
			<React.Fragment>
				<div className="side left">{this.props.renderLeftIcons()}</div>
				<div className="side center" />
				<div className="side right" />
			</React.Fragment>
		);
	};

};

export default HeaderMainEmpty;