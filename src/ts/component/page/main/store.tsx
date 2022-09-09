import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button, IconObject, Loader, Cover, Header } from 'Component';
import { I, C, DataUtil, Util, Dataview, Storage, Action, Onboarding, analytics } from 'Lib';
import { dbStore, blockStore, detailStore, } from 'Store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends RouteComponentProps<any> {
	isPopup?: boolean;
};

interface State {
	tab: string;
	loading: boolean;
};

enum Tab {
	None = '',
	Type = 'type',
	Template = 'template',
	Relation = 'relation',
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

const BLOCK_ID = 'dataview';
const Constant = require('json/constant.json');

const PageMainStore = observer(class PageMainStore extends React.Component<Props, State> {

	state = {
		tab: '',
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
		const { tab, loading } = this.state;
		const rootId = this.getRootId();
		const subId = dbStore.getSubId(rootId, BLOCK_ID);
		const block = blockStore.getLeaf(rootId, BLOCK_ID) || {};
		const meta = dbStore.getMeta(rootId, block.id);
		const views = block.content?.views || [];
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

		const tabs = (
			<div className="tabs">
				{views.map((item: any, i: number) => (
					<div key={item.id} className={[ 'item', (item.id == meta.viewId ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onView(e, item); }}>
						{item.name}
					</div>
				))}
			</div>
		);

		switch (tab) {

			default:
			case Tab.Type:
				Item = (item: any) => {
					const author = detailStore.get(subId, item.creator, []);

					return (
						<div className={[ 'item', tab, meta.viewId ].join(' ')} onClick={(e: any) => { this.onClick(e, item); }}>
							<IconObject size={64} iconSize={40} object={item} />
							<div className="info">
								<div className="txt">
									<div className="name">{item.name}</div>
									<div className="descr">{item.description}</div>
									<Author {...author} />
								</div>
								<div className="line" />
							</div>
							<Button className="blank c28" text="Add" />
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
					const author = detailStore.get(subId, item.creator, []);

					return (
						<div className={[ 'item', tab, meta.viewId ].join(' ')} onClick={(e: any) => { this.onClick(e, item); }}>
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
					const author = detailStore.get(subId, item.creator, []);
					
					return (
						<div className={[ 'item', tab, meta.viewId ].join(' ')} onClick={(e: any) => { this.onClick(e, item); }}>
							<IconObject size={48} iconSize={28} object={item} />
							<div className="info">
								<div className="txt">
									<div className="name">{name}</div>
									<div className="descr">{description}</div>
									<Author {...author} />
								</div>
								<div className="line" />
							</div>
							<Button className="blank c28" text="Add" />
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
							return <Item key={i} {...item} />;
						})}
					</div>
				</CellMeasurer>
			);
		};

		return (
			<div className={[ 'wrapper', tab ].join(' ')}>
				<Header component="mainStore" {...this.props} rootId={rootId} tabs={Tabs} tab={tab} onTab={this.onTab} />

				<div className="body">
					{tabs}

					{loading ? 
						<Loader id="loader" />
					: (
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
					)}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { isPopup } = this.props;

		this._isMounted = true;
		this.resize();
		this.onTab(Storage.get('tabStore') || Tabs[0].id);

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
		const { storeType, storeRelation, storeTemplate } = blockStore;

		this._isMounted = false;

		Action.pageClose(storeType, true);
		Action.pageClose(storeRelation, true);
		Action.pageClose(storeTemplate, true);
	};

	getRootId () {
		const { tab } = this.state;
		const { storeType, storeRelation, storeTemplate } = blockStore;

		let id = '';
		if (tab == Tab.Type) id = storeType;
		if (tab == Tab.Template) id = storeTemplate;
		if (tab == Tab.Relation) id = storeRelation;
		return id;
	};

	getRowHeight (param: any) {
		const { tab } = this.state;
		const { index } = param;

		let h = 0;
		if (tab == Tab.Type) {
			h = index == 0 ? 238 : 96;
		};
		if (tab == Tab.Template) {
			h = 280;
		};
		if (tab == Tab.Relation) {
			h = index == 0 ? 180 : 64;
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
		this.setState({ tab: id, loading: true });

		C.ObjectOpen(this.getRootId(), '', (message: any) => {
			this.getDataviewData('library', true);
			this.setState({ loading: false });
		});
	};

	onView (e: any, item: any) {
		this.getDataviewData(item.id, true);
	};

	onClick (e: any, item: any) {
		DataUtil.objectOpenPopup(item);
	};

	onCreateType (e: any) {
		const details: any = { 
			name: '',
			layout: I.ObjectLayout.Page, 
		};

		C.ObjectCreateObjectType(details, [ I.ObjectFlag.DeleteEmpty ], (message: any) => {
			if (!message.error.code) {
				this.onClick(e, { id: message.objectId, layout: I.ObjectLayout.Type });
				analytics.event('CreateType');
			};
		});
	};

	onCreateTemplate () {
	};

	getDataviewData (id: string, clear: boolean, callBack?: (message: any) => void) {
		Dataview.getData(this.getRootId(), BLOCK_ID, id, [ 'creator' ].concat(Constant.defaultRelationKeys), 0, 0, clear, callBack);
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		const rootId = this.getRootId();
		const { viewId } = dbStore.getMeta(rootId, BLOCK_ID);

        return new Promise((resolve, reject) => {
			this.offset += 25 * this.getRowLimit();
			this.getDataviewData(viewId, false, resolve);
		});
	};

	getItems () {
		const { profile } = blockStore;
		const limit = this.getRowLimit();
		const rootId = this.getRootId();
		const subId = dbStore.getSubId(rootId, BLOCK_ID);
		const records = dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id));

		records.sort((c1: any, c2: any) => {
			const cr1 = c1.creator;
			const cr2 = c2.creator;

			if ((cr1 == profile) && (cr2 != profile)) return -1;
			if ((cr1 != profile) && (cr2 == profile)) return 1;
			return 0;
		});

		let ret: any[] = [
			{ children: [ { id: 'mid' } ] }
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
			wh += 30;
		};

		wrapper.css({ height: wh });
		
		if (isPopup) {
			const element = $('#popupPage .content');
			element.css({ minHeight: 'unset', height: '100%' });
		};
	};

});

export default PageMainStore;