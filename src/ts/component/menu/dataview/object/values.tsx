import * as React from 'react';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, IconObject, ObjectName, EmptySearch } from 'Component';
import { I, S, U, keyboard, Relation, translate } from 'Lib';

const LIMIT = 20;
const HEIGHT_ITEM = 28;
const HEIGHT_EMPTY = 96;
const HEIGHT_DIV = 16;

const MenuObjectValues = observer(class MenuObjectValues extends React.Component<I.Menu> {
	
	_isMounted = false;
	node: any = null;
	n = -1;
	top = 0;
	cache: any = {};
	refList: any = null;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};
	
	render () {
		const { getId, param } = this.props;
		const { data } = param;
		const { canEdit } = data;
		const items = this.getItems();

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => {
			const cn = [ 'item', 'withCaption', (item.isHidden ? 'isHidden' : '') ];
			return (
				<div 
					id={'item-' + item.id} 
					className={cn.join(' ')} 
					onMouseEnter={e => this.onOver(e, item)}
					style={item.style}
				>
					{canEdit ? <Handle /> : ''}
					<span className="clickable" onClick={e => this.onClick(e, item)}>
						<IconObject object={item} />
						<ObjectName object={item} />
					</span>
					{canEdit ? <Icon className="delete withBackground" onClick={e => this.onRemove(e, item)} /> : ''}
				</div>
			);
		});

		const ItemAdd = (item: any) => (
			<div 
				id="item-add" 
				className="item add" 
				onMouseEnter={e => this.onOver(e, item)} 
				onClick={e => this.onClick(e, item)}
				style={item.style}
			>
				<Icon className="plus" />
				<div className="name">{item.name}</div>
			</div>
		);

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			let content = null;
			if (item.isDiv) {
				content = (
					<div className="separator" style={param.style}>
						<div className="inner" />
					</div>
				);
			} else
			if (item.isEmpty) {
				content = <EmptySearch style={param.style} text={translate('menuDataviewObjectValuesEmptySearch')} />;
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
				>
					{content}
				</CellMeasurer>
			);
		};

		const List = SortableContainer(() => (
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
								rowHeight={({ index }) => this.getRowHeight(items[index])}
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
		));
		
		return (
			<List 
				ref={node => this.node = node}
				axis="y" 
				transitionDuration={150}
				distance={10}
				useDragHandle={true}
				onSortStart={this.onSortStart}
				onSortEnd={this.onSortEnd}
				helperClass="isDragging"
				helperContainer={() => $(`#${getId()} .content`).get(0)}
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
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});
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
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, valueMapper, nameAdd, canEdit } = data;

		let value: any[] = Relation.getArrayValue(data.value);
		value = value.map(it => S.Detail.get(rootId, it, []));
		
		if (valueMapper) {
			value = value.map(valueMapper);
		};

		value = value.filter(it => it && !it._empty_ && !it.isArchived && !it.isDeleted);
		value = S.Record.checkHiddenObjects(value);

		if (!value.length) {
			value.push({ isEmpty: true });
		};

		if (canEdit) {
			value = value.concat([
				{ isDiv: true },
				{ id: 'add', name: (nameAdd || translate('menuDataviewObjectValuesAddObject')) },
			]);
		};

		return value;
	};

	onClick (e: any, item: any) {
		if (item.id == 'add') {
			this.onAdd();
		} else {
			U.Object.openEvent(e, item);
		};
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onAdd () {
		const { id, param, getId, getSize } = this.props;
		const { data, className, classNameWrap } = param;
		const { width } = getSize();

		S.Menu.open('dataviewObjectList', {
			element: `#${getId()}`,
			vertical: I.MenuDirection.Center,
			offsetX: width,
			width,
			passThrough: true,
			noAnimation: true,
			className,
			classNameWrap,
			rebind: this.rebind,
			parentId: id,
			data: {
				...data,
				canAdd: true,
			},
		});
	};

	onRemove (e: any, item: any) {
		const { param, id } = this.props;
		const { data } = param;
		const { onChange } = data;
		const relation = data.relation.get();
		
		let value = Relation.getArrayValue(data.value);
		value = value.filter(it => it != item.id);
		
		if (relation) {
			value = Relation.formatValue(relation, value, true);
		};

		this.n = -1;

		onChange(value, () => {
			S.Menu.updateData(id, { value });
			S.Menu.updateData('dataviewObjectList', { value });
		});
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param, id } = this.props;
		const { data } = param;
		const { onChange } = data;
		const relation = data.relation.get();

		let value = Relation.getArrayValue(data.value);
		value = arrayMove(value, oldIndex, newIndex);
		value = Relation.formatValue(relation, value, true);

		onChange(value, () => S.Menu.updateData(id, { value }));
		keyboard.disableSelection(false);
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	getRowHeight (item: any) {
		let h = HEIGHT_ITEM;
		if (item.isEmpty) h = HEIGHT_EMPTY;
		if (item.isDiv) h = HEIGHT_DIV;
		return h;
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 16;
		const height = items.reduce((res: number, current: any) => { return res + this.getRowHeight(current); }, offset);

		obj.css({ height });
		position();
	};

});

export default MenuObjectValues;
