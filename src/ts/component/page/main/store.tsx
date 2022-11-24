import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Title, Label, Button, IconObject, Cover, Header } from 'Component';
import { I, C, DataUtil, Util, Storage, Onboarding, analytics } from 'Lib';
import { dbStore, blockStore, detailStore, commonStore } from 'Store';
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

const Views = [
	{ id: View.Marketplace, name: 'Marketplace' },
	{ id: View.Library, name: 'Library' },
];

const PageMainStore = observer(class PageMainStore extends React.Component<Props, State> {

	state = {
		loading: false,
	};

	top: number = 0;
	offset: number = 0;
	cache: any = null;
	refList: any = null;
	tab: Tab = Tab.Type;
	view: View = View.Marketplace;

	_isMounted: boolean = false;

	constructor (props: Props) {
		super(props);

		this.getRowHeight = this.getRowHeight.bind(this);
		this.onTab = this.onTab.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		if (!this.cache) {
			return null;
		};

		const items = this.getItems();

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
				{Views.map((item: any, i: number) => (
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

					return (
						<div className="item" onClick={(e: any) => { this.onClick(e, item); }}>
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
					const author = detailStore.get(Constant.subId.store, item.creator, []);
					
					return (
						<div className="item" onClick={(e: any) => { this.onClick(e, item); }}>
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
			<div className={[ 'wrapper', this.tab ].join(' ')}>
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
	};

	getRowHeight (param: any) {
		const { index } = param;

		let h = 0;

		switch (index) {
			// Mid
			case 0:
				switch (this.tab) {
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
		this.onView(View.Marketplace);

		Storage.set('tabStore', id);
		analytics.event(Util.toUpperCamelCase([ 'ScreenLibrary', id ].join('-')));
	};

	onView (id: View) {
		this.view = id;
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
		const { workspace } = commonStore;
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: this.getTabType() },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
		];
		const sorts: I.Sort[] = [
			{ type: I.SortType.Asc, relationKey: 'name' },
		];

		let sources: string[] = [];

		switch (this.view) {
			case View.Marketplace:
				switch (this.tab) {
					case Tab.Type:
						sources = dbStore.getTypes().map(it => it.source);
						break;

					case Tab.Relation:
						sources = dbStore.getRelations().map(it => it.source);
						break;
				};

				filters.push({ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: Constant.storeSpaceId });
				if (sources.length) {
					filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: sources });
				};
				break;

			case View.Library:
				filters.push({ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: workspace });
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

	onScroll ({ clientHeight, scrollHeight, scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
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