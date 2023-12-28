import * as React from 'react';
import { I, UtilCommon, UtilDate, translate } from 'Lib';
import { Select } from 'Component';
import { observer } from 'mobx-react';
import { menuStore } from 'Store';

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

		const d = Number(UtilDate.date('j', value));
		const m = Number(UtilDate.date('n', value));
		const y = Number(UtilDate.date('Y', value));

		const today = UtilDate.now();
		const tomorrow = today + 86400;

		const stepMonth = (dir) => {
			let nY = y;
			let nM = m + dir;

			if (nM < 1) {
				nM = 12;
				nY -= 1;
			};
			if (nM > 12) {
				nM = 1;
				nY += 1;
			};

			return UtilDate.timestamp(nY, nM, 1);
		};

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
								onChange={m => this.setValue(UtilDate.timestamp(y, m, 1), false, false)} 
								menuParam={{ 
									classNameWrap, 
									width: 192,
								}}
							/>

							<Select
								ref={ref => this.refYear = ref}
								id="year"
								value={String(y || '')}
								options={years}
								onChange={y => this.setValue(UtilDate.timestamp(y, m, 1), false, false)}
								menuParam={{
									classNameWrap,
									className: 'center',
									horizontal: I.MenuDirection.Right,
									width: 144,
								}}
							/>
						</div>
						<div className="side right">
							<div className="btn prevMonth" onClick={() => { this.setValue(stepMonth(-1), false, false); }} />
							<div className="btn nextMonth" onClick={() => { this.setValue(stepMonth(1), false, false); }} />
						</div>
					</div>

					<div className="days">
						{days.map((item, i) => (
							<div key={i} className="day th">
								{item.name.substring(0, 2)}
							</div>
						))}
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
									this.setValue(UtilDate.timestamp(item.y, item.m, item.d), true, true); 
								}}
							>
								{item.d}
							</div>
						);
					})}
				</div>
				<div className="line" />
				<div className="foot">
					<div className="sides">
						<div className="side left">
							<div className="btn" onClick={() => { this.setValue(UtilDate.mergeTimeWithDate(today, value), true, true); }}>{translate('menuCalendarToday')}</div>
							<div className="btn" onClick={() => { this.setValue(UtilDate.mergeTimeWithDate(tomorrow, value), true, true); }}>{translate('menuCalendarTomorrow')}</div>
						</div>
						<div className="side right">
							<div className="btn clear" onClick={() => { this.setValue(null, true, true); }}>{translate('commonClear')}</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;

		const m = Number(UtilDate.date('n', value));
		const y = Number(UtilDate.date('Y', value));

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
		
		return UtilDate.getCalendarMonth(value);
	};
	
});

export default MenuCalendar;
