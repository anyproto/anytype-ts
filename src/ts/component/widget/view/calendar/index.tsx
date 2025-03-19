import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Select, Icon } from 'Component';
import { I, S, U, J, translate } from 'Lib';

interface WidgetViewCalendarRefProps {
	getFilters: () => I.Filter[];
};

const WidgetViewCalendar = observer(forwardRef<WidgetViewCalendarRefProps, I.WidgetViewComponent>((props, ref: any) => {

	const [ value, setValue ] = useState(U.Date.now());
	const { rootId, block, canCreate, getView, reload, onCreate } = props;
	const monthRef = useRef(null);
	const yearRef = useRef(null);
	const view = getView();
	const { groupRelationKey } = view;
	const data = U.Date.getCalendarMonth(value);

	const getDateParam = (t: number) => {
		const [ d, m, y ] = U.Date.date('j,n,Y', t).split(',').map(it => Number(it));
		return { d, m, y };
	};

	let { m, y } = getDateParam(value);

	const getElementId = (d: number, m: number, y: number) => [ 'day', block.id, d, m, y ].join('-');

	const onContextMenu = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		S.Menu.open('select', {
			element: `#${getElementId(item.d, item.m, item.y)}`,
			offsetY: 4,
			noFlipY: true,
			data: {
				options: [ { id: 'open', icon: 'expand', name: translate('commonOpenObject') } ],
				onSelect: () => {
					U.Object.openDateByTimestamp(groupRelationKey, U.Date.timestamp(item.y, item.m, item.d), 'auto');
				}
			}
		});
	};

	const setSelectsValue = () => {
		monthRef.current.setValue(m);
		yearRef.current.setValue(y);
	};

	const onArrow = (dir: number) => {
		m += dir;
		if (m < 0) {
			m = 12;
			y--;
		};
		if (m > 12) {
			m = 1;
			y++;
		};

		setValue(U.Date.timestamp(y, m, 1));
	};

	const onClick = (d: number, m: number, y: number) => {
		const element = `#${getElementId(d, m, y)}`;

		S.Menu.closeAll([ 'calendarDay' ], () => {
			S.Menu.open('calendarDay', {
				element,
				className: 'fixed fromWidget',
				classNameWrap: 'fromSidebar',
				horizontal: I.MenuDirection.Center,
				noFlipX: true,
				onOpen: () => $(element).addClass('active'),
				onClose: () => $(element).removeClass('active'),
				data: {
					rootId,
					blockId: J.Constant.blockId.dataview,
					relationKey: view.groupRelationKey,
					d,
					m, 
					y,
					hideIcon: view.hideIcon,
					fromWidget: true,
					readonly: !canCreate,
					onCreate: () => {
						const details = {};
						details[view.groupRelationKey] = U.Date.timestamp(y, m, d, 12, 0, 0);

						onCreate({ details });
					}
				}
			});
		});
	};

	const getFilters = (): I.Filter[] => {
		const relation = S.Record.getRelationByKey(view.groupRelationKey);
		if (!relation) {
			return [];
		};

		const data = U.Date.getCalendarMonth(value);
		if (!data.length) {
			return;
		};

		const first = data[0];
		const last = data[data.length - 1];
		const start = U.Date.timestamp(first.y, first.m, first.d, 0, 0, 0);
		const end = U.Date.timestamp(last.y, last.m, last.d, 23, 59, 59);

		return [
			{ 
				relationKey: relation.relationKey, 
				condition: I.FilterCondition.GreaterOrEqual, 
				value: start, 
				quickOption: I.FilterQuickOption.ExactDate,
				format: relation.format,
			},
			{ 
				relationKey: relation.relationKey, 
				condition: I.FilterCondition.LessOrEqual, 
				value: end, 
				quickOption: I.FilterQuickOption.ExactDate,
				format: relation.format,
			}
		];
	};

	const getDotMap = (relationKey: string): Map<string, boolean> => {
		const data = U.Date.getCalendarMonth(value);
		const items = S.Record.getRecords(S.Record.getSubId(rootId, J.Constant.blockId.dataview), [ relationKey ]);
		const ret = new Map();

		data.forEach(it => {
			const current = [ it.d, it.m, it.y ].join('-');

			if (items.find(it => U.Date.date('j-n-Y', it[relationKey]) == current)) {
				ret.set(current, true);
			};
		});

		return ret;
	};

	useEffect(() => setSelectsValue(), []);
	useEffect(() => {
		setSelectsValue();
		reload();
	}, [ value ]);

	useImperativeHandle(ref, () => ({
		getFilters,
	}));

	const today = getDateParam(U.Date.now());
	const days = U.Date.getWeekDays();
	const months = U.Date.getMonths();
	const years = U.Date.getYears(0, 3000);
	const dotMap = getDotMap(groupRelationKey);

	return (
		<div className="body">
			<div id="dateSelect" className="dateSelect">
				<div className="side left">
					<Select 
						ref={monthRef}
						id={`widget-${block.id}-calendar-month`} 
						value={m} 
						options={months} 
						className="month" 
						onChange={m => setValue(U.Date.timestamp(y, m, 1))} 
					/>
					<Select 
						ref={yearRef}
						id={`widget-${block.id}-calendar-year`} 
						value={y} 
						options={years} 
						className="year" 
						onChange={y => setValue(U.Date.timestamp(y, m, 1))} 
					/>
				</div>

				<div className="side right">
					<Icon className="arrow left" onClick={() => onArrow(-1)} />
					<Icon className="arrow right" onClick={() => onArrow(1)} />
				</div>
			</div>

			<div className="table">
				<div className="tableHead">
					{days.map((item, i) => (
						<div key={i} className="item">
							<div className="inner">{item.name.substring(0, 2)}</div>
						</div>
					))}
				</div>

				<div className="tableBody">
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
						if (i < 7) {
							cn.push('first');
						};

						const check = dotMap.get([ item.d, item.m, item.y ].join('-'));
						return (
							<div 
								id={getElementId(item.d, item.m, item.y)}
								key={i}
								className={cn.join(' ')} 
								onClick={() => onClick(item.d, item.m, item.y)}
								onContextMenu={(e: any) => onContextMenu(e, item)}
							>
								<div className="inner">
									{item.d}
									{check ? <div className="bullet" /> : ''}
								</div>
							</div>	
						);
					})}
				</div>
			</div>
		</div>
	);

}));

export default WidgetViewCalendar;