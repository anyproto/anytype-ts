import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, DataUtil, Util, keyboard, Storage, Relation, analytics, sidebar } from 'Lib';
import { Loader } from 'Component';
import { blockStore, dbStore, detailStore, menuStore } from 'Store';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { observer } from 'mobx-react';

import Item from './sidebar/item';
import Footer from './sidebar/footer';

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

const MAX_DEPTH = 15;
const LIMIT = 20;
const HEIGHT = 28;
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
	cache: any = {};
	subId: string = '';
	subscriptionIds: any = {};
	branches: string[] = [];

	refList: any = null;
	refFooter: any = null;

	constructor (props: any) {
		super(props);

		this.onResizeStart = this.onResizeStart.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onContext = this.onContext.bind(this);
		
		this.getRowHeight = this.getRowHeight.bind(this)
	};

	render () {
		const { loading } = this.state;
		const items = this.getItems();
		const cn = [ 'sidebar' ];

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
			>
				<div id="head" className="head" onMouseDown={this.onDragStart} />
				
				<div id="body" className="body">
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
											scrollToAlignment="center"
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					)}
				</div>

				<Footer ref={(ref: any) => { this.refFooter = ref; }} />

				<div className="resize-h" onMouseDown={(e: any) => { this.onResizeStart(e, I.MenuType.Horizontal); }} />
				{/*<div className="resize-v" onMouseDown={(e: any) => { this.onResizeStart(e, I.MenuType.Vertical); }} />*/}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;

		sidebar.init();

		this.loadSections();
		this.rebind();
	};

	componentDidUpdate () {
		const items = this.getItems();

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

		const subIds = Object.keys(this.subscriptionIds).map(id => dbStore.getSubId(Constant.subId.sidebar, id));
		if (subIds.length) {
			C.ObjectSearchUnsubscribe(subIds);
		};
		Util.tooltipHide(true);
	};

	rebind () {
		this.unbind();
		$(window).on('resize.sidebar', (e: any) => { sidebar.resize(); });
	};

	unbind () {
		$(window).off('resize.sidebar');
	};

	restore () {
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('#body');

		this.id = keyboard.getRootId();
		this.setActive(this.id);
		
		body.scrollTop(this.top);
	};

	getSections () {
		return [
			{ id: I.TabIndex.Favorite, name: 'Favorites', limit: 0, },
			{ id: I.TabIndex.Recent, name: 'Recent', limit: 10, },
			{ id: I.TabIndex.Set, name: 'Sets', limit: 0, },
		];
	};

	getSection (id: I.TabIndex): any {
		return this.getSections().find(it => it.id == id) || {};
	};

	loadSections () {
		const { root, profile } = blockStore;
		const sections = this.getSections();
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: [ '_anytype_profile', profile, root ] },
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: SKIP_TYPES_LOAD },
		];

		let n = 0;
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
			const subId = dbStore.getSubId(Constant.subId.sidebar, section.id);

			switch (section.id) {
				case I.TabIndex.Favorite:
					sectionFilters = [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: DataUtil.getSystemTypes() },
						{ operator: I.FilterOperator.And, relationKey: 'isFavorite', condition: I.FilterCondition.Equal, value: true }
					];
					sorts = [];
					break;

				case I.TabIndex.Recent:
					sectionFilters = [
						{ operator: I.FilterOperator.And, relationKey: 'lastOpenedDate', condition: I.FilterCondition.Greater, value: 0 }
					];
					sorts = [
						{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
					];
					break;

				case I.TabIndex.Set:
					sectionFilters = [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: DataUtil.getSystemTypes() },
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set }
					];
					sorts = [
						{ relationKey: 'name', type: I.SortType.Asc },
					];
					break;

			};

			this.subscriptionIds[section.id] = '';
			DataUtil.searchSubscribe({
				subId,
				filters: filters.concat(sectionFilters),
				sorts,
				keys: Constant.sidebarRelationKeys,
				limit: section.limit,
				noDeps: true,
			}, cb);
		});
	};

	checkLinks (ids: string[]) {
		return ids.filter(id => !dbStore.getRecords(Constant.subId.deleted, '').includes(id));
	};

	loadItem (id: string, links: string[]) {
		const hash = sha1(Util.arrayUnique(links).sort().join(''));
		const subId = dbStore.getSubId(Constant.subId.sidebar, id);

		if (this.subscriptionIds[id] && (this.subscriptionIds[id] == hash)) {
			return;
		};

		this.subscriptionIds[id] = hash;
		DataUtil.subscribeIds({
			subId, 
			ids: links, 
			keys: Constant.sidebarRelationKeys,
		});
	};

	getRecords (subId: string) {
		let records: any[] = dbStore.getRecords(subId, '');

		records = records.map((id: string) => { 
			let item = detailStore.get(subId, id, [ 'id', 'type', 'links' ], true);
			let links = [];
			if (item.type != Constant.typeId.set) {
				links = this.checkLinks(Relation.getArrayValue(item.links));
			};
			return { ...item, links };
		});

		return records;
	};

	unwrap (sectionId: string, list: any[], parentId: string, items: any[], depth: number) {
		if (!items.length || (depth >= MAX_DEPTH)) {
			return list;
		};

		const regN = new RegExp(`:${parentId}$`);
		const regS = new RegExp(`^${parentId}$`);
		const branch = this.branches.find(it => it.match(regN) || it.match(regS)) || parentId;

		for (let item of items) {
			let links = this.checkLinks(Relation.getArrayValue(item.links)).filter(it => {
				const branchId = [ branch, it ].join('-');
				if (this.branches.includes(branchId)) {
					return false;
				} else {
					this.branches.push(branchId);
					return true;
				};
			});
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

			if (!length) {
				continue;
			};

			const id = this.getId({ ...newItem, sectionId });
			const check = Storage.checkToggle(Constant.subId.sidebar, id);

			if (check) {
				this.loadItem(item.id, item.links);
				list = this.unwrap(sectionId, list, item.id, this.getRecords(dbStore.getSubId(Constant.subId.sidebar, item.id)), depth + 1);
			};
		};
		return list;
	};

	getItems () {
		let sections = this.getSections();
		let items: any[] = [];

		this.branches = [];

		sections.forEach((section: any) => {
			const children = this.getRecords(dbStore.getSubId(Constant.subId.sidebar, section.id));

			if (section.id == I.TabIndex.Favorite) {
				let { root } = blockStore;
				let childrenIds = blockStore.getChildren(root, root, it => it.isLink()).map(it => it.content.targetBlockId);

				children.sort((c1: any, c2: any) => { return this.sortByIds(childrenIds, c1.id, c2.id); });
			};

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
			item.isOpen = Storage.checkToggle(Constant.subId.sidebar, this.getId(item));
			items.push(item);

			this.branches.push(item.id);

			if (item.isOpen) {
				items = this.unwrap(section.id, items, section.id, children, 0);
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

	sortByIds (ids: string[], id1: string, id2: string) {
		const i1 = ids.indexOf(id1);
		const i2 = ids.indexOf(id2);
		if (i1 > i2) return 1; 
		if (i1 < i2) return -1;
		return 0;
	};

	onScroll ({ clientHeight, scrollHeight, scrollTop }) {
		const { dataset } = this.props;
		const { dragProvider } = dataset || {};

		if (scrollTop) {
			this.top = scrollTop;
		};

		if (dragProvider) {
			dragProvider.onScroll();
		};
	};

	onToggle (e: any, item: any) {
		if (!this._isMounted) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const id = this.getId(item);
		const check = Storage.checkToggle(Constant.subId.sidebar, id);

		Storage.setToggle(Constant.subId.sidebar, id, !check);

		let eventId = '';
		let group = '';
		if (item.isSection) {
			eventId = !check ? 'OpenSidebarGroupToggle' : 'CloseSidebarGroupToggle';
			group = this.getSection(item.id).name;
		} else {
			eventId = !check ? 'OpenSidebarObjectToggle' : 'CloseSidebarObjectToggle';
			group = this.getSection(item.sectionId).name;
		};

		analytics.event(eventId, { group });
		this.forceUpdate();
	};

	setActive (id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));

		node.find('.item.hover').removeClass('hover');

		if (id) {
			node.find(`.item.c${id}`).addClass('hover');
		};
	};

	getId (item: any) {
		const { sectionId, parentId, id, depth, isSection } = item;
		return isSection ? id : [ sectionId, parentId, id, depth ].join('-');
	};

	onClick (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		DataUtil.objectOpenEvent(e, item.details);
		analytics.event('OpenSidebarObject', { group: this.getSection(item.sectionId).name });
	};

	onContext (e: any, item: any): void {
		e.preventDefault();
		e.stopPropagation();

		if (item.isSection) {
			return;
		};

		this.setActive(item.id);

		menuStore.open('dataviewContext', {
			recalcRect: () => {
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			onClose: () => { this.setActive(this.id); },
			data: {
				objectIds: [ item.id ],
				subId: dbStore.getSubId(Constant.subId.sidebar, item.parentId),
			}
		});
	};

	onResizeStart (e: any, dir: I.MenuType) {
		e.preventDefault();
		e.stopPropagation();

		if (!this._isMounted) {
			return;
		};

		const { dataset } = this.props;
		const { selection } = dataset || {};
		const { fixed } = sidebar.data;
		const node = $(ReactDOM.findDOMNode(this));
		const win = $(window);
		const body = $('body');
		const offset = node.offset();

		if (fixed && (dir == I.MenuType.Vertical)) {
			return;
		};
		
		this.ox = offset.left;
		this.oy = offset.top;

		if (selection) {
			selection.preventSelect(true);
		};

		keyboard.setResize(true);
		body.addClass(dir == I.MenuType.Vertical ? 'rowResize' : 'colResize');
		win.off('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', (e: any) => { this.onResizeMove(e, dir); });
		win.on('mouseup.sidebar', (e: any) => { this.onResizeEnd(e, dir); });
	};

	onResizeMove (e: any, dir: I.MenuType) {
		const { width, snap } = sidebar.data;

		if (dir == I.MenuType.Horizontal) {
			sidebar.setWidth((snap == I.MenuDirection.Right) ? (this.ox - e.pageX + width) : (e.pageX - this.ox));
		};

		if (dir == I.MenuType.Vertical) {
			sidebar.setHeight(e.pageY - this.oy);
		};

		sidebar.resizePage();
		$(window).trigger('resize');
	};

	onResizeEnd (e: any, dir: I.MenuType) {
		const { dataset } = this.props;
		const { selection } = dataset || {};

		if (selection) {
			selection.preventSelect(false);
		};

		keyboard.setResize(false);
		$('body').removeClass('rowResize colResize');
		$(window).off('mousemove.sidebar mouseup.sidebar');
	};

	onDragStart (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { dataset } = this.props;
		const { selection } = dataset || {};

		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const offset = node.offset();

		this.ox = e.pageX - offset.left;
		this.oy = e.pageY - offset.top;

		sidebar.set({ fixed: false });
		sidebar.resizePage();

		keyboard.setDragging(true);
		if (selection) {
			selection.preventSelect(true);
		};

		win.off('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', (e: any) => { this.onDragMove(e); });
		win.on('mouseup.sidebar', (e: any) => { this.onDragEnd(e); });
	};

	onDragMove (e: any) {
		const win = $(window);
		
		sidebar.set({ 
			x: e.pageX - this.ox - win.scrollLeft(), 
			y: e.pageY - this.oy - win.scrollTop(),
		});
	};

	onDragEnd (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		
		$(window).off('mousemove.sidebar mouseup.sidebar');
		keyboard.setDragging(false);

		if (selection) {
			selection.preventSelect(false);
		};
	};

	getRowHeight (item: any) {
		let height = HEIGHT;
		if (item.isSection) {
			height = item.withPadding ? 38 : 30;
		};
		return height;
	};

});

export default Sidebar;