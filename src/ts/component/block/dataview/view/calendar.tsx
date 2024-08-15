import * as React from 'react';
import { observer } from 'mobx-react';
import { Select, Icon } from 'Component';
import { I, S, U, translate, Dataview } from 'Lib';
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
	};

	render () {
		const { block, className } = this.props;
		const { value } = this.state;
		const cn = [ 'viewContent', className ];
		const data = this.getData();
		const { m, y } = this.getDateParam(value);
		const today = this.getDateParam(U.Date.now());
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
									<div key={i} className="item">
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

	getSubId () {
		const { rootId, block } = this.props;
		return S.Record.getSubId(rootId, block.id);
	};

	load () {
		const { isCollection, getView, getKeys, getTarget, getSearchIds } = this.props;
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
			{ relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
		].concat(view.filters as any[]);
		const sorts: I.Sort[] = [].concat(view.sorts);
		const searchIds = getSearchIds();
		const subId = this.getSubId();

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
		const { getView } = this.props;
		const view = getView();

		return S.Record.getRecords(this.getSubId(), [ view.groupRelationKey ]);
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
		const ch = container.height();
		const mw = cw - PADDING * 2;
		const margin = (cw - mw) / 2;
		const { top } = node.offset();
		const day = node.find('.day').first();
		const menu = S.Menu.get('dataviewCalendarDay');

		wrap.css({ width: cw, height: Math.max(600, ch - top - 130), marginLeft: -margin - 2 });
		win.trigger('resize.menuDataviewCalendarDay');

		if (menu && !menu.param.data.fromWidget && day.length) {
			S.Menu.update('dataviewCalendarDay', { width: day.outerWidth() + 8 });
		};
	};

});

export default ViewCalendar;