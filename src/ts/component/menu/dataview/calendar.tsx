import * as React from 'react';
import { I, Util } from 'ts/lib';
import { observer } from 'mobx-react';

const Constant = require('json/constant.json');

interface Props extends I.Menu {};

interface State {
	value: number;
};

@observer
class MenuCalendar extends React.Component<Props, State> {
	
	state = {
		value: 0
	};
	
	render() {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const items = this.getData();

		let d = Number(Util.date('d', value));
		let m = Number(Util.date('n', value));
		let y = Number(Util.date('Y', value));
		
		let months = [];
		for (let i in Constant.month) {
			months.push({ id: i, name: Constant.month[i] });
		};

		return (
			<div className="inner">
				<div className="head">
					<div className="date">{Util.date('F, Y', value)}</div>
					<div className="days">
						{Constant.week.map((day: string, i: number) => {
							return <div key={i} className="day th">{day.substr(0, 2)}</div>;
						})}
					</div>
				</div>
				<div className="body">
					{items.map((item, i) => {
						let cn = [ 'day' ];
						if (m != item.m) {
							cn.push('dis');
						};
						if ((d == item.d) && (m == item.m) && (y == item.y)) {
							cn.push('active');
						};
						return <div key={i} className={cn.join(' ')} onClick={() => { this.set(item.d, item.m, y); }}>{item.d}</div>;
					})}
				</div>
				<div className="foot">
					<div className="btn" onClick={() => { this.setValue(Util.time(), true); }}>Today</div>
					<div className="btn" onClick={() => { this.setValue(Util.time() + 86400, true); }}>Tomorrow</div>
				</div>
			</div>
		);
	};

	setValue (v: number, save: boolean) {
		const { param, close } = this.props;
		const { data } = param;
		const { onChange } = data;

		data.value = v;

		if (save) {
			close();
			onChange(v);
		};
	};
	
	set (d: number, m: number, y: number) {
		const { param, close } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		close();
		onChange(Util.timestamp(y, m, d));
	};
	
	getData () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		
		let m = Number(Util.date('n', value));
		let y = Number(Util.date('Y', value));
		
		// February
		if (y % 4 === 0) {
			Constant.monthDays[2] = 29;
		};
		
		let wdf = Number(Util.date('w', Util.timestamp(y, m, 1)));
		let wdl = Number(Util.date('w', Util.timestamp(y, m, Constant.monthDays[m])));
		
		let pm = m - 1;
		let py = y;
		if (pm < 1) {
			pm = 12;
			py = y - 1;
		};
		
		let days = [];
		for (let i = 1; i <= wdf; ++i) {
			days.push({ d: Constant.monthDays[pm] - (wdf - i) });
		};
		for (let i = 1; i <= Constant.monthDays[m]; ++i) {
			days.push({ y: y, m: m, d: i });
		};
		for (let i = 1; i < 7 - wdl; ++i) {
			days.push({ d: i });
		};
		return days;
	};
	
};

export default MenuCalendar;