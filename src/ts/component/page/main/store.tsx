import * as React from 'react';
import { Title, Label, Button, IconObject, Loader, Cover, Header } from 'Component';
import { I, C, DataUtil, Util, Storage, Action, Onboarding, analytics } from 'Lib';
import { dbStore, blockStore, detailStore, commonStore } from 'Store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

import Constant from 'json/constant.json';

interface Props extends I.PageComponent {
	isPopup?: boolean;
};

interface State {
	tab: Tab;
	view: View;
	loading: boolean;
};

enum Tab {
	None = '',
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
		tab: Tab.None,
		view: View.Marketplace,
		loading: false,
	};

	offset: number = 0;
	cache: any = null;
	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);

		this.loadMoreRows = this.loadMoreRows.bind(this);
		this.getRowHeight = this.getRowHeight.bind(this);
		this.onTab = this.onTab.bind(this);
	};
	
	render () {
		const { tab, view, loading } = this.state;
		const items = this.getItems();
		const views = [
			{ id: View.Marketplace, name: 'Marketplace' },
			{ id: View.Library, name: 'Library' },
		];

		if (!this.cache) {
			return null;
		};

		let Item = null;
		let Mid: any = null;

		const Author = (item: any) => {
			if (item._empty_) {
				return null;
			};
			return (
				<div className="author">
					<IconObject object={item} size={16} />
					{item.name}
				</div>
			);
		};

		const TabList = (item: any) => (
			<div className="tabs">
				{views.map((item: any, i: number) => (
					<div key={item.id} className={[ 'item', (item.id == view ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onView(e, item); }}>
						{item.name}
					</div>
				))}
			</div>
		);

		switch (tab) {

			default:
			case Tab.Type:
				Item = (item: any) => {
					const author = detailStore.get(Constant.subId.store, item.creator, []);

					return (
						<div className={[ 'item', tab, view ].join(' ')} onClick={(e: any) => { this.onClick(e, item); }}>
							<IconObject size={64} iconSize={40} object={item} />
							<div className="info">
								<div className="txt">
									<div className="name">{item.name}</div>
									<div className="descr">{item.description}</div>
									<Author {...author} />
								</div>
								<div className="line" />
							</div>
						</div>
					);
				};

				Mid = () => (
					<div className="mid">
						<Title text="Type every object" />
						<Label text="Anytype includes many popular types of objects for you to get started" />

						<Button text="Create a new type" onClick={(e: any) => { this.onCreateType(e); }} />
					</div>
				);
				break;

			case Tab.Template:
				Item = (item: any) => {
					const { name, description, coverType, coverId, coverX, coverY, coverScale } = item;
					const author = detailStore.get(Constant.subId.store, item.creator, []);

					return (
						<div className={[ 'item', tab, view ].join(' ')} onClick={(e: any) => { this.onClick(e, item); }}>
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
					const author = detailStore.get(Constant.subId.store, item.creator, []);
					
					return (
						<div className={[ 'item', tab, view ].join(' ')} onClick={(e: any) => { this.onClick(e, item); }}>
							<IconObject size={48} iconSize={28} object={item} />
							<div className="info">
								<div className="txt">
									<div className="name">{name}</div>
									<div className="descr">{description}</div>
									<Author {...author} />
								</div>
								<div className="line" />
							</div>
						</div>
					);
				};

				Mid = () => (
					<div className="mid">
						<Title text="All objects are connected" />
						<Label text="Use relations to build connections between objects" />

						<Button text="Create a new type" />
					</div>
				);
				break;

		};

		const rowRenderer = (param: any) => {
			const item = items[param.index];
			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					<div className="row" style={param.style}>
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
			<div className={[ 'wrapper', tab ].join(' ')}>
				<Header component="mainStore" {...this.props} tabs={Tabs} tab={tab} onTab={this.onTab} />

				<div className="body">
					<div className="items">
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={this.loadMoreRows}
							isRowLoaded={({ index }) => !!items[index]}
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
											rowHeight={this.getRowHeight}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={10}
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
		const { isPopup } = this.props;
		this._isMounted = true;
		this.resize();
		this.onTab(Storage.get('tabStore') || Tab.Type);

		if (!isPopup) {
			DataUtil.setWindowTitleText('Library');
		};
	};

	componentDidUpdate () {
		const { tab } = this.state;
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: 64,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		Onboarding.start(Util.toCamelCase('store-' + tab), this.props.isPopup);
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	getRowHeight (param: any) {
		const { tab } = this.state;
		const { index } = param;

		let h = 0;

		switch (index) {
			// Mid
			case 0:
				switch (tab) {
					case Tab.Type: h = 238; break;
					case Tab.Template: h = 280; break;
					case Tab.Relation: h = 180; break;
				};
				break;

			// Tabs
			case 1:
				h = 70;
				break;

			default:
				switch (tab) {
					case Tab.Type: h = 96; break;
					case Tab.Template: h = 280; break;
					case Tab.Relation: h = 64; break;
				};
				break;
		};
		return h;
	};

	getRowLimit () {
		const { tab } = this.state;

		let l = 0;
		if (tab == Tab.Type) l = 2;
		if (tab == Tab.Template) l = 3;
		if (tab == Tab.Relation) l = 3;
		return l;
	};

	onTab (id: Tab) {
		if (this.state.tab == id) {
			return;
		};

		Storage.set('tabStore', id);
		analytics.event(Util.toUpperCamelCase([ 'ScreenLibrary', id ].join('-')));

		this.state.tab = id;
		this.state.view = View.Marketplace;
		this.setState(this.state);
		this.getData(true);
	};

	onView (e: any, item: any) {
		this.state.view = item.id;
		this.setState(this.state);
		this.getData(true);
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

	getData (clear: boolean, callBack?: (message: any) => void) {
		const { view } = this.state;
		const { workspace } = commonStore;
		const filters = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: this.getTabType() },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
		];
		const sorts = [
			{ type: I.SortType.Asc, relationKey: 'name' },
		];

		switch (view) {
			case View.Marketplace:
				filters.push({ operator: I.FilterOperator.And, relationKey: Constant.relationKey.space, condition: I.FilterCondition.Equal, value: Constant.storeSpaceId });
				break;

			case View.Library:
				filters.push({ operator: I.FilterOperator.And, relationKey: Constant.relationKey.space, condition: I.FilterCondition.Equal, value: workspace });
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
			keys: Constant.defaultRelationKeys.concat([ 'creator' ]),
			ignoreWorkspace: true,
		}, (message: any) => {
			this.setState({ loading: false });

			if (callBack) {
				callBack(message);
			};
		});
	};

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += 25 * this.getRowLimit();
			this.getData(false, resolve);
		});
	};

	getTabType () {
		let { tab, view } = this.state;
		let type = '';

		switch (view) {
			case View.Marketplace:
				switch (tab) {
					case Tab.Type:		 type = Constant.storeTypeId.type; break;
					case Tab.Template:	 type = Constant.storeTypeId.template; break;
					case Tab.Relation:	 type = Constant.storeTypeId.relation; break;
				};
				break;

			case View.Library:
				switch (tab) {
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
			{ children: [ { id: 'mid' } ] },
			{ children: [ { id: 'tabs' } ] }
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

		ret = ret.filter((it: any) => { return it.children.length > 0; });
		return ret;
	};

	resize () {
		const win = $(window);
		const container = Util.getPageContainer(this.props.isPopup);
		const wrapper = container.find('.wrapper');
		const hh = Util.sizeHeader();
		const platform = Util.getPlatform();
		const isPopup = this.props.isPopup && !container.hasClass('full');
		
		let wh = isPopup ? container.height() - hh : win.height();

		if (platform == I.Platform.Windows) {
			wh -= 30;
		};

		wrapper.css({ height: wh });
		
		if (isPopup) {
			const element = $('#popupPage .content');
			element.css({ minHeight: 'unset', height: '100%' });
		};
	};

});

export default PageMainStore;