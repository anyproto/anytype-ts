import * as React from 'react';
import { I, UtilDate, translate } from 'Lib';
import { Select } from 'Component';
import { observer } from 'mobx-react';
import { menuStore } from 'Store';

const MenuCalendar = observer(class MenuCalendar extends React.Component<I.Menu> {
	
	originalValue = 0;
	refMonth: any = null;
	refYear: any = null;
	
	render () {
		const { param } = this.props;
		const { data, classNameWrap } = param;
		const { value, isEmpty } = data;
		const items = this.getData();
		const { m, y } = UtilDate.getCalendarDateParam(value);
		const todayParam = UtilDate.getCalendarDateParam(this.originalValue);

		const now = UtilDate.now();
		const tomorrow = now + 86400;
		const dayToday = UtilDate.today();
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
									width: 124,
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
									width: 82,
								}}
							/>
						</div>
						<div className="side right">
							<div className="btn prevMonth" onClick={() => this.setValue(this.stepMonth(value, -1), false, false)} />
							<div className="btn nextMonth" onClick={() => this.setValue(this.stepMonth(value, 1), false, false)} />
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
						if (dayToday == UtilDate.timestamp(item.y, item.m, item.d)) {
							cn.push('today');
						};
						if (!isEmpty && (todayParam.d == item.d) && (todayParam.m == item.m) && (todayParam.y == item.y)) {
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
							<div className="btn" onClick={() => this.setValue(UtilDate.mergeTimeWithDate(now, value), true, true)}>{translate('commonToday')}</div>
							<div className="btn" onClick={() => this.setValue(UtilDate.mergeTimeWithDate(tomorrow, value), true, true)}>{translate('commonTomorrow')}</div>
						</div>
						<div className="side right">
							<div className="btn clear" onClick={() => this.setValue(null, true, true)}>{translate('commonClear')}</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;

		this.originalValue = value;
		this.forceUpdate();
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const { m, y } = UtilDate.getCalendarDateParam(value);

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

	stepMonth (value: number, dir: number) {
		const { m, y } = UtilDate.getCalendarDateParam(value);

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
	
});

export default MenuCalendar;
