import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, MenuItemVertical, Icon, Loader } from 'Component';
import { I, UtilCommon, Relation, keyboard, UtilData, UtilObject, UtilFile, translate } from 'Lib';
import { commonStore, menuStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	loading: boolean;
};

const HEIGHT = 28;
const MENU_ID = 'dataviewFileValues';
const LIMIT_HEIGHT = 20;

const MenuDataviewFileList = observer(class MenuDataviewFileList extends React.Component<I.Menu, State> {

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
		const { filter } = data;
		const items = this.getItems();

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			if (!item) {
				return null;
			};

			const type = dbStore.getType(item.type);

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
						name={UtilFile.name(item)}
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
			<div className="wrap">
				<Filter 
					ref={ref => this.refFilter = ref} 
					placeholderFocus={translate('commonFilterObjects')}
					value={filter}
					onChange={this.onFilterChange} 
				/>

				{loading ? <Loader /> : (
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
											rowHeight={HEIGHT}
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
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;

		if (filter != this.filter) {
			this.n = -1;
			this.offset = 0;
			this.filter = filter;
			this.load(true);
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (items[i] || {}).id,
		});

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};
		this.resize();
		this.focus();

		this.props.setActive();
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
		$(window).off('keydown.menu');
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const value = Relation.getArrayValue(data.value);

		return UtilCommon.objectCopy(this.items).filter(it => !value.includes(it.id));
	};
	
	load (clear: boolean, callBack?: (message: any) => void) {
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const { types, filter } = data;
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: [ I.ObjectLayout.File, I.ObjectLayout.Image ] }
		];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

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
		const { onChange, maxCount } = data;

		e.preventDefault();
		e.stopPropagation();

		if (!item) {
			close();
			return;
		};

		let value = Relation.getArrayValue(data.value);
		value.push(item.id);
		value = UtilCommon.arrayUnique(value);

		if (maxCount) {
			value = value.slice(value.length - maxCount, value.length);
		};

		onChange(value, () => {
			menuStore.updateData(this.props.id, { value });
			menuStore.updateData(MENU_ID, { value });
			position();
		});
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const height = Math.max(HEIGHT * 2, Math.min(360, items.length * HEIGHT + 58));

		obj.css({ height: height });
		position();
	};

});

export default MenuDataviewFileList;