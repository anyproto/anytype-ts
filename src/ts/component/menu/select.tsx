import * as React from 'react';
import { Filter, MenuItemVertical } from 'ts/component';
import { I, Util, Key, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {};

const $ = require('jquery');

const HEIGHT = 28;
const LIMIT = 10;

@observer
class MenuSelect extends React.Component<Props, {}> {

	_isMounted: boolean = false;	
	n: number = 0;
	cache: any = null;
	ref: any = null;
	
	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const filter = new RegExp(Util.filterFix(data.filter), 'gi');

		let options = data.options || [];
		if (data.filter) {
			options = options.filter((it: any) => {
				return it.name.match(filter);
			});
		};

		const idx = options.findIndex((it: I.Option) => { return it.id == value; });
		const scrollTo = Math.min(idx + LIMIT - 1, options.length - 1);

		const rowRenderer = (param: any) => {
			const item = options[param.index];
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
						className={item.isInitial ? 'initial' : ''} 
						isActive={item.id == value} 
						onClick={(e: any) => { this.onSelect(e, item); }} 
						onMouseEnter={(e: any) => { this.onOver(e, item); }} 
						style={param.style}
					/>
				</CellMeasurer>
			);
		};
		
		return (
			<div className="items">
				<Filter ref={(ref: any) => { this.ref = ref; }} onChange={this.onFilterChange} />

				<InfiniteLoader
					rowCount={options.length}
					loadMoreRows={() => {}}
					isRowLoaded={({ index }) => index < options.length}
				>
					{({ onRowsRendered, registerChild }) => (
						<AutoSizer className="scrollArea">
							{({ width, height }) => (
								<List
									ref={registerChild}
									width={width}
									height={height}
									deferredMeasurmentCache={this.cache}
									rowCount={options.length}
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
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { options, value, noKeys } = data;
		
		this._isMounted = true;
		if (!noKeys) {
			this.rebind();
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (options[i] || {}).id; },
		});
		
		const active = options.find((it: any) => { return it.id == value });
		if (active && !active.isInitial) {
			window.setTimeout(() => { this.setActive(active, true); }, 210);
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
		const { options } = data;
		
		return options || [];
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id; });
		};
		this.props.setHover(items[this.n], scroll);
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
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
				this.setActive(null, true);
				break;
				
			case Key.down:
				e.preventDefault();
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, true);
				break;
			
			case Key.tab:
			case Key.enter:
			case Key.space:
				e.preventDefault();
				if (item) {
					this.onSelect(e, item);
				};
				break;
				
			case Key.escape:
				e.preventDefault();
				this.props.close();
				break;
		};
	};

	onOver (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { canSelectInitial } = data;

		if (item.isInitial && !canSelectInitial) {
			return;
		};

		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};
	
	onSelect (e: any, item: any) {
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
		const { position, getId } = this.props;
		const items = this.getItems();
		const obj = $('#' + getId() + ' .content');
		const height = Math.max(HEIGHT * 2, Math.min(HEIGHT * LIMIT, items.length * HEIGHT + 16));

		obj.css({ height: height });
		position();
	};

};

export default MenuSelect;