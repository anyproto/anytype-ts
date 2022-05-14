import * as React from 'react';
import { Filter, MenuItemVertical } from 'ts/component';
import { I, Util, Key, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends I.Menu {}

const $ = require('jquery');
const Constant = require('json/constant.json');

const HEIGHT = 28;
const HEIGHT_DESCRIPTION = 56;
const LIMIT = 10;

const MenuSelect = observer(class MenuSelect extends React.Component<Props, {}> {

	_isMounted: boolean = false;	
	n: number = 0;
	cache: any = null;
	filter: string = '';
	refFilter: any = null;
	refList: any = null;
	top: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter, value, noFilter } = data;
		const options = this.getItemsWithoutFilter();
		const items = this.getItems();
		const withFilter = !noFilter && (options.length > LIMIT);

		const rowRenderer = (param: any) => {
			const item = items[param.index];
			const cn = [];
			if (item.isInitial) {
				cn.push('isInitial');
			};
			if (item.isHidden) {
				cn.push('isHidden');
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
					<MenuItemVertical 
						{...item} 
						icon={item.icon}
						className={cn.join(' ')} 
						isActive={item.id == value} 
						checkbox={item.id == value} 
						onClick={(e: any) => { this.onClick(e, item); }} 
						onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
						style={param.style}
					/>
				</CellMeasurer>
			);
		};
		
		return (
			<React.Fragment>
				{withFilter ? (
					<Filter 
						ref={(ref: any) => { this.refFilter = ref; }} 
						value={filter}
						onChange={this.onFilterChange} 
					/>
				) : ''}
				
				{!items.length ? (
					<div className="item empty">No options found</div>
				) : ''}

				<div className="items">
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={() => {}}
						isRowLoaded={({ index }) => index < items.length}
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
										rowHeight={({ index }) => { return this.rowHeight(items[index]); }}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										onScroll={this.onScroll}
										overscanRowCount={10}
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				</div>
			</React.Fragment>
		);
	};
	
	componentDidMount () {
		const { param, setActive } = this.props;
		const { data } = param;
		const { value, noKeys } = data;
		const items = this.getItems();
		
		this._isMounted = true;
		if (!noKeys) {
			this.rebind();
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});
		
		let active = items.find((it: any) => { return it.id == value });
		if (!active) {
			active = items[0];
		};

		if (active && !active.isInitial) {
			window.setTimeout(() => { setActive(active, true); }, 15);
		};

		this.focus();
		this.resize();
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;

		if (this.filter != filter) {
			this.filter = filter;
			this.n = -1;
			this.top = 0;
		};

		if (this.refList) {
			this.refList.scrollToPosition(this.top);
		};

		this.focus();
		this.resize();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	focus () {
		window.setTimeout(() => { 
			if (this.refFilter) {
				this.refFilter.focus(); 
			};
		}, 15);
	};

	getItemsWithoutFilter () {
		const { param } = this.props;
		const { data } = param;

		return (data.options || []).filter((it: any) => { return it; });
	};
	
	getItems () {
		const { param } = this.props;
		const { data } = param;
		const filter = new RegExp(Util.filterFix(data.filter), 'gi');

		let items = this.getItemsWithoutFilter();
		if (data.filter) {
			items = items.filter((it: any) => { return it.name.match(filter); });
		};
		return items || [];
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
			this.onOver(e, item);
		};
	};
	
	onOver (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { canSelectInitial, onOver } = data;

		if (item.isInitial && !canSelectInitial) {
			return;
		};

		if (onOver) {
			onOver(e, item);
		};
	};
	
	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect, canSelectInitial, noClose } = data;

		if (item.isInitial && !canSelectInitial) {
			return;
		};

		if (!noClose) {
			close();
		};
		
		if (onSelect) {
			onSelect(e, item);
		};
	};

	onFilterChange (v: string) {
		this.props.param.data.filter = v;
	};

	onScroll ({ clientHeight, scrollHeight, scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	resize () {
		const { position, getId, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const options = this.getItemsWithoutFilter();
		const items = this.getItems();
		const obj = $(`#${getId()}`);
		const content = obj.find('.content');
		const withFilter = !noFilter && (options.length > LIMIT);
		const offset = (withFilter ? 44 : 0) + (items.length <= LIMIT ? 16 : 0);

		let height = offset;
		for (let i = 0; i < items.length; ++i) {
			height += this.rowHeight(items[i]);
		};
		height = Math.max(44, Math.min(360, height));

		content.css({ height });
		withFilter ? obj.addClass('withFilter') : obj.removeClass('withFilter');

		position();
	};

	rowHeight (item: any) {
		return item.withDescription ? HEIGHT_DESCRIPTION : HEIGHT;
	};

});

export default MenuSelect;