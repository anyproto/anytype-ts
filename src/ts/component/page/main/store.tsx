import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache, WindowScroller } from 'react-virtualized';
import { Title, Icon, IconObject, Header, Footer, Filter, Button, EmptySearch } from 'Component';
import { I, C, S, U, J, Storage, Onboarding, analytics, Action, keyboard, translate } from 'Lib';

interface State {
	isLoading: boolean;
	withBanner: boolean;
};

const KEY_SORT = 'sortStore';
const KEY_TAB = 'tabStore';
const KEY_BANNER = 'storeBannerClosed';

const cmd = keyboard.cmdSymbol();
const alt = keyboard.altSymbol();

const PageMainStore = observer(class PageMainStore extends React.Component<I.PageComponent, State> {

	state = {
		isLoading: false,
		withBanner: false,
	};

	_isMounted = false;
	node: any = null;
	top = 0;
	offset = 0;
	cache: any = null;
	refList: any = null;
	refFilter: any = null;
	tab: I.StoreTab = null;
	sort = '';
	view: I.StoreView = I.StoreView.Marketplace;
	frame = 0;
	limit = 0;
	midHeight = 0;
	filter = '';
	timeoutFilter = 0;

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
		this.onBanner = this.onBanner.bind(this);
		this.onBannerClose = this.onBannerClose.bind(this);
		this.onSort = this.onSort.bind(this);
	};
	
	render () {
		if (!this.cache) {
			return null;
		};

		const { withBanner } = this.state;
		const canWrite = U.Space.canMyParticipantWrite();
		const { isPopup } = this.props;
		const views = this.getViews();
		const items = this.getItems();
		const sources = this.getSources();
		const limit = this.getLimit();
		const length = items.length;
		const tabs = [
			{ id: I.StoreTab.Type, name: translate('pageMainStoreTypes'), tooltipCaption: `${cmd} + T` },
			{ id: I.StoreTab.Relation, name: translate('pageMainStoreRelations'), tooltipCaption: `${cmd} + ${alt} + T` },
		];

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
				<div className="side left">
					{views.map((item: any, i: number) => (
						<div 
							key={item.id} 
							className={[ 'tab', (item.id == this.view ? 'active' : '') ].join(' ')} 
							onClick={() => this.onView(item.id, true)}
						>
							{item.name}
						</div>
					))}
				</div>
				<div className="side right">
					<Icon 
						id="button-store-sort" 
						className="sort withBackground" 
						onClick={this.onSort} 
						tooltip={translate('pageMainStoreSort')} 
					/>
				</div>
			</div>
		);

		const Item = (item: any) => {
			const allowedDelete = canWrite && S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ]);
			const cn = [ 'item', (item.isHidden ? 'isHidden' : '') ];
			const icons: any[] = [];
			const buttons: any[] = [];

			switch (this.view) {
				case I.StoreView.Library:
					if (allowedDelete) {
						buttons.push({ text: translate('commonRemove'), onClick: e => this.onRemove(e, item) });
					} else {
						icons.push({ className: 'lock', tooltip: textService });
					};
					break;

				case I.StoreView.Marketplace:
					if (sources.includes(item.id)) {
						icons.push({ className: 'check', tooltip: textInstalled });
					} else {
						icons.push({ className: 'plus', tooltip: textInstall, onClick: e => this.onInstall(e, item) });
					};
					break;
			};
			
			return (
				<div className={cn.join(' ')}>
					<div className="flex" onClick={() => this.onOpen(item)}>
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
				className={[ 'wrapper', this.tab, this.view, (withBanner ? 'withBanner' : '') ].join(' ')}
			>
				<Header 
					{...this.props}
					component="mainStore" 
					tabs={tabs}
					tab={this.tab}
					layout={I.ObjectLayout.Store}
					onTab={id => this.onTab(id, true)}
					withBanner={withBanner}
					onBanner={this.onBanner}
					onBannerClose={this.onBannerClose}
				/>

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
		const tab = Storage.get(KEY_TAB) || I.StoreTab.Type;

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: 64,
			keyMapper: i => (items[i] || {}).id,
		});

		this.resize();
		this.rebind();
		this.onTab(tab, false);
		this.setState({ withBanner: !Storage.get(KEY_BANNER) });
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

		S.Menu.closeAll(J.Menu.store);
		window.clearTimeout(this.timeoutFilter);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.store', e => this.onKeyDown(e));
	};

	unbind () {
		$(window).off('keydown.store');
	};

	getSortKey (tab: I.StoreTab) {
		return U.Common.toCamelCase(`${KEY_SORT}-${tab}`);
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

		if (this.tab == id) {
			return;
		};

		this.tab = id;
		this.sort = String(Storage.get(this.getSortKey(id)) || '');
		this.onView(Storage.get('viewStore') || I.StoreView.Library, isInner, true);

		Storage.set(KEY_TAB, id);

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

	onView (id: I.StoreView, isInner: boolean, isChangeTab: boolean = false) {
		if (!isChangeTab && (this.view == id)) {
			return;
		};

		this.view = id;
		this.load(true);

		S.Menu.closeAll(J.Menu.store);
		analytics.event('LibraryView', { view: id, type: this.tab, route: (isInner ? 'inner' : 'outer') });

		Storage.set('viewStore', id);
	};

	onOpen (item: any) {
		if (!item.isInstalled) {
			let installed = null;

			switch (this.tab) {
				case I.StoreTab.Type:
					installed = S.Record.getTypeByKey(item.uniqueKey);
					break;

				case I.StoreTab.Relation:
					installed = S.Record.getRelationByKey(item.relationKey);
					break;
			};

			if (installed) {
				item = installed;
			};
		};

		U.Object.openAuto(item);
	};

	onCreateType (e: any) {
		C.ObjectCreateObjectType({}, [ I.ObjectFlag.DeleteEmpty ], S.Common.space, (message: any) => {
			if (!message.error.code) {
				this.onOpen(message.details);
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
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			this.filter = v;
			S.Menu.updateData(this.getMenuId(), { filter: v });
		}, 500);
	};

	onFilterClear () {	
		S.Menu.closeAll(J.Menu.store);
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
					onClick: item => this.onOpen(item),
				});
				break;

			case I.StoreTab.Relation:
				menuParam.data = Object.assign(menuParam.data, {
					menuIdEdit: 'blockRelationEdit',
					addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
						this.onOpen(relation);
					},
				});
				break;
		};

		S.Menu.open(this.getMenuId(), menuParam);
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

	load (clear: boolean, callBack?: (message: any) => void) {
		const { space } = S.Common;
		const filters: I.Filter[] = [
			{ relationKey: 'layout', condition: I.FilterCondition.Equal, value: this.getTabLayout() },
		];
		const option = U.Menu.getStoreSortOptions(this.tab, this.view).find(it => it.id == this.sort);

		let sorts: I.Sort[] = [];

		if (this.sort && option) {
			sorts.push({ type: option.type, relationKey: option.relationKey });
		} else {
			sorts = sorts.concat([
				{ type: I.SortType.Desc, relationKey: 'createdDate' },
				{ type: I.SortType.Asc, relationKey: 'name' },
			]);
		};

		let keys: string[] = J.Relation.default;

		switch (this.view) {
			case I.StoreView.Marketplace:
				filters.push({ relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: J.Constant.storeSpaceId });
				break;

			case I.StoreView.Library:
				filters.push({ relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: space });
				break;
		};

		switch (this.tab) {
			case I.StoreTab.Type:
				keys = keys.concat(J.Relation.type);
				break;

			case I.StoreTab.Relation:
				keys = keys.concat(J.Relation.relation);
				break;
		};

		if (clear) {
			this.setState({ isLoading: true });
			S.Record.recordsSet(J.Constant.subId.store, '', []);
		};

		U.Data.searchSubscribe({
			subId: J.Constant.subId.store,
			filters,
			sorts,
			keys,
			ignoreWorkspace: true,
			ignoreDeleted: true,
			ignoreHidden: true,
		}, (message: any) => {
			this.setState({ isLoading: false });

			if (callBack) {
				callBack(message);
			};
		});
	};

	getTabLayout (): I.ObjectLayout {
		let layout = null;

		switch (this.tab) {
			case I.StoreTab.Type:		 layout = I.ObjectLayout.Type; break;
			case I.StoreTab.Relation:	 layout = I.ObjectLayout.Relation; break;
		};

		return layout;
	};

	getItems () {
		const { isLoading } = this.state;
		const records = S.Record.getRecords(J.Constant.subId.store);
		const limit = this.getLimit();

		let ret: any[] = [
			{ id: 'mid', className: 'block', children: [ { id: 'mid' } ] },
			{ id: 'tabs', className: 'block', children: [ { id: 'tabs' } ] }
		];
		let n = 0;
		let row = { children: [] };

		if (!isLoading && !records.length) {
			ret.push({ id: 'empty', className: 'block', children: [ { id: 'empty' } ] },);
		};

		for (const item of records) {
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
		const canWrite = U.Space.canMyParticipantWrite();

		switch (this.tab) {
			case I.StoreTab.Type:
				views.push({ id: I.StoreView.Library, name: translate('pageMainStoreMyTypes') });
				break;

			case I.StoreTab.Relation:
				views.push({ id: I.StoreView.Library, name: translate('pageMainStoreMyRelations') });
				break;
		};

		if (canWrite) {
			views.push({ id: I.StoreView.Marketplace, name: translate('commonAnytypeLibrary') });
		};
		return views;
	};

	getSources (): string[] {
		let sources: any[] = [];

		switch (this.tab) {
			case I.StoreTab.Type:
				sources = S.Record.getTypes();
				break;

			case I.StoreTab.Relation:
				sources = S.Record.getRelations();
				break;
		};

		return sources.map(it => it.sourceObject).filter(it => it);
	};

	onInstall (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		Action.install(item, true, () => this.onOpen(item));
	};

	onRemove (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		if (S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ])) {
			Action.uninstall(item, true);
			analytics.event('ObjectUninstall', { route: analytics.route.store });
		};
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};

		if (this.refFilter) {
			this.refFilter.forceUpdate();
		};

		S.Menu.resizeAll();
	};

	getLimit () {
		const container = U.Common.getPageContainer(this.props.isPopup);
		const size = J.Size.store;
		const maxWidth = container.width() - size.border * 2;
		const limit = Math.floor(maxWidth / (size.width + size.margin));

		return Math.max(1, Math.min(5, limit));
	};

	onBanner () {
		S.Popup.closeAll(null, () => {
			S.Popup.open('usecase', {});
		});

		analytics.event('ClickOnboardingTooltip', { type: 'explore', id: 'gallery' });
	};

	onBannerClose (e: any) {
		e.stopPropagation();
		e.preventDefault();

		this.setState({ withBanner: false });
		Storage.set(KEY_BANNER, true);

		analytics.event('ClickOnboardingTooltip', { type: 'close', id: 'gallery' });
	};

	onSort (e: any) {
		const options = U.Menu.getStoreSortOptions(this.tab, this.view);

		S.Menu.open('select', {
			element: '#button-store-sort',
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			data: {
				options,
				value: this.sort,
				onSelect: (e: any, item: any) => {
					this.sort = item.id;
					this.load(true);

					Storage.set(this.getSortKey(this.tab), item.id);
				},
			}
		});
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

		if (S.Menu.isOpen(this.getMenuId())) {
			if (this.refFilter && this.filter.length) {
				this.refFilter.setValue(this.filter);
				this.refFilter.focus();
			};

			S.Menu.update(this.getMenuId(), { width: filter.outerWidth() });
		};
	};

});

export default PageMainStore;