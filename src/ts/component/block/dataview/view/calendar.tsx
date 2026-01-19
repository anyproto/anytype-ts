import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Select, Icon } from 'Component';
import { I, S, U, translate, Dataview, J, C, analytics } from 'Lib';
import Item from './calendar/item';

const PADDING = 16;

const ViewCalendar = observer(forwardRef<I.ViewRef, I.ViewComponent>((props, ref) => {

	const { rootId, block, isCollection, className, isInline, isPopup, getView, getTypeId, getTemplateId, getTarget } = props;
	const view = getView();
	const [ value, setValue ] = useState(U.Date.now());
	const nodeRef = useRef(null);
	const yearRef = useRef(null);
	const monthRef = useRef(null);
	const daysRef = useRef({});
	const scrollRef = useRef(false);
	const cn = [ 'viewContent', className ];
	const data = U.Date.getCalendarMonth(value);
	const days = U.Date.getWeekDays();
	const months = U.Date.getMonths();
	const years = U.Date.getYears(0, 3000);

	let { m, y } = U.Date.getDateParam(value);

	const load = () => {
		for (const key in daysRef.current) {
			daysRef.current[key]?.load();
		};
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

	const onToday = () => {
		scrollRef.current = true;
		setValue(U.Date.now());
	};

	const onCreate = (details: any) => {
		const objectId = getTarget().id;
		const flags: I.ObjectFlag[] = [ I.ObjectFlag.SelectTemplate ];
		const type = S.Record.getTypeById(getTypeId());
		const templateId = getTemplateId();

		details = Object.assign(Dataview.getDetails(rootId, block.id, objectId, view.id), details);

		C.ObjectCreate(details, flags, templateId, type?.uniqueKey, S.Common.space, (message: any) => {
			if (message.error.code) {
				return;
			};

			const object = message.details;

			if (isCollection) {
				C.ObjectCollectionAdd(objectId, [ object.id ]);
			};

			U.Object.openConfig(null, object);
			analytics.createObject(object.type, object.layout, analytics.route.calendar, message.middleTime);
		});
	};

	const scrollToday = () => {
		const node = $(nodeRef.current);
		const el = node.find('.day.active');

		if (!el.length) {
			return;
		};

		const scroll = node.find('.body');
		const st = scroll.scrollTop();
		const ch = scroll.height();
		const pt = el.position().top;
		const eh = el.outerHeight();
		const top = Math.max(0, st + pt + eh - ch);

		scroll.scrollTop(top);
	};

	const resize = () => {
		if (isInline) {
			return;
		};

		const win = $(window);
		const node = $(nodeRef.current);
		const wrap = node.find('.wrap');
		const container = U.Common.getPageContainer(isPopup);
		const mw = container.width() - PADDING * 2;
		const day = node.find('.day').first();
		const menu = S.Menu.get('calendarDay');

		wrap.css({ width: mw, marginLeft: -J.Size.blockMenu + PADDING });
		win.trigger('resize.menuCalendarDay');

		if (menu && !menu.param.data.fromWidget && day.length) {
			S.Menu.update('calendarDay', { width: day.outerWidth() + 8 });
		};
	};

	useEffect(() => {
		monthRef.current?.setValue(m);
		yearRef.current.setValue(y);

		if (scrollRef.current) {
			scrollToday();
			scrollRef.current = false;
		};
	}, [ value ]);

	useImperativeHandle(ref, () => ({
		load,
		resize,
	}));

	return (
		<div ref={nodeRef}>
			<div id="dateSelect" className="dateSelect">
				<div className="side left">
					<Select 
						ref={monthRef}
						id={`block-${block.id}-calendar-month`}
						value={m} 
						options={months} 
						className="month" 
						onChange={m => setValue(U.Date.timestamp(y, m, 1))} 
					/>
					<Select 
						ref={yearRef}
						id={`block-${block.id}-calendar-year`}
						value={y} 
						options={years} 
						className="year" 
						onChange={y => setValue(U.Date.timestamp(y, m, 1))} 
					/>
				</div>

				<div className="side right">
					<Icon className="arrow left" onClick={() => onArrow(-1)} />
					<div className="btn" onClick={onToday}>{translate('commonToday')}</div>
					<Icon className="arrow right" onClick={() => onArrow(1)} />
				</div>
			</div>

			<div className="wrap">
				<div className={cn.join(' ')}>
					<div className="table">
						<div className="head">
							{days.map((item, i) => (
								<div key={i} className={`item c${i}`}>
									{item.name.substring(0, 2)}
								</div>
							))}
						</div>

						<div className="body">
							{data.map((item, i) => {
								const cn = [ `c${item.wd}` ];
								const current = [ item.d, item.m, item.y ].join('-');

								let isToday = false;

								if (m != item.m) {
									cn.push('other');
								};
								if (item.isToday) {
									cn.push('active');
									isToday = true;
								};
								if (item.isWeekend) {
									cn.push('weekend');
								};
								if (i < 7) {
									cn.push('first');
								};

								return (
									<Item 
										ref={ref => daysRef.current[current] = ref}
										key={current}
										{...props} 
										{...item} 
										isToday={isToday}
										className={cn.join(' ')}
										onCreate={onCreate}
									/>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);

}));

export default ViewCalendar;