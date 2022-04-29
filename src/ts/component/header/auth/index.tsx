import * as React from 'react';

class HeaderAuthIndex extends React.Component<{}, {}> {
	
	render () {
		return (
			<React.Fragment>
				<div className="side left" />
				<div className="side center">
					<div className="logo" />
				</div>
				<div className="side right" />
			</React.Fragment>
		);
	};
	
};

export default HeaderAuthIndex;