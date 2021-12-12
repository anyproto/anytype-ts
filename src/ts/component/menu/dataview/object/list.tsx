import * as React from 'react';
import { Filter, MenuItemVertical, Icon, Loader, ObjectName } from 'ts/component';
import { I, C, Util, keyboard, DataUtil } from 'ts/lib';
import { commonStore, dbStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {}

interface State {
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT = 28;
const LIMIT = 20;
const MENU_ID = 'dataviewObjectValues';

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
		const { filter } = data;
		const items = this.getItems();

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
			<div className="wrap">
				<Filter 
					ref={(ref: any) => { this.refFilter = ref; }} 
					placeholderFocus="Filter objects..." 
					value={filter}
					onChange={this.onFilterChange} 
				/>

				{loading ? <Loader /> : (
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
										<List
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
				)}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();
		this.focus();
		this.load(false);
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
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
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
		const value = DataUtil.getRelationArrayValue(data.value);
		
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

		this.setState({ loading: true });

		C.ObjectSearch(filters, sorts, Constant.defaultRelationKeys, filter, this.offset, 0, (message: any) => {
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

			this.setState({ loading: false });
		});
	};

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += LIMIT;
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
		const { onChange, maxCount, filter } = data;
		const relation = data.relation.get();

		e.preventDefault();
		e.stopPropagation();

		if (!item) {
			close();
			return;
		};

		const cb = (id: string) => {
			if (!id) {
				return;
			};

			let value = DataUtil.getRelationArrayValue(data.value);
			value.push(id);
			value = Util.arrayUnique(value);

			if (maxCount) {
				value = value.slice(value.length - maxCount, value.length);
			};

			data.value = value;

			onChange(value, () => {
				menuStore.updateData(MENU_ID, { value: value });
				position();
			});
		};

		if (item.id == 'add') {
			const details: any = {
				name: filter,
			};

			const typeId = relation.objectTypes.length ? relation.objectTypes[0] : '';
			if (typeId) {
				const type = dbStore.getObjectType(typeId);
				if (type) {
					details.type = type.id;
					details.layout = type.layout;
				};
			};

			DataUtil.pageCreate('', '', details, I.BlockPosition.Bottom, '', {}, (message: any) => {
				cb(message.targetId);
				close();
			});
		} else {
			cb(item.id);
		};
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $('#' + getId() + ' .content');
		const height = Math.max(HEIGHT * 2, Math.min(280, items.length * HEIGHT + 58));

		obj.css({ height: height });
		position();
	};

});

export default MenuDataviewObjectList;