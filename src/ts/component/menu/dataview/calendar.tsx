import * as React from 'react';
import { I, Util } from 'ts/lib';
import { Input, Select } from 'ts/component';
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
	
	refMonth: any = null;
	refYear: any = null;
	
	constructor(props: any) {
		super(props);

		this.onChangeMonth = this.onChangeMonth.bind(this);
		this.onChangeYear = this.onChangeYear.bind(this);
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

		let months = [];
		for (let i in Constant.month) {
			months.push({ id: i, name: Constant.month[i] });
		};
		
		return (
			<div className="inner">
				<div className="head">	
					<Select initial="Month" id="month" arrowClassName="light" value={String(m)} ref={(ref: any) => { this.refMonth = ref; }} options={months} onChange={this.onChangeMonth} />
					<Input ref={(ref: any) => { this.refYear = ref; }} placeHolder="Year" onKeyUp={this.onChangeYear} />
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
						if ((dv == item.d) && (mv == item.m) && (yv == item.y)) {
							cn.push('active');
						};
						return <div key={i} className={cn.join(' ')} onClick={() => { this.set(item.d, item.m, y); }}>{item.d}</div>;
					})}
				</div>
				<div className="foot dn"></div>
			</div>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;

		const mv = Number(Util.date('n', data.value));
		const yv = Number(Util.date('Y', data.value));

		this.refMonth.setValue(mv);
		this.refYear.setValue(yv);
		
		this.setState({ value: value });
	};

	onChangeMonth (v: any) {
		const { value } = this.state;
		const yv = Number(Util.date('Y', value));

		this.setState({ value: Util.timestamp(yv, v, 1) });
	};

	onChangeYear (e: any, v: any) {
		const { value } = this.state;
		const mv = Number(Util.date('n', value));

		this.setState({ value: Util.timestamp(v, mv, 1) });
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