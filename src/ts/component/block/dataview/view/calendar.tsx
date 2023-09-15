import * as React from 'react';
import { observer } from 'mobx-react';
import { dbStore } from 'Store';
import { I, UtilData, UtilCommon, UtilCalendar } from 'Lib';
import Item from './calendar/item';

const ViewCalendar = observer(class ViewCalendar extends React.Component<I.ViewComponent> {

	node: any = null;
	ref = null;

	constructor (props: I.ViewComponent) {
		super (props);


	};

	render () {
		const { rootId, block, className, isPopup, isInline, getView, onRecordAdd, getLimit, getEmpty, getRecords } = this.props;
		const cn = [ 'viewContent', className ];
		const data = this.getData();

		const value = UtilCommon.time();
		const d = Number(UtilCommon.date('j', value));
		const m = Number(UtilCommon.date('n', value));
		const y = Number(UtilCommon.date('Y', value));

		return (
			<div 
				ref={node => this.node = node} 
				className="wrap"
			>
				<div className={cn.join(' ')}>
					<div className="table">
						{data.map((item, i) => {
							const cn = [ 'day' ];
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
									getSubId={() => this.getSubId(item.d, item.m, item.y)}
								/>
							);
						})}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		const data = this.getData();
		for (const item of data) {
			this.load(item.d, item.m, item.y);
		};
	};

	getData () {
		return UtilCalendar.getData(UtilCommon.time());
	};

	getSubId (d: number, m: number, y: number) {
		const { rootId, block } = this.props;
		return [ rootId, block.id, y, m, d ].join('-');
	};

	load (d: number, m: number, y: number) {
		const { isCollection, getView, getKeys, getTarget, getSearchIds } = this.props;
		const object = getTarget();
		const view = getView();
		const relation = dbStore.getRelationByKey(view.groupRelationKey);
		
		if (!relation || !view) {
			return;
		};

		const value = UtilCommon.timestamp(y, m, d);
		const limit = 10;
		const filters: I.Filter[] = [].concat(view.filters);
		const sorts: I.Sort[] = [].concat(view.sorts);
		const searchIds = getSearchIds();
		const subId = this.getSubId(d, m, y);

		filters.push({ 
			operator: I.FilterOperator.And, 
			relationKey: relation.relationKey, 
			condition: I.FilterCondition.Equal, 
			value, 
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
		}, () => {
		});

	};

});

export default ViewCalendar;