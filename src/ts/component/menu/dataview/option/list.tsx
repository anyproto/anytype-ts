import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import { Icon, Tag, Filter, DragBox } from 'Component';
import { I, C, UtilCommon, UtilMenu, keyboard, Relation, translate } from 'Lib';
import { menuStore, dbStore, commonStore } from 'Store';
import Constant from 'json/constant.json';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import arrayMove from 'array-move';

const HEIGHT = 28;
const LIMIT = 40;

const MenuOptionList = observer(class MenuOptionList extends React.Component<I.Menu> {
	
	_isMounted = false;
	refFilter: any = null;
	refList: any = null;
	cache: any = {};
	n = -1;
	filter = '';
	
	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		if (!this.cache) {
			return null;
		};

		const { param, getId } = this.props;
		const { data } = param;
		const { filter, canAdd, noFilter } = data;
		const relation = data.relation.get();
		const value = data.value || [];
		const items = this.getItems();
		const placeholder = canAdd ? translate('menuDataviewOptionListFilterOrCreateOptions') : translate('menuDataviewOptionListFilterOptions');
		const empty = canAdd ? translate('menuDataviewOptionListTypeToCreate') : translate('menuDataviewOptionListTypeToSearch');

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => {
			const active = value.indexOf(item.id) >= 0;

			return (
				<div 
					id={`item-${item.id}`} 
					className="item" 
					style={item.style} 
					onMouseEnter={e => this.onOver(e, item)}
				>
					<Handle />
					<div className="clickable" onClick={e => this.onClick(e, item)}>
						<Tag text={item.name} color={item.color} className={Relation.selectClassName(relation.format)} />
					</div>
					<div className="buttons">
						<Icon className="more" onClick={e => this.onEdit(e, item)} />
					</div>
					{active ? <Icon className="chk" /> : ''}
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
			if (item.id == 'add') {
				content = <ItemAdd key={item.id} {...item} index={param.index} disabled={true} style={param.style} />;
			} else 
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
				>
					{content}
				</CellMeasurer>
			);
		};

		const List = SortableContainer(() => (
			<div className="items">
				{items.length ? (
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
										overscanRowCount={10}
										scrollToAlignment="center"
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				) : <div className="item empty">{empty}</div>}
			</div>
		));

		return (
			<div className={[ 'wrap', (noFilter ? 'noFilter' : '') ].join(' ')}>
				{!noFilter ? (
					<Filter
						className="outlined"
						icon="search"
						ref={ref => this.refFilter = ref} 
						placeholderFocus={placeholder} 
						value={filter}
						onChange={this.onFilterChange} 
						focusOnMount={true}
					/>
				) : ''}

				<List 
					axis="y" 
					transitionDuration={150}
					distance={10}
					useDragHandle={true}
					onSortStart={this.onSortStart}
					onSortEnd={this.onSortEnd}
					helperClass="isDragging"
					helperContainer={() => $(`#${getId()} .items`).get(0)}
				/>
			</div>
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
			keyMapper: i => (items[i] || {}).id,
		});

		this.forceUpdate();
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;

		if (this.filter != filter) {
			this.n = 0;
		};

		this.props.setActive();
		this.props.position();
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		$(`#${this.props.getId()}`).on('click', () => menuStore.close('dataviewOptionEdit'));
		window.setTimeout(() => this.props.setActive(), 15);
	};

	unbind () {
		$(window).off('keydown.menu');
		$(`#${this.props.getId()}`).off('click');
	};

	onKeyDown (e: any) {
		const items = this.getItems();
		
		let ret = false;

		keyboard.shortcut('arrowright', e, () => {
			this.onEdit(e, items[this.n]);
			ret = true;
		});

		if (ret) {
			return;
		};

		this.props.onKeyDown(e);
	};

	onFilterChange (v: string) {
		this.props.param.data.filter = v;
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		e.stopPropagation();

		const { param } = this.props;
		const { data } = param;
		const { cellRef } = data;
		const value = Relation.getArrayValue(data.value);
		const id = item.id;

		if (cellRef) {
			cellRef.clear();
		};

		if (id == 'add') {
			this.onOptionAdd();
		} else
		if (value.includes(id)) {
			this.onValueRemove(id);
		} else {
			this.onValueAdd(id);
		};

		this.onFilterChange('');
	};

	onValueAdd (id: string) {
		const { param, close } = this.props;
		const { data } = param;
		const { onChange, maxCount } = data;

		let value = Relation.getArrayValue(data.value);

		value.push(id);
		value = UtilCommon.arrayUnique(value);

		if (maxCount) {
			value = value.slice(value.length - maxCount, value.length);

			if (maxCount == 1) {
				close();
			};
		};

		menuStore.updateData(this.props.id, { value });
		onChange(value);
	};

	onValueRemove (id: string) {
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;
		const value = Relation.getArrayValue(data.value);
		const idx = value.indexOf(id);

		value.splice(idx, 1);
		menuStore.updateData(this.props.id, { value });
		onChange(value);
	};

	onOptionAdd () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const relation = data.relation.get();
		const colors = UtilMenu.getBgColors();
		const option = { name: filter, color: colors[UtilCommon.rand(1, colors.length - 1)].value };

		if (!option.name) {
			return;
		};

		const items = this.getItems();
		const match = items.find(it => it.name == option.name);

		if (match) {
			this.onValueAdd(match.id);
			return;
		};

		C.ObjectCreateRelationOption({
			relationKey: relation.relationKey,
			name: option.name,
			relationOptionColor: option.color,
		}, commonStore.space, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (this.refFilter) {
				this.refFilter.setValue('');
			};
			this.onFilterChange('');
			this.onValueAdd(message.objectId);

			window.setTimeout(() => this.resize(), 50);
		});
	};
	
	onEdit (e: any, item: any) {
		e.stopPropagation();

		if (!item || (item.id == 'add')) {
			return;
		};

		const { param, getId, getSize } = this.props;
		const { data, classNameWrap } = param;

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
	};

	getItems (): any[] {
		const { param } = this.props;
		const { data } = param;
		const { canAdd, filterMapper } = data;
		const relation = data.relation.get();
		const { optionOrder } = relation;
		const isSelect = relation.format == I.RelationType.Select;
		const value = Relation.getArrayValue(data.value);
		const ret = [];

		let items = Relation.getOptions(dbStore.getRecords(Constant.subId.option, '')).filter(it => it.relationKey == relation.relationKey);
		let check = [];

		items.filter(it => !it._empty_ && !it.isArchived && !it.isDeleted);

		if (filterMapper) {
			items = items.filter(filterMapper);
		};

		console.log('optionOrder', JSON.stringify(optionOrder, null, 3));

		items.sort((c1, c2) => {
			const isSelected1 = value.includes(c1.id);
			const isSelected2 = value.includes(c2.id);
			const idx1 = optionOrder.indexOf(c1.id);
			const idx2 = optionOrder.indexOf(c2.id);

			//if (isSelected1 && !isSelected2) return -1;
			//if (!isSelected1 && isSelected2) return 1;

			if (idx1 > idx2) return 1;
			if (idx1 < idx2) return -1;

			return 0;
		});

		if (data.filter) {
			const filter = new RegExp(UtilCommon.regexEscape(data.filter), 'gi');
			
			check = items.filter(it => it.name.toLowerCase() == data.filter.toLowerCase());
			items = items.filter(it => it.name.match(filter));

			if (canAdd && !check.length) {
				ret.unshift({ 
					id: 'add', 
					name: UtilCommon.sprintf(isSelect ? translate('menuDataviewOptionListSetStatus') : translate('menuDataviewOptionListCreateOption'), data.filter),
				});
			};
		};

		return items.concat(ret);
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param } = this.props;
		const { data } = param;
		const relation = data.relation.get();
		
		let ids = this.getItems().map(it => it.id);
		ids = arrayMove(ids, oldIndex, newIndex);

		console.log('ORDER', ids);

		C.ObjectSetDetails(relation.id, [ { key: 'relationOptionOrder', value: ids } ]);
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter, maxHeight } = data;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 16 + (noFilter ? 0 : 38);
		const height = Math.max(HEIGHT + offset, Math.min(maxHeight || 360, items.length * HEIGHT + offset));

		obj.css({ height });
		position();
	};
	
});

export default MenuOptionList;
