import * as React from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import arrayMove from 'array-move';
import { SortableContainer } from 'react-sortable-hoc';
import $ from 'jquery';
import { Icon } from 'Component';
import { dbStore, menuStore, blockStore } from 'Store';
import { I, C, UtilCommon, keyboard, analytics, Relation, translate } from 'Lib';
import Item from 'Component/menu/item/filter';
const Constant = require('json/constant.json');

const HEIGHT = 48;
const LIMIT = 20;

const MenuFilterList = observer(class MenuFilterList extends React.Component<I.Menu> {
	
	node: any = null;
	n = -1;
	top = 0;
	cache: any = {};
	refList: any = null;

	constructor (props: I.Menu) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param, getId, setHover } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();

		if (!view) {
			return null;
		};

		const subId = dbStore.getSubId(rootId, blockId);
		const isReadonly = this.isReadonly();
		const filterCnt = view.filters.length;
		const items = this.getItems();

		for (const filter of items) {
			const { relationKey, condition, value } = filter;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					<Item 
						key={item.id} 
						{...item} 
						subId={subId}
						index={param.index} 
						style={param.style} 
						readonly={isReadonly}
						onOver={e => this.onOver(e, item)}
						onClick={e => this.onClick(e, item)}
						onRemove={e => this.onRemove(e, item)}
					/>
				</CellMeasurer>
			);
		};
		
		const List = SortableContainer(() => (
			<div className="items">
				{!items.length ? (
					<div className="item empty">
						<div className="inner">{translate('menuDataviewFilterListEmpty')}</div>
					</div>
				) : (
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={() => {}}
						isRowLoaded={() => true}
						threshold={LIMIT}
					>
						{({ onRowsRendered }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<VList
										ref={ref => this.refList = ref}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={HEIGHT}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={LIMIT}
										onScroll={this.onScroll}
										scrollToAlignment="center"
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				)}
			</div>
		));
		
		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<List 
					axis="y" 
					lockAxis="y"
					lockToContainerEdges={true}
					transitionDuration={150}
					distance={10}
					onSortStart={this.onSortStart}
					onSortEnd={this.onSortEnd}
					useDragHandle={true}
					helperClass="isDragging"
					helperContainer={() => $(`#${getId()} .items`).get(0)}
				/>

				{!isReadonly ? (
					<div className="bottom">
						<div className="line" />
						<div 
							id="item-add" 
							className="item add" 
							onClick={this.onAdd}
							onMouseEnter={() => setHover({ id: 'add' })} 
							onMouseLeave={() => setHover()}
						>
							<Icon className="plus" />
							<div className="name">{translate('menuDataviewFilterNewFilter')}</div>
						</div>
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		const items = this.getItems();

		this.resize();
		this.rebind();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (items[i] || {}).id,
		});
	};

	componentDidUpdate () {
		this.resize();

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};

		this.props.setActive();
	};

	componentWillUnmount () {
		this.unbind();
		menuStore.closeAll(Constant.menuIds.cell);
	};

	rebind () {
		const { getId } = this.props;
		const obj = $(`#${getId()} .content`);

		obj.off('click').on('click', () => menuStore.closeAll(Constant.menuIds.cell));

		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onAdd (e: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, isInline, getTarget } = data;
		const view = getView();
		const relationOptions = this.getRelationOptions();
		const object = getTarget();

		if (!relationOptions.length) {
			return;
		};

		const obj = $(`#${getId()} .content`);
		const first = relationOptions[0];
		const conditions = Relation.filterConditionsByType(first.format);
		const condition = conditions.length ? conditions[0].id : I.FilterCondition.None;
		const newItem = { 
			relationKey: first.id, 
			operator: I.FilterOperator.And, 
			condition: condition as I.FilterCondition,
			value: Relation.formatValue(first, null, false),
		};

		C.BlockDataviewFilterAdd(rootId, blockId, view.id, newItem);

		obj.animate({ scrollTop: obj.get(0).scrollHeight }, 50);

		analytics.event('AddFilter', {
			condition: newItem.condition,
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});
	};

	onRemove (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, loadData, isInline, isCollection, getTarget } = data;
		const view = getView();
		const object = getTarget();

		C.BlockDataviewFilterRemove(rootId, blockId, view.id, [ item.id ], () => {
			loadData(view.id, 0);
		});

		menuStore.close('select');
		analytics.event('RemoveFilter', {
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const { rootId, blockId, loadData, getView } = data;
		const view = getView();

		menuStore.open('dataviewFilterValues', {
			element: `#${getId()} #item-${item.id}`,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			data: {
				...data,
				save: () => {
					C.BlockDataviewFilterReplace(rootId, blockId, view.id, item.id, view.getFilter(item.id), () => {
						loadData(view.id, 0);
					});
				},
				itemId: item.id,
			}
		});
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};
	
	onSortEnd (result: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, loadData, isInline, getTarget } = data;
		const view = getView();
		const object = getTarget();
		const { oldIndex, newIndex } = result;
		
		view.filters = arrayMove(view.filters as I.Filter[], oldIndex, newIndex);
		C.BlockDataviewFilterSort(rootId, blockId, view.id, view.filters.map(it => it.id), () => loadData(view.id, 0));

		keyboard.disableSelection(false);

		analytics.event('RepositionFilter', {
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();

		if (!view) {
			return [];
		};

		return UtilCommon.objectCopy(view.filters || []).map((it: any) => {
			return { 
				...it, 
				relation: dbStore.getRelationByKey(it.relationKey),
			};
		}).filter(it => it.relation);
	};

	getRelationOptions () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;

		return Relation.getFilterOptions(rootId, blockId, getView());
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = !this.isReadonly() ? 62 : 16;
		const height = Math.max(HEIGHT + offset, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height: height });
		position();
	};

	isReadonly () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, readonly } = data;
		const allowedView = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

		return readonly || !allowedView;
	};

});

export default MenuFilterList;