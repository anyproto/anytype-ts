import * as React from 'react';
import { observer } from 'mobx-react';
import { Select } from 'Component';
import { I, UtilData, UtilCommon, UtilDate, translate } from 'Lib';
import { dbStore } from 'Store';
import Item from './calendar/item';
import Constant from 'json/constant.json';

interface State {
	value: number;
};

const PADDING = 46;

const ViewCalendar = observer(class ViewCalendar extends React.Component<I.ViewComponent, State> {

	node: any = null;
	ref = null;
	state = {
		value: UtilDate.now(),
	};

	constructor (props: I.ViewComponent) {
		super (props);
	};

	render () {
		const { className } = this.props;
		const { value } = this.state;
		const cn = [ 'viewContent', className ];
		const data = this.getData();
		const { m, y } = this.getDateParam(value);
		const today = this.getDateParam(UtilDate.now());
		const subId = this.getSubId(m, y);

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
			<div 
				ref={node => this.node = node} 
				className="wrap"
			>
				<div className={cn.join(' ')}>
					<div id="dateSelect" className="dateSelect">
						<Select 
							id="calendar-month" 
							value={m} 
							options={months} 
							className="month" 
							onChange={m => this.setValue(UtilDate.timestamp(y, m, 1))} 
						/>
						<Select 
							id="calendar-year" 
							value={y} 
							options={years} 
							className="year" 
							onChange={y => this.setValue(UtilDate.timestamp(y, m, 1))} 
						/>
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
								const cn = [ 'day' ];
								if (m != item.m) {
									cn.push('other');
								};
								if ((today.d == item.d) && (today.m == item.m) && (today.y == item.y)) {
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
		return UtilDate.getCalendarMonth(this.state.value);
	};

	getSubId (m: number, y: number) {
		const { rootId, block } = this.props;
		return [ rootId, block.id, y, m ].join('-');
	};

	load () {
		const { isCollection, getView, getKeys, getTarget, getSearchIds } = this.props;
		const { value } = this.state;
		const object = getTarget();
		const view = getView();
		const relation = dbStore.getRelationByKey(view.groupRelationKey);
		
		if (!relation || !view) {
			return;
		};

		const { m, y } = this.getDateParam(value);
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

	setValue (value: number) {
		this.setState({ value });
	};

	resize () {
		const { isPopup, isInline } = this.props;

		if (isInline) {
			return;
		};

		const node = $(this.node);

		node.css({ width: 0, height: 0, marginLeft: 0 });

		const container = UtilCommon.getPageContainer(isPopup);
		const cw = container.width();
		const ch = container.height();
		const mw = cw - PADDING * 2;
		const margin = (cw - mw) / 2;
		const { top } = node.offset();

		node.css({ width: cw, height: ch - top - 90, marginLeft: -margin - 2 });
	};

});

export default ViewCalendar;