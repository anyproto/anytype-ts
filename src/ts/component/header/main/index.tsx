import * as React from 'react';
import { Icon } from 'ts/component';

class HeaderMainIndex extends React.Component<{}, {}> {

	render () {
		return (
			<div className="header">
				<Icon className="logo" />
				<div className="menu">
					<div className="item"><Icon className="new" /> New</div>
				</div>
			</div>
		);
	};
	
};

export default HeaderMainIndex;