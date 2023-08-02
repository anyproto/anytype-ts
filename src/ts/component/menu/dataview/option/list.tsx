import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Icon, Tag, Filter } from 'Component';
import { I, C, UtilCommon, UtilMenu, keyboard, Relation, translate } from 'Lib';
import { menuStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

const HEIGHT = 28;
const LIMIT = 40;

const MenuOptionList = observer(class MenuOptionList extends React.Component<I.Menu> {
	
	_isMounted = false;
	refFilter: any = null;
	refList: any = null;
	cache: any = {};
	n = -1;
	filter = '';
	
	constructor (props: I.Menu) {
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
		const items = this.getItems();

		let placeholder;
		let empty;

		if (canAdd) {
			placeholder = translate('menuDataviewOptionListFilterOrCreateOptions');
			empty = translate('menuDataviewOptionListTypeToCreate')
		}
		else {
			placeholder = translate('menuDataviewOptionListFilterOptions');
			empty = translate('menuDataviewOptionListTypeToSearch')
		};

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
							<Tag text={item.name} color={item.color} className={Relation.selectClassName(relation.format)} />
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
				>
					{content}
				</CellMeasurer>
			);
		};

		return (
			<div className={[ 'wrap', (noFilter ? 'noFilter' : '') ].join(' ')}>
				{!noFilter ? (
					<Filter 
						ref={ref => this.refFilter = ref} 
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
							isRowLoaded={() => true}
							threshold={LIMIT}
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
											overscanRowCount={10}
											scrollToAlignment="center"
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					) : (
						<div className="item empty">{empty}</div>
					)}
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
			keyMapper: i => (items[i] || {}).id,
		});

		this.forceUpdate();
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;

		if (this.filter != filter) {
			this.n = 0;
		};

		this.props.setActive();
		this.props.position();
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
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

		$(window).off('keydown.menu');
		$(`#${getId()}`).off('ck');
	};

	onKeyDown (e: any) {
		let item = this.getItems()[this.n];
		let ret = false;

		keyboard.shortcut('arrowright', e, () => {
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

		const { param } = this.props;
		const { data } = param;
		const { cellRef } = data;

		if (cellRef) {
			cellRef.clear();
		};

		item.id == 'add' ? this.onOptionAdd() : this.onValueAdd(item.id);
		this.onFilterChange('');
	};

	onValueAdd (id: string) {
		const { param, close } = this.props;
		const { data } = param;
		const { onChange, maxCount } = data;

		let value = Relation.getArrayValue(data.value);
		value.push(id);
		value = UtilCommon.arrayUnique(value);

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
		const { filter } = data;
		const relation = data.relation.get();
		const colors = UtilMenu.getBgColors();
		const option = { name: filter, color: colors[UtilCommon.rand(1, colors.length - 1)].value };

		if (!option.name) {
			return;
		};

		const items = this.getItems();
		const match = items.find(it => it.name == option.name);

		if (match) {
			this.onValueAdd(match.id);
			return;
		};

		C.ObjectCreateRelationOption({
			relationKey: relation.relationKey,
			name: option.name,
			relationOptionColor: option.color,
		}, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (this.refFilter) {
				this.refFilter.setValue('');
			};
			this.onFilterChange('');
			this.onValueAdd(message.objectId);

			window.setTimeout(() => { this.resize(); }, 50);
		});
	};
	
	onEdit (e: any, item: any) {
		e.stopPropagation();

		if (!item || (item.id == 'add')) {
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

	getItems (): any[] {
		const { param } = this.props;
		const { data } = param;
		const { canAdd, filterMapper } = data;
		const relation = data.relation.get();
		const isStatus = relation.format == I.RelationType.Status;
		const value = Relation.getArrayValue(data.value);

		let items = Relation.getOptions(dbStore.getRecords(Constant.subId.option, '')).filter(it => it.relationKey == relation.relationKey);
		let ret = [];
		let check = [];

		if (filterMapper) {
			items = items.filter(filterMapper);
		};

		if (data.filter) {
			const filter = new RegExp(UtilCommon.regexEscape(data.filter), 'gi');
			
			check = items.filter(it => it.name.toLowerCase() == data.filter.toLowerCase());
			items = items.filter(it => it.name.match(filter));

			if (canAdd && !check.length) {
				let addItemNameKey = 'menuDataviewOptionListCreateOption';
				if (isStatus) {
					addItemNameKey = 'menuDataviewOptionListSetStatus';
				};
				ret.unshift({ id: 'add', name: UtilCommon.sprintf(translate(addItemNameKey), data.filter) });
			};
		};

		items = items.filter(it => !value.includes(it.id));

		return items.concat(ret);
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = noFilter ? 16 : 58;
		const height = Math.max(HEIGHT + offset, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height: height });
		position();
	};
	
});

export default MenuOptionList;