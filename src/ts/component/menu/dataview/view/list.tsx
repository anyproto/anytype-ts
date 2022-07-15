import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon } from 'ts/component';
import { I, C, Util, keyboard } from 'ts/lib';
import { menuStore, dbStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import arrayMove from 'array-move';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';

interface Props extends I.Menu {};

const $ = require('jquery');
const HEIGHT_SECTION = 28;
const HEIGHT_ITEM = 40;
const LIMIT = 20;

const MenuViewList = observer(class MenuViewList extends React.Component<Props> {
	
	_isMounted: boolean = false;
	n: number = 0;
	top: number = 0;
	refList: any = null;
	cache: any = {};
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { getData, rootId, blockId } = data;
		const items = this.getItems();
		const allowed = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => (
			<div 
				id={'item-' + item.id} 
				className="item big" 
				onMouseEnter={(e: any) => { this.onOver(e, item); }}
				style={item.style}
			>
				{allowed ? <Handle /> : ''}
				<div className="clickable" onClick={(e: any) => { getData(item.id, 0); }}>
					<div className="name">{item.name}</div>
				</div>
				<div className="buttons">
					<Icon className="more" onClick={(e: any) => { this.onEdit(e, item); }} />
				</div>
			</div>
		));

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			let content = null;
			if (item.isSection) {
				content = <div className="sectionName" style={param.style}>{item.name}</div>;
			} else {
				content = <Item key={item.id} {...item} index={param.index} style={param.style} />;
			};

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					{content}
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
											rowHeight={({ index }) => {
												const item = items[index];
												return item.isSection ? HEIGHT_SECTION : HEIGHT_ITEM;
											}}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={LIMIT}
											onScroll={this.onScroll}
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
					transitionDuration={150}
					distance={10}
					useDragHandle={true}
					onSortStart={this.onSortStart}
					onSortEnd={this.onSortEnd}
					helperClass="isDragging"
					helperContainer={() => { return $(ReactDOM.findDOMNode(this)).find('.items').get(0); }}
				/>
				{allowed ? (
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
							<div className="name">Add a view</div>
						</div>
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		const items = this.getItems();

		this._isMounted = true;
		this.rebind();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		this.resize();
	};

	componentDidUpdate () {
		this.resize();

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};

		this.props.setActive(null, true);
	};

	componentWillUnmount () {
		this._isMounted = false;
		menuStore.closeAll([ 'dataviewViewEdit' ]);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const items: any[] = Util.objectCopy(dbStore.getViews(rootId, blockId));

		items.unshift({ id: 'label', name: 'Views', isSection: true });
		return items;
	};

	getValue (): any[] {
		const { param } = this.props;
		const { data } = param;

		let value = Util.objectCopy(data.value || []);
		if ('object' != typeof(value)) {
			value = value ? [ value ] : [];
		};
		value = value.filter((it: string) => { return it; });
		return value;
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onAdd () {
		const { param, getId } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();
		const relations = Util.objectCopy(view.relations);
		const filters: I.Filter[] = [];

		for (let relation of relations) {
			if (relation.isHidden || !relation.isVisible) {
				continue;
			};

			filters.push({
				relationKey: relation.relationKey,
				operator: I.FilterOperator.And,
				condition: I.FilterCondition.None,
				value: null,
			});
		};

		menuStore.open('dataviewViewEdit', {
			element: `#${getId()} #item-add`,
			horizontal: I.MenuDirection.Center,
			data: {
				...data,
				view: observable.box({ 
					type: I.ViewType.Grid,
					relations: relations,
					filters: filters,
				}),
				onSave: () => {
					this.forceUpdate();
				},
			},
		});
	};

	onEdit (e: any, item: any) {
		e.stopPropagation();

		const { param, getId } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const allowed = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

		menuStore.open('dataviewViewEdit', { 
			element: `#${getId()} #item-${item.id}`,
			horizontal: I.MenuDirection.Center,
			data: {
				...data,
				readonly: !allowed,
				view: observable.box(item),
				onSave: () => { this.forceUpdate(); },
			}
		});
	};

	onClick (e: any, item: any) {
		const { close } = this.props;

		close();
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
		const { rootId, blockId } = data;
		const { oldIndex, newIndex } = result;

		let views = dbStore.getViews(rootId, blockId);
		let view = views[oldIndex];
		let ids = arrayMove(views.map((it: any) => { return it.id; }), oldIndex, newIndex);

		dbStore.viewsSort(rootId, blockId, ids);
		C.BlockDataviewViewSetPosition(rootId, blockId, view.id, newIndex);

		selection.preventSelect(false);
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
		const offset = 50;
		const height = Math.max(HEIGHT_ITEM + offset, Math.min(360, items.length * HEIGHT_ITEM + offset));

		obj.css({ height });
		position();
	};

});

export default MenuViewList;