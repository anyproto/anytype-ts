import * as React from 'react';
import { observer } from 'mobx-react';
import { Select, Icon } from 'Component';
import { I, S, U, translate, Dataview, J, C, analytics } from 'Lib';
import Item from './calendar/item';

interface State {
	value: number;
};

const PADDING = 46;

const ViewCalendar = observer(class ViewCalendar extends React.Component<I.ViewComponent, State> {

	node: any = null;
	refMonth = null;
	refYear = null;
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
		const data = this.getData();
		const { m, y } = this.getDateParam(value);
		const days = U.Date.getWeekDays();
		const months = U.Date.getMonths();
		const years = U.Date.getYears(0, 3000);
		const items = this.getItems();

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
											key={i}
											{...this.props} 
											{...item} 
											isToday={isToday}
											className={cn.join(' ')}
											items={items.filter(it => it._date == current)}
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
		this.load();
	};

	componentDidUpdate (): void {
		this.init();

		if (this.scroll) {
			this.scrollToday();
			this.scroll = false;
		};
	};

	init () {
		const { m, y } = this.getDateParam(this.state.value);

		this.refMonth?.setValue(m);
		this.refYear?.setValue(y);
	};

	getDateParam (t: number) {
		const [ d, m, y ] = U.Date.date('j,n,Y', t).split(',').map(it => Number(it));
		return { d, m, y };
	};

	getData () {
		return U.Date.getCalendarMonth(this.state.value);
	};

	load () {
		const { isCollection, getView, getKeys, getTarget, getSearchIds, getSubId } = this.props;
		const object = getTarget();
		const view = getView();
		if (!view) {
			return;
		};

		const relation = S.Record.getRelationByKey(view.groupRelationKey);
		if (!relation) {
			return;
		};

		const data = this.getData();
		if (!data.length) {
			return;
		};

		const first = data[0];
		const last = data[data.length - 1];
		const start = U.Date.timestamp(first.y, first.m, first.d, 0, 0, 0);
		const end = U.Date.timestamp(last.y, last.m, last.d, 23, 59, 59);
		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
		].concat(view.filters as any[]);
		const sorts: I.Sort[] = [].concat(view.sorts);
		const searchIds = getSearchIds();
		const subId = getSubId();

		filters.push({ 
			relationKey: relation.relationKey, 
			condition: I.FilterCondition.GreaterOrEqual, 
			value: start, 
			quickOption: I.FilterQuickOption.ExactDate,
			format: relation.format,
		});

		filters.push({ 
			relationKey: relation.relationKey, 
			condition: I.FilterCondition.LessOrEqual, 
			value: end, 
			quickOption: I.FilterQuickOption.ExactDate,
			format: relation.format,
		});

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		U.Data.searchSubscribe({
			subId,
			filters: filters.map(it => Dataview.filterMapper(view, it)),
			sorts: sorts.map(it => Dataview.filterMapper(view, it)),
			keys: getKeys(view.id),
			sources: object.setOf || [],
			ignoreHidden: true,
			ignoreDeleted: true,
			collectionId: (isCollection ? object.id : ''),
		});
	};

	onArrow (dir: number) {
		let { m, y } = this.getDateParam(this.state.value);

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
		const today = this.getDateParam(U.Date.now());

		this.scroll = true;
		this.setValue(U.Date.timestamp(today.y, today.m, today.d));
	};

	onCreate (details: any) {
		const { rootId, isCollection, getView, getTypeId, getTemplateId, getTarget } = this.props;
		const view = getView();
		const objectId = getTarget().id;
		const flags: I.ObjectFlag[] = [ I.ObjectFlag.SelectTemplate ];
		const type = S.Record.getTypeById(getTypeId());
		const templateId = getTemplateId();

		details = Object.assign(Dataview.getDetails(rootId, J.Constant.blockId.dataview, objectId, view.id), details);

		C.ObjectCreate(details, flags, templateId, type?.uniqueKey, S.Common.space, true, (message: any) => {
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
		this.setState({ value }, () => this.load());
	};

	getItems () {
		const { getView, getSubId } = this.props;
		const view = getView();

		return S.Record.getRecords(getSubId(), [ view.groupRelationKey ]).map(it => {
			it._date = U.Date.date('j-n-Y', it[view.groupRelationKey]);
			return it;
		});
	};

	resize () {
		const { isPopup, isInline } = this.props;

		if (isInline) {
			return;
		};

		const win = $(window);
		const node = $(this.node);
		const wrap = node.find('.wrap');

		wrap.css({ width: 0, height: 0, marginLeft: 0 });

		const container = U.Common.getPageContainer(isPopup);
		const cw = container.width();
		const mw = cw - PADDING * 2;
		const margin = (cw - mw) / 2;
		const day = node.find('.day').first();
		const menu = S.Menu.get('calendarDay');

		wrap.css({ width: cw, marginLeft: -margin - 2 });
		win.trigger('resize.menuCalendarDay');

		if (menu && !menu.param.data.fromWidget && day.length) {
			S.Menu.update('calendarDay', { width: day.outerWidth() + 8 });
		};
	};

});

export default ViewCalendar;
