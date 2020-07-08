import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util } from 'ts/lib';
import { Icon, Input } from 'ts/component';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

const $ = require('jquery');
const Constant = require('json/constant.json');

interface Props extends I.Menu {};

interface State {
	value: number;
};

@observer
class MenuCalendar extends React.Component<Props, {}> {
	
	state = {
		value: 0
	};
	
	valueRef: any = null;
	
	constructor(props: any) {
		super(props);
	};

	render() {
		const items = this.getData();
		const { param } = this.props;
		const { data } = param;
		const { value } = this.state;

		let dv = Number(Util.date('d', data.value));
		let mv = Number(Util.date('n', data.value));
		let yv = Number(Util.date('Y', data.value));
		
		let m = Number(Util.date('n', value));
		let y = Number(Util.date('Y', value));
		
		return (
			<React.Fragment>
				<Input ref={(ref: any) => { this.valueRef = ref; }} readOnly={true} />
				<div className="inner">
					<div className="month">
						<div className="name">
							{Constant.month[m]}, {y}
						</div>
						<div className="icons">
							<Icon className="arrow left" onClick={() => { this.switchMonth(-1); }} />
							<Icon className="arrow right" onClick={() => { this.switchMonth(1); }} />
						</div>
					</div>
					{Constant.week.map((day: string, i: number) => {
						return <div key={i} className="day th">{day.substr(0, 2)}</div>;
					})}
					{items.map((item, i) => {
						let cn = [ 'day' ];
						if (m != item.m) {
							cn.push('dis');
						};
						if ((dv == item.d) && (mv == item.m) && (yv == item.y)) {
							cn.push('active');
						};
						return <div key={i} className={cn.join(' ')} onClick={() => { this.set(item.d, item.m, y); }}>{item.d}</div>;
					})}
				</div>
			</React.Fragment>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { id, value } = data;
		
		this.setState({ value: value });
		this.valueRef.setValue(Util.date('M d, Y', value));
	};
	
	switchMonth (dir: number): void {
		const { value } = this.state;
		
		let m = Number(Util.date('n', value));
		let y = Number(Util.date('Y', value));
		
		m += dir;
		
		if (m < 1) {
			m = 12;
			y--;
		};
		
		if (m > 12) {
			m = 1;
			y++;
		};
		
		this.setState({ value: Util.timestamp(y, m, 1) });
	};
	
	set (d: number, m: number, y: number) {
		const { id, param } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		commonStore.menuClose(id);
		onChange(Util.timestamp(y, m, d));
	};
	
	getData () {
		const { value } = this.state;
		
		let d = Number(Util.date('d', value));
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