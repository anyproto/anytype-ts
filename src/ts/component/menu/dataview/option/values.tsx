import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Tag } from 'ts/component';
import { I, Util, DataUtil, keyboard, Relation } from 'ts/lib';
import arrayMove from 'array-move';
import { menuStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';

interface Props extends I.Menu {};

const $ = require('jquery');
const HEIGHT = 28;
const LIMIT = 20;

const MenuOptionValues = observer(class MenuOptionValues extends React.Component<Props> {
	
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
		const relation = data.relation.get();
		const items = this.getItems();

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => (
			<div 
				id={'item-' + item.id} 
				className="item" 
				onMouseEnter={(e: any) => { this.onOver(e, item); }}
				style={item.style}
			>
				<div className="clickable" onClick={(e: any) => { this.onClick(e, item); }}>
					<Tag {...item} className={DataUtil.tagClass(relation.format)} />
				</div>
				<div className="buttons">
					<Icon className="more" onClick={(e: any) => { this.onEdit(e, item); }} />
					<Icon className="delete" onClick={(e: any) => { this.onRemove(e, item); }} />
				</div>
			</div>
		));

		const ItemAdd = (item: any) => (
			<div 
				id="item-add" 
				className="item add" 
				onMouseEnter={(e: any) => { this.onOver(e, item); }} 
				onClick={(e: any) => { this.onClick(e, item); }}
				style={item.style}
			>
				<Icon className="plus" />
				<div className="name">{item.name}</div>
			</div>
		);

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			let content = null;
			if (item.id == 'label') {
				content = <div className="sectionName" style={param.style}>{item.name}</div>
			} else 
			if (item.id == 'add') {
				content = <ItemAdd key={item.id} {...item} index={param.index} disabled={true} style={param.style} />;
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
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				</div>
			);
		});
		
		return (
			<List 
				axis="y" 
				transitionDuration={150}
				distance={10}
				useDragHandle={true}
				onSortStart={this.onSortStart}
				onSortEnd={this.onSortEnd}
				helperClass="isDragging"
				helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
			/>
		);
	};
	
	componentDidMount () {
		const items = this.getItems();

		this._isMounted = true;
		this.rebind();
		this.resize();

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

		window.setTimeout(() => { this.props.setActive(); });
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		const { getId } = this.props;

		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		$(`#${getId()}`).on('click', () => { menuStore.close('dataviewOptionEdit'); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		const { getId } = this.props;

		$(window).unbind('keydown.menu');
		$(`#${getId()}`).unbind('click');
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { filter, cellRef } = data;
		
		let value: any[] = [
			{ id: 'label', name: 'Select an option or add one' }
		];
		if (filter) {
			value.push({ id: 'add', name: `Create option "${data.filter}"` });
		};
		if (cellRef) {
			value = value.concat(cellRef.getItems());
		};
		return value;
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onAdd (e: any) {
		e.stopPropagation();

		const { param } = this.props;
		const { data } = param;
		const { cellRef, filter } = data;
		
		if (cellRef) {
			cellRef.onOptionAdd(filter);
			cellRef.clear();
		};
	};

	onEdit (e: any, item: any) {
		e.stopPropagation();

		const { param, getId, getSize } = this.props;
		const { data, classNameWrap } = param;

		menuStore.closeAll([ 'dataviewOptionList', 'dataviewOptionEdit' ], () => {
			menuStore.open('dataviewOptionEdit', { 
				element: `#${getId()} #item-${item.id}`,
				offsetX: getSize().width,
				vertical: I.MenuDirection.Center,
				passThrough: true,
				noFlipY: true,
				noAnimation: true,
				classNameWrap: classNameWrap,
				data: {
					...data,
					rebind: this.rebind,
					option: item,
				}
			});
		});
	};

	onClick (e: any, item: any) {
		item.id == 'add' ? this.onAdd(e) : this.onEdit(e, item);
	};

	onRemove (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { cellRef } = data;

		if (cellRef) {
			cellRef.onValueRemove(item.id);
		};
	};

	onSortStart () {
		const { dataset } = this.props;
		const { selection } = dataset;

		selection.preventSelect(true);
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param, dataset } = this.props;
		const { selection } = dataset;
		const { data } = param;
		const { filter, cellRef } = data;
		const offset = filter ? 2 : 1;

		if (cellRef) {
			cellRef.onDragEnd(oldIndex - offset, newIndex - offset);
		};

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
		const offset = 16;
		const height = Math.max(HEIGHT + offset, Math.min(280, items.length * HEIGHT + offset));

		obj.css({ height: height });
		position();
	};

});

export default MenuOptionValues;