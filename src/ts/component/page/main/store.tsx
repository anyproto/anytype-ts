import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Title, Label, Button, Icon, IconObject, Cover, Header, Filter } from 'Component';
import { I, C, DataUtil, Util, Storage, Onboarding, analytics, Action } from 'Lib';
import { dbStore, blockStore, detailStore, commonStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.PageComponent {
	isPopup?: boolean;
};

interface State {
	loading: boolean;
};

enum Tab {
	Type = 'type',
	Template = 'template',
	Relation = 'relation',
};

enum View {
	Marketplace = 'marketplace',
	Library = 'library',
};

const Tabs = [
	{ 
		id: Tab.Type, name: 'Types', active: 'library',
		children: [
			{ id: 'market', name: 'Marketplace', disabled: true },
			{ id: 'library', name: 'Library' },
		]
	},
	/*
	{ 
		id: Tab.Template, 'name': 'Templates', active: 'library', 
		children: [
			{ id: 'market', name: 'Marketplace' },
			{ id: 'library', name: 'Library' },
		], 
	},
	*/
	{ 
		id: Tab.Relation, 'name': 'Relations', active: 'library', 
		children: [
			{ id: 'market', name: 'Marketplace', disabled: true },
			{ id: 'library', name: 'Library' },
		], 
	},
];

const PageMainStore = observer(class PageMainStore extends React.Component<Props, State> {

	state = {
		loading: false,
	};

	top: number = 0;
	offset: number = 0;
	cache: any = null;
	refList: any = null;
	refFilter: any = null;
	tab: Tab = Tab.Type;
	view: View = View.Marketplace;

	_isMounted: boolean = false;

	constructor (props: Props) {
		super(props);

		this.getRowHeight = this.getRowHeight.bind(this);
		this.onTab = this.onTab.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterFocus = this.onFilterFocus.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
	};
	
	render () {
		if (!this.cache) {
			return null;
		};

		const views = this.getViews();
		const items = this.getItems();


		let Item = null;
		let Mid: any = null;

		const filter = (
			<Filter 
				ref={(ref: any) => { this.refFilter = ref; }}
				id="store-filter"
				icon="search"
				onFocus={this.onFilterFocus}
				onChange={this.onFilterChange}
				onClear={this.onFilterClear}
			/>
		);

		const Author = (item: any) => {
			if (item._empty_) {
				return null;
			};
			return (
				<div className="author">
					{item.name}
				</div>
			);
		};

		const TabList = (item: any) => (
			<div className="tabs">
				{views.map((item: any, i: number) => (
					<div key={item.id} className={[ 'tab', (item.id == this.view ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onView(item.id); }}>
						{item.name}
					</div>
				))}
			</div>
		);

		switch (this.tab) {

			default:
			case Tab.Type:
				Item = (item: any) => {
					const author = detailStore.get(Constant.subId.store, item.creator, []);
					const allowedDelete = blockStore.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ]);

					return (
						<div className="item" onClick={(e: any) => { this.onClick(e, item); }}>
							<IconObject size={64} iconSize={40} object={item} />
							<div className="info">
								<div className="txt">
									<div className="name">{item.name}</div>
									<div className="descr">{item.description}</div>
									<Author {...author} />
								</div>

								<div className="buttons">
									{allowedDelete ? <Icon className="remove" tooltip="Delete" onClick={(e: any) => { this.onRemove(e, item); }} /> : ''}
								</div>

								<div className="line" />
							</div>
						</div>
					);
				};

				Mid = () => (
					<div className="mid">
						<Title text="Types Library" />
						<Label text="Types are like categories that help you group and manage your Objects.<br/>Create your own or add some from our Marketplace." />
						{filter}
					</div>
				);
				break;

			case Tab.Template:
				Item = (item: any) => {
					const { name, description, coverType, coverId, coverX, coverY, coverScale } = item;
					const author = detailStore.get(Constant.subId.store, item.creator, []);

					return (
						<div className="item" onClick={(e: any) => { this.onClick(e, item); }}>
							<div className="img">
								{coverId && coverType ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true} /> : ''}
							</div>
							<div className="info">
								<div className="name">{name}</div>
								<div className="descr">{description}</div>
								<Author {...author} />
							</div>
						</div>
					);
				};

				Mid = () => (
					<div className="mid">
						<Title text="Template space" />
						<Label text="Our beautifully-designed templates come with hundreds" />
						<Button text="Create a new template" onClick={(e: any) => { this.onCreateTemplate(); }} />
					</div>
				);
				break;

			case Tab.Relation:
				Item = (item: any) => {
					const { name, description } = item;
					const allowedDelete = blockStore.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ]);
					
					return (
						<div className="item" onClick={(e: any) => { this.onClick(e, item); }}>
							<IconObject size={48} iconSize={28} object={item} />
							<div className="info">
								<div className="txt">
									<div className="name">{name}</div>
									<div className="descr">{description}</div>
								</div>

								<div className="buttons">
									{allowedDelete ? <Icon className="remove" tooltip="Delete" onClick={(e: any) => { this.onRemove(e, item); }} /> : ''}
								</div>

								<div className="line" />
							</div>
						</div>
					);
				};

				Mid = () => (
					<div className="mid">
						<Title text="Relations library" />
						<Label text="Relation is a link with a name. They make sense when you are connecting objects, so you can only create a new one from Relations menu in object" />
						{filter}
					</div>
				);
				break;

		};

		const rowRenderer = (param: any) => {
			let item = items[param.index];
			let cn = [ 'row' ];

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
					hasFixedWidth={() => {}}
				>
					<div className={cn.join(' ')} style={param.style}>
						{item.children.map((item: any, i: number) => {
							if (item.id == 'mid') {
								return <Mid key={i} {...item} />;
							};
							if (item.id == 'tabs') {
								return <TabList key={i} {...item} />;
							};
							return <Item key={i} {...item} />;
						})}
					</div>
				</CellMeasurer>
			);
		};

		return (
			<div className={[ 'wrapper', this.tab, this.view ].join(' ')}>
				<Header component="mainStore" {...this.props} tabs={Tabs} tab={this.tab} onTab={this.onTab} />

				<div className="body">
					<div className="items">
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={() => {}}
							isRowLoaded={({ index }) => true}
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
											rowHeight={this.getRowHeight}
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
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		const { isPopup } = this.props;
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: 64,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		this.resize();
		this.onTab(Storage.get('tabStore') || Tab.Type);

		if (!isPopup) {
			DataUtil.setWindowTitleText('Library');
		};
	};

	componentDidUpdate () {
		const { isPopup } = this.props;

		this.resize();
		this.refList.recomputeRowHeights();

		Onboarding.start(Util.toCamelCase('store-' + this.tab), isPopup);
	};

	componentWillUnmount () {
		this._isMounted = false;

		menuStore.closeAll(Constant.menuIds.store);
	};

	getRowHeight (param: any) {
		const { index } = param;

		let h = 0;

		switch (index) {
			// Mid
			case 0:
				switch (this.tab) {
					case Tab.Type: h = 264; break;
					case Tab.Template: h = 280; break;
					case Tab.Relation: h = 264; break;
				};
				break;

			// Tabs
			case 1:
				h = 70;
				break;

			default:
				switch (this.tab) {
					case Tab.Type: h = 96; break;
					case Tab.Template: h = 280; break;
					case Tab.Relation: h = 64; break;
				};
				break;
		};
		return h;
	};

	getRowLimit () {
		let l = 0;
		if (this.tab == Tab.Type) l = 2;
		if (this.tab == Tab.Template) l = 3;
		if (this.tab == Tab.Relation) l = 3;
		return l;
	};

	onTab (id: Tab) {
		this.tab = id;
		this.onView(View.Library);

		Storage.set('tabStore', id);
		analytics.event(Util.toUpperCamelCase([ 'ScreenLibrary', id ].join('-')));
	};

	onView (id: View) {
		this.view = id;
		this.getData(true);

		menuStore.closeAll(Constant.menuIds.store);
	};

	onClick (e: any, item: any) {
		DataUtil.objectOpenPopup(item);
	};

	onCreateType (e: any) {
		C.ObjectCreateObjectType({}, [ I.ObjectFlag.DeleteEmpty ], (message: any) => {
			if (!message.error.code) {
				this.onClick(e, message.details);
				analytics.event('CreateType');
			};
		});
	};

	onCreateTemplate () {
	};

	onFilterChange (v: string) {
		menuStore.updateData(this.getMenuId(), { filter: v });
	};

	onFilterClear () {	
		menuStore.closeAll(Constant.menuIds.store);
	};

	onFilterFocus (e: any) {
		const menuParam: any = {
			element: '#store-filter',
			commonFilter: true,
			horizontal: I.MenuDirection.Center,
			width: 386,
			offsetY: 4,
			data: {
				filter: this.refFilter.getValue(),
				noFilter: true,
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
					addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
						this.onClick(e, relation);
					},
				});
				break;
		};

		menuStore.open(this.getMenuId(), menuParam);
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
			{ type: I.SortType.Asc, relationKey: 'name' },
		];

		let sources: any[] = [];
		let keys: string[] = Constant.defaultRelationKeys.concat([ 'creator' ]);

		switch (this.view) {
			case View.Marketplace:
				filters.push({ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: Constant.storeSpaceId });

				switch (this.tab) {
					case Tab.Type:
						sources = dbStore.getTypes();
						break;

					case Tab.Relation:
						sources = dbStore.getRelations();
						break;
				};

				sources = sources.filter(it => it.sourceObject).map(it => it.sourceObject);
				if (sources.length) {
					filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: sources });
				};
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
				filters.push({ operator: I.FilterOperator.And, relationKey: 'relationKey', condition: I.FilterCondition.NotIn, value: Constant.systemRelationKeys });
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
					case Tab.Template:	 type = Constant.storeTypeId.template; break;
					case Tab.Relation:	 type = Constant.storeTypeId.relation; break;
				};
				break;

			case View.Library:
				switch (this.tab) {
					case Tab.Type:		 type = Constant.typeId.type; break;
					case Tab.Template:	 type = Constant.typeId.template; break;
					case Tab.Relation:	 type = Constant.typeId.relation; break;
				};
				break;
		};
		return type;
	};

	getItems () {
		const { profile } = blockStore;
		const limit = this.getRowLimit();
		const records = dbStore.getRecords(Constant.subId.store, '').map(id => detailStore.get(Constant.subId.store, id));

		records.sort((c1: any, c2: any) => {
			const cr1 = c1.creator;
			const cr2 = c2.creator;

			if ((cr1 == profile) && (cr2 != profile)) return -1;
			if ((cr1 != profile) && (cr2 == profile)) return 1;
			return 0;
		});

		let ret: any[] = [
			{ className: 'block', children: [ { id: 'mid' } ] },
			{ className: 'block', children: [ { id: 'tabs' } ] }
		];
		let n = 0;
		let row = { children: [] };

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

		views.push({ id: View.Marketplace, name: 'Marketplace' });
		return views;
	};

	onRemove (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		Action.uninstall([ item.id ], item.type);
	};

	onScroll ({ clientHeight, scrollHeight, scrollTop }) {
		const win = $(window);
		const { list } = menuStore;

		if (scrollTop) {
			this.top = scrollTop;
		};

		for (let menu of list) {
			win.trigger('resize.' + Util.toCamelCase('menu-' + menu.id));
		};
	};

	resize () {
		const win = $(window);
		const container = Util.getPageContainer(this.props.isPopup);
		const node = $(ReactDOM.findDOMNode(this));
		const content = $('#popupPage .content');
		const body = node.find('.body');
		const hh = Util.sizeHeader();
		const platform = Util.getPlatform();
		const isPopup = this.props.isPopup && !container.hasClass('full');
		
		let wh = isPopup ? container.height() : win.height();
		if (platform == I.Platform.Windows) {
			wh -= Constant.size.headerWindows;
		};

		node.css({ height: wh });
		
		if (isPopup) {
			body.css({ height: wh - hh });
			content.css({ minHeight: 'unset', height: '100%' });
		} else {
			body.css({ height: '' });
			content.css({ minHeight: '', height: '' });
		};
	};

});

export default PageMainStore;