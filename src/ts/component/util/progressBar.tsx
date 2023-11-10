import * as React from 'react';
import { Label } from 'Component';
import { Preview } from 'Lib';

interface Props {
	segments: { name: string; caption: string; percent: number; isActive: boolean; }[];
	current?: string;
	max?: string;
};

class ProgressBar extends React.Component<Props> {

	node: any = null;

	constructor (props: Props) {
		super(props);

		this.onTooltipShow = this.onTooltipShow.bind(this);
	};

	render () {
		const { segments, current, max } = this.props;
		const total = segments.reduce((res, current) => res += current.percent, 0);

		const Item = (item: any) => {
			const cn = [ 'fill' ];
			if (item.isActive) {
				cn.push('isActive');
			};

			return (
				<div 
					className={cn.join(' ')} 
					style={{ width: `${item.percent * 100}%` }} 
					onMouseEnter={e => this.onTooltipShow(e, item)}
					onMouseLeave={() => Preview.tooltipHide(false)}
				/>
			);
		};

		return (
			<div className="progressBar">
				<div className="bar">
					{segments.map((item, i) => (
						<Item key={i} {...item} />
					))}
					<div className="fill empty" style={{ width: `${(1 - total) * 100}%` }} />
				</div>

				<div className="labels">
					{current ? <Label className="current" text={current} /> : ''}
					{max ? <Label className="max" text={max} /> : '' }
				</div>
			</div>
		);
	};

	onTooltipShow (e: any, item: any) {
		const t = Preview.tooltipCaption(item.name, item.caption);
		Preview.tooltipShow({ text: t, element: $(e.currentTarget) });
	};
	
};

export default ProgressBar;