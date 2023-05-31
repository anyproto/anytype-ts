import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Title, Icon, IconObject, Header, Footer, Filter, Button, EmptySearch } from 'Component';
import { I, C, DataUtil, ObjectUtil, Util, Storage, Onboarding, analytics, Action, keyboard } from 'Lib';
import { dbStore, blockStore, detailStore, commonStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	loading: boolean;
};

enum Tab {
	Type = 'type',
	Relation = 'relation',
};

enum View {
	Marketplace = 'marketplace',
	Library = 'library',
};

const cmd = keyboard.cmdSymbol();
const alt = keyboard.altSymbol();
const Tabs = [
	{ id: Tab.Type, name: 'Types', tooltipCaption: `${cmd} + T` },
	{ id: Tab.Relation, name: 'Relations', tooltipCaption: `${cmd} + ${alt} + T` },
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
	tab: Tab = Tab.Type;
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

		const views = this.getViews();
		const items = this.getItems();
		const sources = this.getSources();
		const limit = this.getLimit();

		let title = '';
		let placeholder = '';
		let textService = '';
		let textInstalled = '';
		let textInstall = '';
		let textEmpty = '';
		let iconSize = 0;

		switch (this.tab) {
			case Tab.Type:
				title = 'Types are like categories<br/>that help you group and manage<br/>your objects.';
				placeholder = 'Search or create a new type...';
				textService = 'Service type';
				textInstalled = 'Type is installed';
				textInstall = 'Install type';
				textEmpty = '<b>Your type list is empty</b>Add some from the Anytype Library using the search icon or create your own using the button above';
				iconSize = 18;
				break;

			case Tab.Relation:
				title = 'All objects are connected.<br />Use relations to build connections between objects.';
				placeholder = 'Search or create a new relation...';
				textService = 'Service relation';
				textInstalled = 'Relation is installed';
				textInstall = 'Install relation';
				textEmpty = '<b>Your relation list is empty</b>Add some from the Anytype Library using the search icon or create your own using the button above';
				iconSize = 20;
				break;
		};

		const Mid = () => (
			<div className="mid">
				<Title text={title} />
				<Filter 
					ref={ref => { this.refFilter = ref; }}
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
						buttons.push({ text: 'Remove', onClick: (e: any) => { this.onRemove(e, item); } });
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
							rowCount={items.length}
							loadMoreRows={() => {}}
							isRowLoaded={() => true}
						>
							{({ onRowsRendered, registerChild }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={ref => { this.refList = ref; }}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={({ index }) => this.getRowHeight(items[index])}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={10}
											onScroll={this.onScroll}
											scrollToAlignment="start"
										/>
									)}
								</AutoSizer>
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
		this.onTab(Storage.get('tabStore') || Tab.Type, false);
	};

	componentDidUpdate () {
		const { isPopup } = this.props;

		this.resize();
		if (this.refList) {
			this.refList.recomputeRowHeights();
		};

		Onboarding.start(Util.toCamelCase('store-' + this.tab), isPopup);
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

		keyboard.shortcut(`${cmd}+t`, e, () => { this.onTab(Tab.Type, true); });
		keyboard.shortcut(`${cmd}+alt+t`, e, () => { this.onTab(Tab.Relation, true); });
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
		this.tab = id;
		this.onView(Storage.get('viewStore') || View.Library, isInner);

		Storage.set('tabStore', id);
	};

	onView (id: View, isInner: boolean) {
		this.view = id;
		this.getData(true);

		menuStore.closeAll(Constant.menuIds.store);
		analytics.event('LibraryView', { view: id, type: this.tab, route: (isInner ? 'inner' : 'outer') });

		Storage.set('viewStore', id);
	};

	onClick (e: any, item: any) {
		ObjectUtil.openAuto(item);
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
			element: filter,
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
			case Tab.Type:
				menuParam.data = Object.assign(menuParam.data, {
					onClick: (item: any) => {
						this.onClick(e, item);
					}
				});
				break;

			case Tab.Relation:
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
			case Tab.Type:
				menuId = 'typeSuggest';
				break;

			case Tab.Relation:
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
			{ type: I.SortType.Desc, relationKey: 'createdDate' },
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
			case Tab.Type:
				keys = keys.concat(Constant.typeRelationKeys);
				break;

			case Tab.Relation:
				keys = keys.concat(Constant.relationRelationKeys);
				break;
		};

		if (clear) {
			this.setState({ loading: true });
			dbStore.recordsSet(Constant.subId.store, '', []);
		};

		DataUtil.searchSubscribe({
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
					case Tab.Type:		 type = Constant.storeTypeId.type; break;
					case Tab.Relation:	 type = Constant.storeTypeId.relation; break;
				};
				break;

			case View.Library:
				switch (this.tab) {
					case Tab.Type:		 type = Constant.typeId.type; break;
					case Tab.Relation:	 type = Constant.typeId.relation; break;
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
			case Tab.Type:
				views.push({ id: View.Library, name: 'My types' });
				break;

			case Tab.Relation:
				views.push({ id: View.Library, name: 'My relations' });
				break;
		};

		views.push({ id: View.Marketplace, name: 'Anytype library' });
		return views;
	};

	getSources (): string[] {
		let sources: any[] = []

		switch (this.tab) {
			case Tab.Type:
				sources = dbStore.getTypes();
				break;

			case Tab.Relation:
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

		for (let menu of menus) {
			win.trigger('resize.' + Util.toCamelCase('menu-' + menu.id));
		};
	};

	getLimit () {
		const container = Util.getPageContainer(this.props.isPopup);
		const size = Constant.size.store;
		const maxWidth = container.width() - size.border * 2;
		const limit = Math.floor(maxWidth / (size.width + size.margin));

		return Math.max(1, Math.min(5, limit));
	};

	resize () {
		const container = Util.getPageContainer(this.props.isPopup);
		const win = $(window);
		const node = $(this.node);
		const content = $('#popupPage .content');
		const body = node.find('.body');
		const hh = Util.sizeHeader();
		const isPopup = this.isPopup();
		const limit = this.getLimit();
		const wh = isPopup ? container.height() : win.height();
		const midHeight = node.find('.mid').outerHeight();
		const filter = node.find('#store-filter');

		node.css({ height: wh });
		
		if (isPopup) {
			body.css({ height: wh - hh });
			content.css({ minHeight: 'unset', height: '100%' });
		} else {
			body.css({ height: '' });
			content.css({ minHeight: '', height: '' });
		};

		if ((limit != this.limit) || (midHeight != this.midHeight)) {
			this.limit = limit;
			this.midHeight = midHeight;

			raf.cancel(this.frame);
			this.frame = raf(() => { this.forceUpdate(); });
		};

		if (!menuStore.get(this.getMenuId())) {
			return;
		}

		if (this.refFilter && this.filter.length) {
			this.refFilter.setValue(this.filter);
			this.refFilter.focus();
		};
		menuStore.update(this.getMenuId(), { element: filter, width: filter.outerWidth() });
	};

	isPopup () {
		const { isPopup } = this.props;
		const container = Util.getPageContainer(isPopup);

		return isPopup && !container.hasClass('full');
	};

});

export default PageMainStore;