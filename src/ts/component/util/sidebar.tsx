import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, DataUtil, Util, keyboard, Storage, Relation, focus } from 'ts/lib';
import { IconObject, Icon, Loader } from 'ts/component';
import { blockStore, commonStore, dbStore, detailStore, menuStore, popupStore } from 'ts/store';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { observer } from 'mobx-react';

import Item from './sidebar/item';

interface Props {
	isPopup?: boolean;
	dataset?: any;
};

interface State {
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const sha1 = require('sha1');

const MAX_DEPTH = 100;
const LIMIT = 20;
const HEIGHT = 28;
const SNAP_THRESHOLD = 30;
const SKIP_TYPES_LOAD = [
	Constant.typeId.space,
];

const Sidebar = observer(class Sidebar extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		loading: false,
	};
	loaded: boolean = false;
	top: number = 0;
	id: string = '';
	ox: number = 0;
	oy: number = 0;
	width: number = 0;
	height: number = 0;
	timeout: number = 0;
	refList: any = null;
	cache: any = {};
	subId: string = '';
	subscriptionIds: any = {};

	constructor (props: any) {
		super(props);

		this.onExpand = this.onExpand.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onContext = this.onContext.bind(this);
		this.onProfile = this.onProfile.bind(this);
		this.onStore = this.onStore.bind(this);
		this.onSettings = this.onSettings.bind(this);
		this.onAdd = this.onAdd.bind(this);

		this.getRowHeight = this.getRowHeight.bind(this)
	};

	render () {
		const { sidebar } = commonStore;
		const { width, height, x, y, fixed, snap } = sidebar;
		const { loading } = this.state;
		const items = this.getItems();
		const css: any = { width };
		const cn = [ 'sidebar' ];
		const profile = detailStore.get(Constant.subIds.profile, blockStore.profile);

		if (snap == I.MenuDirection.Left) {
			cn.push('left');
		};
		if (snap == I.MenuDirection.Right) {
			cn.push('right');
		};

		if (fixed) {
			cn.push('fixed');
		} else {
			css.height = height;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					<Item 
						{...item}
						index={param.index}
						elementId={this.getId(item)}
						style={param.style}
						onClick={this.onClick} 
						onToggle={this.onToggle} 
						onContext={this.onContext}
					/>
				</CellMeasurer>
			);
		};

		return (
            <div 
				id="sidebar" 
				className={cn.join(' ')} 
				style={css} 
				onMouseEnter={this.onMouseEnter} 
				onMouseLeave={this.onMouseLeave}
			>
				<div className="head" onMouseDown={this.onDragStart}></div>
				
				<div className="body">
					{loading ? (
						<Loader />
					) : (
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={() => {}}
							isRowLoaded={() => { return true; }}
							threshold={LIMIT}
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
											rowHeight={({ index }) => this.getRowHeight(items[index])}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={LIMIT}
											onScroll={this.onScroll}
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					)}
				</div>

				<div className="foot">
					<div className="item" onClick={this.onProfile}>
						<IconObject object={profile} size={26} tooltip="Your profile" tooltipY={I.MenuDirection.Top} />
					</div>
					<div className="item" onClick={this.onStore}>
						<Icon className="store" tooltip="Library" tooltipY={I.MenuDirection.Top} />
					</div>
					{this.canAdd() ? (
						<div className="item" onClick={this.onAdd}>
							<Icon className="add" tooltip="Create new object" tooltipY={I.MenuDirection.Top} />
						</div>
					) : ''}
					<div className="item" onClick={this.onSettings}>
						<Icon className="settings" tooltip="Settings" tooltipY={I.MenuDirection.Top} />
					</div>
					{fixed ? (
						<div className="item" onClick={this.onExpand}>
							<Icon className="collapse" tooltip="Collapse sidebar" tooltipY={I.MenuDirection.Top} />
						</div>
					) : ''}
				</div>

				<div className="resize-h" onMouseDown={(e: any) => { this.onResizeStart(e, I.MenuType.Horizontal); }} />
				<div className="resize-v" onMouseDown={(e: any) => { this.onResizeStart(e, I.MenuType.Vertical); }} />
            </div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.loadSections();
		this.rebind();
	};

	componentDidUpdate () {
		const items = this.getItems();

		this.resize();
		this.restore();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		window.clearTimeout(this.timeout);
		C.ObjectSearchUnsubscribe(Object.keys(this.subscriptionIds).map(id => dbStore.getSubId(Constant.subIds.sidebar, id)));
	};

	rebind () {
		this.unbind();
		$(window).on('resize.sidebar', (e: any) => { this.resize(); });
	};

	unbind () {
		$(window).unbind('resize.sidebar');
	};

	restore () {
		const { sidebar } = commonStore;
		const { x, y, snap } = sidebar;
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('.body');

		this.width = node.width();
		this.height = node.height();

		body.scrollTop(this.top);

		this.setActive(this.id);
		this.setStyle(x, y, snap);
	};

	getSections () {
		return [
			{ id: I.TabIndex.Favorite, name: 'Favorites' },
			{ id: I.TabIndex.Recent, name: 'Recent' },
			{ id: I.TabIndex.Set, name: 'Sets' },
		];
	};

	loadSections () {
		const { root, profile, recent } = blockStore;
		const sections = this.getSections();
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
			{ 
				operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, 
				value: [
					'_anytype_profile',
					profile,
					root,
				]
			},
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: SKIP_TYPES_LOAD },
		];

		let n = 0;
		let limit = 0;
		let sorts: I.Sort[] = [];
		let sectionFilters: I.Filter[] = [];
		let cb = () => {
			n++;
			if (n == sections.length - 1) {
				this.setState({ loading: false });
			};
		};

		this.setState({ loading: true });

		sections.forEach((section: any) => {
			const subId = dbStore.getSubId(Constant.subIds.sidebar, section.id);

			switch (section.id) {
				case I.TabIndex.Favorite:
					sectionFilters = [
						{ operator: I.FilterOperator.And, relationKey: 'isFavorite', condition: I.FilterCondition.Equal, value: true }
					];
					sorts = [];
					limit = 0;
					break;

				case I.TabIndex.Recent:
					sectionFilters = [];
					sorts = [
						{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
					];
					limit = LIMIT;
					break;

				case I.TabIndex.Set:
					sectionFilters = [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set }
					];
					sorts = [
						{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
					];
					limit = LIMIT;
					break;

			};
			
			C.ObjectSearchSubscribe(subId, filters.concat(sectionFilters), sorts, Constant.sidebarRelationKeys, [], 0, limit, true, '', '', true, cb);
		});
	};

	checkLinks (ids: string[]) {
		return ids.filter(id => !dbStore.getRecordsIds(Constant.subIds.deleted, '').includes(id));
	};

	loadItem (id: string, links: string[]) {
		const hash = sha1(links.join(''));
		const subId = dbStore.getSubId(Constant.subIds.sidebar, id);

		if (this.subscriptionIds[id] && (this.subscriptionIds[id] == hash)) {
			return;
		};

		this.subscriptionIds[id] = hash;
		C.ObjectIdsSubscribe(subId, links, Constant.sidebarRelationKeys, true);
	};

	getRecords (subId: string) {
		let records: any[] = dbStore.getRecordsIds(subId, '');

		records = records.map((id: string) => { 
			let item = detailStore.get(subId, id, [ 'id', 'type', 'links' ], true);
			let links = [];
			if (item.type != Constant.typeId.set) {
				links = Relation.getArrayValue(item.links);
			};
			return { ...item, links };
		});

		return records;
	};

	unwrap (sectionId: string, list: any[], parentId: string, items: any[], depth: number) {
		if (!items.length || (depth >= MAX_DEPTH)) {
			return list;
		};

		for (let item of items) {
			let links = this.checkLinks(item.links);
			let length = links.length;
			let newItem = {
				details: item,
				id: item.id,
				depth,
				length,
				parentId,
				sectionId,
			};
			list.push(newItem);

			if (length) {
				const id = this.getId({ ...newItem, sectionId });
				const check = Storage.checkToggle(Constant.subIds.sidebar, id);

				if (check) {
					this.loadItem(item.id, links);
					list = this.unwrap(sectionId, list, item.id, this.getRecords(dbStore.getSubId(Constant.subIds.sidebar, item.id)), depth + 1);
				};
			};
		};
		return list;
	};

	getItems () {
		let sections = this.getSections();
		let items: any[] = [];

		sections.forEach((section: any) => {
			const children = this.getRecords(dbStore.getSubId(Constant.subIds.sidebar, section.id));
			const item: any = {
				details: {
					id: section.id,
					name: section.name,
				},
				length: children.length,
				depth: 0,
				id: section.id,
				parentId: '',
				sectionId: '',
				isSection: true,
			};
			item.isOpen = Storage.checkToggle(Constant.subIds.sidebar, this.getId(item));
			items.push(item);

			if (item.isOpen) {
				items = this.unwrap(section.id, items, section.id, children, 1);
			};
		});

		const filtered = items.filter(it => it.isSection);
		for (let i = 0; i < filtered.length; ++i) {
			const item = filtered[i];
			const next = filtered[i + 1];

			if (next && item.isOpen) {
				next.withPadding = true;
			};
		};

		return items;
	};

	sortByIds (ids: string[], c1: any, c2: any) {
		const i1 = ids.indexOf(c1);
		const i2 = ids.indexOf(c2);
		if (i1 > i2) return 1; 
		if (i1 < i2) return -1;
		return 0;
	};

	onScroll ({ clientHeight, scrollHeight, scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	onToggle (e: any, item: any) {
		if (!this._isMounted) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const id = this.getId(item);

		Storage.setToggle(Constant.subIds.sidebar, id, !Storage.checkToggle(Constant.subIds.sidebar, id));
		this.forceUpdate();
	};

	onExpand (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { sidebar } = commonStore;
		const fixed = !sidebar.fixed;
		const update: any = { fixed };

		if (fixed) {
			update.x = 0;
			update.y = 0;
		};

		commonStore.sidebarSet(update);
	};

	setActive (id: string) {
		const node = $(ReactDOM.findDOMNode(this));

		node.find('.item.hover').removeClass('hover');

		if (id) {
			node.find(`#item-${id}`).addClass('hover');
		};
	};

	getId (item: any) {
		const { sectionId, parentId, id, depth } = item;
		return [ sectionId, parentId, id, depth ].join('-');
	};

	onClick (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		this.id = this.getId(item);
		this.setActive(this.id);

		DataUtil.objectOpenEvent(e, item.details);
	};

	onContext (e: any, item: any): void {
		e.preventDefault();
		e.stopPropagation();

		const { x, y } = keyboard.mouse.page;
		const subId = dbStore.getSubId(Constant.subIds.sidebar, item.parentId);

		this.setActive(this.getId(item));

		menuStore.open('dataviewContext', {
			rect: { width: 0, height: 0, x: x + 20, y: y },
			vertical: I.MenuDirection.Center,
			classNameWrap: 'fromPopup',
			onClose: () => {
				this.setActive(this.id);
			},
			data: {
				objectId: item.id,
				subId,
			}
		});
	};

	onMouseEnter (e: any) {
		window.clearTimeout(this.timeout);
	};

	onMouseLeave (e: any) {
		if (!this._isMounted || keyboard.isResizing || keyboard.isDragging) {
			return;
		};

		const { sidebar } = commonStore;
		const { snap, fixed } = sidebar;

		if (fixed || (snap === null) || menuStore.isOpen()) {
			return;
		};

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			const node = $(ReactDOM.findDOMNode(this));
			node.removeClass('active');
		}, 1000);
	};

	onResizeStart (e: any, dir: I.MenuType) {
		if (!this._isMounted) {
			return;
		};

		const { dataset } = this.props;
		const { selection } = dataset || {};
		const { sidebar } = commonStore;
		const { fixed } = sidebar;
		const node = $(ReactDOM.findDOMNode(this));
		const win = $(window);
		const body = $('body');
		const offset = node.offset();

		if (fixed && (dir == I.MenuType.Vertical)) {
			return;
		};
		
		this.width = node.width();
		this.height = node.height();
		this.ox = offset.left;
		this.oy = offset.top;

		if (selection) {
			selection.preventSelect(true);
		};

		keyboard.setResize(true);
		body.addClass(dir == I.MenuType.Vertical ? 'rowResize' : 'colResize');
		win.unbind('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', (e: any) => { this.onResizeMove(e, dir); });
		win.on('mouseup.sidebar', (e: any) => { this.onResizeEnd(e, dir); });
	};

	onResizeMove (e: any, dir: I.MenuType) {
		const { sidebar } = commonStore;
		const { snap, width, fixed } = sidebar;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		if (dir == I.MenuType.Horizontal) {
			const d = (snap == I.MenuDirection.Right) ? (this.ox - e.pageX + width) : e.pageX - this.ox;
	
			this.width = this.getWidth(d);
			this.setWidth(this.width);

			if (fixed) {
				win.trigger('resize.editor');
			};
		};

		if (dir == I.MenuType.Vertical) {
			this.height = this.getHeight(e.pageY - this.oy);
			node.css({ height: this.height });
		};
	};

	onResizeEnd (e: any, dir: I.MenuType) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const update: any = {};

		if (dir == I.MenuType.Horizontal) {
			update.width = this.width;
		};
		if (dir == I.MenuType.Vertical) {
			update.height = this.height;
		};
		commonStore.sidebarSet(update);

		if (selection) {
			selection.preventSelect(false);
		};

		keyboard.setResize(false);
		$('body').removeClass('rowResize colResize');
		$(window).unbind('mousemove.sidebar mouseup.sidebar');
	};

	onDragStart (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const { sidebar } = commonStore;
		const { fixed } = sidebar;

		if (fixed) {
			return;
		};

		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const offset = node.offset();

		this.width = node.width();
		this.height = node.height();
		this.ox = e.pageX - offset.left;
		this.oy = e.pageY - offset.top;

		keyboard.setDrag(true);
		if (selection) {
			selection.preventSelect(true);
		};

		win.unbind('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', (e: any) => { this.onDragMove(e); });
		win.on('mouseup.sidebar', (e: any) => { this.onDragEnd(e); });
	};

	onDragMove (e: any) {
		const win = $(window);
		
		let x = e.pageX - this.ox - win.scrollLeft();
		let y = e.pageY - this.oy - win.scrollTop();
		let snap = this.checkSnap(x);

		if (snap !== null) {
			x = 0;
		};

		this.setStyle(x, y, snap);
	};

	onDragEnd (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const win = $(window);
		
		let x = e.pageX - this.ox - win.scrollLeft();
		let y = e.pageY - this.oy - win.scrollTop();
		let snap = this.checkSnap(x);

		if (snap !== null) {
			x = 0;
		};

		commonStore.sidebarSet({ x, y, snap });
		this.setStyle(x, y, snap);

		win.unbind('mousemove.sidebar mouseup.sidebar');
		keyboard.setDrag(false);

		if (selection) {
			selection.preventSelect(false);
		};
	};

	onProfile (e: any) {
		const object = detailStore.get(Constant.subIds.profile, blockStore.profile);
		DataUtil.objectOpenEvent(e, object);
	};

	onStore (e: any) {
		DataUtil.objectOpenPopup({ layout: I.ObjectLayout.Store });
	};

	onSettings (e: any) {
		popupStore.open('settings', {});
	};

	onAdd (e: any) {
		const rootId = keyboard.getRootId();
		const { focused } = focus.state;
		const root = blockStore.getLeaf(rootId, rootId);
		const canAdd = this.canAdd();

		if (!root || !canAdd) {
			return;
		};
		
		let fb = blockStore.getLeaf(rootId, focused);
		let targetId = '';
		let position = I.BlockPosition.Bottom;
		
		if (fb) {
			if (fb.isTextTitle()) {
				const first = blockStore.getFirstBlock(rootId, 1, (it: I.Block) => { return it.isFocusable() && !it.isTextTitle(); });
				if (first) {
					targetId = first.id;
					position = I.BlockPosition.Top;
				};
			} else 
			if (fb.isFocusable()) {
				targetId = fb.id;
			};
		};
		
		DataUtil.pageCreate(rootId, targetId, {}, position, '', {}, (message: any) => {
			DataUtil.objectOpen({ id: message.targetId });
		});
	};

	canAdd () {
		const rootId = keyboard.getRootId();
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return false;
		};

		const allowed = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Block ]);
		return allowed && !root.isLocked() && !root.isObjectRelation() && !root.isObjectType() && !root.isObjectSet() && !root.isObjectFileKind();
	};

	checkSnap (x: number) {
		let win = $(window);
		let snap = null;

		if (x <= SNAP_THRESHOLD) {
			snap = I.MenuDirection.Left;
		};
		if (x + this.width >= win.width() - SNAP_THRESHOLD) {
			snap = I.MenuDirection.Right;
		};
		return snap;
	};

	getWidth (w: number) {
		const size = Constant.size.sidebar.width;
		return Math.max(size.min, Math.min(size.max, w));
	};

	getHeight (h: number) {
		const win = $(window);
		const size = Constant.size.sidebar.height;
		return Math.max(size.min, Math.min(win.height() - Util.sizeHeader(), h));
	};

	checkCoords (x: number, y: number): { x: number, y: number } {
		const win = $(window);

		x = Number(x);
		x = Math.max(0, x);
		x = Math.min(win.width() - this.width, x);

		y = Number(y);
		y = Math.max(Util.sizeHeader(), y);
		y = Math.min(win.height() - this.height, y);

		return { x, y };
	};

	setStyle (x: number, y: number, snap: I.MenuDirection) {
		const node = $(ReactDOM.findDOMNode(this));
		const coords = this.checkCoords(x, y);

		node.removeClass('left right');

		if (snap == I.MenuDirection.Left) {
			node.addClass('left');
		};
		if (snap == I.MenuDirection.Right) {
			node.addClass('right');
		};

		node.css({ 
			top: coords.y,
			left: (snap === null ? coords.x : ''),
		});
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { sidebar } = commonStore;
		const { width, fixed } = sidebar;
		const node = $(ReactDOM.findDOMNode(this));
		const head = node.find('.head');

		head.css({ height: fixed ? Util.sizeHeader() - 20 : 0 });
		this.setWidth(width);
	};

	getRowHeight (item: any) {
		let height = HEIGHT;
		if (item.isSection) {
			height = item.withPadding ? 38 : 30;
		};
		return height;
	};

	setWidth (width: number) {
		const node = $(ReactDOM.findDOMNode(this));
		node.css({ width });
		Util.resizeSidebar(this.props.isPopup);
	};

});

export default Sidebar;