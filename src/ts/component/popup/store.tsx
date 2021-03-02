import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button, IconObject, Loader } from 'ts/component';
import { I, C, DataUtil, SmileUtil } from 'ts/lib';
import { dbStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

interface State {
	tab: string;
	loading: boolean;
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
		loading: false,
	};

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);

		this.resize = this.resize.bind(this);
	};
	
	render () {
		const { tab, loading } = this.state;
		const rootId = this.getRootId();
		const block = blockStore.getLeaf(rootId, BLOCK_ID) || {};
		const meta = dbStore.getMeta(rootId, block.id);
		const views = block.content?.views || [];

		let Item = null;
		let element = null;
		let data = dbStore.getData(rootId, block.id).map((it: any) => {
			it.name = String(it.name || Constant.default.name || '');
			return it;
		});

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
			case 'type':
				Item = (item: any) => {
					const author = blockStore.getDetails(rootId, item.creator);

					return (
						<div className={[ 'item', 'isType' ].join(' ')} onClick={(e: any) => { this.onClick(e, item); }}>
							<IconObject size={64} object={{ ...item, layout: I.ObjectLayout.ObjectType }} />
							<div className="info">
								<div className="name">{item.name}</div>
								<div className="descr">{item.description}</div>
								<Author {...author} />
								<div className="line" />
							</div>
							<Button className="blank c28" text="Add" />
						</div>
					);
				};

				element = (
					<React.Fragment>
						<div className="mid">
							<Title text="Type every object" />
							<Label text="Our beautifully-designed templates come with hundreds" />

							<Button text="Create a new type" className="orange" onClick={(e: any) => { this.onCreateType(); }} />
						</div>

						{loading ? 
							<Loader />
						: (
							<React.Fragment>
								{tabs}
								<div className="items">
									{data.map((item: any, i: number) => (
										<Item key={i} {...item} />
									))}
								</div>
							</React.Fragment>
						)}
					</React.Fragment>
				);
				break;

			case 'template':
				break;

			case 'relation':
				Item = (item: any) => {
					const author = blockStore.getDetails(rootId, item.creator);
					return (
						<div className={[ 'item', 'isRelation' ].join(' ')} onClick={(e: any) => { this.onClick(e, item); }}>
							<IconObject size={48} object={{ ...item, layout: I.ObjectLayout.Relation }} />
							<div className="info">
								<div className="name">{item.name}</div>
								<Author {...author} />
								<div className="line" />
							</div>
							<Button className="blank c28" text="Add" />
						</div>
					);
				};

				element = (
					<React.Fragment>
						<div className="mid">
							<Title text="All objects are connected" />
							<Label text="Our beautifully-designed templates come with hundreds" />

							<Button text="Create a new type" className="orange" />
						</div>

						{loading ? 
							<Loader />
						: (
							<React.Fragment>
								{tabs}
								<div className="items">
									{data.map((item: any, i: number) => (
										<Item key={i} {...item} />
									))}
								</div>
							</React.Fragment>
						)}
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
					{element}
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
			const height = Math.max(648, win.height() - 128);

			obj.css({ height: height });
			position();
		});
	};

	load () {
		this.setState({ loading: true });

		C.BlockOpen(this.getRootId(), (message: any) => {
			this.setState({ loading: false });
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

	onClick (e: any, item: any) {
		DataUtil.objectOpenEvent(e, item);
	};

	onCreateType () {
		const param: any = { 
			name: Constant.default.nameType, 
			layout: I.ObjectLayout.Page, 
			iconEmoji: SmileUtil.random(),
		};

		C.ObjectTypeCreate(param, (message: any) => {
			if (message.error.code) {
				return;
			};

			DataUtil.objectOpenPopup({ ...message.objectType, layout: I.ObjectLayout.ObjectType });
		});
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