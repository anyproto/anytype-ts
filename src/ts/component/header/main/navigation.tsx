import * as React from 'react';
import { I } from 'Lib';

class HeaderMainNavigation extends React.Component<I.HeaderComponent> {

	render () {
		const { renderLeftIcons } = this.props;

		return (
			<React.Fragment>
				<div className="side left">{renderLeftIcons()}</div>
				<div className="side center" />
				<div className="side right" />
			</React.Fragment>
		);
	};

};

export default HeaderMainNavigation;