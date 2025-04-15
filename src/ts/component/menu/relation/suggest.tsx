import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, Icon, MenuItemVertical, Loader, EmptySearch } from 'Component';
import { I, S, U, J, analytics, keyboard, Relation, Action, translate } from 'Lib';

interface State {
	isLoading: boolean;
};

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const LIMIT = 20;

const MenuRelationSuggest = observer(class MenuRelationSuggest extends React.Component<I.Menu, State> {

	state = {
		isLoading: false,
	};

	_isMounted = false;
	filter = '';
	cache: any = null;
	items: any[] = [];
	refFilter: any = null;
	refList: any = null;
	n = 1;
	offset = 0;
	timeoutFilter = 0;

	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};
	
	render () {
		const { isLoading } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { filter, noFilter } = data;
		const items = this.getItems();
		const canWrite = U.Space.canMyParticipantWrite();

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			let content = null;
			if (item.id == 'add') {
				content = (
					<div 
						id="item-add" 
						className="item add" 
						onMouseEnter={e => this.onMouseEnter(e, item)} 
						onClick={e => this.onClick(e, item)} 
						style={param.style}
					>
						<Icon className="plus" />
						<div className="name">{item.name}</div>
					</div>
				);
			} else {
				content = (
					<MenuItemVertical 
						{...item}
						index={param.index}
						className={item.isHidden ? 'isHidden' : ''}
						style={param.style}
						onMouseEnter={e => this.onMouseEnter(e, item)} 
						onClick={e => this.onClick(e, item)}
						withMore={item.isInstalled}
						onMore={e => this.onEdit(e, item)}
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
			<div className="wrap">
				{!noFilter ? (
					<Filter 
						ref={ref => this.refFilter = ref}
						className="outlined"
						placeholderFocus={translate('menuRelationSuggestFilterOrCreateRelation')}
						value={filter}
						onChange={this.onFilterChange}
						focusOnMount={true}
					/>
				) : ''}

				{!items.length && !isLoading ? (
					<EmptySearch readonly={!canWrite} filter={filter} />
				) : ''}

				{this.cache && items.length && !isLoading ? (
					<div className="items">
						<InfiniteLoader
							rowCount={items.length + 1}
							loadMoreRows={this.loadMoreRows}
							isRowLoaded={({ index }) => !!items[index]}
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
											rowHeight={({ index }) => this.getRowHeight(items[index])}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={LIMIT}
											scrollToAlignment="center"
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		this.rebind();
		this.resize();
		this.load(true);
		this.forceUpdate();
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const filter = String(data.filter || '');
		const items = this.getItems();

		if (filter != this.filter) {
			this.filter = filter;
			this.n = -1;
			this.offset = 0;
			this.load(true);
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});

		this.resize();
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;

		S.Menu.closeAll([ 'searchObject' ]);
		window.clearTimeout(this.timeoutFilter);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		return new Promise((resolve, reject) => {
			this.offset += J.Constant.limit.menuRecords;
			this.load(false, resolve);
		});
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		if (!this._isMounted) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const filter = String(data.filter || '');
		const filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: I.ObjectLayout.Relation },
			{ relationKey: 'relationKey', condition: I.FilterCondition.NotIn, value: data.skipKeys || [] },
		];
		const sorts = [
			{ relationKey: 'lastUsedDate', type: I.SortType.Desc },
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		if (clear) {
			this.setState({ isLoading: true });
			this.items = [];
		};

		const requestParam = {
			filters,
			sorts,
			keys: J.Relation.relation,
			fullText: filter,
			offset: this.offset,
			limit: J.Constant.limit.menuRecords,
		};

		this.loadRequest(requestParam, (message: any) => {
			if (!this._isMounted) {
				return;
			};

			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.setState({ isLoading: false });
			} else {
				this.forceUpdate();
			};
		});
	};

	loadRequest (param: any, callBack?: (message: any) => void) {
		U.Data.search(param, (message: any) => {
			this.items = this.items.concat(message.records || []);

			if (callBack) {
				callBack(message);
			};
		});
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const reg = new RegExp(U.Common.regexEscape(filter), 'gi');
		const systemKeys = Relation.systemKeys();
		const items = U.Common.objectCopy(this.items || []).map(it => ({ ...it, object: it }));
		const library = items.filter(it => it.isInstalled && !systemKeys.includes(it.relationKey));
		const system = items.filter(it => it.isInstalled && systemKeys.includes(it.relationKey));
		const types = U.Menu.getRelationTypes().filter(it => it.name.match(reg)).map(it => ({ ...it, isType: true }));
		const canWrite = U.Space.canMyParticipantWrite();

		let sections: any[] = [
			canWrite ? { id: 'create', name: translate('menuRelationSuggestCreateNew'), children: types } : null,
			{ id: 'library', name: translate('commonMyRelations'), children: library },
			{ id: 'system', name: translate('commonSystemRelations'), children: system },
		];

		if (canWrite && filter) {
			sections.unshift({ children: [ { id: 'add', name: U.Common.sprintf(translate('menuRelationSuggestCreateRelation'), filter) } ] });
		};

		sections = sections.filter((section: any) => {
			if (!section) {
				return false;
			};

			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		});

		return sections;
	};
	
	getItems () {
		const sections = this.getSections();
		let items: any[] = [];

		sections.forEach((section: any, i: number) => {
			if (section.name && section) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};

			items = items.concat(section.children);

			if (i < sections.length - 1) {
				items.push({ isDiv: true });
			};
		});

		return items;
	};

	onFilterChange (v: string) {
		if (v != this.filter) {
			window.clearTimeout(this.timeoutFilter);
			this.timeoutFilter = window.setTimeout(() => this.props.param.data.filter = v, J.Constant.delay.keyboard);
		};
	};

	onMouseEnter (e: any, item: any) {
		e.persist();

		if (!keyboard.isMouseDisabled && !S.Menu.isAnimating(this.props.id)) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		if (!item) {
			this.props.close();
			return;
		};

		if (item.arrow) {
			return;
		};

		const { id, close, param, getId, getSize } = this.props;
		const { data, className, classNameWrap } = param;
		const { rootId, blockId, menuIdEdit, addCommand, ref, noInstall, filter } = data;
		const object = S.Detail.get(rootId, rootId, [ 'type' ], true);
		const onAdd = (item: any) => {
			close();

			if (addCommand && item) {
				addCommand(rootId, blockId, item);
			};

			U.Object.setLastUsedDate(item.id, U.Date.now());
		};

		if (item.isType || (item.id == 'add')) {
			S.Menu.open(menuIdEdit, { 
				element: `#${getId()} #item-${item.id}`,
				offsetX: getSize().width,
				offsetY: -80,
				noAnimation: true,
				className,
				classNameWrap,
				rebind: this.rebind,
				parentId: id,
				data: {
					...data,
					addParam: { 
						name: filter,
						format: item.isType ? item.id : I.RelationType.LongText,
					},
					onChange: () => close(),
					addCommand: (rootId: string, blockId: string, item: any) => onAdd(item),
				}
			});
		} else {
			if (item.isInstalled || noInstall) {
				onAdd(item);

				if (!noInstall) {
					analytics.event('AddExistingRelation', { format: item.format, type: ref, objectType: object.type, relationKey: item.relationKey });
				};
			} else {
				Action.install(item, true, message => onAdd(message.details));
			};
		};
	};

	onEdit (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const { param, getId, getSize } = this.props;
		const { data, className, classNameWrap } = param;
		const { rootId, menuIdEdit } = data;

		S.Menu.open(menuIdEdit, { 
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			noAnimation: true,
			className,
			classNameWrap,
			data: {
				...data,
				rootId,
				relationId: item.id,
				noUnlink: true,
				saveCommand: () => this.load(true),
			}
		});
	};

	getRowHeight (item: any) {
		return item.isDiv ? HEIGHT_DIV : HEIGHT_ITEM;
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);

		let height = 16 + (noFilter ? 0 : 42);
		if (!items.length) {
			height = 160;
		} else {
			height = items.reduce((res: number, current: any) => res + this.getRowHeight(current), height);
		};
		height = Math.min(height, 376);

		obj.css({ height });
		position();
	};

});

export default MenuRelationSuggest;
