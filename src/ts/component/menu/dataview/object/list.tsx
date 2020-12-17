import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, C, DataUtil, Util, Key, keyboard } from 'ts/lib';
import { dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {};

interface State {
	n: number;
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT = 28;
const LIMIT = 20;

@observer
class MenuDataviewObjectList extends React.Component<Props, State> {

	state = {
		loading: false,
		n: 0,
	};

	_isMounted: boolean = false;	
	filter: string = '';
	cache: any = null;
	offset: number = 0;
	items: any[] = [];

	constructor (props: any) {
		super(props);
		
		this.loadMoreRows = this.loadMoreRows.bind(this);
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const { n } = this.state;
		const items = this.getItems();

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const objectType: any = dbStore.getObjectType(item.type) || {};
			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					<MenuItemVertical 
						id={item.id}
						object={item}
						name={item.name}
						onMouseEnter={(e: any) => { this.onOver(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }}
						withCaption={true}
						caption={objectType.name}
						style={param.style}
					/>
				</CellMeasurer>
			);
		};

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
								<List
									ref={registerChild}
									width={width}
									height={height}
									deferredMeasurmentCache={this.cache}
									rowCount={items.length}
									rowHeight={HEIGHT}
									rowRenderer={rowRenderer}
									onRowsRendered={onRowsRendered}
									overscanRowCount={LIMIT}
									scrollToIndex={n}
								/>
							)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();
		this.load();
	};

	componentDidUpdate () {
		const { n } = this.state;
		const items = this.getItems();
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;

		if (filter != this.filter) {
			this.offset = 0;
			this.filter = filter;
			this.load();
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		this.resize();
		this.setActive(items[n]);
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getItems () {
		return this.items;
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		const { n } = this.state;
		this.props.setActiveItem((item ? item : items[n]), scroll);
	};

	load (callBack?: (message: any) => void) {
		const { param } = this.props;
		const { data } = param;
		const { types, filter } = data;
		const filters = [
			{ relationKey: 'type', operator: I.FilterOperator.And, condition: I.FilterCondition.In, value: types },
		];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		this.setState({ loading: true });

		C.ObjectSearch(filters, sorts, filter, this.offset, 1000000, (message: any) => {
			if (callBack) {
				callBack(message);
			};

			this.items = this.items.concat(message.records.map((it: any) => {
				it.name = String(it.name || Constant.default.name);
				return it;
			}));

			this.setState({ loading: false });
		});
	};

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += LIMIT;
			this.load(resolve);
		});
	};

	filterItems (): any[] {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		
		if (!filter) {
			return this.items;
		};

		const reg = new RegExp(filter.split(' ').join('[^\s]*|') + '[^\s]*', 'i');
		return this.items.filter((it: any) => { return it.name.match(reg); });
	};

	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();
		keyboard.disableMouse(true);

		let { n } = this.state;
		
		const k = e.key.toLowerCase();
		const items = this.getItems();
		const l = items.length;
		const item = items[n];

		switch (k) {
			case Key.up:
				e.preventDefault();
				n--;
				if (n < 0) {
					n = l - 1;
				};
				this.setState({ n: n });
				this.setActive(null, true);
				break;
				
			case Key.down:
				e.preventDefault();
				n++;
				if (n > l - 1) {
					n = 0;
				};
				this.setState({ n: n });
				this.setActive(null, true);
				break;
				
			case Key.tab:
			case Key.enter:
				e.preventDefault();
				if (item) {
					this.onClick(e, item);
				};
				break;
				
			case Key.escape:
				this.props.close();
				break;
		};
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		if (!item || item.isSection) {
			this.props.close();
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;

		let value = Util.objectCopy(data.value || []);
		value.push(item.key);
		value = Util.arrayUnique(value);

		this.props.param.data.value = value;
		onChange(value);

		this.props.close();
	};

	resize () {
		const { id, position } = this.props;
		const items = this.getItems();
		const obj = $('#' + Util.toCamelCase('menu-' + id) + ' .content');
		const height = Math.max(HEIGHT * 2, Math.min(240, items.length * HEIGHT + 16));

		obj.css({ height: height });
		position();
	};

};

export default MenuDataviewObjectList;