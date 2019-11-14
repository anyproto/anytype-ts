import * as React from 'react';

class Loader extends React.Component<{}, {}> {
	
	render () {
		return (
			<div className="loaderWrapper">
				<div className="loader" />
			</div>
		);
	};
	
};

export default Loader;