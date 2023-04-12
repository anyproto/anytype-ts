import * as React from 'react';
import { I, Util, translate } from 'Lib';
import { Select } from 'Component';
import { observer } from 'mobx-react';
import { menuStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	value: number;
};

const MenuCalendar = observer(class MenuCalendar extends React.Component<I.Menu, State> {
	
	state = {
		value: 0,
	};
	refMonth: any = null;
	refYear: any = null;
	
	render () {
		const { param } = this.props;
		const { data, classNameWrap } = param;
		const { value } = data;
		const items = this.getData();

		const d = Number(Util.date('j', value));
		const m = Number(Util.date('n', value));
		const y = Number(Util.date('Y', value));

		const today = Util.time();
		const tomorrow = today + 86400;

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
								ref={ref => this.refMonth = ref}
								id="month"
								value={String(m || '')} 
								options={months} 
								onChange={m => { this.setValue(Util.timestamp(y, m, 1), false, false); }} 
								menuParam={{ 
									classNameWrap, 
									className: 'orange',
									width: 192,
								}}
							/>
						</div>
						<div className="side right">
							<Select 
								ref={ref => this.refYear = ref}
								id="year" 
								value={String(y || '')} 
								options={years} 
								onChange={y => this.setValue(Util.timestamp(y, m, 1), false, false)} 
								menuParam={{ 
									classNameWrap, 
									className: 'orange center',
									horizontal: I.MenuDirection.Right, 
									width: 144,
								}}
							/>
						</div>
					</div>

					<div className="days">
						{days.map((item, i) => {
							return <div key={i} className="day th">{item.name.substr(0, 2)}</div>;
						})}
					</div>
				</div>
				<div className="body">
					{items.map((item, i) => {
						const cn = [ 'day' ];
						if (m != item.m) {
							cn.push('other');
						};
						if ((d == item.d) && (m == item.m) && (y == item.y)) {
							cn.push('active');
						};
						return (
							<div 
								key={i} 
								className={cn.join(' ')} 
								onClick={(e: any) => { 
									e.stopPropagation();
									this.setValue(Util.timestamp(item.y, item.m, item.d), true, true); 
								}}
							>
								{item.d}
							</div>
						);
					})}
				</div>
				<div className="line" />
				<div className="foot">
					<div className="btn" onClick={() => { this.setValue(Util.mergeTimewithDate(value, today), true, true); }}>{translate('menuCalendarToday')}</div>
					<div className="btn" onClick={() => { this.setValue(Util.mergeTimewithDate(value, tomorrow), true, true); }}>{translate('menuCalendarTomorrow')}</div>
				</div>
			</div>
		);
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;

		const m = Number(Util.date('n', value));
		const y = Number(Util.date('Y', value));

		this.refMonth.setValue(m);
		this.refYear.setValue(y);

		this.props.position();
	};

	setValue (value: number, save: boolean, close: boolean) {
		const { param, id } = this.props;
		const { data } = param;
		const { onChange } = data;

		menuStore.updateData(id, { value });

		if (save) {
			onChange(value);
		};

		if (close) {
			this.props.close();
		};
	};

	getData () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		
		const m = Number(Util.date('n', value));
		const y = Number(Util.date('Y', value));
		const md = Constant.monthDays;
		
		// February
		if (y % 4 === 0) {
			md[2] = 29;
		};
		
		const wdf = Number(Util.date('N', Util.timestamp(y, m, 1)));
		const wdl = Number(Util.date('N', Util.timestamp(y, m, md[m])));
		let pm = m - 1;
		let nm = m + 1;
		let py = y;
		let ny = y;

		if (pm < 1) {
			pm = 12;
			py = y - 1;
		};

		if (nm > 12) {
			nm = 1;
			ny = y + 1;
		};

		const days = [];
		for (let i = 1; i <= wdf; ++i) {
			days.push({ d: md[pm] - (wdf - i), m: pm, y: py });
		};
		for (let i = 1; i <= md[m]; ++i) {
			days.push({ y: y, m: m, d: i });
		};

		for (let i = 1; i < 7 - wdl; ++i) {
			days.push({ d: i, m: nm, y: ny });
		};

		return days;
	};
	
});

export default MenuCalendar;