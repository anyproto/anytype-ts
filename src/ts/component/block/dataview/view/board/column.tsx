import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, LoadMore } from 'Component';
import { I, Relation, UtilData, UtilCommon, translate } from 'Lib';
import { dbStore, detailStore, menuStore } from 'Store';
import Card from './card';
import Cell from 'Component/block/dataview/cell';

interface Props extends I.ViewComponent {
	id: string;
	value: any;
	onDragStartColumn?: (e: any, groupId: string) => void;
	onDragStartCard?: (e: any, groupId: string, record: any) => void;
	getSubId?: () => string;
};

const Column = observer(class Column extends React.Component<Props> {

	node: any = null;
	cache: any = {};
	width = 0;
	columnWidth = 0;
	columnCount = 0;
	offset = 0;

	constructor (props: Props) {
		super(props);

		this.onLoadMore = this.onLoadMore.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMore = this.onMore.bind(this);
	};

	render () {
		const { rootId, block, id, getSubId, getView, getLimit, value, onDragStartColumn } = this.props;
		const view = getView();
		const subId = getSubId();
		const items = this.getItems();
		const { total } = dbStore.getMeta(subId, '');
		const limit = getLimit();
		const head = {};
		const cn = [ 'column' ];
		const cnbg = [];
		const group = dbStore.getGroup(rootId, block.id, id);
		const order = (block.content.groupOrder || []).find(it => it.viewId == view.id);
		const orderGroup = (order?.groups || []).find(it => it.groupId == id) || {};
		const isAllowedObject = this.props.isAllowedObject();

		if (view.groupBackgroundColors) {
			cn.push('withColor');
			cnbg.push('bgColor bgColor-' + (orderGroup.bgColor || group.bgColor || 'grey'));
		};

		head[view.groupRelationKey] = value;

		// Subscriptions
		items.forEach((item: any) => {
			const object = detailStore.get(subId, item.id, [ view.groupRelationKey ]);
		});

		return (
			<div 
				ref={node => this.node = node} 
				id={'column-' + id} 
				className={cn.join(' ')}
				{...UtilCommon.dataProps({ id })}
			>
				<div id={`column-${id}-head`} className="head">
					<div className="sides">
						<div 
							className="side left"
							draggable={true}
							onDragStart={e => onDragStartColumn(e, id)}
							onClick={this.onMore}
						>
							<Cell 
								id={'board-head-' + id} 
								rootId={rootId}
								subId={subId}
								block={block}
								relationKey={view.groupRelationKey} 
								viewType={I.ViewType.Board}
								getRecord={() => head}
								recordId=""
								readonly={true} 
								arrayLimit={4}
								withLabel={true}
								placeholder={translate('commonUncategorized')}
							/>
						</div>

						<div className="side right">
							<Icon id={`button-${id}-more`} className="more" tooltip={translate('blockDataviewBoardColumnSettings')} onClick={this.onMore} />
							<Icon className="add" tooltip={translate('blockDataviewCreateNew')} onClick={(e) => this.onAdd(e, -1)} />
						</div>
					</div>

					<div className={cnbg.join(' ')} />
				</div>

				<div className="body">
					<div className="bg">
						{items.map((item: any, i: number) => (
							<Card
								key={[ 'board', view.id, id, item.id ].join('-')}
								{...this.props}
								id={item.id}
								groupId={id}
								recordId={item.id}
							/>
						))}

						{limit + this.offset < total ? <LoadMore limit={limit} loaded={items.length} total={total} onClick={this.onLoadMore} /> : ''}

						{isAllowedObject ? (
							<div id={`record-${id}-add`} className="card add" onClick={(e) => { this.onAdd(e, 1); }}>
								<Icon className="plus" />
							</div>
						) : ''}

						<div className={cnbg.join(' ')} />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.load(true);
	};

	componentWillUnmount () {
		this.clear();
	};

	load (clear: boolean) {
		const { id, block, getView, getKeys, getSubId, applyObjectOrder, getLimit, getTarget, isCollection } = this.props;
		const object = getTarget();
		const view = getView();
		const relation = dbStore.getRelationByKey(view.groupRelationKey);
		
		if (!relation || !view) {
			return;
		};

		const el = block.content.objectOrder.find(it => (it.viewId == view.id) && (it.groupId == id));
		const objectIds = el ? el.objectIds || [] : [];
		const subId = getSubId();
		const limit = getLimit() + this.offset;
		const filters: I.Filter[] = [].concat(view.filters);
		const sorts: I.Sort[] = [].concat(view.sorts);

		if (objectIds.length) {
			sorts.unshift({ relationKey: '', type: I.SortType.Custom, customOrder: objectIds });
		};

		let value = this.props.value;
		let filter: any = { operator: I.FilterOperator.And, relationKey: relation.relationKey };

		switch (relation.format) {
			default:
				filter.condition = I.FilterCondition.Equal;
				filter.value = value;
				break;

			case I.RelationType.Status:
				filter.condition = value ? I.FilterCondition.Equal : I.FilterCondition.Empty;
				filter.value = value ? value : null;
				break;

			case I.RelationType.Tag:
				value = Relation.getArrayValue(value);
				filter.condition = value.length ? I.FilterCondition.ExactIn : I.FilterCondition.Empty;
				filter.value = value.length ? value : null;
				break;
		};

		filters.push(filter);

		if (clear) {
			this.clear();
			this.setState({ loading: true });
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
			dbStore.recordsSet(subId, '', applyObjectOrder(id, dbStore.getRecords(subId, '')));

			if (clear) {
				this.setState({ loading: false });
			};
		});
	};

	clear () {
		const { getSubId } = this.props;
		dbStore.recordsClear(getSubId(), '');
	};

	getItems () {
		const { id, getSubId, applyObjectOrder } = this.props;

		return applyObjectOrder(id, UtilCommon.objectCopy(dbStore.getRecords(getSubId(), ''))).map(id => ({ id }));
	};

	onLoadMore () {
		const { getLimit } = this.props;

		this.offset += getLimit();
		this.load(false);
	};

	onAdd (e: any, dir: number) {
		e.preventDefault();
		e.stopPropagation();

		this.props.onRecordAdd(e, dir, this.props.id);
	};

	onMore (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { rootId, block, id, getView } = this.props;
		const node = $(this.node);

		node.addClass('active');

		menuStore.open('dataviewGroupEdit', {
			element: `#column-${id}-head`,
			horizontal: I.MenuDirection.Center,
			onClose: () => { node.removeClass('active'); },
			data: {
				rootId,
				blockId: block.id,
				groupId: id,
				getView,
			}
		});
	};

});

export default Column;
