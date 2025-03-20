import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, Icon, MenuItemVertical, Loader, EmptySearch } from 'Component';
import { I, C, S, U, J, analytics, keyboard, Action, translate, Storage } from 'Lib';

interface State {
	isLoading: boolean;
};

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const LIMIT = 15;

const MenuTypeSuggest = observer(class MenuTypeSuggest extends React.Component<I.Menu, State> {

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
		const { param, setHover } = this.props;
		const { data } = param;
		const { filter, noFilter } = data;
		const items = this.getItems();
		const canWrite = U.Space.canMyParticipantWrite();
		const buttons = this.getButtons();

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
						withMore={!!item.onMore}
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
						placeholderFocus={translate('menuTypeSuggestFilterTypes')}
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
							{({ onRowsRendered, registerChild }) => (
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

				{buttons.length ? (
					<div className="bottom">
						{buttons.map((item, i) => (
							<MenuItemVertical 
								key={item.id}
								{...item}
								onMouseEnter={e => setHover(item)} 
								onClick={e => this.onClick(e, item)}
							/>
						))}
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		const { param } = this.props;
		const { data } = param;
		const { noStore } = data;

		if (noStore) {
			this.n = 0;
		};

		this.rebind();
		this.resize();
		this.load(true);
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { noStore } = data;
		const filter = String(data.filter || '');
		const items = this.getItems();

		if (filter != this.filter) {
			this.filter = filter;
			this.n = noStore ? 0 : 1;
			this.offset = 0;
			this.load(true);
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});

		this.rebind();
		this.resize();
	};
	
	componentWillUnmount () {
		this._isMounted = false;

		if (S.Menu.isOpen('searchObject', 'store')) {
			S.Menu.closeAll([ 'searchObject' ]);
		};
		window.clearTimeout(this.timeoutFilter);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	loadMoreRows () {
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
		const { skipIds } = data;
		const filter = String(data.filter || '');
		const sorts = [
			{ relationKey: 'lastUsedDate', type: I.SortType.Desc },
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		let filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: I.ObjectLayout.Type },
		];
		if (data.filters) {
			filters = filters.concat(data.filters);
		};

		if (skipIds && skipIds.length) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (clear) {
			this.setState({ isLoading: true });
			this.items = [];
		};

		const requestParam = {
			filters,
			sorts,
			keys: U.Data.typeRelationKeys(),
			fullText: filter,
			offset: this.offset,
			limit: J.Constant.limit.menuRecords,
		};

		this.loadRequest(requestParam, () => {
			this.loadRequest({ ...requestParam, spaceId: J.Constant.storeSpaceId }, (message: any) => {
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
		const { space } = S.Common;
		const { param } = this.props;
		const { data } = param;
		const { filter, noStore } = data;
		const pinned = Storage.getPinnedTypes();
		const items = U.Common.objectCopy(this.items || []).map(it => ({ ...it, object: it }));
		const buttons = data.buttons || [];
		const add = buttons.find(it => it.id == 'add');

		items.sort((c1, c2) => U.Data.sortByPinnedTypes(c1, c2, pinned));

		const library = items.filter(it => (it.spaceId == space));
		const librarySources = library.map(it => it.sourceObject);
		const canWrite = U.Space.canMyParticipantWrite();

		let sections: any[] = [
			{ id: 'library', name: translate('menuTypeSuggestMyTypes'), children: library },
		];

		if (canWrite) {
			if (filter) {
				const store = items.filter(it => (it.spaceId == J.Constant.storeSpaceId) && !librarySources.includes(it.id));

				sections = sections.concat([
					{ id: 'store', name: translate('commonAnytypeLibrary'), children: store },
					!add ? { children: [ { id: 'add', name: U.Common.sprintf(translate('menuTypeSuggestCreateTypeFilter'), filter) } ] } : null,
				].filter(it => it));
			} else {
				sections = sections.concat([
					{ 
						id: 'store', children: [
							{ id: 'store', icon: 'store', name: translate('commonAnytypeLibrary'), arrow: true }
						]
					},
				]);
			};
		};

		if (noStore) {
			sections = sections.map(it => {
				it.name = '';
				return it;
			});
			sections = sections.filter(it => it.id != 'store');
		};

		sections = sections.filter((section: any) => {
			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		});

		return sections;
	};
	
	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { onMore } = data;
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

		if (onMore) {
			items = items.map((item: any) => {
				item.onMore = e => onMore(e, this, item);
				return item;
			});
		};

		return items;
	};

	getButtons () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const buttons = [ ...data.buttons || [] ];
		const add = buttons.find(it => it.id == 'add');

		if (add) {
			add.name = filter ? U.Common.sprintf(translate('menuTypeSuggestCreateTypeFilter'), filter) : translate('menuTypeSuggestCreateType');
		};

		return buttons.map(it => ({ ...it, isButton: true }));
	};

	onFilterChange (v: string) {
		if (v != this.filter) {
			window.clearTimeout(this.timeoutFilter);
			this.timeoutFilter = window.setTimeout(() => this.props.param.data.filter = v, J.Constant.delay.keyboard);
		};
	};

	onMouseEnter (e: any, item: any) {
		e.persist();

		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
			this.onOver(e, item);
		};
	};

	onOver (e: any, item: any) {
		if (!this._isMounted) {
			return;
		};

		if (!item.arrow) {
			S.Menu.closeAll([ 'searchObject' ]);
			return;
		};

		const { id, getId, getSize, param } = this.props;
		const { data, classNameWrap } = param;
		const sources = this.getLibrarySources();
		const className = [ param.className ];

		const menuParam: I.MenuParam = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			offsetY: 36,
			classNameWrap,
			vertical: I.MenuDirection.Top,
			isSub: true,
			noFlipY: true,
			rebind: this.rebind,
			parentId: id,
			data: {},
		};

		let menuId = '';

		switch (item.id) {
			case 'store': {
				className.push('single');

				if (param.className) {
					className.push(param.className);
				};

				menuId = 'searchObject';
				menuParam.className = className.join(' ');

				let filters: I.Filter[] = [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
					{ relationKey: 'id', condition: I.FilterCondition.NotIn, value: sources },
				];
				if (data.filters) {
					filters = filters.concat(data.filters);
				};

				menuParam.data = Object.assign(menuParam.data, {
					spaceId: J.Constant.storeSpaceId,
					keys: U.Data.typeRelationKeys(),
					filters,
					sorts: [
						{ relationKey: 'name', type: I.SortType.Asc },
					],
					onSelect: item => this.onClick(e, item),
					dataMapper: it => S.Detail.mapper(it),
				});
				break;
			};
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id)) {
			S.Menu.closeAll([ 'searchObject' ], () => S.Menu.open(menuId, menuParam));
		};
	};
	
	onClick (e: any, item: any) {
		const { close, param } = this.props;
		const { data } = param;
		const { filter, onClick, noInstall } = data;

		if (item.arrow) {
			return;
		};

		if (item.isButton && item.onClick) {
			item.onClick(e);
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const cb = (item: any) => {
			close();

			if (onClick) {
				onClick(S.Detail.mapper(item));
			};
		};
		const setLast = item => U.Object.setLastUsedDate(item.id, U.Date.now());

		if (item.id == 'add') {
			C.ObjectCreateObjectType({ name: filter }, [], S.Common.space, (message: any) => {
				if (!message.error.code) {
					U.Object.openAuto(message.details);
					analytics.event('CreateType');
				};
			});
		} else 
		if (item.onClick) {
			item.onClick(e);
		} else {
			if (item.isInstalled || noInstall) {
				cb(item);
				setLast(item);
			} else {
				Action.install(item, true, message => {
					cb(message.details);
					setLast(message.details);
				});
			};
		};
	};

	onKeyDown (e: any) {
		const { onKeyDown, param } = this.props;
		const { data } = param;
		const buttons = data.buttons || [];
		const cmd = keyboard.cmdKey();
		const clipboard = buttons.find(it => it.id == 'clipboard');

		let ret = false;

		if (clipboard && clipboard.onClick) {
			keyboard.shortcut(`${cmd}+v`, e, () => {
				e.preventDefault();

				clipboard.onClick();
				ret = true;
			});
		};

		if (!ret) {
			onKeyDown(e);
		};
	};

	getRowHeight (item: any) {
		return item.isDiv ? HEIGHT_DIV : HEIGHT_ITEM;
	};

	getLibrarySources () {
		return S.Record.getTypes().filter(it => (it.spaceId == S.Common.space)).map(it => it.sourceObject).filter(it => it);
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const buttons = data.buttons || [];
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 16 + (noFilter ? 0 : 42);
		const buttonHeight = buttons.length ? buttons.reduce((res: number, current: any) => res + this.getRowHeight(current), 16) : 0;

		let height = 0;
		if (!items.length) {
			height = 160;
		} else {
			height = items.reduce((res: number, current: any) => res + this.getRowHeight(current), height);
		};

		height += offset + buttonHeight;
		height = Math.min(height, offset + buttonHeight + HEIGHT_ITEM * LIMIT);

		obj.css({ height });
		position();
	};

});

export default MenuTypeSuggest;
