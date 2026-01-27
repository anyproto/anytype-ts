import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, U, J, translate, keyboard } from 'Lib';
import { Select, Icon } from 'Component';

export interface CalendarDay {
	d: number;
	m: number;
	y: number;
	isToday?: boolean;
	isWeekend?: boolean;
};

interface Props {
	value: number;
	onChange: (value: number | null) => void;
	isReadonly?: boolean;
	canClear?: boolean;
	position?: () => void;
	className?: string;
	menuClassNameWrap?: string;

	// Optional features for MenuCalendar integration
	isEmpty?: boolean;
	enableKeyboard?: boolean;
	enableHoverState?: boolean;
	showFooter?: boolean;
	getDotMap?: (start: number, end: number, cb: (map: Map<string, boolean>) => void) => void;
	onDayClick?: (item: CalendarDay, ts: number) => boolean | void;
	onDayContextMenu?: (e: React.MouseEvent, item: CalendarDay) => void;
	rebind?: () => void;
	unbind?: () => void;
};

export interface CalendarSelectRefProps {
	getValue: () => number;
	setValue: (v: number) => void;
	setDisplayValue: (v: number) => void;
	getSelectedDate: () => CalendarDay | null;
	setSelectedDate: (date: CalendarDay | null) => void;
};

const CalendarSelect = observer(forwardRef<CalendarSelectRefProps, Props>((props, ref) => {

	const {
		value, onChange, isReadonly, canClear = true, position, menuClassNameWrap, className,
		isEmpty, enableKeyboard, enableHoverState, showFooter, getDotMap, onDayClick, onDayContextMenu, rebind, unbind,
	} = props;

	const [ displayValue, setDisplayValue ] = useState(value || U.Date.now());
	const [ dotMap, setDotMap ] = useState<Map<string, boolean>>(new Map());
	const [ selectedDate, setSelectedDate ] = useState<CalendarDay | null>(null);
	const selectedDateRef = useRef<CalendarDay | null>(null);
	const monthRef = useRef(null);
	const yearRef = useRef(null);

	const { m, y } = U.Date.getCalendarDateParam(displayValue);
	const valueParam = value ? U.Date.getCalendarDateParam(value) : null;
	const todayParam = U.Date.getCalendarDateParam(U.Date.now());
	const days = U.Date.getWeekDays();
	const data = U.Date.getCalendarMonth(displayValue);

	const cn = [ 'calendarSelect' ];

	if (className) {
		cn.push(className);
	};

	const months: I.Option[] = [];
	const years: I.Option[] = [];

	for (let i = 1; i <= 12; ++i) {
		months.push({ id: String(i), name: translate(`month${i}`) });
	};

	for (let i = 0; i <= 3000; ++i) {
		years.push({ id: String(i), name: String(i) });
	};

	useEffect(() => {
		if (value) {
			const initialDate = U.Date.getCalendarDateParam(value);
			setSelectedDate(initialDate);
			selectedDateRef.current = initialDate;
		};

		initDotMap();

		if (enableKeyboard) {
			bindKeyboard();
		};

		position?.();

		return () => {
			if (enableKeyboard) {
				unbindKeyboard();
			};
		};
	}, []);

	useEffect(() => {
		monthRef.current?.setValue(m);
		yearRef.current?.setValue(y);
		position?.();
	}, [ displayValue ]);

	useEffect(() => {
		if (value) {
			setDisplayValue(value);
		};
	}, [ value ]);

	const bindKeyboard = (): void => {
		unbindKeyboard();
		$(window).on('keydown.calendarSelect', e => onKeyDown(e));
	};

	const unbindKeyboard = (): void => {
		$(window).off('keydown.calendarSelect');
	};

	const onKeyDown = (e: any): void => {
		e.stopPropagation();
		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (pressed: string) => {
			e.preventDefault();
			onArrow(pressed);
		});

		keyboard.shortcut('enter', e, () => {
			if (selectedDateRef.current) {
				onClick(selectedDateRef.current);
			};
		});
	};

	const onArrow = (pressed: string): void => {
		const num = [ 'arrowup', 'arrowdown' ].includes(pressed) ? 7 : 1;
		const d = [ 'arrowup', 'arrowleft' ].includes(pressed) ? -1 : 1;
		const daysDelta = num * d;
		const currentSelected = selectedDateRef.current;

		if (!currentSelected) {
			return;
		};

		const newValue = U.Date.timestamp(currentSelected.y, currentSelected.m, currentSelected.d, 12) + daysDelta * J.Constant.day;
		const newDate = U.Date.getCalendarDateParam(newValue);
		const hasAnotherMonth = newDate.m != m;

		if (hasAnotherMonth) {
			setDisplayValue(newValue);
		};

		setSelectedDate(newDate);
		selectedDateRef.current = newDate;
	};

	const initDotMap = (): void => {
		if (!getDotMap || !data.length) {
			return;
		};

		const first = data[0];
		const last = data[data.length - 1];
		const start = U.Date.timestamp(first.y, first.m, first.d);
		const end = U.Date.timestamp(last.y, last.m, last.d);

		getDotMap(start, end, map => setDotMap(map));
	};

	const stepMonth = (dir: number): void => {
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

		setDisplayValue(U.Date.timestamp(nY, nM, 1));
	};

	const onClick = (item: CalendarDay): void => {
		if (!item) {
			return;
		};

		const ts = U.Date.timestamp(item.y, item.m, item.d);

		if (onDayClick) {
			const shouldContinue = onDayClick(item, ts);
			if (shouldContinue === false) {
				return;
			};
		};

		if (isReadonly) {
			return;
		};

		onChange(ts);
	};

	const onToday = (): void => {
		if (isReadonly) {
			return;
		};

		const now = U.Date.now();
		onChange(U.Date.mergeTimeWithDate(now, value || now));
	};

	const onTomorrow = (): void => {
		if (isReadonly) {
			return;
		};

		const now = U.Date.now();
		onChange(U.Date.mergeTimeWithDate(now + J.Constant.day, value || now));
	};

	const onClear = (): void => {
		if (isReadonly) {
			return;
		};

		onChange(null);
	};

	const onDayMouseEnter = (item: CalendarDay): void => {
		if (!enableHoverState || keyboard.isMouseDisabled) {
			return;
		};

		setSelectedDate(item);
		selectedDateRef.current = item;
	};

	const onDayMouseLeave = (): void => {
		if (!enableHoverState) {
			return;
		};

		setSelectedDate(null);
		selectedDateRef.current = null;
	};

	const compare = (a: CalendarDay | null, b: CalendarDay): boolean => {
		return !!a && (a.d == b.d) && (a.m == b.m) && (a.y == b.y);
	};

	useImperativeHandle(ref, () => ({
		getValue: () => value,
		setValue: (v: number) => {
			setDisplayValue(v || U.Date.now());
			onChange(v);
		},
		setDisplayValue: (v: number) => {
			setDisplayValue(v || U.Date.now());
		},
		getSelectedDate: () => selectedDateRef.current,
		setSelectedDate: (date: CalendarDay | null) => {
			setSelectedDate(date);
			selectedDateRef.current = date;
		},
	}));

	return (
		<div className={cn.join(' ')}>
			<div className="head">
				<div className="sides">
					<div className="side left">
						<Select
							ref={monthRef}
							id="calendar-month"
							value={String(m || '')}
							options={months}
							onChange={v => setDisplayValue(U.Date.timestamp(y, Number(v), 1))}
							menuParam={{ width: 124, classNameWrap: menuClassNameWrap }}
							readonly={isReadonly}
						/>

						<Select
							ref={yearRef}
							id="calendar-year"
							value={String(y || '')}
							options={years}
							onChange={v => setDisplayValue(U.Date.timestamp(Number(v), m, 1))}
							menuParam={{ width: 82, classNameWrap: menuClassNameWrap }}
							readonly={isReadonly}
						/>
					</div>
					<div className="side right">
						<Icon className="arrow left" onClick={() => stepMonth(-1)} />
						<Icon className="arrow right" onClick={() => stepMonth(1)} />
					</div>
				</div>

				<div className="weekDays">
					{days.map((item, i) => (
						<div key={i} className="weekDay">
							{item.name.substring(0, 2)}
						</div>
					))}
				</div>
			</div>

			<div className="body">
				{data.map((item, i) => {
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
					if (!isEmpty && compare(valueParam, item)) {
						cn.push('active');
					};
					if (compare(todayParam, item)) {
						cn.push('isToday');
					};
					if (enableHoverState && compare(selectedDate, item)) {
						cn.push('selected');
					};

					const hasDot = dotMap.get([ item.d, item.m, item.y ].join('-'));

					return (
						<div
							key={i}
							id={[ 'day', item.d, item.m, item.y ].join('-')}
							className={cn.join(' ')}
							onClick={() => onClick(item)}
							onMouseEnter={() => onDayMouseEnter(item)}
							onMouseLeave={onDayMouseLeave}
							onContextMenu={onDayContextMenu ? e => onDayContextMenu(e, item) : undefined}
						>
							<div className="inner">
								{item.d}
								{hasDot ? <div className="bullet" /> : ''}
							</div>
						</div>
					);
				})}
			</div>

			{(showFooter ?? !isReadonly) ? (
				<div className="foot">
					<div className="sides">
						<div className="side left">
							<div className="btn" onClick={onToday}>{translate('commonToday')}</div>
							<div className="btn" onClick={onTomorrow}>{translate('commonTomorrow')}</div>
						</div>
						<div className="side right">
							{canClear ? <div className="btn clear" onClick={onClear}>{translate('commonClear')}</div> : ''}
						</div>
					</div>
				</div>
			) : ''}
		</div>
	);

}));

export default CalendarSelect;
