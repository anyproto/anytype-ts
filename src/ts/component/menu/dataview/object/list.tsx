import * as React from 'react';
import { Filter, MenuItemVertical, Icon, Loader, ObjectName } from 'ts/component';
import { I, C, Util, keyboard, DataUtil, Relation } from 'ts/lib';
import { commonStore, dbStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends I.Menu {};

interface State {
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT = 28;
const MENU_ID = 'dataviewObjectValues';

const LIMIT_HEIGHT = 20;

const MenuDataviewObjectList = observer(class MenuDataviewObjectList extends React.Component<Props, State> {

	state = {
		loading: false,
	};

	_isMounted: boolean = false;	
	filter: string = '';
	cache: any = {};
	offset: number = 0;
	items: any[] = [];
	refFilter: any = null;
	refList: any = null;
	top: number = 0;
	n: number = -1;

	constructor (props: any) {
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
		const placeholderFocus = data.placeholderFocus || 'Filter objects...';

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const type: any = dbStore.getObjectType(item.type) || {};
			const name = <ObjectName object={item} />;

			let content = null;
			if (item.id == 'add') {
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
						withCaption={true}
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
					hasFixedWidth={() => {}}
				>
					{content}
				</CellMeasurer>
			);
		};

		return (
			<div className={[ 'wrap', (noFilter ? 'noFilter' : '') ].join(' ')}>
				{!noFilter ? (
					<Filter 
						ref={(ref: any) => { this.refFilter = ref; }} 
						placeholderFocus={placeholderFocus} 
						value={filter}
						onChange={this.onFilterChange} 
					/>
				) : ''}

				{loading ? <Loader /> : (
					<div className="items">
						<InfiniteLoader
							rowCount={items.length + 1}
							loadMoreRows={this.loadMoreRows}
							isRowLoaded={({ index }) => !!this.items[index]}
							threshold={LIMIT_HEIGHT}
						>
							{({ onRowsRendered, registerChild }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={(ref: any) => { this.refList = ref; }}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={HEIGHT}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={LIMIT_HEIGHT}
											onScroll={this.onScroll}
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					</div>
				)}
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
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
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
		$(window).unbind('keydown.menu');
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

	onScroll ({ clientHeight, scrollHeight, scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { canAdd } = data;
		const value = Relation.getArrayValue(data.value);
		
		let ret = Util.objectCopy(this.items);

		ret = ret.filter((it: I.SelectOption) => { return value.indexOf(it.id) < 0; });

		if (data.filter && canAdd) {
			ret.unshift({ id: 'add', name: `Create object named "${data.filter}"` });
		};

		return ret;
	};
	
	load (clear: boolean, callBack?: (message: any) => void) {
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const { types, filter } = data;
		const filters = [];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true });
		};

		if (types && types.length) {
			filters.push({ relationKey: 'type', operator: I.FilterOperator.And, condition: I.FilterCondition.In, value: types });
		};

		if (clear) {
			this.setState({ loading: true });
		};

		C.ObjectSearch(filters, sorts, Constant.defaultRelationKeys, filter, this.offset, Constant.limit.menu, (message: any) => {
			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records.map((it: any) => {
				it.name = String(it.name || DataUtil.defaultName('page'));
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
			this.offset += Constant.limit.menu;
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

			let value = Relation.getArrayValue(data.value);
			value.push(id);
			value = Util.arrayUnique(value);

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
			let type: any = null;
			let flags: I.ObjectFlag[] = [];
			
			if (typeId) {
				type = dbStore.getObjectType(typeId);
				if (type) {
					details.type = type.id;
					details.layout = type.layout;
				};
			};

			if (!type) {
				flags.push(I.ObjectFlag.SelectType);
			};

			DataUtil.pageCreate('', '', details, I.BlockPosition.Bottom, '', {}, flags, (message: any) => {
				cb(message.targetId);
				close();
			});
		} else {
			cb(item.id);
		};
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = noFilter ? 16 : 58;
		const height = Math.max(HEIGHT * 2, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height: height });
		position();
	};

});

export default MenuDataviewObjectList;