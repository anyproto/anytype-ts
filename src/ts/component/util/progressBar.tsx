import React, { FC, MouseEvent } from 'react';
import $ from 'jquery';
import { Label } from 'Component';
import { Preview, U } from 'Lib';

interface Segment {
	name: string;
	caption: string;
	percent: number;
	isActive: boolean;
};

interface Props {
	segments: Segment[];
	current?: string;
	max?: string;
};

const ProgressBar: FC<Props> = ({
	segments = [],
	current = '',
	max = '',
}) => {
	const total = segments.reduce((res, current) => res += current.percent, 0);
	const onTooltipShow = (e: MouseEvent, item: Segment) => {
		const name = U.Common.htmlSpecialChars(item.name);
		const caption = U.Common.htmlSpecialChars(item.caption);
		const t = Preview.tooltipCaption(name, caption);

		if (t) {
			Preview.tooltipShow({ text: t, element: $(e.currentTarget) });
		};
	};

	const Item = (item: any) => {
		const cn = [ 'fill' ];

		if (item.isActive) {
			cn.push('isActive');
		};

		return (
			<div 
				className={cn.join(' ')} 
				style={{ width: `${item.percent * 100}%` }} 
				onMouseEnter={e => onTooltipShow(e, item)}
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

export default ProgressBar;