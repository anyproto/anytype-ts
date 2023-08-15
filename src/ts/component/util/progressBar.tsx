import * as React from 'react';

interface Props {
	percent: number;
	current?: string;
	max?: string;
};

class ProgressBar extends React.Component<Props> {

	node: any = null;

	render () {
		const { percent, current, max } = this.props;
		let currentLabel = null;
		let maxLabel = null;

		if (current) {
			currentLabel = <div className="label current">{current}</div>;
		};

		if (max) {
			maxLabel = <div className="label max">{max}</div>;
		};

		return (
			<div className="progressBar">
				<div className="bar">
					<div className="fill" style={{ width: percent + '%' }} />
				</div>

				<div className="labels">
					{currentLabel}
					{maxLabel}
				</div>
			</div>
		);
	};
	
};

export default ProgressBar;