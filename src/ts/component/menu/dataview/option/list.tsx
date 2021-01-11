import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Tag, Input } from 'ts/component';
import { I, C, Util, DataUtil, translate, keyboard, Key } from 'ts/lib';
import arrayMove from 'array-move';
import { commonStore } from 'ts/store';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

interface Props extends I.Menu {};

interface State {
	n: number;
};

const $ = require('jquery');
const MENU_ID = 'dataviewOptionValues';
const HEIGHT = 28;
const LIMIT = 20;

@observer
class MenuOptionList extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	ref: any = null;
	cache: any = {};
	state = {
		n: 0,
	};
	
	constructor (props: any) {
		super(props);
		
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const { n } = this.state;
		const value = data.value || [];
		const items = this.getItems();

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
						{item.id == 'add' ? (
							<div id="item-add" className="item add" onClick={(e: any) => { this.onClick(e, item); }}>
								<Icon className="plus" />
								<div className="name">Create option "{filter}"</div>
							</div>
						) : (
							<div id={'item-' + item.id} className="item" onClick={(e: any) => { this.onClick(e, item); }}>
								<Tag text={item.text} color={item.color} />
								<Icon className="more" onClick={(e: any) => { this.onEdit(e, item); }} />
							</div>
						)}
				</CellMeasurer>
			);
		};

		return (
			<div className="wrap">
				<div className="filter">
					<Input id="filter-input" ref={(ref: any) => { this.ref = ref; }} placeHolder={translate('commonFilterClick')} onFocus={this.onFocus} onBlur={this.onBlur} onChange={this.onFilterChange} />
				</div>

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
			</div>
		);
	};
	
	componentDidMount () {
		const items = this.getItems();

		this._isMounted = true;
		this.focus();
		this.rebind();
		this.resize();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		this.forceUpdate();
	};

	componentDidUpdate () {
		const { n } = this.state;
		const items = this.getItems();

		this.props.position();
		this.resize();
		this.setActive(items[n]);
	};

	componentWillUnmount () {
		const { param } = this.props;
		const { data } = param;
		const { rebind } = data;

		this._isMounted = false;
		this.unbind();
		
		if (rebind) {
			rebind();
		};
	};

	focus () {
		window.setTimeout(() => { 
			if (this.ref) {
				this.ref.focus(); 
			};
		}, 15);
	};

	rebind () {
		this.unbind();

		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		const { n } = this.state;
		this.props.setHover((item ? item : items[n]), scroll);
	};

	onFilterChange (e: any, v: string) {
		this.props.param.data.filter = v;
	};

	onFocus () {
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#filter-input');

		input.attr({ placeHolder: 'Filter objects...' });
	};

	onBlur () {
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#filter-input');

		input.attr({ placeHolder: translate('commonFilterClick') });
	};

	onClick (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;

		if (item.id == 'add') {
			this.onAdd(e);
		} else {
			let value = Util.objectCopy(data.value || []);
			value.push(item.id);
			value = Util.arrayUnique(value);

			this.props.param.data.value = value;

			commonStore.menuUpdateData(MENU_ID, { value: value });
			onChange(value);
		};
	};

	onAdd (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { filter, rootId, blockId } = data;
		const relation = data.relation.get();

		C.BlockDataviewRelationSelectOptionAdd(rootId, blockId, relation.relationKey, { text: filter });
	};
	
	onEdit (e: any, item: any) {
		e.stopPropagation();

		const { param, getId } = this.props;
		const { data } = param;

		commonStore.menuOpen('dataviewOptionEdit', { 
			type: I.MenuType.Vertical,
			element: '#' + getId() + ' #tag-' + item.id,
			offsetX: 288,
			offsetY: 0,
			vertical: I.MenuDirection.Center,
			horizontal: I.MenuDirection.Left,
			data: {
				...data,
				option: item,
			}
		});
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const relation = data.relation.get();
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == this.props.id; });

		relation.selectDict = arrayMove(relation.selectDict, oldIndex, newIndex);
		data.relation.set(relation);
		DataUtil.dataviewRelationUpdate(rootId, blockId, relation);

		if (menu) {
			menu.param.data.relation = observable.box(relation);
			commonStore.menuUpdate(this.props.id, menu.param);
		};
	};

	getItems (): I.SelectOption[] {
		const { param } = this.props;
		const { data } = param;
		const relation = data.relation.get();
		const filter = new RegExp(Util.filterFix(data.filter), 'gi');

		let items = relation.selectDict || [];

		if (data.filter) {
			items = items.filter((it: I.SelectOption) => { return it.text.match(filter); });
			items.unshift({ id: 'add' });
		};

		return items;
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

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $('#' + getId() + ' .content');
		const height = Math.max(HEIGHT * 2, Math.min(280, items.length * HEIGHT + 58));

		obj.css({ height: height });
		position();
	};
	
};

export default MenuOptionList;