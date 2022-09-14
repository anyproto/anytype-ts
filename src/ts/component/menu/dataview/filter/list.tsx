import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer } from 'react-sortable-hoc';
import { Icon } from 'Component';
import { dbStore, menuStore, blockStore } from 'Store';
import { I, C, Util, keyboard, analytics, Relation } from 'Lib';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';

import Item from 'Component/menu/item/filter';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');
const $ = require('jquery');

const HEIGHT = 48;
const LIMIT = 20;

const MenuFilterList = observer(class MenuFilterList extends React.Component<Props, {}> {
	
	n: number = 0;
	top: number = 0;
	cache: any = {};
	refList: any = null;

	constructor (props: any) {
		super(props);
		
		this.save = this.save.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();
		const allowedView = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
		const subId = dbStore.getSubId(rootId, blockId);

		if (!view) {
			return null;
		};

		const filterCnt = view.filters.length;
		const items = this.getItems();

		for (let filter of items) {
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
					hasFixedWidth={() => {}}
				>
					<Item 
						key={item.id} 
						{...item} 
						subId={subId}
						index={param.index} 
						style={param.style} 
						readonly={!allowedView}
						onOver={(e: any) => { this.onOver(e, item); }}
						onClick={(e: any) => { this.onClick(e, item); }}
						onRemove={(e: any) => { this.onRemove(e, item); }}
					/>
				</CellMeasurer>
			);
		};
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{!items.length ? (
						<div className="item empty">
							<div className="inner">No filters applied to this view</div>
						</div>
					) : (
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={() => {}}
							isRowLoaded={() => { return true; }}
							threshold={LIMIT}
						>
							{({ onRowsRendered, registerChild }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<VList
											ref={(ref: any) => { this.refList = ref; }}
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
			);
		});
		
		return (
			<div className="wrap">
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
					helperContainer={() => { return $(ReactDOM.findDOMNode(this)).find('.items').get(0); }}
				/>
				{allowedView ? (
					<div className="bottom">
						<div className="line" />
						<div 
							id="item-add" 
							className="item add" 
							onClick={this.onAdd}
							onMouseEnter={() => { this.props.setHover({ id: 'add' }); }} 
							onMouseLeave={() => { this.props.setHover(); }}
						>
							<Icon className="plus" />
							<div className="name">Add a filter</div>
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
			keyMapper: (i: number) => { return (items[i] || {}).id; },
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

		obj.off('click').on('click', () => { menuStore.closeAll(Constant.menuIds.cell); });

		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onAdd (e: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();
		const relationOptions = this.getRelationOptions();

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

		view.filters.push(newItem);
		obj.animate({ scrollTop: obj.get(0).scrollHeight }, 50);

		analytics.event('AddFilter', { condition: newItem.condition });
		this.save();
	};

	onRemove (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();

		view.filters = view.filters.filter((it: any, i: number) => { return i != item.id; });
		this.save();

		menuStore.close('select');
		analytics.event('RemoveFilter');
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { param, getId } = this.props;
		const { data } = param;

		menuStore.open('dataviewFilterValues', {
			element: `#${getId()} #item-${item.id}`,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			data: {
				...data,
				save: this.save,
				itemId: item.id,
			}
		});
	};

	onSortStart () {
		const { dataset } = this.props;
		const { selection } = dataset;

		selection.preventSelect(true);
	};
	
	onSortEnd (result: any) {
		const { param, dataset } = this.props;
		const { selection } = dataset;
		const { data } = param;
		const { getView } = data;
		const view = getView();
		const { oldIndex, newIndex } = result;

		view.filters = arrayMove(view.filters, oldIndex, newIndex);
		this.save();

		selection.preventSelect(false);
		analytics.event('RepositionFilter');
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { getView, getData, rootId, blockId, onSave } = data;
		const view = getView();

		C.BlockDataviewViewUpdate(rootId, blockId, view.id, view, (message: any) => {
			if (onSave) {
				onSave(message);
			};
			window.setTimeout(() => { this.forceUpdate(); }, 50);

			getData(view.id, 0);
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

		let n = 0;
		return Util.objectCopy(view.filters || []).map((it: any) => {
			return { 
				...it, 
				id: n++,
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

	onScroll ({ clientHeight, scrollHeight, scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 62;
		const height = Math.max(HEIGHT + offset, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height: height });
		position();
	};

});

export default MenuFilterList;