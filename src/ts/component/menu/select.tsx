import * as React from 'react';
import { Filter, MenuItemVertical } from 'ts/component';
import { I, Util, Key, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {}

const $ = require('jquery');
const Constant = require('json/constant.json');

const HEIGHT = 28;
const LIMIT = 10;

const MenuSelect = observer(class MenuSelect extends React.Component<Props, {}> {

	_isMounted: boolean = false;	
	n: number = 0;
	cache: any = null;
	ref: any = null;
	
	constructor (props: any) {
		super(props);
		
		this.onFilterChange = this.onFilterChange.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter, value, noFilter } = data;
		const items = this.getItems();
		const idx = items.findIndex((it: I.Option) => { return it.id == value; });
		const withFilter = !noFilter && (items.length > LIMIT);

		let scrollTo = idx + 1; 
		if (idx > LIMIT) {
			scrollTo = Math.min(idx + LIMIT - 3, items.length - 1);
		};

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
						onMouseEnter={(e: any) => { this.onOver(e, item); }} 
						style={param.style}
					/>
				</CellMeasurer>
			);
		};
		
		return (
			<React.Fragment>
				{withFilter ?
					<Filter 
						ref={(ref: any) => { this.ref = ref; }} 
						value={filter}
						onChange={this.onFilterChange} 
					/>
				: ''}
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
										ref={registerChild}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={HEIGHT}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={10}
										scrollToIndex={scrollTo}
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
			window.setTimeout(() => { setActive(active, true); }, Constant.delay.menu);
		};

		this.focus();
		this.resize();
	};

	componentDidUpdate () {
		this.focus();
		this.resize();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	focus () {
		window.setTimeout(() => { 
			if (this.ref) {
				this.ref.focus(); 
			};
		}, 15);
	};
	
	getItems () {
		const { param } = this.props;
		const { data } = param;
		const filter = new RegExp(Util.filterFix(data.filter), 'gi');

		let items = (data.options || []).filter((it: any) => { return it; });
		if (data.filter) {
			items = items.filter((it: any) => { return it.name.match(filter); });
		};
		return items || [];
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
		const { setActive } = this.props;
		const k = e.key.toLowerCase();
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		switch (k) {
			case Key.up:
				e.preventDefault();
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				setActive(null, true);
				break;
				
			case Key.down:
				e.preventDefault();
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				setActive(null, true);
				break;
			
			case Key.tab:
			case Key.enter:
			case Key.space:
				e.preventDefault();
				if (item) {
					item.arrow ? this.onOver(e, item) : this.onClick(e, item);
				};
				break;

			case Key.right:
				e.preventDefault();

				if (item) {
					this.onOver(e, item);
				};
				break;

			case Key.left:	
			case Key.escape:
				e.preventDefault();
				this.props.close();
				break;
		};
	};

	onOver (e: any, item: any) {
		const { param, setActive } = this.props;
		const { data } = param;
		const { canSelectInitial, onMouseEnter } = data;

		if (item.isInitial && !canSelectInitial) {
			return;
		};

		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};

		if (onMouseEnter) {
			onMouseEnter(e, item);
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

	resize () {
		const { position, getId, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const items = this.getItems();
		const obj = $('#' + getId());
		const content = obj.find('.content');

		const length = Math.max(items.length, 1);
		const withFilter = !noFilter && (length > LIMIT);

		let offset = withFilter ? 50 : 8;
		if (length <= LIMIT) {
			offset += 8;
		};

		const height = Math.max(44, Math.min(HEIGHT * LIMIT + offset, length * HEIGHT + offset));

		content.css({ height: height });
		withFilter ? obj.addClass('withFilter') : obj.removeClass('withFilter');

		position();
	};

});

export default MenuSelect;