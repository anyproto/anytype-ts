import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Loader, LoadMore } from 'Component';
import { I, translate, keyboard, Relation, DataUtil } from 'Lib';
import { observer } from 'mobx-react';
import { dbStore, detailStore, menuStore, commonStore } from 'Store';

import Card from './card';
import Cell from 'Component/block/dataview/cell';

interface Props extends I.ViewComponent {
	id: string;
	value: any;
	onRecordAdd (groupId: string, dir: number): void;
	onDragStartColumn?: (e: any, groupId: string) => void;
	onDragStartCard?: (e: any, groupId: string, record: any) => void;
	getSubId?: () => string;
	applyObjectOrder?: () => void;
};

interface State {
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const Column = observer(class Column extends React.Component<Props, State> {

	cache: any = {};
	width: number = 0;
	columnWidth: number = 0;
	columnCount: number = 0;
	offset: number = 0;
	loading: boolean = false;
	state = {
		loading: false,
	};

	constructor(props: Props) {
		super(props);

		this.onLoadMore = this.onLoadMore.bind(this);
		this.onMore = this.onMore.bind(this);
	};

	render () {
		const { rootId, block, id, getSubId, getView, getLimit, onRecordAdd, value, onDragStartColumn } = this.props;
		const { loading } = this.state;
		const view = getView();
		const subId = getSubId();
		const records = dbStore.getRecords(subId, '');
		const items = this.getItems();
		const { offset, total } = dbStore.getMeta(subId, '');
		const limit = getLimit();
		const group = dbStore.getGroup(rootId, block.id, id);
		const head = {};
		const cn = [ 'column' ];
		const cnbg = [];
		
		if (view.groupBackgroundColors) {
			cn.push('withColor');
			cnbg.push('bgColor bgColor-' + (group.bgColor || 'grey'));
		};

		head[view.groupRelationKey] = value;

		// Subscriptions
		records.forEach((id: string) => {
			const object = detailStore.get(subId, id, [ view.groupRelationKey ]);
		});

		return (
			<div 
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
								placeholder={translate('commonEmpty')}
							/>
						</div>

						<div className="side right">
							<Icon id={`button-${id}-more`} className="more" onClick={this.onMore} />
							<Icon className="add"  onClick={() => { onRecordAdd(id, -1); }} />
						</div>
					</div>

					<div className={cnbg.join(' ')} />
				</div>

				<div className="body">
					<div className="bg">
						{loading ? <Loader / > : (
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

								{limit + this.offset < total ? <LoadMore limit={limit} onClick={this.onLoadMore} /> : ''}

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
		if (this.loading) {
			return;
		};

		const { rootId, block, getView, getKeys, getSubId, applyObjectOrder, getLimit } = this.props;
		const view = getView();
		const relation = dbStore.getRelationByKey(view.groupRelationKey);
		const subId = getSubId();
		const limit = getLimit() + this.offset;

		if (!relation) {
			return;
		};

		const filters: I.Filter[] = view.filters.concat([
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
		]);

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

		this.loading = true;

		DataUtil.searchSubscribe({
			subId,
			filters,
			sorts: view.sorts,
			keys: getKeys(view.id),
			sources: block.content.sources,
			limit,
		}, () => {
			applyObjectOrder();

			if (clear) {
				this.setState({ loading: false });
			};

			this.loading = false;
		});
	};

	clear () {
		const { getSubId } = this.props;
		dbStore.recordsClear(getSubId(), '');
	};

	getItems () {
		const { getSubId } = this.props;
		return dbStore.getRecords(getSubId(), '').map(id => { return { id }; });
	};

	onLoadMore (e: any) {
		const { getLimit } = this.props;

		this.offset += getLimit();
		this.load(false);
	};

	onMore (e: any) {
		const { rootId, block, id, getView } = this.props;
		const node = $(ReactDOM.findDOMNode(this));

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