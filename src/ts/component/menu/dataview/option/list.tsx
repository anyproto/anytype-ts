import * as React from 'react';
import { Icon, Tag, Filter } from 'ts/component';
import { I, Util, DataUtil, keyboard, Relation } from 'ts/lib';
import { menuStore } from 'ts/store';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const HEIGHT = 28;
const LIMIT = 40;

const MenuOptionList = observer(class MenuOptionList extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	refFilter: any = null;
	refList: any = null;
	cache: any = {};
	n: number = -1;
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter, canAdd, noFilter } = data;
		const relation = data.relation.get();
		const value = data.value || [];
		const items = this.getItems(true);
		const placeholder = canAdd ? 'Filter or create options...' : 'Filter options...';

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const active = value.indexOf(item.id) >= 0;
			
			let content = null;
			if (item.id == 'add') {
				content =  (
					<div id="item-add" className="item add" onClick={(e: any) => { this.onClick(e, item); }} style={param.style} onMouseEnter={(e: any) => { this.onOver(e, item); }}>
						<Icon className="plus" />
						<div className="name">{item.name}</div>
					</div>
				);
			} else 
			if (item.isSection) {
				content = (<div className="sectionName" style={param.style}>{item.name}</div>);
			} else {
				content = (
					<div id={'item-' + item.id} className="item" style={param.style} onMouseEnter={(e: any) => { this.onOver(e, item); }}>
						<div className="clickable" onClick={(e: any) => { this.onClick(e, item); }}>
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
			<div className={[ 'wrap', (noFilter ? 'noFilter' : '') ].join(' ')}>
				{!noFilter ? (
					<Filter 
						ref={(ref: any) => { this.refFilter = ref; }} 
						placeholderFocus={placeholder} 
						value={filter}
						onChange={this.onFilterChange} 
					/>
				) : ''}

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
											ref={(ref: any) => { this.refList = ref; }}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={HEIGHT}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={10}
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
		this.props.setActive();
		this.props.position();
		this.resize();
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
		const { getId } = this.props;

		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		$(`#${getId()}`).on('click', () => { menuStore.close('dataviewOptionEdit'); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};

	unbind () {
		const { getId } = this.props;

		$(window).unbind('keydown.menu');
		$(`#${getId()}`).unbind('click');
	};

	onKeyDown (e: any) {
		let item = this.getItems(false)[this.n];
		let ret = false;

		if (this.n == -1) {
			keyboard.shortcut('enter', e, (pressed: string) => {
				this.onOptionAdd();
				ret = true;
			});
		};

		keyboard.shortcut('arrowright', e, (pressed: string) => {
			this.onEdit(e, item);
			ret = true;
		});

		if (ret) {
			return;
		};

		this.props.onKeyDown(e);
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
		e.stopPropagation();
		item.id == 'add' ? this.onOptionAdd() : this.onValueAdd(item.id);
	};

	onValueAdd (id: string) {
		const { param, close } = this.props;
		const { data } = param;
		const { onChange, maxCount } = data;

		let value = Relation.getArrayValue(data.value);
		value.push(id);
		value = Util.arrayUnique(value);

		if (maxCount) {
			value = value.slice(value.length - maxCount, value.length);

			if (maxCount == 1) {
				close();
			};
		};

		menuStore.updateData(this.props.id, { value });

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

		const items = this.getItems(false);
		const match = items.find((it: any) => { return it.text == option.text; });

		if (match) {
			this.onValueAdd(match.id);
			return;
		};

		optionCommand('add', rootId, blockId, relation.relationKey, record.id, option, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (this.refFilter) {
				this.refFilter.setValue('');
			};
			this.onFilterChange('');
			this.onValueAdd(message.option.id);

			window.setTimeout(() => { this.resize(); }, 50);
		});
	};
	
	onEdit (e: any, item: any) {
		e.stopPropagation();

		if (!item) {
			return;
		};

		const { param, getId, getSize } = this.props;
		const { data, classNameWrap } = param;

		menuStore.open('dataviewOptionEdit', { 
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			passThrough: true,
			noFlipY: true,
			noAnimation: true,
			classNameWrap: classNameWrap,
			data: {
				...data,
				rebind: this.rebind,
				option: item,
			}
		});
	};

	getItems (withSections: boolean): I.SelectOption[] {
		const { param } = this.props;
		const { data } = param;
		const { canAdd, filterMapper } = data;
		const relation = data.relation.get();
		const isStatus = relation.format == I.RelationType.Status;
		const value = Relation.getArrayValue(data.value);

		let items = Util.objectCopy(relation.selectDict || []);
		let sections: any = {};
		let ret = [];
		let check = [];

		sections[I.OptionScope.Local] = { id: I.OptionScope.Local, name: 'Select option', children: [] };
		sections[I.OptionScope.Relation] = { id: I.OptionScope.Relation, name: 'Everywhere', children: [] };

		if (filterMapper) {
			items = items.filter(filterMapper);
		};

		if (data.filter) {
			const filter = new RegExp(Util.filterFix(data.filter), 'gi');
			check = items.filter((it: I.SelectOption) => { return it.text.toLowerCase() == data.filter.toLowerCase(); });
			items = items.filter((it: I.SelectOption) => { return it.text.match(filter); });

			if (canAdd && !check.length) {
				const name = isStatus ? `Set status "${data.filter}"` : `Create option "${data.filter}"`;
				ret.unshift({ id: 'add', name: name });
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

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const items = this.getItems(true);
		const obj = $(`#${getId()} .content`);
		const offset = noFilter ? 16 : 58;
		const height = Math.max(HEIGHT + offset, Math.min(280, items.length * HEIGHT + offset));

		obj.css({ height: height });
		position();
	};
	
});

export default MenuOptionList;