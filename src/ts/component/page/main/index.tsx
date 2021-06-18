import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject, ListIndex, Cover, HeaderMainIndex as Header, FooterMainIndex as Footer, Filter } from 'ts/component';
import { commonStore, blockStore, detailStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, C, Util, DataUtil, translate, crumbs, Storage } from 'ts/lib';
import arrayMove from 'array-move';

interface Props extends RouteComponentProps<any> {};

interface State {
	tab: Tab;
	filter: string;
	pages: any[];
};

const $ = require('jquery');
const raf = require('raf');
const Constant: any = require('json/constant.json');

enum Tab {
	None = '',
	Favorite = 'favorite',
	Recent = 'recent',
	Draft = 'draft',
	Archive = 'archive',
}

const Tabs = [
	{ id: Tab.Favorite, name: 'Favorites' },
	{ id: Tab.Recent, name: 'Recent' },
	{ id: Tab.Draft, name: 'Inbox' },
	{ id: Tab.Archive, name: 'Bin' },
];

@observer
class PageMainIndex extends React.Component<Props, State> {
	
	listRef: any = null;
	filterRef: any = null;
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
		const { root, profile } = blockStore;
		const element = blockStore.getLeaf(root, root);
		const { tab } = this.state;

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
									if (!config.allowDataview && (item.id == Tab.Draft)) {
										return null;
									};

									return <TabItem key={i} {...item} />
								})}
							</div>
							<div id="searchWrap" className="searchWrap" onMouseDown={this.onSearch}>
								<Icon className="search" />
								<Filter 
									ref={(ref: any) => { this.filterRef = ref; }} 
									placeHolder="" 
									placeHolderFocus="" 
									onChange={this.onFilterChange}
								/>
							</div>
						</div>
						<ListIndex 
							ref={(ref) => { this.listRef = ref; }}
							onSelect={this.onSelect} 
							onAdd={this.onAdd}
							onMore={this.onMore}
							onSortStart={this.onSortStart}
							onSortEnd={this.onSortEnd}
							getList={this.getList}
							helperContainer={() => { return $('#documents').get(0); }} 
							canDrag={[ Tab.Favorite, Tab.Archive ].indexOf(tab) >= 0}
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

		if ([ Tab.Recent, Tab.Draft ].indexOf(id) >= 0) {
			this.load();
		};
	};

	load () {
		const { tab, filter } = this.state;
		const recent = crumbs.get(I.CrumbsType.Recent).ids;

		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
		];
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc }
		];

		if (tab == Tab.Recent) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: recent });
		};

		if (tab == Tab.Draft) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.page });
		};

		C.ObjectSearch(filters, sorts, Constant.defaultRelationKeys, filter, 0, 100, (message: any) => {
			if (message.error.code) {
				return;
			};

			let pages = message.records;
			for (let page of pages) {
				page.order = recent.findIndex((id: string) => { return id == page.id; });
			};

			pages.sort((c1: any, c2: any) => {
				if (c1.order > c2.order) return -1;
				if (c2.order < c1.order) return 1;
				return 0;
			});

			this.setState({ pages: pages });
		});
	};

	onSearch (e: any) {
		e.stopPropagation();

		const node = $(ReactDOM.findDOMNode(this));
		const searchWrap = node.find('#searchWrap');
		const body = node.find('#body');

		if (searchWrap.hasClass('active')) {
			return;
		};

		searchWrap.addClass('active');
		this.filterRef.focus();

		window.setTimeout(() => {
			body.unbind('click').on('click', (e: any) => {
				searchWrap.removeClass('active');
				body.unbind('click')
			});
		}, 210);
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			this.setState({ filter: v });
			this.load();
		}, 500);
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
		e.persist();

		const { root } = blockStore;

		let object: any = null;
		if (item.isBlock) {
			object = detailStore.get(root, item.content.targetBlockId, []);
		} else {
			object = item;
		};

		crumbs.cut(I.CrumbsType.Page, 0, () => {
			DataUtil.objectOpenEvent(e, object);
		});
	};

	onStore (e: any) {
		DataUtil.objectOpenPopup({ layout: I.ObjectLayout.Store });
	};
	
	onAdd (e: any) {
		const { root } = blockStore;

		DataUtil.pageCreate(root, '', {}, I.BlockPosition.Bottom, '', (message: any) => {
			DataUtil.objectOpen({ id: message.targetId });
		});
	};

	onMore (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const { match } = this.props;
		const { root } = blockStore;
		const node = $(ReactDOM.findDOMNode(this));

		menuStore.open('blockMore', { 
			element: `#button-${item.id}-more`,
			offsetY: 8,
			horizontal: I.MenuDirection.Center,
			className: 'fromIndex',
			subIds: Constant.menuIds.more,
			data: {
				rootId: root,
				blockId: item.id,
				objectId: item.isBlock ? item.content.targetBlockId : item.id,
				blockIds: [ item.id ],
				match: match,
			},
			onOpen: () => {
				raf(() => {
					node.find('#item-' + item.id).addClass('active');
				});
			},
			onClose: () => {
				node.find('#item-' + item.id).removeClass('active');
			}
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
		const map = blockStore.getMap(root);
		const element = map[root];
		
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
		const { root } = blockStore;
		const { config } = commonStore;
		const { tab, filter, pages } = this.state;
		
		let reg = null;
		let list: any[] = [];

		if (filter) {
			reg = new RegExp(Util.filterFix(filter), 'gi');
		};

		switch (tab) {
			default:
			case Tab.Favorite:
			case Tab.Archive:
				list = blockStore.getChildren(root, root, (it: any) => {
					const object = detailStore.get(root, it.content.targetBlockId);
					if (it.content.style == I.LinkStyle.Archive) {
						return false;
					};
					if (!config.allowDataview && ([ I.ObjectLayout.Page, I.ObjectLayout.Human, I.ObjectLayout.Task ].indexOf(object.layout) < 0) && !object._objectEmpty_) {
						return false;
					};
					if (reg && object.name && !object.name.match(reg)) {
						return false;
					};

					if (tab == Tab.Archive) {
						return object.isArchived;
					} else {
						return !object.isArchived;
					};
				}).map((it: any) => {
					it.isBlock = true;
					return it;
				});
				break;

			case Tab.Recent:
			case Tab.Draft:
				list = pages;
				break;
		};

		return list;
	};

};

export default PageMainIndex;