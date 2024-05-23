import * as React from 'react';
import { observer } from 'mobx-react';
import { Select, Icon } from 'Component';
import { I, UtilData, UtilCommon, UtilDate, UtilObject, translate, Dataview } from 'Lib';
import { dbStore, menuStore, detailStore } from 'Store';
import Item from './calendar/item';
const Constant = require('json/constant.json');

const PADDING = 46;

const ViewCalendar = observer(class ViewCalendar extends React.Component<I.ViewComponent> {

	node: any = null;
	refMonth = null;
	refYear = null;
	value = UtilDate.now();
	scroll = false;

	constructor (props: I.ViewComponent) {
		super (props);

		this.onToday = this.onToday.bind(this);
	};

	render () {
		const { className } = this.props;
		const cn = [ 'viewContent', className ];
		const data = this.getData();
		const { m, y } = this.getDateParam(this.value);
		const today = this.getDateParam(UtilDate.now());

		const days = [];
		const months = [];
		const years = [];

		for (let i = 1; i <= 7; ++i) {
			days.push({ id: i, name: translate(`day${i}`) });
		};

		for (let i = 1; i <= 12; ++i) {
			months.push({ id: i, name: translate('month' + i) });
		};

		for (let i = 0; i <= 3000; ++i) {
			years.push({ id: i, name: i });
		};

		return (
			<div ref={node => this.node = node}>
				<div id="dateSelect" className="dateSelect">
					<div className="side left">
						<Select 
							ref={ref => this.refMonth = ref}
							id="calendar-month" 
							value={m} 
							options={months} 
							className="month" 
							onChange={m => this.setValue(UtilDate.timestamp(y, m, 1))} 
						/>
						<Select 
							ref={ref => this.refYear = ref}
							id="calendar-year" 
							value={y} 
							options={years} 
							className="year" 
							onChange={y => this.setValue(UtilDate.timestamp(y, m, 1))} 
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
									<div key={i} className="item th">
										{item.name.substring(0, 2)}
									</div>
								))}
							</div>

							<div className="body">
								{data.map((item, i) => {
									const cn = [];
									if (m != item.m) {
										cn.push('other');
									};
									if ((today.d == item.d) && (today.m == item.m) && (today.y == item.y)) {
										cn.push('active');
									};
									if (i < 7) {
										cn.push('first');
									};

									return (
										<Item 
											key={i}
											{...this.props} 
											{...item} 
											className={cn.join(' ')}
											items={this.getItems()}
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
		const { m, y } = this.getDateParam(this.value);

		this.refMonth?.setValue(m);
		this.refYear?.setValue(y);
	};

	getDateParam (t: number) {
		const [ d, m, y ] = UtilDate.date('j,n,Y', t).split(',').map(it => Number(it));
		return { d, m, y };
	};

	getData () {
		return UtilDate.getCalendarMonth(this.value);
	};

	getSubId () {
		const { rootId, block } = this.props;
		return dbStore.getSubId(rootId, block.id);
	};

	load () {
		const { isCollection, getView, getKeys, getTarget, getSearchIds } = this.props;
		const object = getTarget();
		const view = getView();
		const relation = dbStore.getRelationByKey(view.groupRelationKey);
		
		if (!relation || !view) {
			return;
		};

		const data = this.getData();
		if (!data.length) {
			return;
		};

		const first = data[0];
		const last = data[data.length - 1];
		const start = UtilDate.timestamp(first.y, first.m, first.d, 0, 0, 0);
		const end = UtilDate.timestamp(last.y, last.m, last.d, 23, 59, 59);
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.excludeFromSet() },
		].concat(view.filters);
		const sorts: I.Sort[] = [].concat(view.sorts);
		const searchIds = getSearchIds();
		const subId = this.getSubId();

		filters.push({ 
			operator: I.FilterOperator.And, 
			relationKey: relation.relationKey, 
			condition: I.FilterCondition.GreaterOrEqual, 
			value: start, 
			quickOption: I.FilterQuickOption.ExactDate,
			format: relation.format,
		});

		filters.push({ 
			operator: I.FilterOperator.And, 
			relationKey: relation.relationKey, 
			condition: I.FilterCondition.LessOrEqual, 
			value: end, 
			quickOption: I.FilterQuickOption.ExactDate,
			format: relation.format,
		});

		if (searchIds) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		UtilData.searchSubscribe({
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
		let { m, y } = this.getDateParam(this.value);

		m += dir;
		if (m < 0) {
			m = 12;
			y--;
		};
		if (m > 12) {
			m = 1;
			y++;
		};

		this.setValue(UtilDate.timestamp(y, m, 1));
	};

	onToday () {
		const today = this.getDateParam(UtilDate.now());

		this.scroll = true;
		this.setValue(UtilDate.timestamp(today.y, today.m, today.d));
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
		this.value = value;
		this.forceUpdate();
		this.load();
	};

	getItems () {
		const { getView } = this.props;
		const view = getView();

		return dbStore.getRecords(this.getSubId(), [ view.groupRelationKey ]);
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

		const container = UtilCommon.getPageContainer(isPopup);
		const cw = container.width();
		const ch = container.height();
		const mw = cw - PADDING * 2;
		const margin = (cw - mw) / 2;
		const { top } = node.offset();
		const day = node.find('.day').first();

		wrap.css({ width: cw, height: Math.max(600, ch - top - 130), marginLeft: -margin - 2 });
		win.trigger('resize.menuDataviewCalendarDay');

		if (day.length) {
			menuStore.update('dataviewCalendarDay', { width: day.outerWidth() + 8 });
		};
	};

});

export default ViewCalendar;