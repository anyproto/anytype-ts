import * as React from 'react';
import { I, Util, translate } from 'ts/lib';
import { Select } from 'ts/component';
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

		const d = Number(Util.date('d', value));
		const m = Number(Util.date('n', value));
		const y = Number(Util.date('Y', value));

		const days = [];
		const months = [];
		const years = [];

		for (let i = 1; i <= 7; ++i) {
			days.push({ id: i, name: translate('day' + i) });
		};

		for (let i = 1; i <= 12; ++i) {
			months.push({ id: i, name: translate('month' + i) });
		};

		for (let i = 0; i <= 3000; ++i) {
			years.push({ id: i, name: i });
		};

		return (
			<div className="inner">
				<div className="head">
					<div className="sides">
						<div className="side left">
							<Select 
								id="month" 
								value={String(m || '')} 
								options={months} 
								menuWidth={192} 
								onChange={(m: any) => { this.setValue(Util.timestamp(y, m, 1), false); }} 
							/>
						</div>
						<div className="side right">
							<Select 
								id="year" 
								value={String(y || '')} 
								options={years} 
								menuClassName="center" 
								menuWidth={144} 
								horizontal={I.MenuDirection.Right} 
								onChange={(y: any) => { this.setValue(Util.timestamp(y, m, 1), false); }} 
							/>
						</div>
					</div>

					<div className="days">
						{days.map((item: any, i: number) => {
							return <div key={i} className="day th">{item.name.substr(0, 2)}</div>;
						})}
					</div>
				</div>
				<div className="body">
					{items.map((item, i) => {
						let cn = [ 'day' ];
						if (m != item.m) {
							cn.push('other');
						};
						if ((d == item.d) && (m == item.m) && (y == item.y)) {
							cn.push('active');
						};
						return <div key={i} className={cn.join(' ')} onClick={() => { this.set(item.d, item.m, y); }}>{item.d}</div>;
					})}
				</div>
				<div className="line" />
				<div className="foot">
					<div className="btn" onClick={() => { this.setValue(Util.time(), true); }}>{translate('menuCalendarToday')}</div>
					<div className="btn" onClick={() => { this.setValue(Util.time() + 86400, true); }}>{translate('menuCalendarTomorrow')}</div>
				</div>
			</div>
		);
	};

	componentDidUpdate () {
		this.props.position();
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