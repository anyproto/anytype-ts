import * as React from 'react';
import { I, S, U, J, translate, keyboard } from 'Lib';
import { Select } from 'Component';
import { observer } from 'mobx-react';

interface State {
	dotMap: Map<string, boolean>;
	selectedDate: ReturnType<typeof U.Date.getCalendarDateParam>;
};

enum ArrowDirection {
	Up = 'arrowup',
	Down = 'arrowdown',
	Left = 'arrowleft',
	Right = 'arrowright',
}

const MenuCalendar = observer(class MenuCalendar extends React.Component<I.Menu, State> {

	originalValue = 0;
	refMonth: any = null;
	refYear: any = null;

	state: Readonly<State> = {
		dotMap: new Map(),
		selectedDate: null,
	};

	render () {
		const { param } = this.props;
		const { data, classNameWrap } = param;
		const { value, isEmpty, canEdit, canClear = true } = data;
		const { dotMap, selectedDate } = this.state;
		const items = this.getData();
		const { m, y } = U.Date.getCalendarDateParam(value);
		const todayParam = U.Date.getCalendarDateParam(this.originalValue);
		const now = U.Date.now();
		const tomorrow = now + 86400;
		const dayToday = U.Date.today();
		const days = U.Date.getWeekDays();
		const months = [];
		const years = [];

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
								onChange={m => this.setValue(U.Date.timestamp(y, m, 1), false, false)}
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
								onChange={y => this.setValue(U.Date.timestamp(y, m, 1), false, false)}
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
						if (item.isToday) {
							cn.push('today');
						};
						if (item.isWeekend) {
							cn.push('weekend');
						};
						if (!isEmpty && (todayParam.d == item.d) && (todayParam.m == item.m) && (todayParam.y == item.y)) {
							cn.push('active');
						};
						if (selectedDate && (selectedDate.d == item.d) && (selectedDate.m == item.m) && (selectedDate.y == item.y)) {
							cn.push('selected');
						};

						const check = dotMap.get([ item.d, item.m, item.y ].join('-'));
						return (
							<div
								key={i}
								id={[ 'day', item.d, item.m, item.y ].join('-')}
								className={cn.join(' ')}
								onClick={e => this.onClick(e, item)}
								onMouseEnter={() => {
									if (!keyboard.isMouseDisabled) {
										this.setState({ selectedDate: item });
									};
								}}
								onMouseLeave={() => this.setState({ selectedDate: null })}
								onContextMenu={e => this.onContextMenu(e, item)}
							>
								<div className="inner">
									{item.d}
									{check ? <div className="bullet" /> : ''}
								</div>
							</div>
						);
					})}
				</div>
				{canEdit ? (
					<>
						<div className="line" />
						<div className="foot">
							<div className="sides">
								<div className="side left">
									<div className="btn" onClick={() => this.setValue(U.Date.mergeTimeWithDate(now, value), true, true)}>{translate('commonToday')}</div>
									<div className="btn" onClick={() => this.setValue(U.Date.mergeTimeWithDate(tomorrow, value), true, true)}>{translate('commonTomorrow')}</div>
								</div>
								<div className="side right">
									{canClear && <div className="btn clear" onClick={() => this.setValue(null, true, true)}>{translate('commonClear')}</div>}
								</div>
							</div>
						</div>
					</>
				) : ''}
			</div>
		);
	};

	componentDidMount(): void {
		const { param } = this.props;
		const { data } = param;
		const { value, noKeyboard } = data;
		const selectedDate = U.Date.getCalendarDateParam(value);

		this.originalValue = value;

		this.setState({ selectedDate });
		this.initDotMap();

		if (!noKeyboard) {
			this.rebind();
		};

		this.forceUpdate();
	};

	componentWillUnmount () {
		const { param } = this.props;
		const { data } = param;
		const { noKeyboard } = data;

		if (!noKeyboard) {
			this.unbind();
		};
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	onKeyDown = (e: any) => {
		e.stopPropagation();
		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (pressed: string) => {
			e.preventDefault();

			this.onArrow(pressed as ArrowDirection);
		});

		const { selectedDate } = this.state;

		if (selectedDate) {
			keyboard.shortcut('enter', e, () => this.onClick(e, selectedDate));
		};
	};

	onArrow = (dir: ArrowDirection) => {
		const num = [ ArrowDirection.Up, ArrowDirection.Down ].includes(dir) ? 7 : 1;
		const d = [ ArrowDirection.Up, ArrowDirection.Left ].includes(dir) ? -1 : 1;
		const daysDelta = num * d;

		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const currentMonth = U.Date.getCalendarDateParam(value).m;

		const { selectedDate } = this.state;
		if (!selectedDate) {
			return;
		};

		const newDateValue = U.Date.timestamp(selectedDate.y, selectedDate.m, selectedDate.d, 12) + daysDelta * 86400;
		const newCalendarDate = U.Date.getCalendarDateParam(newDateValue);

		const hasAnotherMonth = newCalendarDate.m != currentMonth;
		if (hasAnotherMonth) {
			this.setValue(newDateValue, false, false);
		};

		this.setState({ selectedDate: newCalendarDate });
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const { m, y } = U.Date.getCalendarDateParam(value);

		this.refMonth.setValue(m);
		this.refYear.setValue(y);
	};

	initDotMap () {
		const { param } = this.props;
		const { data } = param;
		const { getDotMap } = data;
		const items = this.getData();

		if (!getDotMap || !items.length) {
			return;
		};

		const first = items[0];
		const last = items[items.length - 1];
		const start = U.Date.timestamp(first.y, first.m, first.d);
		const end = U.Date.timestamp(last.y, last.m, last.d);

		getDotMap(start, end, dotMap => this.setState({ dotMap }));
	};

	onClick = (e: any, item: any) => {
		e.stopPropagation();

		this.setOrOpenDate(item);
	};

	setOrOpenDate = (item: any) => {
		const { param } = this.props;
		const { data } = param;
		const { canEdit, relationKey } = data;
		const ts = U.Date.timestamp(item.y, item.m, item.d);

		if (canEdit) {
			this.setValue(ts, true, true); 
		} else {
			U.Object.openDateByTimestamp(relationKey, ts);
		};
	};

	onContextMenu (e: any, item: any) {
		e.preventDefault();

		const { getId, param } = this.props;
		const { className, classNameWrap, data } = param;
		const { relationKey } = data;

		S.Menu.open('select', {
			element: `#${getId()} #${[ 'day', item.d, item.m, item.y ].join('-')}`,
			offsetY: 4,
			noFlipY: true,
			className,
			classNameWrap,
			data: {
				options: [
					{ id: 'open', icon: 'expand', name: translate('commonOpenObject') },
				],
				onSelect: () => {
					U.Object.openDateByTimestamp(relationKey, U.Date.timestamp(item.y, item.m, item.d));
				}
			}
		});
	};

	setValue (value: number, save: boolean, close: boolean) {
		const { param, id } = this.props;
		const { data } = param;
		const { onChange, canEdit } = data;

		if (!canEdit) {
			return;
		};

		S.Menu.updateData(id, { value });

		if (save && onChange) {
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

		return U.Date.getCalendarMonth(value);
	};

	stepMonth = (value: number, dir: number) => {
		const { m, y } = U.Date.getCalendarDateParam(value);

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

		return U.Date.timestamp(nY, nM, 1);
	};

});

export default MenuCalendar;
