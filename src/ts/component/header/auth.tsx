import * as React from 'react';
import { Icon } from 'ts/component';

class HeaderAuth extends React.Component<{}, {}> {
	
	render () {
		return (
			<div id="header" className="header">
				<Icon className="logo" />
			</div>
		);
	};
	
};

export default HeaderAuth;