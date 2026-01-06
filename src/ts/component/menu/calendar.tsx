import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { I, S, U, J, translate, keyboard } from 'Lib';
import { Select } from 'Component';
import { observer } from 'mobx-react';

const MenuCalendar = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, position, getId, close } = props;
	const { data, className, classNameWrap } = param;
	const { value, isEmpty, relationKey, canEdit, canClear = true, noKeyboard, getDotMap, onChange } = data;
	const [ dotMap, setDotMap ] = useState(new Map());
	const [ initialValue, setInitialValue ] = useState(0);
	const [ selectedDate, setSelectedDate ] = useState(null);
	const selectedDateRef = useRef(null);
	const monthRef = useRef(null);
	const yearRef = useRef(null);
	const { m, y } = U.Date.getCalendarDateParam(value);
	const todayParam = U.Date.getCalendarDateParam(initialValue);
	const now = U.Date.now();
	const days = U.Date.getWeekDays();
	const months = [];
	const years = [];

	for (let i = 1; i <= 12; ++i) {
		months.push({ id: i, name: translate(`month${i}`) });
	};

	for (let i = 0; i <= 3000; ++i) {
		years.push({ id: i, name: i });
	};

	useEffect(() => {
		setInitialValue(value);
		const initialDate = U.Date.getCalendarDateParam(value);
		setSelectedDate(initialDate);
		selectedDateRef.current = initialDate;
		initDotMap();

		if (!noKeyboard) {
			rebind();
		};

		return () => {
			if (!noKeyboard) {
				unbind();
			};
		};
	}, []);

	useEffect(() => {
		const { m, y } = U.Date.getCalendarDateParam(value);

		monthRef.current?.setValue(m);
		yearRef.current?.setValue(y);

		position();
	});

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const onKeyDown = (e: any) => {
		e.stopPropagation();
		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (pressed: string) => {
			e.preventDefault();
			onArrow(pressed);
		});

		keyboard.shortcut('enter', e, () => onClick(e, selectedDate));
	};

	const onArrow = (pressed: string) => {
		const num = [ 'arrowup', 'arrowdown' ].includes(pressed) ? 7 : 1;
		const d = [ 'arrowup', 'arrowleft' ].includes(pressed) ? -1 : 1;
		const daysDelta = num * d;
		const { m } = U.Date.getCalendarDateParam(value);
		const currentSelected = selectedDateRef.current;

		if (!currentSelected) {
			return;
		};

		const newValue = U.Date.timestamp(currentSelected.y, currentSelected.m, currentSelected.d, 12) + daysDelta * J.Constant.day;
		const newDate = U.Date.getCalendarDateParam(newValue);
		const hasAnotherMonth = newDate.m != m;

		if (hasAnotherMonth) {
			setValue(newValue, false, false);
		};

		setSelectedDate(newDate);
		selectedDateRef.current = newDate;
	};

	const initDotMap = () => {
		const { getDotMap } = data;
		const items = getData();

		if (!getDotMap || !items.length) {
			return;
		};

		const first = items[0];
		const last = items[items.length - 1];
		const start = U.Date.timestamp(first.y, first.m, first.d);
		const end = U.Date.timestamp(last.y, last.m, last.d);

		getDotMap(start, end, dotMap => setDotMap(dotMap));
	};

	const onClick = (e: any, item: any) => {
		e.stopPropagation();

		if (!item) {
			return;
		};

		const ts = U.Date.timestamp(item.y, item.m, item.d);

		if (canEdit) {
			setValue(ts, true, true); 
		} else {
			U.Object.openDateByTimestamp(relationKey, ts);
		};
	};

	const onContextMenu = (e: any, item: any) => {
		e.preventDefault();

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
				},
			}
		});
	};

	const setValue = (value: number, save: boolean, shouldClose: boolean) => {
		if (!canEdit) {
			return;
		};

		S.Menu.updateData(props.id, { value });

		if (save && onChange) {
			onChange(value);
		};

		if (shouldClose) {
			close();
		};
	};

	const getData = () => {
		return U.Date.getCalendarMonth(value);
	};

	const stepMonth = (value: number, dir: number) => {
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

	const compare = (a: any, b: any) => {
		return a && b && (a.d == b.d) && (a.m == b.m) && (a.y == b.y);
	};

	const items = getData();

	return (
		<div className="inner">
			<div className="head">
				<div className="sides">
					<div className="side left">
						<Select
							ref={monthRef}
							id="month"
							value={String(m || '')}
							options={months}
							onChange={m => setValue(U.Date.timestamp(y, m, 1), false, false)}
							menuParam={{
								classNameWrap,
								width: 124,
							}}
						/>

						<Select
							ref={yearRef}
							id="year"
							value={String(y || '')}
							options={years}
							onChange={y => setValue(U.Date.timestamp(y, m, 1), false, false)}
							menuParam={{
								classNameWrap,
								width: 82,
							}}
						/>
					</div>
					<div className="side right">
						<div className="btn prevMonth" onClick={() => setValue(stepMonth(value, -1), false, false)} />
						<div className="btn nextMonth" onClick={() => setValue(stepMonth(value, 1), false, false)} />
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
					if (!isEmpty && compare(todayParam, item)) {
						cn.push('active');
					};
					if (selectedDate && compare(selectedDate, item)) {
						cn.push('selected');
					};

					const check = dotMap.get([ item.d, item.m, item.y ].join('-'));
					return (
						<div
							key={i}
							id={[ 'day', item.d, item.m, item.y ].join('-')}
							className={cn.join(' ')}
							onClick={e => onClick(e, item)}
							onMouseEnter={() => {
								if (!keyboard.isMouseDisabled) {
									setSelectedDate(item);
									selectedDateRef.current = item;
								};
							}}
						onMouseLeave={() => {
							setSelectedDate(null);
						}}
							onContextMenu={e => onContextMenu(e, item)}
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
								<div className="btn" onClick={() => setValue(U.Date.mergeTimeWithDate(now, value), true, true)}>{translate('commonToday')}</div>
								<div className="btn" onClick={() => setValue(U.Date.mergeTimeWithDate(now + J.Constant.day, value), true, true)}>{translate('commonTomorrow')}</div>
							</div>
							<div className="side right">
								{canClear && <div className="btn clear" onClick={() => setValue(null, true, true)}>{translate('commonClear')}</div>}
							</div>
						</div>
					</div>
				</>
			) : ''}
		</div>
	);

}));

export default MenuCalendar;