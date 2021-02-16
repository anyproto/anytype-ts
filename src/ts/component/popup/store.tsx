import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button, IconObject, Icon } from 'ts/component';
import { I, C, DataUtil, Util } from 'ts/lib';
import { dbStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

interface State {
	tab: string;
};

const $ = require('jquery');
const raf = require('raf');
const Tabs = [
	{ 
		id: 'type', name: 'Types', active: 'library',
		children: [
			{ id: 'market', name: 'Marketplace', disabled: true },
			{ id: 'library', name: 'Library' },
		]
	},
	/*
	{ 
		id: 'template', 'name': 'Templates', active: 'library', 
		children: [
			{ id: 'market', name: 'Marketplace' },
			{ id: 'library', name: 'Library' },
		], 
	},
	*/
	{ 
		id: 'relation', 'name': 'Relations', active: 'library', 
		children: [
			{ id: 'market', name: 'Marketplace', disabled: true },
			{ id: 'library', name: 'Library' },
		], 
	},
];
const BLOCK_ID = 'dataview';
const Constant = require('json/constant.json');

@observer
class PopupStore extends React.Component<Props, State> {

	state = {
		tab: 'type',
	};

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);

		this.resize = this.resize.bind(this);
	};
	
	render () {
		const { objectTypes } = dbStore;
		const { profile } = blockStore;
		const { tab } = this.state;
		const rootId = this.getRootId();
		const tabItem = Tabs.find((it: any) => { return it.id == tab; });
		const details = blockStore.getDetails(profile, profile);
		const block = blockStore.getLeaf(rootId, BLOCK_ID);

		console.log(block);

		if (!block) {
			return null;
		};

		const views = block.content.views;
		const meta = dbStore.getMeta(rootId, block.id);
		const data = dbStore.getData(rootId, block.id);

		let relations = [];
		objectTypes.map((it: I.ObjectType) => { relations = relations.concat(it.relations); });
		relations = Util.arrayUniqueObjects(relations, 'relationKey');
		relations.sort((c1: any, c2: any) => {
			if (c1.name > c2.name) return 1;
			if (c1.name < c2.name) return -1;
			return 0;
		});

		let content = null;
		let Item = null;

		switch (tab) {

			default:
			case 'type':
				Item = (item: any) => {
					const author = blockStore.getDetails(rootId, item.creator);

					return (
						<div className={[ 'item', 'isType' ].join(' ')} onClick={(e: any) => { this.onObjectType(e, item); }}>
							<IconObject size={64} object={{ ...item, layout: I.ObjectLayout.ObjectType }} />
							<div className="info">
								<div className="name">{item.name}</div>
								<div className="descr">{item.description}</div>
								<div className="author">
									<IconObject object={author} size={16} />
									{author.name}
								</div>
								<div className="line" />
							</div>
							<Button className="blank c28" text="Add" />
						</div>
					);
				};

				content = (
					<React.Fragment>
						<div className="mid">
							<Title text="Type every object" />
							<Label text="Our beautifully-designed templates come with hundreds" />

							<Button text="Create a new type" className="orange" onClick={(e: any) => { this.onObjectType(e, { id: 'create' }); }} />
						</div>

						<div className="tabs">
							{views.map((item: any, i: number) => (
								<div key={item.id} className={[ 'item', (item.id == meta.viewId ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onView(e, item); }}>
									{item.name}
								</div>
							))}
						</div>

						<div className="items">
							{data.map((item: any, i: number) => (
								<Item key={i} {...item} />
							))}
						</div>
					</React.Fragment>
				);
				break;

			case 'template':
				break;

			case 'relation':
				Item = (item: any) => (
					<div className={[ 'item', 'isRelation' ].join(' ')} onClick={(e: any) => { this.onRelation(e, item); }}>
						<div className="iconObject c48 isRelation">
							<Icon className={[ 'iconCommon', 'c30', 'relation', DataUtil.relationClass(item.format) ].join(' ')} />
						</div>
						<div className="info">
							<div className="name">{item.name} ({item.relationKey})</div>
							<div className="author">
								<IconObject object={details} size={16} />
								{details.name}
							</div>
							<div className="line" />
						</div>
						<Button className="blank c28" text="Add" />
					</div>
				);

				content = (
					<React.Fragment>
						<div className="mid">
							<Title text="All objects are connected" />
							<Label text="Our beautifully-designed templates come with hundreds" />

							<Button text="Create a new type" className="orange" />
						</div>

						<div className="tabs">
							{views.map((item: any, i: number) => (
								<div key={item.id} className={[ 'item', (item.id == meta.viewId ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onView(e, item); }}>
									{item.name}
								</div>
							))}
						</div>

						<div className="items">
							{relations.map((item: any, i: number) => (
								<Item key={i} {...item} />
							))}
						</div>
					</React.Fragment>
				);
				break;

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
					{content}
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
			const width = 1152; //Math.min(1152, Math.max(960, win.width() - 128));
			const height = Math.max(648, win.height() - 128);

			obj.css({ width: width, height: height });
			position();
		});
	};

	load () {
		const rootId = this.getRootId();
		C.BlockOpen(rootId, (message: any) => {
			this.forceUpdate();
		});
	};

	getRootId () {
		const { tab } = this.state;
		const { storeType, storeRelation, storeTemplate } = blockStore;

		let id = '';
		if (tab == 'type') id = storeType;
		if (tab == 'template') id = storeTemplate;
		if (tab == 'relation') id = storeRelation;
		return id;
	};

	onTab (e: any, item: any) {
		const tabItem = Tabs.find((it: any) => { return it.id == item.id; });
		if (!tabItem) {
			return;
		};

		this.state.tab = tabItem.id;
		this.setState({ tab: item.id });

		this.load();
	};

	onView (e: any, item: any) {
		this.getData(item.id, 0);
	};

	onObjectType (e: any, item: any) {
		const { history } = this.props;
		const id = DataUtil.schemaField(item.url);

		history.push('/main/objectType/' + id);
	};

	onRelation (e: any, item: any) {
		const { history } = this.props;

		history.push('/main/relation/' + item.relationKey);
	};

	getData (id: string, offset: number, callBack?: (message: any) => void) {
		const rootId = this.getRootId();
		const { viewId } = dbStore.getMeta(rootId, BLOCK_ID);
		const viewChange = id != viewId;
		const meta: any = { offset: offset };
		const cb = (message: any) => {
			if (callBack) {
				callBack(message);
			};
		};

		if (viewChange) {
			meta.viewId = id;
			dbStore.recordsSet(rootId, BLOCK_ID, []);
		};

		dbStore.metaSet(rootId, BLOCK_ID, meta);
		C.BlockDataviewViewSetActive(rootId, BLOCK_ID, id, offset, Constant.limit.store.records, cb);

	};
	
};

export default PopupStore;