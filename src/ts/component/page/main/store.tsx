import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache, WindowScroller } from 'react-virtualized';
import { Title, Icon, IconObject, Header, Footer, Filter, Button, EmptySearch } from 'Component';
import { I, C, UtilData, UtilObject, UtilCommon, Storage, Onboarding, analytics, Action, keyboard, translate } from 'Lib';
import { dbStore, blockStore, detailStore, commonStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	loading: boolean;
};

enum View {
	Marketplace = 'marketplace',
	Library = 'library',
};

const cmd = keyboard.cmdSymbol();
const alt = keyboard.altSymbol();
const Tabs = [
	{ id: I.StoreTab.Type, name: translate('pageMainStoreTypes'), tooltipCaption: `${cmd} + T` },
	{ id: I.StoreTab.Relation, name: translate('pageMainStoreRelations'), tooltipCaption: `${cmd} + ${alt} + T` },
];

const PageMainStore = observer(class PageMainStore extends React.Component<I.PageComponent, State> {

	state = {
		loading: false,
	};

	_isMounted = false;
	node: any = null;
	top = 0;
	offset = 0;
	cache: any = null;
	refList: any = null;
	refFilter: any = null;
	tab: I.StoreTab = I.StoreTab.Type;
	view: View = View.Marketplace;
	frame = 0;
	limit = 0;
	midHeight = 0;
	filter: string = '';

	constructor (props: I.PageComponent) {
		super(props);

		this.getRowHeight = this.getRowHeight.bind(this);
		this.onTab = this.onTab.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterFocus = this.onFilterFocus.bind(this);
		this.onFilterBlur = this.onFilterBlur.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.onFilterClick = this.onFilterClick.bind(this);
	};
	
	render () {
		if (!this.cache) {
			return null;
		};

		const { isPopup } = this.props;
		const views = this.getViews();
		const items = this.getItems();
		const sources = this.getSources();
		const limit = this.getLimit();
		const length = items.length;

		let title = '';
		let placeholder = '';
		let textService = '';
		let textInstalled = '';
		let textInstall = '';
		let textEmpty = '';
		let iconSize = 0;

		switch (this.tab) {
			case I.StoreTab.Type:
				title = translate('pageMainStoreTypesTitle');
				placeholder = translate('pageMainStoreTypesPlaceholder');
				textService = translate('pageMainStoreTypesService');
				textInstalled = translate('pageMainStoreTypeInstalled');
				textInstall = translate('pageMainStoreTypeInstall');
				textEmpty = translate('pageMainStoreTypeEmpty');
				iconSize = 18;
				break;

			case I.StoreTab.Relation:
				title = translate('pageMainStoreRelationsTitle');
				placeholder = translate('pageMainStoreRelationsPlaceholder');
				textService = translate('pageMainStoreRelationsService');
				textInstalled = translate('pageMainStoreRelationsInstalled');
				textInstall = translate('pageMainStoreRelationsInstall');
				textEmpty = translate('pageMainStoreRelationsEmpty');
				iconSize = 20;
				break;
		};

		const Mid = () => (
			<div className="mid">
				<Title text={title} />
				<Filter 
					ref={ref => this.refFilter = ref}
					id="store-filter"
					icon="search"
					placeholder={placeholder}
					onClick={this.onFilterClick}
					onFocus={this.onFilterFocus}
					onBlur={this.onFilterBlur}
					onChange={this.onFilterChange}
					onClear={this.onFilterClear}
				/>
			</div>
		);

		const TabList = (item: any) => (
			<div className="tabs">
				{views.map((item: any, i: number) => (
					<div 
						key={item.id} 
						className={[ 'tab', (item.id == this.view ? 'active' : '') ].join(' ')} 
						onClick={(e: any) => { this.onView(item.id, true); }}
					>
						{item.name}
					</div>
				))}
			</div>
		);

		const Item = (item: any) => {
			const allowedDelete = blockStore.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ]);
			const cn = [ 'item', (item.isHidden ? 'isHidden' : '') ];
			const icons: any[] = [];
			const buttons: any[] = [];

			switch (this.view) {
				case View.Library:
					if (allowedDelete) {
						buttons.push({ text: translate('commonRemove'), onClick: e => this.onRemove(e, item) });
					} else {
						icons.push({ className: 'lock', tooltip: textService });
					};
					break;

				case View.Marketplace:
					if (sources.includes(item.id)) {
						icons.push({ className: 'check', tooltip: textInstalled });
					} else {
						icons.push({ className: 'plus', tooltip: textInstall, onClick: (e: any) => { this.onInstall(e, item); } });
					};
					break;
			};
			
			return (
				<div className={cn.join(' ')}>
					<div className="flex" onClick={(e: any) => { this.onClick(e, item); }}>
						<IconObject iconSize={iconSize} object={item} />
						<div className="name">{item.name}</div>
					</div>

					<div className="buttons">
						{buttons.map((button: any, i: number) => (
							<Button key={i} {...button} />
						))}
						{icons.map((button: any, i: number) => (
							<Icon key={i} {...button} />
						))}
					</div>
				</div>
			);
		};

		const rowRenderer = (param: any) => {
			const item = items[param.index];
			const cn = [ 'row' ];
			const style = { ...param.style, gridTemplateColumns: `repeat(${limit}, minmax(0, 1fr))` };

			if (item.className) {
				cn.push(item.className);
			};

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					<div className={cn.join(' ')} style={style}>
						{item.children.map((item: any, i: number) => {
							if (item.id == 'mid') {
								return <Mid key={i} {...item} />;
							};
							if (item.id == 'tabs') {
								return <TabList key={i} {...item} />;
							};
							if (item.id == 'empty') {
								return <EmptySearch key={i} text={textEmpty} />;
							};
							return <Item key={i} {...item} />;
						})}
					</div>
				</CellMeasurer>
			);
		};

		return (
			<div 
				ref={node => this.node = node}
				className={[ 'wrapper', this.tab, this.view ].join(' ')}
			>
				<Header component="mainStore" {...this.props} tabs={Tabs} tab={this.tab} onTab={id => this.onTab(id, true)} />

				<div className="body">
					<div className="items">
						<InfiniteLoader
							loadMoreRows={() => {}}
							isRowLoaded={({ index }) => !!items[index]}
							rowCount={length}
							threshold={10}
						>
							{({ onRowsRendered }) => (
								<WindowScroller scrollElement={isPopup ? $('#popupPage-innerWrap').get(0) : window}>
									{({ height, isScrolling, registerChild, scrollTop }) => (
										<AutoSizer disableHeight={true}>
											{({ width }) => {
												return (
													<div ref={registerChild}>
														<List
															autoHeight={true}
															height={Number(height) || 0}
															width={Number(width) || 0}
															isScrolling={isScrolling}
															rowCount={length}
															rowHeight={({ index }) => this.getRowHeight(items[index])}
															onRowsRendered={onRowsRendered}
															rowRenderer={rowRenderer}
															onScroll={this.onScroll}
															scrollTop={scrollTop}
															scrollToAlignment="start"
														/>
													</div>
												);
											}}
										</AutoSizer>
									)}
								</WindowScroller>
							)}
						</InfiniteLoader>
					</div>
				</div>

				<Footer component="mainObject" />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: 64,
			keyMapper: i => (items[i] || {}).id,
		});

		this.resize();
		this.rebind();
		this.onTab(Storage.get('tabStore') || I.StoreTab.Type, false);
	};

	componentDidUpdate () {
		this.resize();

		if (this.refList) {
			this.refList.recomputeRowHeights();
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		menuStore.closeAll(Constant.menuIds.store);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.store', (e: any) => { this.onKeyDown(e); });
	};

	unbind () {
		$(window).off('keydown.store');
	};

	onKeyDown (e: any) {
		const cmd = keyboard.cmdKey();

		keyboard.shortcut(`${cmd}+t`, e, () => this.onTab(I.StoreTab.Type, true));
		keyboard.shortcut(`${cmd}+alt+t`, e, () => this.onTab(I.StoreTab.Relation, true));
	};

	getRowHeight (item: any) {
		let h = 0;
		switch (item.id) {
			case 'mid':		 h = this.midHeight || 305; break;
			case 'tabs':	 h = 52; break;
			case 'empty':	 h = 190; break;
			default:		 h = 64; break;
		};
		return h;
	};

	onTab (id: any, isInner: boolean) {
		const { isPopup } = this.props;

		this.tab = id;
		this.onView(Storage.get('viewStore') || View.Library, isInner);

		Storage.set('tabStore', id);

		if (!isPopup) {
			let key = '';
			switch (id) {
				case I.StoreTab.Type: key = 'storeType'; break;
				case I.StoreTab.Relation: key = 'storeRelation'; break;
			};

			if (key) {
				Onboarding.start(key, false);
			};
		};
	};

	onView (id: View, isInner: boolean) {
		this.view = id;
		this.getData(true);

		menuStore.closeAll(Constant.menuIds.store);
		analytics.event('LibraryView', { view: id, type: this.tab, route: (isInner ? 'inner' : 'outer') });

		Storage.set('viewStore', id);
	};

	onClick (e: any, item: any) {
		UtilObject.openAuto(item);
	};

	onCreateType (e: any) {
		C.ObjectCreateObjectType({}, [ I.ObjectFlag.DeleteEmpty ], (message: any) => {
			if (!message.error.code) {
				this.onClick(e, message.details);
				analytics.event('CreateType');
			};
		});
	};

	onFilterClick () {
		const node = $(this.node);
		const filter = node.find('#store-filter');
		const input = filter.find('#input');

		input.show();
		this.refFilter.focus();
	};

	onFilterChange (v: string) {
		this.filter = v;
		menuStore.updateData(this.getMenuId(), { filter: v });
	};

	onFilterClear () {	
		menuStore.closeAll(Constant.menuIds.store);
	};

	onFilterFocus (e: any) {
		const node = $(this.node);
		const filter = node.find('#store-filter');

		const menuParam: any = {
			element: '#store-filter',
			commonFilter: true,
			horizontal: I.MenuDirection.Center,
			width: filter.outerWidth(),
			offsetY: 4,
			data: {
				filter: this.refFilter.getValue(),
				noFilter: true,
				noInstall: true,
			}
		};

		switch (this.tab) {
			case I.StoreTab.Type:
				menuParam.data = Object.assign(menuParam.data, {
					onClick: (item: any) => {
						this.onClick(e, item);
					}
				});
				break;

			case I.StoreTab.Relation:
				menuParam.data = Object.assign(menuParam.data, {
					menuIdEdit: 'blockRelationEdit',
					addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
						this.onClick(e, relation);
					},
				});
				break;
		};

		menuStore.open(this.getMenuId(), menuParam);
	};

	onFilterBlur () {
		const node = $(this.node);
		const filter = node.find('#store-filter');
		const input = filter.find('#input');

		input.css({ display: '' });
	};

	getMenuId () {
		let menuId = '';
		switch (this.tab) {
			case I.StoreTab.Type:
				menuId = 'typeSuggest';
				break;

			case I.StoreTab.Relation:
				menuId = 'relationSuggest';
				break;
		};
		return menuId;
	};

	getData (clear: boolean, callBack?: (message: any) => void) {
		const { workspace } = commonStore;
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: this.getTabType() },
		];
		const sorts: I.Sort[] = [
			{ type: I.SortType.Desc, relationKey: 'createdDate', includeTime: true },
		];

		let keys: string[] = Constant.defaultRelationKeys;

		switch (this.view) {
			case View.Marketplace:
				filters.push({ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: Constant.storeSpaceId });
				break;

			case View.Library:
				filters.push({ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: workspace });
				break;
		};

		switch (this.tab) {
			case I.StoreTab.Type:
				keys = keys.concat(Constant.typeRelationKeys);
				break;

			case I.StoreTab.Relation:
				keys = keys.concat(Constant.relationRelationKeys);
				break;
		};

		if (clear) {
			this.setState({ loading: true });
			dbStore.recordsSet(Constant.subId.store, '', []);
		};

		UtilData.searchSubscribe({
			subId: Constant.subId.store,
			filters,
			sorts,
			keys,
			ignoreWorkspace: true,
			ignoreDeleted: true,
			ignoreHidden: true,
		}, (message: any) => {
			this.setState({ loading: false });

			if (callBack) {
				callBack(message);
			};
		});
	};

	getTabType () {
		let type = '';
		switch (this.view) {
			case View.Marketplace:
				switch (this.tab) {
					case I.StoreTab.Type:		 type = Constant.storeTypeId.type; break;
					case I.StoreTab.Relation:	 type = Constant.storeTypeId.relation; break;
				};
				break;

			case View.Library:
				switch (this.tab) {
					case I.StoreTab.Type:		 type = Constant.typeId.type; break;
					case I.StoreTab.Relation:	 type = Constant.typeId.relation; break;
				};
				break;
		};
		return type;
	};

	getItems () {
		const { profile } = blockStore;
		const { loading } = this.state;
		const records = dbStore.getRecords(Constant.subId.store, '').map(id => detailStore.get(Constant.subId.store, id));
		const limit = this.getLimit();

		records.sort((c1: any, c2: any) => {
			const cr1 = c1.creator;
			const cr2 = c2.creator;

			if ((cr1 == profile) && (cr2 != profile)) return -1;
			if ((cr1 != profile) && (cr2 == profile)) return 1;
			return 0;
		});

		let ret: any[] = [
			{ id: 'mid', className: 'block', children: [ { id: 'mid' } ] },
			{ id: 'tabs', className: 'block', children: [ { id: 'tabs' } ] }
		];
		let n = 0;
		let row = { children: [] };

		if (!loading && !records.length) {
			ret.push({ id: 'empty', className: 'block', children: [ { id: 'empty' } ] },);
		};

		for (let item of records) {
			row.children.push(item);

			n++;
			if (n == limit) {
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length < limit) {
			ret.push(row);
		};

		ret = ret.filter(it => it.children.length > 0);
		return ret;
	};

	getViews (): any[] {
		const views: any[] = [];

		switch (this.tab) {
			case I.StoreTab.Type:
				views.push({ id: View.Library, name: translate('pageMainStoreMyTypes') });
				break;

			case I.StoreTab.Relation:
				views.push({ id: View.Library, name: translate('pageMainStoreMyRelations') });
				break;
		};

		views.push({ id: View.Marketplace, name: translate('commonAnytypeLibrary') });
		return views;
	};

	getSources (): string[] {
		let sources: any[] = []

		switch (this.tab) {
			case I.StoreTab.Type:
				sources = dbStore.getTypes();
				break;

			case I.StoreTab.Relation:
				sources = dbStore.getRelations();
				break;
		};

		return sources.map(it => it.sourceObject).filter(it => it);
	};

	onInstall (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		Action.install(item, true);
	};

	onRemove (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		if (blockStore.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ])) {
			Action.uninstall(item, true);
		};
	};

	onScroll ({ scrollTop }) {
		const win = $(window);
		const menus = menuStore.list.filter(it => Constant.menuIds.store.includes(it.id));

		if (scrollTop) {
			this.top = scrollTop;
		};

		if (this.refFilter) {
			this.refFilter.forceUpdate();
		};

		for (let menu of menus) {
			win.trigger('resize.' + UtilCommon.toCamelCase(`menu-${menu.id}`));
		};
	};

	getLimit () {
		const container = UtilCommon.getPageContainer(this.props.isPopup);
		const size = Constant.size.store;
		const maxWidth = container.width() - size.border * 2;
		const limit = Math.floor(maxWidth / (size.width + size.margin));

		return Math.max(1, Math.min(5, limit));
	};

	resize () {
		const node = $(this.node);
		const limit = this.getLimit();
		const midHeight = node.find('.mid').outerHeight();
		const filter = node.find('#store-filter');
		const grid = node.find('.ReactVirtualized__Grid__innerScrollContainer');
		const items = this.getItems();
		const height = items.reduce((res, current) => res += this.getRowHeight(current), 0);

		grid.css({ height });

		if ((limit != this.limit) || (midHeight != this.midHeight)) {
			this.limit = limit;
			this.midHeight = midHeight;

			raf.cancel(this.frame);
			this.frame = raf(() => this.forceUpdate());
		};

		if (menuStore.isOpen(this.getMenuId())) {
			if (this.refFilter && this.filter.length) {
				this.refFilter.setValue(this.filter);
				this.refFilter.focus();
			};

			menuStore.update(this.getMenuId(), { width: filter.outerWidth() });
		};
	};

});

export default PageMainStore;
