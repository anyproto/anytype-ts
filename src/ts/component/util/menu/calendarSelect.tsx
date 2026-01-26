import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { I, U, J, translate } from 'Lib';
import { Select, Icon } from 'Component';

interface Props {
	value: number;
	onChange: (value: number | null) => void;
	isReadonly?: boolean;
	canClear?: boolean;
	position?: () => void;
	menuClassNameWrap?: string;
};

export interface CalendarSelectRefProps {
	getValue: () => number;
	setValue: (v: number) => void;
};

const CalendarSelect = observer(forwardRef<CalendarSelectRefProps, Props>((props, ref) => {

	const { value, onChange, isReadonly, canClear = true, position, menuClassNameWrap } = props;

	const [ displayValue, setDisplayValue ] = useState(value || U.Date.now());
	const monthRef = useRef(null);
	const yearRef = useRef(null);

	const { m, y } = U.Date.getCalendarDateParam(displayValue);
	const selectedParam = value ? U.Date.getCalendarDateParam(value) : null;
	const todayParam = U.Date.getCalendarDateParam(U.Date.now());
	const days = U.Date.getWeekDays();
	const data = U.Date.getCalendarMonth(displayValue);

	const months: I.Option[] = [];
	const years: I.Option[] = [];

	for (let i = 1; i <= 12; ++i) {
		months.push({ id: String(i), name: translate(`month${i}`) });
	};

	for (let i = 0; i <= 3000; ++i) {
		years.push({ id: String(i), name: String(i) });
	};

	useEffect(() => {
		position?.();
	}, []);

	useEffect(() => {
		monthRef.current?.setValue(m);
		yearRef.current?.setValue(y);
	}, [ displayValue ]);

	useEffect(() => {
		if (value) {
			setDisplayValue(value);
		};
	}, [ value ]);

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
		position?.();
	};

	const onClick = (item: any): void => {
		if (isReadonly || !item) {
			return;
		};

		const ts = U.Date.timestamp(item.y, item.m, item.d);
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

	const compare = (a: any, b: any): boolean => {
		return a && b && (a.d == b.d) && (a.m == b.m) && (a.y == b.y);
	};

	useImperativeHandle(ref, () => ({
		getValue: () => value,
		setValue: (v: number) => {
			setDisplayValue(v || U.Date.now());
			onChange(v);
		},
	}));

	return (
		<div className="calendarSelect">
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
					if (compare(selectedParam, item)) {
						cn.push('active');
					};
					if (compare(todayParam, item)) {
						cn.push('isToday');
					};

					return (
						<div
							key={i}
							id={[ 'day', item.d, item.m, item.y ].join('-')}
							className={cn.join(' ')}
							onClick={() => onClick(item)}
						>
							<div className="inner">{item.d}</div>
						</div>
					);
				})}
			</div>

			{!isReadonly ? (
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
