import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { Icon, Loader, LoadMore } from 'Component';
import { I, translate, Relation, DataUtil, Util } from 'Lib';
import { dbStore, detailStore, menuStore } from 'Store';

import Card from './card';
import Cell from 'Component/block/dataview/cell';

interface Props extends I.ViewComponent {
	id: string;
	value: any;
	onRecordAdd (groupId: string, dir: number): void;
	onDragStartColumn?: (e: any, groupId: string) => void;
	onDragStartCard?: (e: any, groupId: string, record: any) => void;
	getSubId?: () => string;
	applyObjectOrder?: (groupId: string, records: any[]) => any[];
};

interface State {
	loading: boolean;
};

const Column = observer(class Column extends React.Component<Props, State> {

	node: any = null;
	cache: any = {};
	width: number = 0;
	columnWidth: number = 0;
	columnCount: number = 0;
	offset: number = 0;
	state = {
		loading: false,
	};

	constructor (props: Props) {
		super(props);

		this.onLoadMore = this.onLoadMore.bind(this);
		this.onMore = this.onMore.bind(this);
	};

	render () {
		const { rootId, block, id, getSubId, getView, getLimit, onRecordAdd, value, onDragStartColumn } = this.props;
		const { loading } = this.state;
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
				data-id={id}
			>
				<div className="head">
					<div className="sides">
						<div 
							className="side left"
							draggable={true}
							onDragStart={(e: any) => { onDragStartColumn(e, id); }}
						>
							<Cell 
								id={'board-head-' + id} 
								rootId={rootId}
								subId={subId}
								block={block}
								relationKey={view.groupRelationKey} 
								viewType={I.ViewType.Board}
								getRecord={() => { return head; }}
								readonly={true} 
								arrayLimit={4}
								withLabel={true}
								placeholder={translate('placeholderCellCommon')}
							/>
						</div>

						<div className="side right">
							<Icon id={`button-${id}-more`} className="more" tooltip="Column settings" onClick={this.onMore} />
							<Icon className="add" tooltip="Create new object" onClick={() => { onRecordAdd(id, -1); }} />
						</div>
					</div>

					<div className={cnbg.join(' ')} />
				</div>

				<div className="body">
					<div className="bg">
						{loading ? <Loader /> : (
							<React.Fragment>
								{items.map((item: any, i: number) => (
									<Card
										key={[ 'board', view.id, id, item.id ].join('-')}
										{...this.props}
										id={item.id}
										groupId={id}
										index={i}
									/>
								))}

								{limit + this.offset < total ? <LoadMore limit={limit} loaded={items.length} total={total} onClick={this.onLoadMore} /> : ''}

								<div id={`card-${id}-add`} className="card add" onClick={() => { onRecordAdd(id, 1); }}>
									<Icon className="plus" />
								</div>

							</React.Fragment>
						)}
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
		const { id, block, getView, getKeys, getSubId, applyObjectOrder, getLimit } = this.props;
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

		DataUtil.searchSubscribe({
			subId,
			filters,
			sorts,
			keys: getKeys(view.id),
			sources: block.content.sources,
			limit,
			ignoreHidden: true,
			ignoreDeleted: true,
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
		return applyObjectOrder(id, Util.objectCopy(dbStore.getRecords(getSubId(), ''))).map(id => { return { id }; });
	};

	onLoadMore (e: any) {
		const { getLimit } = this.props;

		this.offset += getLimit();
		this.load(false);
	};

	onMore (e: any) {
		const { rootId, block, id, getView } = this.props;
		const node = $(this.node);

		node.addClass('active');

		menuStore.open('dataviewGroupEdit', {
			element: `#button-${id}-more`,
			onClose: () => {
				node.removeClass('active');
			},
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