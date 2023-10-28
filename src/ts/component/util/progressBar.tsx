import * as React from 'react';
import { Label } from 'Component';

interface Props {
	segments: { name: string; percent: number; isActive: boolean; }[];
	current?: string;
	max?: string;
};

class ProgressBar extends React.Component<Props> {

	node: any = null;

	render () {
		const { segments, current, max } = this.props;
		const total = segments.reduce((res, current) => res += current.percent, 0);

		return (
			<div className="progressBar">
				<div className="bar">
					{segments.map((item, i) => {
						const cn = [ 'fill' ];
						if (item.isActive) {
							cn.push('isActive');
						};

						return <div className={cn.join(' ')} style={{ width: `${item.percent * 100}%` }} />;
					})}

					<div className="fill empty" style={{ width: `${(1 - total) * 100}%` }} />
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