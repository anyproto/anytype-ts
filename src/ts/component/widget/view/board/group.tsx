import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, UtilCommon, translate, Dataview, UtilObject, UtilData } from 'Lib';
import { dbStore, detailStore } from 'Store';
import Cell from 'Component/block/dataview/cell';
import Item from './item';

const Constant = require('json/constant.json');

interface Props extends I.WidgetViewComponent {
	id: string;
	value: any;
};

const Group = observer(class Group extends React.Component<Props> {

	node: any = null;
	cache: any = {};
	width = 0;
	columnWidth = 0;
	columnCount = 0;
	offset = 0;

	constructor (props: Props) {
		super(props);

	};

	render () {
		const { rootId, block, id, getView, value } = this.props;
		const view = getView();
		const subId = this.getSubId();
		const items = this.getItems();
		const head = {};

		head[view.groupRelationKey] = value;

		// Subscriptions
		items.forEach((item: any) => {
			const object = detailStore.get(subId, item.id, [ view.groupRelationKey ]);
		});

		return (
			<div 
				ref={node => this.node = node} 
				className="group"
			>
				<div className="clickable">
					<Icon className="arrow" />
					<Cell 
						id={`board-head-${id}`} 
						rootId={rootId}
						subId={subId}
						block={Constant.blockId.dataview}
						relationKey={view.groupRelationKey} 
						viewType={I.ViewType.Board}
						getRecord={() => head}
						readonly={true} 
						arrayLimit={2}
						withName={true}
						placeholder={translate('commonUncategorized')}
					/>
				</div>
				<div className="items">
					{items.map((item: any, index: number) => (
						<Item 
							{...this.props}
							key={item.id} 
							subId={subId}
							id={item.id} 
						/>
					))}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.load();
	};

	componentWillUnmount () {
		this.clear();
	};

	load () {
		const { id, getView, getObject, getViewLimit, value } = this.props;
		const subId = this.getSubId(); 
		const object = getObject();
		const view = getView();
		const isCollection = object.layout == I.ObjectLayout.Collection;

		if (!view || !object) {
			return;
		};

		const relation = dbStore.getRelationByKey(view.groupRelationKey);
		if (!relation) {
			return;
		};

		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.excludeFromSet() },
			Dataview.getGroupFilter(relation, value),
		].concat(view.filters);
		const sorts: I.Sort[] = [].concat(view.sorts);
		const limit = getViewLimit();

		UtilData.searchSubscribe({
			subId,
			filters: filters.map(it => Dataview.filterMapper(view, it)),
			sorts: sorts.map(it => Dataview.filterMapper(view, it)),
			keys: Constant.sidebarRelationKeys,
			sources: object.setOf || [],
			limit,
			ignoreHidden: true,
			ignoreDeleted: true,
			collectionId: (isCollection ? object.id : ''),
		}, () => {
			dbStore.recordsSet(subId, '', this.applyObjectOrder(id, dbStore.getRecordIds(subId, '')));
		});
	};

	clear () {
		dbStore.recordsClear(this.getSubId(), '');
	};

	getSubId () {
		const { rootId, id } = this.props;

		return dbStore.getGroupSubId(rootId, Constant.blockId.dataview, id);
	};

	getItems () {
		const { id } = this.props;
		const subId = this.getSubId();
		const records = UtilCommon.objectCopy(dbStore.getRecordIds(subId, ''));

		return this.applyObjectOrder(id, records).map(id => ({ id }));
	};

	applyObjectOrder (groupId: string, ids: string[]): any[] {
		const { rootId, parent } = this.props;

		return Dataview.applyObjectOrder(rootId, Constant.blockId.dataview, parent.content.viewId, groupId, ids);
	};


});

export default Group;