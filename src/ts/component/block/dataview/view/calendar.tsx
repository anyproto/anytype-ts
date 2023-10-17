import * as React from 'react';
import { observer } from 'mobx-react';
import { I, UtilData, UtilCommon, UtilDate, translate } from 'Lib';
import { dbStore, menuStore } from 'Store';
import Item from './calendar/item';
import Constant from 'json/constant.json';

const PADDING = 46;

const ViewCalendar = observer(class ViewCalendar extends React.Component<I.ViewComponent> {

	node: any = null;
	ref = null;

	constructor (props: I.ViewComponent) {
		super (props);
	};

	render () {
		const { className } = this.props;
		const cn = [ 'viewContent', className ];
		const data = this.getData();

		const value = UtilDate.now();
		const { d, m, y } = this.getDateParam(value);
		const subId = this.getSubId(m, y);

		const days = [];
		for (let i = 1; i <= 7; ++i) {
			days.push({ id: i, name: translate(`day${i}`) });
		};

		return (
			<div 
				ref={node => this.node = node} 
				className="wrap"
			>
				<div className={cn.join(' ')}>
					<div id="dateSelect" className="dateSelect">
						<div className="month">August</div>
						<div className="year">2023</div>
					</div>

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
								if ((d == item.d) && (m == item.m) && (y == item.y)) {
									cn.push('active');
								};
								return (
									<Item 
										key={i}
										{...this.props} 
										{...item} 
										className={cn.join(' ')}
										getSubId={() => subId}
										getDateParam={this.getDateParam}
									/>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		this.load();
	};

	getDateParam (t: number) {
		const d = Number(UtilDate.date('j', t));
		const m = Number(UtilDate.date('n', t));
		const y = Number(UtilDate.date('Y', t));

		return { d, m, y };
	};

	getData () {
		return UtilDate.getCalendarMonth(UtilDate.now());
	};

	getSubId (m: number, y: number) {
		const { rootId, block } = this.props;
		return [ rootId, block.id, y, m ].join('-');
	};

	load () {
		const { isCollection, getView, getKeys, getTarget, getSearchIds } = this.props;
		const object = getTarget();
		const view = getView();
		const relation = dbStore.getRelationByKey(view.groupRelationKey);
		
		if (!relation || !view) {
			return;
		};

		const { m, y } = this.getDateParam(UtilDate.now());
		const start = UtilDate.timestamp(y, m, 1, 0, 0, 0);
		const end = UtilDate.timestamp(y, m, Constant.monthDays[m] + (y % 4 === 0 ? 1 : 0), 23, 59, 59);
		const limit = 10;
		const filters: I.Filter[] = [].concat(view.filters);
		const sorts: I.Sort[] = [].concat(view.sorts);
		const searchIds = getSearchIds();
		const subId = this.getSubId(m, y);

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
			filters,
			sorts,
			keys: getKeys(view.id),
			sources: object.setOf || [],
			limit,
			ignoreHidden: true,
			ignoreDeleted: true,
			collectionId: (isCollection ? object.id : ''),
		});
	};

	resize () {
		const { isPopup, isInline } = this.props;

		if (isInline) {
			return;
		};

		const win = $(window);
		const node = $(this.node);

		node.css({ width: 0, height: 0, marginLeft: 0 });

		const container = UtilCommon.getPageContainer(isPopup);
		const cw = container.width();
		const ch = container.height();
		const mw = cw - PADDING * 2;
		const margin = (cw - mw) / 2;
		const { top } = node.offset();
		const day = node.find('.day').first();

		node.css({ width: cw, height: ch - top - 90, marginLeft: -margin - 2 });
		win.trigger('resize.menuDataviewCalendarDay');

		if (day.length) {
			menuStore.update('dataviewCalendarDay', { width: day.outerWidth() + 8 });
		};
	};

});

export default ViewCalendar;