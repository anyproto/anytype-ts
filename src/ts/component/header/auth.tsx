import * as React from 'react';

class HeaderAuth extends React.Component<{}, {}> {
	
	render () {
		return (
			<div id="header" className="header headerAuth">
				<div className="side left" />
				<div className="side center">
					<div className="logo" />
				</div>
				<div className="side right" />
			</div>
		);
	};
	
};

export default HeaderAuth;