import * as React from 'react';

interface Props {
	percent: number;
};

class ProgressBar extends React.Component<Props> {

	node: any = null;

	render () {
		const { percent } = this.props;

		return (
			<div className="progressBar">
				<div className="progressBarFill" style={{ width: percent + '%' }} />
			</div>
		);
	};
	
};

export default ProgressBar;