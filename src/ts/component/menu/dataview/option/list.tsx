import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Icon, Tag, Filter } from 'Component';
import { I, C, S, U, J, keyboard, Relation, translate } from 'Lib';

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
		const { filter, canAdd, canEdit, noFilter } = data;
		const relation = data.relation.get();
		const value = Relation.getArrayValue(data.value);
		const items = this.getItems();

		let placeholder = '';
		let empty = '';

		if (canAdd) {
			placeholder = translate('menuDataviewOptionListFilterOrCreateOptions');
			empty = translate('menuDataviewOptionListTypeToCreate');
		} else {
			placeholder = translate('menuDataviewOptionListFilterOptions');
			empty = translate('menuDataviewOptionListTypeToSearch');
		};

		if (!canEdit) {
			empty = translate('placeholderCellCommon');
		};

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const active = value.includes(item.id);
			const isAllowed = S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]);
			
			let content = null;
			if (item.id == 'add') {
				content = (
					<div 
						id="item-add" 
						className="item add" 
						style={param.style}
						onClick={e => this.onClick(e, item)} 
						onMouseEnter={e => this.onOver(e, item)}
					>
						<Icon className="plus" />
						<div className="name">{item.name}</div>
					</div>
				);
			} else 
			if (item.isSection) {
				content = (<div className="sectionName" style={param.style}>{item.name}</div>);
			} else {
				const cn = [ 'item' ];
				if (active) {
					cn.push('withCheckbox');
				};

				content = (
					<div 
						id={`item-${item.id}`} 
						className={cn.join(' ')} 
						style={param.style} 
						onMouseEnter={e => this.onOver(e, item)}
					>
						<div className="clickable" onClick={e => this.onClick(e, item)}>
							<Tag text={item.name} color={item.color} className={Relation.selectClassName(relation.format)} />
						</div>
						<div className="buttons">
							{active ? <Icon className="chk" /> : ''}
							{isAllowed ? <Icon className="more" onClick={e => this.onEdit(e, item)} /> : ''}
						</div>
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
						className="outlined"
						icon="search"
						ref={ref => this.refFilter = ref} 
						placeholderFocus={placeholder} 
						value={filter}
						onChange={this.onFilterChange} 
						focusOnMount={true}
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

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		$(`#${this.props.getId()}`).on('click', () => S.Menu.close('dataviewOptionEdit'));
		window.setTimeout(() => this.props.setActive(), 15);
	};

	unbind () {
		$(window).off('keydown.menu');
		$(`#${this.props.getId()}`).off('click');
	};

	onKeyDown (e: any) {
		// Chinese IME is open
		if (keyboard.isComposition) {
			return;
		};

		const items = this.getItems();
		
		let ret = false;

		keyboard.shortcut('arrowright', e, () => {
			this.onEdit(e, items[this.n]);
			ret = true;
		});

		if (!ret) {
			this.props.onKeyDown(e);
		};
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
		const { cellRef, canEdit } = data;

		if (!canEdit) {
			return;
		};

		const value = Relation.getArrayValue(data.value);

		if (cellRef) {
			cellRef.clear();
		};

		if (item.id == 'add') {
			this.onOptionAdd();
		} else
		if (value.includes(item.id)) {
			this.onValueRemove(item.id);
		} else {
			this.onValueAdd(item.id);
		};

		this.refFilter?.setValue('');
		this.onFilterChange('');
	};

	onValueAdd (id: string) {
		const { param, close } = this.props;
		const { data } = param;
		const { onChange, maxCount } = data;

		let value = Relation.getArrayValue(data.value);

		value.push(id);
		value = U.Common.arrayUnique(value);

		if (maxCount) {
			value = value.slice(value.length - maxCount, value.length);

			if (maxCount == 1) {
				close();
			};
		};

		S.Menu.updateData(this.props.id, { value });
		onChange(value);
	};

	onValueRemove (id: string) {
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;
		const value = Relation.getArrayValue(data.value);
		const idx = value.indexOf(id);

		value.splice(idx, 1);
		S.Menu.updateData(this.props.id, { value });
		onChange(value);
	};

	onOptionAdd () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const relation = data.relation.get();
		const colors = U.Menu.getBgColors();
		const option = { name: filter, color: colors[U.Common.rand(1, colors.length - 1)].value };

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
		}, S.Common.space, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (this.refFilter) {
				this.refFilter.setValue('');
			};
			this.onFilterChange('');
			this.onValueAdd(message.objectId);

			window.setTimeout(() => this.resize(), 50);
		});
	};
	
	onEdit (e: any, item: any) {
		e.stopPropagation();

		if (!item || (item.id == 'add')) {
			return;
		};

		const { id, param, getId, getSize } = this.props;
		const { data, classNameWrap } = param;
		const isAllowed = S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]);

		if (!isAllowed) {
			return;
		};

		S.Menu.open('dataviewOptionEdit', { 
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			passThrough: true,
			noFlipY: true,
			noAnimation: true,
			classNameWrap: classNameWrap,
			rebind: this.rebind,
			parentId: id,
			data: {
				...data,
				option: item,
			}
		});
	};

	getItems (): any[] {
		const { param } = this.props;
		const { data } = param;
		const { canAdd, filterMapper, canEdit } = data;
		const relation = data.relation.get();
		const isSelect = relation.format == I.RelationType.Select;
		const value = Relation.getArrayValue(data.value);
		const ret = [];

		let items = Relation.getOptions(S.Record.getRecordIds(J.Constant.subId.option, '')).filter(it => it.relationKey == relation.relationKey);
		let check = [];

		items.filter(it => !it._empty_ && !it.isArchived && !it.isDeleted);

		if (filterMapper) {
			items = items.filter(filterMapper);
		};

		items.sort((c1, c2) => {
			const isSelected1 = value.includes(c1.id);
			const isSelected2 = value.includes(c2.id);

			if (isSelected1 && !isSelected2) return -1;
			if (!isSelected1 && isSelected2) return 1;

			return 0;
		});

		if (canEdit && data.filter) {
			const filter = new RegExp(U.Common.regexEscape(data.filter), 'gi');
			
			check = items.filter(it => it.name.toLowerCase() == data.filter.toLowerCase());
			items = items.filter(it => it.name.match(filter));

			if (canAdd && !check.length) {
				ret.unshift({ 
					id: 'add', 
					name: U.Common.sprintf(isSelect ? translate('menuDataviewOptionListSetStatus') : translate('menuDataviewOptionListCreateOption'), data.filter),
				});
			};
		};

		return items.concat(ret);
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter, maxHeight } = data;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 16 + (noFilter ? 0 : 38);
		const height = Math.max(HEIGHT + offset, Math.min(maxHeight || 360, items.length * HEIGHT + offset));

		obj.css({ height });
		position();
	};
	
});

export default MenuOptionList;
