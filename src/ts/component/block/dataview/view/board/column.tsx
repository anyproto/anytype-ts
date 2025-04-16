import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, LoadMore, Cell } from 'Component';
import { I, S, U, translate, Dataview } from 'Lib';
import Card from './card';

interface Props extends I.ViewComponent {
	id: string;
	value: any;
	onDragStartColumn?: (e: any, groupId: string) => void;
	onDragStartCard?: (e: any, groupId: string, record: any) => void;
	getSubId?: () => string;
	recordIdx?: number;
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
		this.getCoverObject = this.getCoverObject.bind(this);
	};

	render () {
		const { rootId, block, id, getSubId, getView, getLimit, value, onDragStartColumn, getTarget } = this.props;
		const view = getView();
		const { coverRelationKey, hideIcon } = view;
		const target = getTarget();
		const subId = getSubId();
		const items = this.getItems();
		const { total } = S.Record.getMeta(subId, '');
		const limit = getLimit();
		const head = {};
		const cn = [ 'column' ];
		const cnbg = [];
		const group = S.Record.getGroup(rootId, block.id, id);
		const order = (block.content.groupOrder || []).find(it => it.viewId == view.id);
		const orderGroup = (order?.groups || []).find(it => it.groupId == id) || {};
		const isAllowedObject = this.props.isAllowedObject();
		const tooltip = Dataview.getCreateTooltip(rootId, block.id, target.id, view.id);

		if (view.groupBackgroundColors) {
			cn.push('withColor');
			cnbg.push('bgColor bgColor-' + (orderGroup.bgColor || group.bgColor || 'grey'));
		};

		head[view.groupRelationKey] = value;

		// Subscriptions
		items.forEach((item: any) => {
			const object = S.Detail.get(subId, item.id, [ view.groupRelationKey ]);
		});

		return (
			<div 
				ref={node => this.node = node} 
				id={`column-${id}`} 
				className={cn.join(' ')}
				{...U.Common.dataProps({ id })}
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
								id={`board-head-${id}`} 
								rootId={rootId}
								subId={subId}
								block={block}
								relationKey={view.groupRelationKey} 
								viewType={I.ViewType.Board}
								getRecord={() => head}
								readonly={true} 
								arrayLimit={4}
								withName={true}
								placeholder={translate('commonUncategorized')}
							/>
						</div>

						<div className="side right">
							<Icon id={`button-${id}-more`} className="more" tooltipParam={{ text: translate('blockDataviewBoardColumnSettings') }} onClick={this.onMore} />
							{isAllowedObject ? <Icon className="add" tooltipParam={{ text: tooltip }} onClick={e => this.onAdd(e, -1)} /> : ''}
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
								getRecord={() => item}
								getCoverObject={this.getCoverObject}
								recordIdx={i}
							/>
						))}

						{limit + this.offset < total ? (
							<LoadMore limit={limit} loaded={items.length} total={total} onClick={this.onLoadMore} />
						): ''}

						{isAllowedObject ? (
							<div id={`record-${id}-add`} className="card add" onClick={e => this.onAdd(e, 1)}>
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

	load (clear: boolean) {
		const { id, block, isCollection, value, getView, getKeys, getSubId, applyObjectOrder, getLimit, getTarget, getSearchIds } = this.props;
		const object = getTarget();
		const view = getView();
		if (!view) {
			return;
		};

		const relation = S.Record.getRelationByKey(view.groupRelationKey);
		if (!relation) {
			return;
		};

		const el = block.content.objectOrder.find(it => (it.viewId == view.id) && (it.groupId == id));
		const objectIds = el ? el.objectIds || [] : [];
		const subId = getSubId();
		const limit = getLimit() + this.offset;
		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
			Dataview.getGroupFilter(relation, value),
		].concat(view.filters as any[]);
		const sorts: I.Sort[] = [].concat(view.sorts);
		const searchIds = getSearchIds();

		if (objectIds.length) {
			sorts.unshift({ relationKey: '', type: I.SortType.Custom, customOrder: objectIds });
		};

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		if (clear) {
			this.clear();
			this.setState({ loading: true });
		};

		U.Data.searchSubscribe({
			subId,
			filters: filters.map(it => Dataview.filterMapper(view, it)),
			sorts: sorts.map(it => Dataview.filterMapper(view, it)),
			keys: getKeys(view.id),
			sources: object.setOf || [],
			limit,
			ignoreHidden: true,
			ignoreDeleted: true,
			collectionId: (isCollection ? object.id : ''),
		}, () => {
			S.Record.recordsSet(subId, '', applyObjectOrder(id, S.Record.getRecordIds(subId, '')));

			if (clear) {
				this.setState({ loading: false });
			};
		});
	};

	clear () {
		S.Record.recordsClear(this.props.getSubId(), '');
	};

	getItems () {
		const { id, getSubId, applyObjectOrder } = this.props;

		return applyObjectOrder(id, U.Common.objectCopy(S.Record.getRecordIds(getSubId(), ''))).map(id => ({ id }));
	};

	getCoverObject (id: string): any {
		const { getView, getKeys, getSubId } = this.props;
		const view = getView();

		if (!view.coverRelationKey) {
			return null;
		};

		const subId = getSubId();
		const record = S.Detail.get(subId, id, getKeys(view.id));

		return Dataview.getCoverObject(subId, record, view.coverRelationKey);
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
		const element = `#button-${id}-more`;

		S.Menu.open('dataviewGroupEdit', {
			element,
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
			onOpen: () => {
				$(element).addClass('active');
				node.addClass('active');
			},
			onClose: () => {
				$(element).removeClass('active');
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
