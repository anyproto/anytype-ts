import * as React from 'react';
import { Label } from 'Component';

interface Props {
	percent: number;
	current?: string;
	max?: string;
};

class ProgressBar extends React.Component<Props> {

	node: any = null;

	render () {
		const { percent, current, max } = this.props;

		return (
			<div className="progressBar">
				<div className="bar">
					<div className="fill current" style={{ width: '30%' }} />
					<div className="fill" style={{ width: '10%' }} />
					<div className="fill" style={{ width: '15%' }} />
					<div className="fill empty" style={{ width: '45%' }} />
				</div>

				<div className="labels">
					{current ? <Label className="current" text={current} /> : ''}
					{max ? <Label className="max" text={max} /> : '' }
				</div>
			</div>
		);
	};
	
};

export default ProgressBar;