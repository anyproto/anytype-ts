import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, MenuItemVertical, Icon, Loader, ObjectName, ObjectType } from 'Component';
import { I, S, U, J, keyboard, Relation, translate, analytics } from 'Lib';

interface State {
	isLoading: boolean;
};

const MENU_ID = 'dataviewObjectValues';
const LIMIT_HEIGHT = 20;
const LIMIT_TYPE = 2;
const HEIGHT_SECTION = 28;
const HEIGHT_ITEM = 28;
const HEIGHT_ITEM_BIG = 56;
const HEIGHT_EMPTY = 96;
const HEIGHT_DIV = 16;

const MenuDataviewObjectList = observer(class MenuDataviewObjectList extends React.Component<I.Menu, State> {

	state = {
		isLoading: false,
	};

	_isMounted = false;	
	filter = '';
	cache: any = {};
	offset = 0;
	items: any[] = [];
	refFilter: any = null;
	refList: any = null;
	top = 0;
	n = -1;

	constructor (props: I.Menu) {
		super(props);
		
		this.loadMoreRows = this.loadMoreRows.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { isLoading } = this.state;
		const { data } = param;
		const { filter, noFilter } = data;
		const items = this.getItems();
		const placeholderFocus = data.placeholderFocus || translate('commonFilterObjects');

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			if (!item) {
				return null;
			};

			const type = S.Record.getTypeById(item.type);
			const name = <ObjectName object={item} />;

			let content = null;
			if (item.isDiv) {
				content = (
					<div className="separator" style={param.style}>
						<div className="inner" />
					</div>
				);
			} else
			if (item.isSection) {
				content = (<div className="sectionName" style={param.style}>{item.name}</div>);
			} else
			if (item.id == 'add') {
				content = (
					<div id="item-add" className="item add" onMouseEnter={e => this.onOver(e, item)} onClick={e => this.onClick(e, item)} style={param.style}>
						<Icon className="plus" />
						<div className="name">{item.name}</div>
					</div>
				);
			} else {
				content = (
					<MenuItemVertical 
						id={item.id}
						object={item}
						name={<ObjectName object={item} />}
						onMouseEnter={e => this.onOver(e, item)} 
						onClick={e => this.onClick(e, item)}
						caption={<ObjectType object={type} />}
						style={param.style}
					/>
				);
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

		return (
			<div className={[ 'wrap', (!noFilter ? 'withFilter' : '') ].join(' ')}>
				{!noFilter ? (
					<Filter
						className="outlined"
						icon="search"
						ref={ref => this.refFilter = ref} 
						placeholderFocus={placeholderFocus}
						value={filter}
						onChange={this.onFilterChange} 
					/>
				) : ''}

				{isLoading ? <Loader /> : ''}

				{this.cache && items.length && !isLoading ? (
					<div className="items">
						<InfiniteLoader
							rowCount={items.length + 1}
							loadMoreRows={this.loadMoreRows}
							isRowLoaded={({ index }) => !!this.items[index]}
							threshold={LIMIT_HEIGHT}
						>
							{({ onRowsRendered }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={ref => this.refList = ref}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={({ index }) => this.getRowHeight(items[index])}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={LIMIT_HEIGHT}
											onScroll={this.onScroll}
											scrollToAlignment="center"
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();
		this.focus();
		this.load(true);
	};

	componentDidUpdate () {
		const items = this.getItems();
		const { param, setActive } = this.props;
		const { data } = param;
		const { filter } = data;

		if (filter != this.filter) {
			this.top = 0;
			this.offset = 0;
			this.filter = filter;
			this.n = -1;
			this.load(true);
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};
		this.resize();
		this.focus();

		setActive(items[this.n], false);
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	focus () {
		window.setTimeout(() => { 
			if (this.refFilter) {
				this.refFilter.focus(); 
			};
		}, 15);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onKeyDown (e: any) {
		// Chinese IME is open
		if (keyboard.isComposition) {
			return;
		};

		const { param, onKeyDown } = this.props;
		const { data } = param;
		const { cellRef } = data;

		keyboard.shortcut('arrowdown', e, () => {
			if (cellRef) {
				cellRef.blur();
			};
		});

		onKeyDown(e);
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		const { isLoading } = this.state;

		if (isLoading) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { filter, canEdit } = data;
		const types = this.getTypes();
		const value = Relation.getArrayValue(data.value);

		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
		].concat(data.filters || []);
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
		];

		if (types && types.length) {
			filters.push({ relationKey: 'type.uniqueKey', condition: I.FilterCondition.In, value: types.map(it => it.uniqueKey) });
		};

		if (clear) {
			this.setState({ isLoading: true });
		};

		let limit = J.Constant.limit.menuRecords;

		if (!canEdit) {
			limit = 0;
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value });
		};

		U.Data.search({
			filters,
			sorts,
			fullText: filter,
			offset: this.offset,
			limit,
		}, (message: any) => {
			if (message.error.code) {
				this.setState({ isLoading: false });
				return;
			};

			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records || []);

			if (clear) {
				this.setState({ isLoading: false });
			} else {
				this.forceUpdate();
			};
		});
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { canAdd, canEdit, nameCreate } = data;
		const value = Relation.getArrayValue(data.value);
		const typeNames = this.getTypeNames();

		let ret = U.Common.objectCopy(this.items);
		if (canEdit) {
			ret = ret.filter(it => !value.includes(it.id));
		};
		if (typeNames) {
			ret.unshift({ isSection: true, name: typeNames });
		};

		if (data.filter && canAdd && canEdit) {
			if (ret.length || typeNames) {
				ret.push({ isDiv: true });
			};
			ret.push({ id: 'add', name: U.Common.sprintf(nameCreate || translate('commonCreateObjectWithName'), data.filter) });
		};

		return ret;
	};

	getTypes () {
		const { param } = this.props;
		const { data } = param;

		return (data.types || []).map(id => S.Record.getTypeById(id)).filter(it => it);
	};

	getTypeNames (): string {
		const types = this.getTypes();

		if (!types || !types.length) {
			return '';
		};

		const names = types.map(it => it.name);
		const l = names.length;

		if (l > LIMIT_TYPE) {
			const more = l - LIMIT_TYPE;

			names.splice(LIMIT_TYPE, more);
			names.push(`+${more}`);
		};

		return `${U.Common.plural(l, translate('pluralObjectType'))}: ${names.join(', ')}`;
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		return new Promise((resolve, reject) => {
			this.offset += J.Constant.limit.menuRecords;
			this.load(false, resolve);
		});
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
		const { param, close, position } = this.props;
		const { data } = param;
		const { onChange, maxCount, filter, cellRef, canEdit } = data;
		const relation = data.relation.get();
		const addParam = data.addParam || {};

		e.preventDefault();
		e.stopPropagation();

		if (!item || !relation) {
			close();
			return;
		};

		if (!canEdit) {
			U.Object.openConfig(item);
			return;
		};

		if (cellRef) {
			cellRef.clear();
		};

		const cb = (id: string) => {
			if (!id) {
				return;
			};

			let value = U.Common.arrayUnique(Relation.getArrayValue(data.value).concat([ id ]));
			if (maxCount) {
				value = value.slice(value.length - maxCount, value.length);
			};

			onChange(value, () => {
				S.Menu.updateData(this.props.id, { value });
				S.Menu.updateData(MENU_ID, { value });

				position();
			});
		};

		if (item.id == 'add') {
			const param = Relation.getParamForNewObject(filter, relation);
			const details = Object.assign(param.details, addParam.details || {});

			U.Object.create('', '', details, I.BlockPosition.Bottom, '', param.flags, analytics.route.relation, (message: any) => {
				cb(message.targetId);
				close();
			});
		} else {
			cb(item.id);
		};
	};

	getRowHeight (item: any) {
		let h = HEIGHT_ITEM;
		if (item.isBig) h = HEIGHT_ITEM_BIG;
		if (item.isSection) h = HEIGHT_SECTION;
		if (item.isEmpty) h = HEIGHT_EMPTY;
		if (item.isDiv) h = HEIGHT_DIV;
		return h;
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);

		let offset = 16;

		if (!noFilter) {
			offset += 42;
		};
		if (!items.length) {
			offset += HEIGHT_EMPTY;
		};

		const itemsHeight = items.reduce((res: number, current: any) => { return res + this.getRowHeight(current); }, offset);
		const height = Math.max(HEIGHT_ITEM + offset, Math.min(300, itemsHeight));

		obj.css({ height });
		position();
	};

});

export default MenuDataviewObjectList;