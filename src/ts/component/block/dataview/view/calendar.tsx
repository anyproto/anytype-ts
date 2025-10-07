import * as React from 'react';
import { observer } from 'mobx-react';
import { Select, Icon } from 'Component';
import { I, S, U, translate, Dataview, J, C, analytics } from 'Lib';
import Item from './calendar/item';

interface State {
	value: number;
};

const PADDING = 16;

const ViewCalendar = observer(class ViewCalendar extends React.Component<I.ViewComponent, State> {

	node: any = null;
	refMonth = null;
	refYear = null;
	refDays = {};
	scroll = false;
	state = {
		value: U.Date.now(),
	};

	constructor (props: I.ViewComponent) {
		super (props);

		this.onToday = this.onToday.bind(this);
		this.onCreate = this.onCreate.bind(this);
	};

	render () {
		const { block, className } = this.props;
		const { value } = this.state;
		const cn = [ 'viewContent', className ];
		const data = U.Date.getCalendarMonth(value);
		const { m, y } = U.Date.getDateParam(value);
		const days = U.Date.getWeekDays();
		const months = U.Date.getMonths();
		const years = U.Date.getYears(0, 3000);

		return (
			<div ref={node => this.node = node}>
				<div id="dateSelect" className="dateSelect">
					<div className="side left">
						<Select 
							ref={ref => this.refMonth = ref}
							id={`block-${block.id}-calendar-month`}
							value={m} 
							options={months} 
							className="month" 
							onChange={m => this.setValue(U.Date.timestamp(y, m, 1))} 
						/>
						<Select 
							ref={ref => this.refYear = ref}
							id={`block-${block.id}-calendar-year`}
							value={y} 
							options={years} 
							className="year" 
							onChange={y => this.setValue(U.Date.timestamp(y, m, 1))} 
						/>
					</div>

					<div className="side right">
						<Icon className="arrow left" onClick={() => this.onArrow(-1)} />
						<div className="btn" onClick={this.onToday}>{translate('commonToday')}</div>
						<Icon className="arrow right" onClick={() => this.onArrow(1)} />
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
											ref={ref => this.refDays[current] = ref}
											key={current}
											{...this.props} 
											{...item} 
											isToday={isToday}
											className={cn.join(' ')}
											onCreate={this.onCreate}
										/>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		this.init();
	};

	componentDidUpdate (): void {
		this.init();

		if (this.scroll) {
			this.scrollToday();
			this.scroll = false;
		};
	};

	init () {
		const { m, y } = U.Date.getDateParam(this.state.value);

		this.refMonth?.setValue(m);
		this.refYear?.setValue(y);
	};

	load () {
		for (const key in this.refDays) {
			this.refDays[key]?.load();
		};
	};

	onArrow (dir: number) {
		let { m, y } = U.Date.getDateParam(this.state.value);

		m += dir;
		if (m < 0) {
			m = 12;
			y--;
		};
		if (m > 12) {
			m = 1;
			y++;
		};

		this.setValue(U.Date.timestamp(y, m, 1));
	};

	onToday () {
		const today = U.Date.getDateParam(U.Date.now());

		this.scroll = true;
		this.setValue(U.Date.timestamp(today.y, today.m, today.d));
	};

	onCreate (details: any) {
		const { rootId, block,isCollection, getView, getTypeId, getTemplateId, getTarget } = this.props;
		const view = getView();
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

			U.Object.openConfig(object);
			analytics.createObject(object.type, object.layout, analytics.route.calendar, message.middleTime);
		});
	};

	scrollToday () {
		const node = $(this.node);
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

	setValue (value: number) {
		this.setState({ value });
	};

	resize () {
		const { isPopup, isInline } = this.props;

		if (isInline) {
			return;
		};

		const win = $(window);
		const node = $(this.node);
		const wrap = node.find('.wrap');

		wrap.css({ width: 0, marginLeft: 0 });

		const container = U.Common.getPageContainer(isPopup);
		const cw = container.width();
		const mw = cw - PADDING * 2;
		const day = node.find('.day').first();
		const menu = S.Menu.get('calendarDay');

		wrap.css({ width: mw, marginLeft: -J.Size.blockMenu + PADDING });
		win.trigger('resize.menuCalendarDay');

		if (menu && !menu.param.data.fromWidget && day.length) {
			S.Menu.update('calendarDay', { width: day.outerWidth() + 8 });
		};
	};

});

export default ViewCalendar;
