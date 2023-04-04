import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, MenuItemVertical } from 'Component';
import { I, Util, Relation, keyboard } from 'Lib';

const HEIGHT_ITEM = 28;
const HEIGHT_SECTION = 28;
const HEIGHT_DESCRIPTION = 56;
const HEIGHT_DIV = 16;
const LIMIT = 10;

const MenuSelect = observer(class MenuSelect extends React.Component<I.Menu> {

	_isMounted = false;	
	n = -1;
	cache: any = null;
	filter = '';
	refFilter: any = null;
	refList: any = null;
	top = 0;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterKeyUp = this.onFilterKeyUp.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter, value, disabled, placeholder } = data;
		const items = this.getItems(true);
		const withFilter = this.isWithFilter();

		items.forEach((item: any) => {
			const { switchValue } = item;
		});

		const rowRenderer = (param: any) => {
			const item = items[param.index];
			const cn = [];

			if (item.isInitial) {
				cn.push('isInitial');
			};
			if (item.isHidden) {
				cn.push('isHidden');
			};
			if (disabled) {
				cn.push('disabled');
			};

			let content = null;
			if (item.isSection) {
				content = <div className={[ 'sectionName', (param.index == 0 ? 'first' : '') ].join(' ')} style={param.style}>{item.name}</div>;
			} else
			if (item.isDiv) {
				content = (
					<div className="separator" style={param.style}>
						<div className="inner" />
					</div>
				);
			} else {
				content = (
					<MenuItemVertical 
						{...item} 
						icon={item.icon}
						className={cn.join(' ')} 
						checkbox={this.isActive(item)} 
						onClick={(e: any) => { this.onClick(e, item); }} 
						onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
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
			<React.Fragment>
				{withFilter ? (
					<Filter 
						ref={ref => { this.refFilter = ref; }} 
						value={filter}
						placeholder={placeholder}
						onChange={this.onFilterChange}
						onKeyUp={this.onFilterKeyUp}
					/>
				) : ''}
				
				{!items.length ? (
					<div className="item empty">No options found</div>
				) : ''}

				<div className="items">
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={() => {}}
						isRowLoaded={({ index }) => !!items[index]}
					>
						{({ onRowsRendered, registerChild }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={ref => { this.refList = ref; }}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={({ index }) => this.getRowHeight(items[index])}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										onScroll={this.onScroll}
										scrollToAlignment="center"
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
		const items = this.getItems(true);
		const withFilter = this.isWithFilter();
		
		this._isMounted = true;
		if (!noKeys) {
			this.rebind();
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});
		
		let active = value ? items.find(it => it.id == value) : null;
		if (!active && items.length && !withFilter) {
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
		const withFilter = this.isWithFilter();

		if (withFilter && (this.filter != filter)) {
			this.filter = filter;
			this.n = -1;
			this.top = 0;
		};

		if (this.refList) {
			this.refList.scrollToPosition(this.top);
		};

		if (this.n == -1) {
			this.focus();
		};
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
		$(window).off('keydown.menu');
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

		return (data.options || []).filter(it => it);
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;

		return (data.sections || []);
	};
	
	getItems (withSections: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { preventFilter } = data;
		const sections = this.getSections();

		let items: any[] = [];

		if (sections && sections.length) {
			for (let section of sections) {
				if (withSections) {
					items.push({ id: section.id, name: section.name, isSection: true });
				};
				items = items.concat(section.children);
			};
		} else {
			items = this.getItemsWithoutFilter();
		};

		if (data.filter && !preventFilter) {
			const filter = new RegExp(Util.filterFix(data.filter), 'gi');

			items = items.filter(it => String(it.name || '').match(filter));
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
		const { onSelect, canSelectInitial, noClose, disabled } = data;

		if (item.isInitial && !canSelectInitial) {
			return;
		};

		if (!noClose) {
			close();
		};
		
		if (!disabled && onSelect) {
			onSelect(e, item);
		};
	};

	onSwitch (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSwitch } = data;

		if (onSwitch) {
			onSwitch(e, item);
		};
	};

	onFilterChange (v: string) {
		this.props.param.data.filter = v;
	};

	onFilterKeyUp (e: React.KeyboardEvent, v: string) {
		const { param } = this.props;
		const { data } = param;
		const { onFilterKeyUp } = data;

		if (onFilterKeyUp) {
			onFilterKeyUp(e, v);
		};
	};

	getRowHeight (item: any) {
		if (item.isDiv) return HEIGHT_DIV;
		if (item.isSection) return HEIGHT_SECTION;
		if (item.withDescription) return HEIGHT_DESCRIPTION;
		return HEIGHT_ITEM;
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	isWithFilter () {
		const { param } = this.props;
		const { data } = param;
		const { noFilter, withFilter } = data;

		if (withFilter) {
			return true;
		};

		const options = this.getItemsWithoutFilter().filter(it => !it.isDiv);
		return !noFilter && (options.length > LIMIT);
	};

	updateOptions (options: any[]) {
		this.props.param.data.options = options;
	};

	isActive (item: any) {
		const { param } = this.props;
		const { data } = param;
		const value = Relation.getArrayValue(data.value);

		return item.checkbox || value.includes(String(item.id));
	};

	resize () {
		const { position, getId, param } = this.props;
		const { data } = param;
		const { noScroll } = data;
		const items = this.getItems(true);
		const obj = $(`#${getId()}`);
		const content = obj.find('.content');
		const withFilter = this.isWithFilter();
		
		let height = 0;
		if (withFilter) {
			height += 60;
		};
		if (!withFilter || noScroll) {
			height += 16;
		};

		if (!items.length) {
			height += HEIGHT_ITEM;
		} else {
			items.forEach(it => { height += this.getRowHeight(it); });
		};

		if (!noScroll) {
			height = Math.min(370, height);
		};
		height = Math.max(44, height);

		content.css({ height });
		withFilter ? obj.addClass('withFilter') : obj.removeClass('withFilter');

		position();
	};

});

export default MenuSelect;