import * as React from 'react';
import { Icon, Tag, Filter } from 'ts/component';
import { I, Util, DataUtil, keyboard, Key } from 'ts/lib';
import arrayMove from 'array-move';
import { commonStore, menuStore } from 'ts/store';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

interface Props extends I.Menu {}

interface State {
	n: number;
}

const $ = require('jquery');
const MENU_ID = 'dataviewOptionValues';
const HEIGHT = 28;
const LIMIT = 40;

const MenuOptionList = observer(class MenuOptionList extends React.Component<Props, State> {
	
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
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const relation = data.relation.get();
		const { n } = this.state;
		const value = data.value || [];
		const items = this.getItems(true);

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const active = value.indexOf(item.id) >= 0;
			
			let content = null;
			if (item.id == 'add') {
				content =  (
					<div id="item-add" className="item add" onClick={(e: any) => { this.onClick(e, item); }} style={param.style}>
						<Icon className="plus" />
						<div className="name">{item.name}</div>
					</div>
				);
			} else 
			if (item.isSection) {
				content = (<div className="sectionName" style={param.style}>{item.name}</div>);
			} else {
				content = (
					<div id={'item-' + item.id} className="item" onClick={(e: any) => { this.onClick(e, item); }} style={param.style}>
						<div className="clickable">
							<Tag text={item.text} color={item.color} className={DataUtil.tagClass(relation.format)} />
						</div>
						<div className="buttons">
							<Icon className="more" onClick={(e: any) => { this.onEdit(e, item); }} />
						</div>
						{active ? <Icon className="chk" /> : ''}
					</div>
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
					ref={(ref: any) => { this.ref = ref; }} 
					placeholderFocus="Filter or create options..." 
					value={filter}
					onChange={this.onFilterChange} 
				/>

				<div className="items">
					{items.length ? (
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
											overscanRowCount={10}
											scrollToIndex={n}
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					) : (
						<div className="item empty">
							No options available
						</div>
					)}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const items = this.getItems(true);

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
		const items = this.getItems(false);

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
		const { getId } = this.props;
		const win = $(window);
		const obj = $(`#${getId()}`);

		this.unbind();

		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		obj.on('click', () => { menuStore.close('dataviewOptionEdit'); });
	};
	
	unbind () {
		const { getId } = this.props;
		const win = $(window);
		const obj = $(`#${getId()}`);

		win.unbind('keydown.menu');
		obj.unbind('click');
	};

	setActive (item?: any, scroll?: boolean) {
		const items = this.getItems(false);
		const { n } = this.state;
		this.props.setHover((item ? item : items[n]), scroll);
	};

	onFilterChange (v: string) {
		this.props.param.data.filter = v;
	};

	onClick (e: any, item: any) {
		item.id == 'add' ? this.onOptionAdd() : this.onValueAdd(item.id);
	};

	onValueAdd (id: string) {
		const { param, close } = this.props;
		const { data } = param;
		const { onChange, maxCount } = data;

		let value = DataUtil.getRelationArrayValue(data.value);
		value.push(id);
		value = Util.arrayUnique(value);

		if (maxCount) {
			value = value.slice(value.length - maxCount, value.length);

			if (maxCount == 1) {
				close();
			};
		};

		data.value = value;
		menuStore.updateData(MENU_ID, { value: value });

		onChange(value);
	};

	onOptionAdd () {
		const { param } = this.props;
		const { data } = param;
		const { filter, rootId, blockId, record, optionCommand } = data;
		const relation = data.relation.get();
		const colors = DataUtil.menuGetBgColors();
		const option = { text: filter, color: colors[Util.rand(1, colors.length - 1)].value };

		if (!option.text) {
			return;
		};

		optionCommand('add', rootId, blockId, relation.relationKey, record.id, option, (message: any) => {
			if (message.error.code) {
				return;
			};

			this.ref.setValue('');
			this.onFilterChange('');
			this.onValueAdd(message.option.id);

			window.setTimeout(() => { this.resize(); }, 50);
		});
	};
	
	onEdit (e: any, item: any) {
		e.stopPropagation();

		const { param, getId } = this.props;
		const { data, classNameWrap } = param;

		menuStore.close('dataviewOptionEdit', () => {
			menuStore.open('dataviewOptionEdit', { 
				element: `#${getId()} #item-${item.id}`,
				offsetX: 288,
				vertical: I.MenuDirection.Center,
				passThrough: true,
				noFlipY: true,
				noAnimation: true,
				classNameWrap: classNameWrap,
				data: {
					...data,
					option: item,
				}
			});
		});
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const relation = data.relation.get();

		relation.selectDict = arrayMove(relation.selectDict, oldIndex, newIndex);
		data.relation.set(relation);
		DataUtil.dataviewRelationUpdate(rootId, blockId, relation);

		menuStore.updateData(this.props.id, { relation: observable.box(relation) });
	};

	getItems (withSections: boolean): I.SelectOption[] {
		const { param } = this.props;
		const { data } = param;
		const { canAdd, filterMapper } = data;
		const relation = data.relation.get();
		const value = DataUtil.getRelationArrayValue(data.value);

		let items = Util.objectCopy(relation.selectDict || []);
		let sections: any = {};
		let ret = [];

		sections[I.OptionScope.Local] = { id: I.OptionScope.Local, name: 'In this object', children: [] };
		sections[I.OptionScope.Relation] = { id: I.OptionScope.Relation, name: 'Everywhere', children: [] };
		sections[I.OptionScope.Format] = { id: I.OptionScope.Format, name: 'Suggested', children: [] };

		if (filterMapper) {
			items = items.filter(filterMapper);
		};

		if (data.filter) {
			const filter = new RegExp(Util.filterFix(data.filter), 'gi');
			const check = items.filter((it: I.SelectOption) => { return it.text.toLowerCase() == data.filter.toLowerCase(); });

			items = items.filter((it: I.SelectOption) => { return it.text.match(filter); });

			if (canAdd && !check.length) {
				ret.unshift({ id: 'add', name: `Create option "${data.filter}"` });
			};
		};

		items = items.filter((it: I.SelectOption) => { return value.indexOf(it.id) < 0; });

		for (let item of items) {
			if (!sections[item.scope]) {
				continue;
			};
			sections[item.scope].children.push(item);
		};

		for (let i in sections) {
			let section = sections[i];
			if (!section.children.length) {
				continue;
			};
			if (withSections) {
				ret.push({ id: section.id, name: section.name, isSection: true });
			};
			ret = ret.concat(section.children);
		};

		return ret;
	};

	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();
		keyboard.disableMouse(true);

		let { n } = this.state;
		
		const k = e.key.toLowerCase();
		const items = this.getItems(false);
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
		const items = this.getItems(true);
		const obj = $(`#${getId()} .content`);
		const offset = 58;
		const height = Math.max(HEIGHT + offset, Math.min(280, items.length * HEIGHT + offset));

		obj.css({ height: height });
		position();
	};
	
});

export default MenuOptionList;