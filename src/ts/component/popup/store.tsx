import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button, IconObject, Loader } from 'ts/component';
import { I, C, DataUtil, SmileUtil } from 'ts/lib';
import { dbStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

interface State {
	tab: string;
	loading: boolean;
};

enum Tab {
	Type = 'type',
	Template = 'template',
	Relation = 'relation',
}

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');

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

@observer
class PopupStore extends React.Component<Props, State> {

	state = {
		tab: Tab.Type,
		loading: false,
	};

	offset: number = 0;
	cache: any = null;
	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);

		this.loadMoreRows = this.loadMoreRows.bind(this);
		this.getRowHeight = this.getRowHeight.bind(this);
		this.resize = this.resize.bind(this);
	};
	
	render () {
		const { tab, loading } = this.state;
		const rootId = this.getRootId();
		const block = blockStore.getLeaf(rootId, BLOCK_ID) || {};
		const meta = dbStore.getMeta(rootId, block.id);
		const views = block.content?.views || [];
		const items = this.getItems();

		let Item = null;
		let mid = null;

		const Author = (item: any) => {
			if (item._objectEmpty_) {
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
					const author = blockStore.getDetails(rootId, item.creator);

					return (
						<div className={[ 'item', tab, meta.viewId ].join(' ')} onClick={(e: any) => { this.onClick(e, item); }}>
							<IconObject size={64} object={{ ...item, layout: I.ObjectLayout.ObjectType }} />
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

				mid = (
					<div className="mid">
						<Title text="Type every object" />
						<Label text="Our beautifully-designed templates come with hundreds" />

						<Button text="Create a new type" className="orange" onClick={(e: any) => { this.onCreateType(); }} />
					</div>
				);
				break;

			case Tab.Template:
				break;

			case Tab.Relation:
				Item = (item: any) => {
					const author = blockStore.getDetails(rootId, item.creator);
					return (
						<div className={[ 'item', tab, meta.viewId ].join(' ')} onClick={(e: any) => { this.onClick(e, item); }}>
							<IconObject size={48} object={{ ...item, layout: I.ObjectLayout.Relation }} />
							<div className="info">
								<div className="txt">
									<div className="name">{item.name}</div>
									<Author {...author} />
								</div>
								<div className="line" />
							</div>
							<Button className="blank c28" text="Add" />
						</div>
					);
				};

				mid = (
					<div className="mid">
						<Title text="All objects are connected" />
						<Label text="Our beautifully-designed templates come with hundreds" />

						<Button text="Create a new type" className="orange" />
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
						{item.children.map((smile: any, i: number) => {
							return <Item key={i} id={smile.smile} {...smile} />;
						})}
					</div>
				</CellMeasurer>
			);
		};

		return (
			<div className={[ 'wrapper', tab ].join(' ')}>
				<div className="head">
					<div className="tabs">
						{Tabs.map((item: any, i: number) => (
							<div key={item.id} className={[ 'item', (item.id == tab ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onTab(e, item); }}>
								{item.name}
							</div>
						))}
					</div>
				</div>

				<div className="body">
					{mid}
					{tabs}

					{loading ? 
						<Loader />
					: (
						<div className="items">
							<InfiniteLoader
								rowCount={items.length}
								loadMoreRows={this.loadMoreRows}
								isRowLoaded={({ index }) => { return index < items.length; }}
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
		this._isMounted = true;
		this.rebind();
		this.resize();
		this.onTab(null, Tabs[0]);
	};

	componentDidUpdate () {
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: this.getRowHeight(),
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});


		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.unbind('resize.store').on('resize.store', () => { this.resize(); });
	};

	unbind () {
		$(window).unbind('resize.store');
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		raf(() => {
			const { getId, position } = this.props;
			const win = $(window);
			const obj = $(`#${getId()} #innerWrap`);
			const height = Math.max(648, win.height() - 128);

			obj.css({ height: height });
			position();
		});
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

	getRowHeight () {
		const { tab } = this.state;

		let h = 0;
		if (tab == Tab.Type) h = 96;
		if (tab == Tab.Template) h = 2;
		if (tab == Tab.Relation) h = 64;
		return h;
	};

	getRowLimit () {
		const { tab } = this.state;

		let l = 0;
		if (tab == Tab.Type) l = 2;
		if (tab == Tab.Template) l = 2;
		if (tab == Tab.Relation) l = 3;
		return l;
	};

	onTab (e: any, item: any) {
		const tabItem = Tabs.find((it: any) => { return it.id == item.id; });
		if (!tabItem) {
			return;
		};

		this.state.tab = tabItem.id;
		this.setState({ tab: item.id, loading: true });

		C.BlockOpen(this.getRootId(), (message: any) => {
			this.setState({ loading: false });
		});
	};

	onView (e: any, item: any) {
		this.getData(item.id, true);
	};

	onClick (e: any, item: any) {
		DataUtil.objectOpenEvent(e, item);
	};

	onCreateType () {
		const { objectTypes } = dbStore;
		const param: any = { 
			name: '',
			layout: I.ObjectLayout.Page, 
		};

		C.ObjectTypeCreate(param, (message: any) => {
			if (message.error.code) {
				return;
			};

			objectTypes.push(message.objectType);
			dbStore.objectTypesSet(objectTypes);

			DataUtil.objectOpenPopup({ ...message.objectType, layout: I.ObjectLayout.ObjectType });
		});
	};

	getData (id: string, clear: boolean, callBack?: (message: any) => void) {
		const rootId = this.getRootId();
		const { viewId } = dbStore.getMeta(rootId, BLOCK_ID);
		const viewChange = id != viewId;
		const meta: any = { offset: this.offset };
		const cb = (message: any) => {
			if (callBack) {
				callBack(message);
			};
		};

		if (viewChange) {
			meta.viewId = id;
		};
		if (viewChange || clear) {
			dbStore.recordsSet(rootId, BLOCK_ID, []);
		};

		dbStore.metaSet(rootId, BLOCK_ID, meta);
		C.BlockDataviewViewSetActive(rootId, BLOCK_ID, id, this.offset, Constant.limit.store.records, cb);
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		const rootId = this.getRootId();
		const { viewId } = dbStore.getMeta(rootId, BLOCK_ID);

        return new Promise((resolve, reject) => {
			this.offset += 25 * this.getRowLimit();
			this.getData(viewId, false, resolve);
		});
	};

	getItems () {
		const limit = this.getRowLimit();
		const rootId = this.getRootId();
		const data = dbStore.getData(rootId, BLOCK_ID).map((it: any) => {
			it.name = String(it.name || Constant.default.name || '');
			return it;
		});

		let ret: any[] = [];
		let n = 0;
		let row = { children: [] };
		for (let i = 0; i < data.length; ++i) {
			const item = data[i];

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

};

export default PopupStore;