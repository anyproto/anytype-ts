import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, MenuItemVertical, Label, Icon } from 'Component';
import { I, U, Relation, keyboard, translate } from 'Lib';

const HEIGHT_ITEM = 28;
const HEIGHT_ITEM_BIG = 56;
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
		const { filter, value, disabled, placeholder, noVirtualisation, menuLabel } = data;
		const items = this.getItems(true);
		const withFilter = this.isWithFilter();

		items.forEach((item: any) => {
			const { switchValue } = item;
		});

		const Item = (item) => {
			const cn = [];

			let content = null;
			if (item.id == 'add') {
				content = (
					<div
						id="item-add"
						className="item add"
						onMouseEnter={e => this.onMouseEnter(e, item)}
						onClick={e => this.onClick(e, item)}
						style={item.style}
					>
						<Icon className="plus" />
						<div className="name">{item.name}</div>
					</div>
				);
			} else {
				if (item.className) {
					cn.push(item.className);
				};
				if (item.isInitial) {
					cn.push('isInitial');
				};
				if (item.isHidden) {
					cn.push('isHidden');
				};
				if (disabled) {
					cn.push('disabled');
				};

				content = (
					<MenuItemVertical 
						{...item} 
						icon={item.icon}
						className={cn.join(' ')} 
						checkbox={this.isActive(item)} 
						onClick={e => this.onClick(e, item)} 
						onMouseEnter={e => this.onMouseEnter(e, item)} 
						style={item.style}
					/>
				);
			};

			return content;
		};

		let content = null;
		if (noVirtualisation) {
			content = (
				<>
					{items.map((item, i) => (
						<Item {...item} key={i} index={i} />
					))}
				</>
			);
		} else {
			const rowRenderer = (param: any) => (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					<Item {...items[param.index]} index={param.index} style={param.style} />
				</CellMeasurer>
			);

			content = (
				<InfiniteLoader
					rowCount={items.length}
					loadMoreRows={() => {}}
					isRowLoaded={({ index }) => !!items[index]}
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
									onScroll={this.onScroll}
									scrollToAlignment="center"
									overscanRowCount={10}
								/>
							)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			);
		};
		
		return (
			<>
				{withFilter ? (
					<Filter 
						ref={ref => this.refFilter = ref}
						className="outlined"
						value={filter}
						placeholder={placeholder}
						onChange={this.onFilterChange}
						onKeyUp={this.onFilterKeyUp}
						focusOnMount={true}
					/>
				) : ''}

				{menuLabel ? (
					<Label className="menuLabel" text={menuLabel} />
				) : ''}
				
				<div className="items">
					{content}
				</div>
			</>
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
			window.setTimeout(() => setActive(active, true), 15);
		};

		this.resize();
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const withFilter = this.isWithFilter();
		const items = this.getItems(true);

		if (withFilter && (this.filter != filter)) {
			this.filter = filter;
			this.n = -1;
			this.top = 0;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});

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
		this.unbind();
	};
	
	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
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
		const { preventFilter, withAdd } = data;
		const sections = this.getSections();

		let items: any[] = [];

		if (sections && sections.length) {
			for (const section of sections) {
				if (withSections) {
					items.push({ id: section.id, name: section.name, isSection: true });
				};
				items = items.concat(section.children);
			};
		} else {
			items = this.getItemsWithoutFilter();
		};

		if (data.filter && !preventFilter) {
			const filter = new RegExp(U.Common.regexEscape(data.filter), 'gi');

			items = items.filter(it => String(it.name || '').match(filter));
		};

		if (!items.length) {
			items.push({ id: 'empty', name: translate('menuSelectEmpty'), className: 'empty', isEmpty: true });
		};

		if (withAdd) {
			items = items.concat([
				{ isDiv: true },
				{ id: 'add', name: translate('commonAddRelation') }
			]);
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

		if (item.isSection || (item.isInitial && !canSelectInitial)) {
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
		if (item.isBig) return HEIGHT_ITEM_BIG;
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

		if (undefined !== item.checkbox) {
			return item.checkbox;
		};

		return value.includes(String(item.id));
	};

	resize () {
		const { position, getId, param } = this.props;
		const { data } = param;
		const { noScroll, maxHeight, noVirtualisation, withAdd } = data;
		const items = this.getItems(true);
		const obj = $(`#${getId()}`);
		const content = obj.find('.content');
		const withFilter = this.isWithFilter();
		
		if (!noScroll) {
			let height = 0;
			if (withFilter) {
				height += 52;
			};
			if (!withFilter) {
				height += 16;
			};

			if (!items.length) {
				height += HEIGHT_ITEM;
			} else {
				height = items.reduce((res: number, current: any) => res + this.getRowHeight(current), height);
			};

			height = Math.min(maxHeight || 370, height);
			height = Math.max(44, height);

			content.css({ height });
		};

		obj.toggleClass('withFilter', Boolean(withFilter));
		obj.toggleClass('withAdd', Boolean(withAdd));
		obj.toggleClass('noScroll', Boolean(noScroll));
		obj.toggleClass('noVirtualisation', Boolean(noVirtualisation));

		position();
	};

});

export default MenuSelect;
