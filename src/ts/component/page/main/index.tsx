import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject, ListIndex, Cover, HeaderMainIndex as Header, FooterMainIndex as Footer, Filter } from 'ts/component';
import { commonStore, blockStore, detailStore, menuStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, C, Util, DataUtil, translate, crumbs, Storage } from 'ts/lib';
import arrayMove from 'array-move';

interface Props extends RouteComponentProps<any> {}

interface State {
	tab: Tab;
	filter: string;
	pages: any[];
}

const $ = require('jquery');
const Constant: any = require('json/constant.json');

enum Tab {
	None = '',
	Favorite = 'favorite',
	Recent = 'recent',
	Draft = 'draft',
	Set = 'Set',
	Archive = 'archive',
}

const Tabs = [
	{ id: Tab.Favorite, name: 'Favorites' },
	{ id: Tab.Recent, name: 'Recent' },
	{ id: Tab.Draft, name: 'Inbox' },
	{ id: Tab.Set, name: 'Sets' },
	{ id: Tab.Archive, name: 'Archive' },
];

const PageMainIndex = observer(class PageMainIndex extends React.Component<Props, State> {
	
	refFilter: any = null;
	id: string = '';
	timeoutFilter: number = 0;

	state = {
		tab: Tab.Favorite,
		filter: '',
		pages: [],
	};

	constructor (props: any) {
		super(props);
		
		this.getList = this.getList.bind(this);
		this.onAccount = this.onAccount.bind(this);
		this.onProfile = this.onProfile.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onStore = this.onStore.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSearch = this.onSearch.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { config } = commonStore;
		const { root, profile, recent } = blockStore;
		const element = blockStore.getLeaf(root, root);
		const { tab, filter } = this.state;
		const canDrag = [ Tab.Favorite ].indexOf(tab) >= 0

		if (!element) {
			return null;
		};

		const object = detailStore.get(profile, profile, []);
		const { name } = object;
		const list = this.getList();

		const TabItem = (item: any) => (
			<div className={[ 'tab', (tab == item.id ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onTab(item.id); }}>
				{item.name}
			</div>
		);

		return (
			<div>
				<Cover {...cover} />
				<Header {...this.props} />
				<Footer {...this.props} />
				
				<div id="body" className="wrapper">
					<div id="title" className="title">
						{name ? Util.sprintf(translate('indexHi'), Util.shorten(name, 24)) : ''}
						
						<div className="rightMenu">
							<Icon id="button-account" className="account" tooltip="Accounts" onClick={this.onAccount} />
							<Icon id="button-add" className="add" tooltip="Add new object" onClick={this.onAdd} />
							{config.allowDataview ? (
								<Icon id="button-store" className="store" tooltip="Store" onClick={this.onStore} />
							) : ''}
							<IconObject getObject={() => { return { ...object, layout: I.ObjectLayout.Human } }} size={56} tooltip="Your profile" onClick={this.onProfile} />
						</div>
					</div>
					
					<div id="documents"> 
						<div className="tabWrap">
							<div className="tabs">
								{Tabs.map((item: any, i: number) => {
									if (!config.allowDataview && ([ Tab.Draft, Tab.Set ].indexOf(item.id) >= 0)) {
										return null;
									};

									return <TabItem key={i} {...item} />
								})}
							</div>
							<div id="searchWrap" className="searchWrap" onClick={this.onSearch}>
								<Icon className="search" />
								<Filter 
									ref={(ref: any) => { this.refFilter = ref; }} 
									placeholder="" 
									placeholderFocus="" 
									value={filter}
									onChange={this.onFilterChange}
								/>
							</div>
						</div>
						<ListIndex 
							onSelect={this.onSelect} 
							onAdd={this.onAdd}
							onMore={this.onMore}
							onSortStart={this.onSortStart}
							onSortEnd={this.onSortEnd}
							getList={this.getList}
							helperContainer={() => { return $('#documents').get(0); }} 
							canDrag={canDrag}
						/>
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const win = $(window);

		crumbs.delete(I.CrumbsType.Page);

		this.onScroll();
		this.onTab(Storage.get('indexTab') || Tab.Favorite);

		win.unbind('scroll').on('scroll', (e: any) => { this.onScroll(); });
	};
	
	componentDidUpdate () {
		this.resize();

		if (this.id) {
			const node = $(ReactDOM.findDOMNode(this));
			const item = node.find(`#item-${this.id}`);

			item.addClass('hover');
		};
	};

	componentWillUnmount () {
		$(window).unbind('scroll');
		menuStore.closeAll(Constant.menuIds.index);
	};

	onScroll () {
		const win = $(window);
		const top = win.scrollTop();
		const node = $(ReactDOM.findDOMNode(this));
		const title = node.find('#title');
		const list = node.find('#documents');
		if (!list.length) {
			return;
		};

		const oy = list.offset().top;
		const menu = $('#menuSelect.add');
		const offset = 256;

		let y = 0;
		if (oy - top <= offset) {
			y = oy - top - offset;
		};

		title.css({ transform: `translate3d(0px,${y}px,0px)` });
		menu.css({ transform: `translate3d(0px,${y}px,0px)`, transition: 'none' });
	};

	onTab (id: Tab) {
		this.state.tab = id;
		this.setState({ tab: id, pages: [] });

		Storage.set('indexTab', id);

		if ([ Tab.Archive, Tab.Draft, Tab.Set ].indexOf(id) >= 0) {
			this.load();
		};
	};

	load () {
		const { tab, filter } = this.state;
		const { config } = commonStore;

		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: tab == Tab.Archive },
		];
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc }
		];

		if (tab == Tab.Draft) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.page });
		};

		if (tab == Tab.Set) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set });
			filters.push({ 
				operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, 
				value: [
					blockStore.storeType,
					blockStore.storeTemplate,
					blockStore.storeRelation,
				] 
			});
		};

		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false });
		};

		C.ObjectSearch(filters, sorts, Constant.defaultRelationKeys, filter, 0, 100, (message: any) => {
			if (message.error.code) {
				return;
			};

			this.setState({ pages: message.records });
		});
	};

	onSearch (e: any) {
		e.stopPropagation();

		const node = $(ReactDOM.findDOMNode(this));
		const searchWrap = node.find('#searchWrap');
		const page = $('.page');

		if (searchWrap.hasClass('active')) {
			return;
		};

		searchWrap.addClass('active');
		this.refFilter.focus();

		window.setTimeout(() => {
			page.unbind('click').on('click', (e: any) => {
				if ($.contains(searchWrap.get(0), e.target)) {
					return;
				};

				searchWrap.removeClass('active');
				page.unbind('click');

				window.setTimeout(() => { this.setFilter(''); }, 210);
			});
		}, 210);
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => { this.setFilter(v); }, 500);
	};

	setFilter (v: string) {
		if (this.refFilter) {
			this.refFilter.setValue(v);
		};
		this.setState({ filter: v });
		this.load();
	};

	onAccount () {
		menuStore.open('account', {
			element: '#button-account',
			horizontal: I.MenuDirection.Right
		});
	};
	
	onProfile (e: any) {
		const { profile } = blockStore;
		const object = detailStore.get(profile, profile, []);

		DataUtil.objectOpenEvent(e, object);
	};
	
	onSelect (e: any, item: any) {
		e.stopPropagation();
		e.persist();

		const object = item.isBlock ? item._object_ : item;

		crumbs.cut(I.CrumbsType.Page, 0, () => {
			DataUtil.objectOpenEvent(e, object);
		});
	};

	onStore (e: any) {
		DataUtil.objectOpenPopup({ layout: I.ObjectLayout.Store });
	};
	
	onAdd (e: any) {
		DataUtil.pageCreate('', '', {}, I.BlockPosition.Bottom, '', (message: any) => {
			DataUtil.objectOpenPopup({ id: message.targetId });
		});
	};

	onMore (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const { tab } = this.state;
		const { root, recent } = blockStore;
		const { config } = commonStore;
		const object = item.isBlock ? item._object_ : item;
		const rootId = tab == Tab.Recent ? recent : root;
		const subIds = [ 'searchObject' ];

		let menuContext = null;
		let favorites = []; 
		let archive = null;
		let link = null;
		let move = { id: 'move', icon: 'move', name: 'Move to', arrow: true };
		let types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map((it: I.ObjectType) => { return it.id; });

		if (config.allowDataview) {
			types = types.filter((it: string) => { return it != Constant.typeId.page; });
		};

		if (item.isBlock) {
			favorites = blockStore.getChildren(blockStore.root, blockStore.root, (it: I.Block) => {
				return it.isLink() && (it.content.targetBlockId == object.id);
			});
		};

		if (favorites.length) {
			link = { id: 'unlink', icon: 'unfav', name: 'Remove from Favorites' };
		} else {
			link = { id: 'link', icon: 'fav', name: 'Add to Favorites' };
		};

		if (object.isArchived) {
			link = null;
			archive = { id: 'unarchive', icon: 'undo', name: 'Restore from archive' };
		} else {
			archive = { id: 'archive', icon: 'remove', name: 'Move to archive' };
		};

		if (object.isReadonly) {
			archive = null;
		};

		if ([ Tab.Favorite ].indexOf(tab) < 0) {
			move = null;
		};

		const options = [
			archive,
			move,
			link,
		];

		const onArchive = (v: boolean) => {
			const cb = (message: any) => {
				if (message.error.code) {
					return;
				};

				if (object.type == Constant.typeId.type) {
					dbStore.objectTypeUpdate({ id: object.id, isArchived: v });
				};

				this.load();
			};

			C.BlockListSetPageIsArchived(rootId, [ object.id ], v, cb);
		};

		menuStore.open('select', { 
			element: `#button-${item.id}-more`,
			offsetY: 8,
			horizontal: I.MenuDirection.Center,
			className: 'fromIndex',
			subIds: subIds,
			onOpen: (context: any) => {
				menuContext = context;
			},
			data: {
				options: options,
				onMouseEnter: (e: any, el: any) => {
					menuStore.closeAll(subIds, () => {
						if (el.id == 'move') {
							const filters = [
								{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types }
							];

							if (!config.allowDataview) {
								filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: [ Constant.typeId.page ] });
							};

							menuStore.open('searchObject', {
								element: `#menuSelect #item-${el.id}`,
								offsetX: menuContext.getSize().width,
								vertical: I.MenuDirection.Center,
								isSub: true,
								data: {
									rootId: rootId,
									blockId: item.id,
									blockIds: [ item.id ],
									type: I.NavigationType.Move, 
									skipId: rootId,
									position: I.BlockPosition.Bottom,
									onSelect: (el: any) => { menuContext.close(); }
								}
							});
						};
					});
				},
				onSelect: (e: any, el: any) => {
					if (el.arrow) {
						menuStore.closeAll(subIds);
						return;
					};

					switch (el.id) {
						case 'archive':
							onArchive(true);
							break;

						case 'unarchive':
							onArchive(false);
							break;

						case 'link':
							const newBlock = {
								type: I.BlockType.Link,
								content: {
									targetBlockId: object.id,
								}
							};
							C.BlockCreate(newBlock, root, '', I.BlockPosition.Bottom);
							break;

						case 'unlink':
							let favorites = blockStore.getChildren(root, root, (it: I.Block) => { 
								return it.isLink() && (it.content.targetBlockId == object.id);
							}).map((it: I.Block) => { return it.id; });

							if (favorites.length) {
								C.BlockUnlink(root, favorites);
							};
							break;
					};
				},
			},
		});
	};

	onSortStart (param: any) {
		const { node } = param;

		this.id = $(node).data('id');
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		if (oldIndex == newIndex) {
			return;
		};
		
		const { root } = blockStore;
		const list = this.getList();
		const current = list[oldIndex];
		const target = list[newIndex];
		const element = blockStore.getMapElement(root, root);
		
		if (!current || !target || !element) {
			return;
		};

		
		const position = newIndex < oldIndex ? I.BlockPosition.Top : I.BlockPosition.Bottom;
		const oidx = element.childrenIds.indexOf(current.id);
		const nidx = element.childrenIds.indexOf(target.id);

		blockStore.updateStructure(root, root, arrayMove(element.childrenIds, oidx, nidx));
		C.BlockListMove(root, root, [ current.id ], target.id, position);
	};
	
	resize () {
		const list = this.getList();
		const size = Constant.size.index;
		const win = $(window);
		const wh = win.height();
		const ww = win.width();
		const node = $(ReactDOM.findDOMNode(this));
		const title = node.find('#title');
		const body = node.find('#body');
		const documents = node.find('#documents');
		const items = node.find('#documents .item');

		const maxWidth = ww - size.border * 2;
		const cnt = Math.floor(maxWidth / (size.width + size.margin));
		const width = Math.floor((maxWidth - size.margin * (cnt - 1)) / cnt);
		const height = this.getListHeight();

		items.css({ width: width }).removeClass('last');
		title.css({ width: maxWidth });
		body.css({ width: maxWidth });
		documents.css({ marginTop: wh - size.titleY - height - 8 });

		items.each((i: number, item: any) => {
			item = $(item);
			const icon = item.find('.iconObject');

			if ((i + 1) >= cnt && ((i + 1) % cnt === 0) && (list.length + 1 > cnt)) {
				item.addClass('last');
			};
			if (icon.length) {
				item.addClass('withIcon');
			};
		});

		this.onScroll();
	};

	getListHeight () {
		const size = Constant.size.index;
		return (size.height + size.margin) * 2 + size.margin * 2;
	};

	getList () {
		const { root, recent } = blockStore;
		const { config } = commonStore;
		const { tab, filter, pages } = this.state;
		
		let reg = null;
		let list: any[] = [];
		let rootId = root;
		let recentIds = [];

		if (filter) {
			reg = new RegExp(Util.filterFix(filter), 'gi');
		};

		switch (tab) {
			default:
			case Tab.Favorite:
			case Tab.Recent:
				if (tab == Tab.Recent) {
					rootId = recent;
					recentIds = crumbs.get(I.CrumbsType.Recent).ids;
				};

				list = blockStore.getChildren(rootId, rootId, (it: any) => {
					const object = detailStore.get(rootId, it.content.targetBlockId, []);
					const { layout, name, _empty_, isArchived } = object;

					if (!config.allowDataview && ([ I.ObjectLayout.Page, I.ObjectLayout.Human, I.ObjectLayout.Task ].indexOf(layout) < 0) && !_empty_) {
						return false;
					};
					if (reg && name && !name.match(reg)) {
						return false;
					};

					return !isArchived;
				}).map((it: any) => {
					if (tab == Tab.Recent) {
						it._order = recentIds.findIndex((id: string) => { return id == it.content.targetBlockId; });
					};

					it._object_ = detailStore.get(rootId, it.content.targetBlockId, []);
					it.isBlock = true;
					return it;
				});

				if (tab == Tab.Recent) {
					list.sort((c1: any, c2: any) => {
						if (c1._order > c2._order) return -1;
						if (c2._order < c1._order) return 1;
						return 0;
					});
				};

				break;

			case Tab.Archive:
			case Tab.Set:
			case Tab.Draft:
				list = pages;
				break;
		};

		return list;
	};

});

export default PageMainIndex;