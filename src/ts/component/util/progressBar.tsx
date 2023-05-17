import * as React from 'react';

interface Props {
	width: number;
};

class ProgressBar extends React.Component<Props> {

	node: any = null;

	render () {
		const { width } = this.props;

		return (
			<div className="progressBar">
				<div className="progressBarFill" style={{ width: width + '%' }} />
			</div>
		);
	};
	
};

export default ProgressBar;