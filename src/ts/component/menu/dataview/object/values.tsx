import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, IconObject, ObjectName } from 'ts/component';
import { I, DataUtil, keyboard, Relation } from 'ts/lib';
import arrayMove from 'array-move';
import { commonStore, detailStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {}

const $ = require('jquery');
const HEIGHT = 28;
const LIMIT = 20;

const MenuObjectValues = observer(class MenuObjectValues extends React.Component<Props> {
	
	_isMounted: boolean = false;
	n: number = 0;
	top: number = 0;
	cache: any = {};
	refList: any = null;
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};
	
	render () {
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
					onMouseEnter={(e: any) => { this.onOver(e, item); }}
					style={item.style}
				>
					<Handle />
					<span className="clickable" onClick={(e: any) => { this.onClick(e, item); }}>
						<IconObject object={item} />
						<ObjectName object={item} />
					</span>
					<Icon className="delete" onClick={(e: any) => { this.onRemove(e, item); }} />
				</div>
			);
		});

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

		const List = SortableContainer((item: any) => (
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
		));
		
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

		this.props.setActive(null, true);
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
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
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const { rootId, subId, valueMapper, nameAdd } = data;

		let value: any[] = Relation.getArrayValue(data.value);
		value = value.map((it: string) => { return detailStore.get(subId, it, []); });

		if (valueMapper) {
			value = value.map(valueMapper);
		};

		value = value.filter((it: any) => { return !it._empty_; });
		if (!config.debug.ho) {
			value = value.filter((it: any) => { return !it.isHidden; });
		};

		value.unshift({ id: 'add', name: (nameAdd || 'Add object') });
		return value;
	};

	onClick (e: any, item: any) {
		if (item.id == 'add') {
			this.onAdd();
		} else {
			DataUtil.objectOpenEvent(e, item);
		};
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onAdd () {
		const { param, getId, getSize, close } = this.props;
		const { data, className, classNameWrap } = param;

		menuStore.open('dataviewObjectList', {
			element: `#${getId()}`,
			width: 0,
			offsetX: param.width,
			offsetY: () => { return -getSize().height; },
			passThrough: true,
			noFlipY: true,
			noAnimation: true,
			className: className,
			classNameWrap: classNameWrap,
			data: {
				...data,
				rebind: this.rebind,
			},
		});
	};

	onRemove (e: any, item: any) {
		const { param, id } = this.props;
		const { data } = param;
		const { onChange } = data;
		const relation = data.relation.get();
		
		let value = Relation.getArrayValue(data.value);
		value = value.filter((it: any) => { return it != item.id; });
		
		if (relation) {
			value = Relation.formatValue(relation, value, true);
		};

		this.n = -1;

		onChange(value, () => {
			menuStore.updateData(id, { value });
			menuStore.updateData('dataviewObjectList', { value });
		});
	};

	onSortStart () {
		const { dataset } = this.props;
		const { selection } = dataset;

		selection.preventSelect(true);
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param, dataset, id } = this.props;
		const { selection } = dataset;
		const { data } = param;
		const { onChange } = data;
		const relation = data.relation.get();

		let value = Relation.getArrayValue(data.value);
		value = arrayMove(value, oldIndex - 1, newIndex - 1);
		value = Relation.formatValue(relation, value, true);

		onChange(value, () => {
			menuStore.updateData(id, { value });
		});

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

export default MenuObjectValues;