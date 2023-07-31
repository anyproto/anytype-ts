import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, MenuItemVertical, Icon, Loader, ObjectName, EmptySearch } from 'Component';
import { I, UtilCommon, keyboard, UtilData, UtilObject, Relation, translate } from 'Lib';
import { menuStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	loading: boolean;
};

const MENU_ID = 'dataviewObjectValues';
const LIMIT_HEIGHT = 20;
const HEIGHT_SECTION = 28;
const HEIGHT_ITEM = 28;
const HEIGHT_ITEM_BIG = 56;
const HEIGHT_DIV = 16;

const MenuDataviewObjectList = observer(class MenuDataviewObjectList extends React.Component<I.Menu, State> {

	state = {
		loading: false,
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
		const { loading } = this.state;
		const { data } = param;
		const { filter, noFilter } = data;
		const items = this.getItems();
		const placeholderFocus = data.placeholderFocus || translate('commonFilterObjects');

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			if (!item) {
				return null;
			};

			const type = dbStore.getType(item.type);
			const name = <ObjectName object={item} />;

			let content = null;
			if (item.isDiv) {
				content = (
					<div className="separator" style={param.style}>
						<div className="inner" />
					</div>
				);
			} else if (item.id == 'add') {
				content =  (
					<div id="item-add" className="item add" onMouseEnter={(e: any) => { this.onOver(e, item); }} onClick={(e: any) => { this.onClick(e, item); }} style={param.style}>
						<Icon className="plus" />
						<div className="name">{item.name}</div>
					</div>
				);
			} else {
				content = (
					<MenuItemVertical 
						id={item.id}
						object={item}
						name={name}
						onMouseEnter={(e: any) => { this.onOver(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }}
						caption={type ? type.name : undefined}
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
						ref={ref => this.refFilter = ref} 
						placeholderFocus={placeholderFocus} 
						value={filter}
						onChange={this.onFilterChange} 
					/>
				) : ''}

				{loading ? <Loader /> : ''}

				{!items.length && !loading ? (
					<EmptySearch text={filter ? UtilCommon.sprintf(translate('popupSearchEmptyFilter'), filter) : translate('popupSearchEmpty')} />
				) : ''}

				{this.cache && items.length && !loading ? (
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
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onKeyDown (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { cellRef } = data;

		keyboard.shortcut('arrowdown', e, () => {
			if (cellRef) {
				cellRef.blur();
			};
		});

		this.props.onKeyDown(e);
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { canAdd } = data;
		const value = Relation.getArrayValue(data.value);
		const ret = UtilCommon.objectCopy(this.items).filter(it => !value.includes(it.id));

		if (data.filter && canAdd) {
			if (ret.length) {
				ret.push({ isDiv: true });
			};
			ret.push({ id: 'add', name: UtilCommon.sprintf(translate('commonCreateObject'), data.filter) });
		};

		return ret;
	};
	
	load (clear: boolean, callBack?: (message: any) => void) {
		const { param } = this.props;
		const { data } = param;
		const { types, filter } = data;
		const filters: I.Filter[] = [].concat(data.filters || []);
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		if (types && types.length) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types });
		} else {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: UtilObject.getSystemTypes() });
		};

		if (clear) {
			this.setState({ loading: true });
		};

		UtilData.search({
			filters,
			sorts,
			fullText: filter,
			offset: this.offset,
			limit: Constant.limit.menuRecords,
		}, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat((message.records || []).map((it: any) => {
				it.name = String(it.name || UtilObject.defaultName('Page'));
				return it;
			}));

			if (clear) {
				this.setState({ loading: false });
			} else {
				this.forceUpdate();
			};
		});
	};

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += Constant.limit.menuRecords;
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
		const { onChange, maxCount, filter, cellRef } = data;
		const relation = data.relation.get();

		e.preventDefault();
		e.stopPropagation();

		if (!item) {
			close();
			return;
		};

		if (cellRef) {
			cellRef.clear();
		};

		const cb = (id: string) => {
			if (!id) {
				return;
			};

			let value = UtilCommon.arrayUnique(Relation.getArrayValue(data.value).concat([ id ]));
			if (maxCount) {
				value = value.slice(value.length - maxCount, value.length);
			};

			onChange(value, () => {
				menuStore.updateData(this.props.id, { value });
				menuStore.updateData(MENU_ID, { value });

				position();
			});
		};

		if (item.id == 'add') {
			let details: any = { name: filter };
			let typeId = relation.objectTypes.length ? relation.objectTypes[0] : '';
			let flags: I.ObjectFlag[] = [];
			
			if (typeId) {
				details.type = typeId;
			} else {
				flags.push(I.ObjectFlag.SelectType);
			};

			UtilObject.create('', '', details, I.BlockPosition.Bottom, '', {}, flags, (message: any) => {
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
		if (item.isDiv) h = HEIGHT_DIV;
		return h;
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const height = Math.max(300, items.reduce((res: number, current: any) => { return res + this.getRowHeight(current); }, HEIGHT_ITEM + 16 + (noFilter ? 0 : 44)));

		obj.css({ height });
		position();
	};

});

export default MenuDataviewObjectList;