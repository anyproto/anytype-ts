import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject, ListIndex, Cover, Header, FooterMainIndex as Footer, Filter } from 'ts/component';
import { commonStore, blockStore, detailStore, menuStore, dbStore, popupStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, C, Util, DataUtil, translate, crumbs, Storage, analytics, keyboard, Action } from 'ts/lib';
import arrayMove from 'array-move';

interface Props extends RouteComponentProps<any> {
	dataset?: any;
};

interface State {
	tab: I.TabIndex;
	filter: string;
	loading: boolean;
};

const Constant: any = require('json/constant.json');

const PageMainIndex = observer(class PageMainIndex extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	refFilter: any = null;
	id: string = '';
	timeoutFilter: number = 0;
	selected: string[] = [];

	state = {
		tab: I.TabIndex.Favorite,
		filter: '',
		loading: false,
	};

	constructor (props: any) {
		super(props);
		
		this.getList = this.getList.bind(this);
		this.onAccount = this.onAccount.bind(this);
		this.onProfile = this.onProfile.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onStore = this.onStore.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSearch = this.onSearch.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.onSelectionDelete = this.onSelectionDelete.bind(this);
		this.onSelectionArchive = this.onSelectionArchive.bind(this);
		this.onSelectionFavorite = this.onSelectionFavorite.bind(this);
		this.onSelectionAll = this.onSelectionAll.bind(this);
		this.onSelectionNone = this.onSelectionNone.bind(this);
		this.onSelectionClose = this.onSelectionClose.bind(this);
	};
	
	render () {
		const { cover, config } = commonStore;
		const { account } = authStore;
		const { root, recent } = blockStore;
		const element = blockStore.getLeaf(root, root);
		const { filter, loading } = this.state;
		const tabs = this.getTabs();
		const tab = tabs.find((it: any) => { return it.id == this.state.tab; });
		const canDrag = [ I.TabIndex.Favorite ].indexOf(tab.id) >= 0;
		const { allowSpaces } = config;

		if (!element) {
			return null;
		};

		const profile = detailStore.get(Constant.subId.profile, blockStore.profile);
		const list = this.getList();
		const length = list.length;
		const isDeleted = authStore.accountIsDeleted();

		// Subscriptions
		list.forEach((it: any) => {
			const { name, iconEmoji, iconImage, type, layout, relationFormat } = it;
		});
	
		let selectionButtons = [
			{ id: 'selectAll', icon: 'all', name: 'Select all' },
			{ id: 'selectNone', icon: 'all', name: 'Deselect all' },
		];

		if (tab.id == I.TabIndex.Favorite) {
			selectionButtons = [
				{ id: 'archive', icon: 'delete', name: 'Move to bin' },
				{ id: 'unfav', icon: 'unfav', name: 'Remove from favorites' },
			].concat(selectionButtons);
		} else
		if (tab.id == I.TabIndex.Archive) {
			selectionButtons = [
				{ id: 'delete', icon: 'delete', name: 'Delete' },
				{ id: 'restore', icon: 'restore', name: 'Restore' },
			].concat(selectionButtons);
		} else {
			selectionButtons = [
				{ id: 'archive', icon: 'delete', name: 'Move to bin' },
				{ id: 'fav', icon: 'fav', name: 'Add to favorites' },
			].concat(selectionButtons);
		};

		const TabItem = (item: any) => (
			<div className={[ 'tab', (tab.id == item.id ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onTab(item.id); }}>
				{item.name}
			</div>
		);

		let content = null;
		let deleted = null;

		if (!loading) {
			if (!list.length) {
				content = (
					<div className="emptySearch">
						There are no objects in {tab.name} tab
					</div>
				);
			} else {
				content = (
					<ListIndex 
						onClick={this.onClick} 
						onSelect={this.onSelect} 
						onAdd={this.onAdd}
						onMore={this.onMore}
						onSortStart={this.onSortStart}
						onSortEnd={this.onSortEnd}
						getList={this.getList}
						helperContainer={() => { return $('#documents .list').get(0); }} 
						canDrag={canDrag}
					/>
				);
			};
		};

		if (isDeleted) {
			deleted = (
				<div className="deleted">
					<Icon /> Account is deleted
				</div>
			);
		};

		return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="mainIndex" />
				<Footer {...this.props} />
				
				<div id="body" className="wrapper">
					<div id="title" className="title">
						<div className="side left">
							<span>{profile.name ? Util.sprintf(translate('indexHi'), Util.shorten(profile.name, 24)) : ''}</span>
						</div>
						
						<div className="side right">
							<Icon id="button-account" className="account" tooltip="Accounts" onClick={this.onAccount} />
							<Icon id="button-add" className="add" tooltip="Add new object" onClick={this.onAdd} />
							<Icon id="button-store" className="store" tooltip="Library" onClick={this.onStore} />
							<IconObject 
								object={profile} 
								size={56} 
								tooltip="Your profile" 
								onClick={this.onProfile} 
							/>
						</div>

						{deleted}
					</div>
					
					<div id="documents" className={Util.toCamelCase('tab-' + tab.id)}> 
						<div id="tabWrap" className="tabWrap">
							<div className="tabs">
								{tabs.map((item: any, i: number) => (
									<TabItem key={i} {...item} />
								))}
							</div>
							<div className="btns">
								<div id="searchWrap" className="btn searchWrap" onClick={this.onSearch}>
									<Icon className="search" />
									<Filter 
										ref={(ref: any) => { this.refFilter = ref; }} 
										placeholder="" 
										placeholderFocus="" 
										value={filter}
										onChange={this.onFilterChange}
										onClear={this.onFilterClear}
									/>
								</div>
								{(tab.id == I.TabIndex.Recent) && list.length ? <div className="btn" onClick={this.onClear}>Clear</div> : ''}
							</div>
						</div>
						<div id="selectWrap" className="tabWrap">
							<div className="tabs">
								<div id="selectCnt" className="side left" />
								<div className="side right">
									{selectionButtons.map((item: any, i: number) => (
										<div id={'button-' + item.id} key={i} className="element" onClick={(e: any) => { this.onSelection(e, item); }}>
											<Icon className={item.icon} />
											<div className="name">{item.name}</div>
										</div>
									))}
								</div>
							</div>
						</div>
						{content}
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		const tabs = this.getTabs();

		this.onTab(Storage.get('tabIndex') || tabs[0].id);
		this.onScroll();
		this.selectionRender();
		this.rebind();
		this.resize();
		
		analytics.setContext('', '');
	};
	
	componentDidUpdate () {
		if (this.id) {
			const node = $(ReactDOM.findDOMNode(this));
			const item = node.find(`#item-${this.id}`);

			item.addClass('hover');
		};

		this.resize();
		this.selectionRender();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		menuStore.closeAll(Constant.menuIds.index);
		Action.dbClear(Constant.subId.index);
	};

	rebind () {
		const win = $(window);

		this.unbind();
		win.on('keyup.page', (e: any) => { this.onKeyUp(e); });
		win.on('scroll.page', (e: any) => { this.onScroll(); });
	};

	unbind () {
		$(window).unbind('scroll.page keyup.page');
	};

	onKeyUp (e: any) {
		keyboard.shortcut('escape', e, (pressed: string) => {
			this.selected = [];
			this.selectionRender();
		});
	};

	onScroll () {
		const win = $(window);
		const top = win.scrollTop();
		const node = $(ReactDOM.findDOMNode(this));
		const list = node.find('#documents');

		if (!list.length) {
			return;
		};

		const title = node.find('#title');
		const selectWrap = node.find('#selectWrap');
		const header = node.find('#header');
		const hh = Util.sizeHeader();
		const menu = $('#menuSelect.add');
		const offsetTitle = 256;

		let oy = list.offset().top;
		let yt = 0;
		if (oy - top <= offsetTitle) {
			yt = oy - top - offsetTitle;
		};

		if (list.hasClass('isSelecting')) {
			if (oy - top <= hh) {
				header.addClass('selectFixed');
				list.addClass('selectFixed');
				selectWrap.css({ top: hh });
			} else {
				header.removeClass('selectFixed');
				list.removeClass('selectFixed');
				selectWrap.css({ top: '' });
			};
		} else {
			header.removeClass('selectFixed');
			list.removeClass('selectFixed');
		};

		title.css({ transform: `translate3d(0px,${yt}px,0px)` });
		menu.css({ transform: `translate3d(0px,${yt}px,0px)`, transition: 'none' });
	};

	getTabs () {
		const { config } = commonStore;

		let tabs: any[] = [
			{ id: I.TabIndex.Favorite, name: 'Favorites' },
			{ id: I.TabIndex.Recent, name: 'History' },
			{ id: I.TabIndex.Set, name: 'Sets', load: true },
		];

		if (config.experimental) {
			tabs.push({ id: I.TabIndex.Space, name: 'Spaces', load: true });
		};

		if (config.allowSpaces) {
			tabs.push({ id: I.TabIndex.Shared, name: 'Shared', load: true });
		};

		tabs.push({ id: I.TabIndex.Archive, name: 'Bin', load: true });
		return tabs;
	};

	onTab (id: I.TabIndex) {
		let tabs = this.getTabs();
		let tab = tabs.find((it: any) => { return it.id == id; });
		if (!tab) {
			tab = tabs[0];
			id = tab.id;
		};

		this.selected = [];
		this.state.tab = id;	
		this.setState({ tab: id });

		Storage.set('tabIndex', id);
		analytics.event('SelectHomeTab', { tab: tab.name });

		this.load();
	};

	load () {
		if (!this._isMounted) {
			return;
		};

		const { filter } = this.state;
		const { config } = commonStore;
		const tabs = this.getTabs();
		const tab = tabs.find((it: any) => { return it.id == this.state.tab; });

		if (!tab.load) {
			return;
		};

		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: tab.id == I.TabIndex.Archive },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
		];
		const sorts = [
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc }
		];

		if (tab.id == I.TabIndex.Set) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set });
		};

		if (tab.id == I.TabIndex.Space) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.space });
		};

		if (tab.id == I.TabIndex.Shared) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotEqual, value: Constant.typeId.space });
			filters.push({ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.NotEmpty, value: null });
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHighlighted', condition: I.FilterCondition.Equal, value: true });
		};

		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false });
		};

		if (filter) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'name', condition: I.FilterCondition.Like, value: filter });
		};

		this.setState({ loading: true });

		C.ObjectSearchSubscribe(Constant.subId.index, filters, sorts, Constant.defaultRelationKeys, [], 0, 100, true, '', '', false, (message: any) => {
			if (!this._isMounted || message.error.code) {
				return;
			};

			this.setState({ loading: false });
		});
	};

	onSearch (e: any) {
		e.stopPropagation();

		const node = $(ReactDOM.findDOMNode(this));
		const searchWrap = node.find('#searchWrap');

		if (searchWrap.hasClass('active')) {
			return;
		};

		searchWrap.addClass('active');
		this.refFilter.focus();
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => { this.setFilter(v); }, 500);
	};

	onFilterClear () {
		const node = $(ReactDOM.findDOMNode(this));
		const searchWrap = node.find('#searchWrap');

		searchWrap.removeClass('active');

		this.refFilter.blur();
		this.setFilter('');
	};

	setFilter (v: string) {
		if (this.state.filter == v) {
			return;
		};

		if (this.refFilter) {
			this.refFilter.setValue(v);
		};
		
		this.state.filter = v;
		this.setState({ filter: v });
		this.load();

		analytics.event('SearchQuery', { route: 'ScreenHome', length: v.length });
	};

	onAccount () {
		menuStore.open('account', {
			element: '#button-account',
			horizontal: I.MenuDirection.Right
		});
	};
	
	onProfile (e: any) {
		const object = detailStore.get(Constant.subId.profile, blockStore.profile);
		DataUtil.objectOpenEvent(e, object);
	};
	
	onClick (e: any, item: any) {
		e.stopPropagation();
		e.persist();

		const { tab } = this.state;
		const object = item.isBlock ? item._object_ : item;

		if (tab == I.TabIndex.Archive) {
			this.onSelect(e, item);
		} else {
			DataUtil.objectOpenEvent(e, object);
		};
	};

	getObject (item: any) {
		return item.isBlock ? item._object_ : item;
	};

	onSelect (e: any, item: any) {
		e.stopPropagation();
		e.persist();

		if (e.shiftKey) {
			const list = this.getList();
			const idx = list.findIndex(it => it.id == item.id);
			
			if ((idx >= 0) && (this.selected.length > 0)) {
				const selectedIndexes = this.getSelectedIndexes().filter(i => i != idx);
				const closest = Util.findClosestElement(selectedIndexes, idx);
				
				if (isFinite(closest)) {
					const [ start, end ] = this.getSelectionRange(closest, idx);
					const ids = list.slice(start, end).map(item => item.id);

					this.selected = this.selected.concat(ids);
				};
			};
		} else {
			let idx = this.selected.indexOf(item.id);
			if (idx >= 0) {
				this.selected.splice(idx, 1);
			} else {
				this.selected.push(item.id);
			};	
		};

		this.selected = Util.arrayUnique(this.selected);
		this.selectionRender();

		analytics.event('MultiSelectHome', { count: this.selected.length });
	};

	selectionRender () {
		const node = $(ReactDOM.findDOMNode(this));
		const wrapper = node.find('#documents');
		const cnt = node.find('#selectCnt');
		const selectAll = node.find('#button-selectAll');
		const selectNone = node.find('#button-selectNone');
		const items = this.getList();
		const l = this.selected.length;

		if (l == items.length) {
			selectAll.hide();
			selectNone.show();
		} else {
			selectAll.show();
			selectNone.hide();
		};

		l ? wrapper.addClass('isSelecting') : wrapper.removeClass('isSelecting');
		cnt.text(`${l} ${Util.cntWord(l, 'object', 'objects')} selected`);

		node.find('.item.isSelected').removeClass('isSelected');
		this.selected.forEach((id: string) => {
			node.find(`#item-${id}`).addClass('isSelected');
		});

		this.onScroll();
	};

	onSelection (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const l = this.selected.length;

		switch (item.id) {
			case 'delete':
				this.onSelectionDelete();
				break;

			case 'archive':
				this.onSelectionArchive(true);

				analytics.event('MoveToBin', { count: l });
				break;

			case 'restore':
				this.onSelectionArchive(false);

				analytics.event('RestoreFromBin', { count: l });
				break;

			case 'fav':
				this.onSelectionFavorite(true);

				analytics.event('AddToFavorites', { count: l });
				break;

			case 'unfav':
				this.onSelectionFavorite(false);

				analytics.event('RemoveFromFavorites', { count: l });
				break;

			case 'selectAll':
				this.onSelectionAll();

				analytics.event('MultiSelectHome', { count: l });
				break;

			case 'selectNone':
				this.onSelectionNone();
				break;
		};
	};

	getSelectedObjectIds () {
		const items = this.getList().filter((it: any) => { return this.selected.includes(it.id); });
		return items.map((it: any) => { return this.getObject(it).id; });
	};

	onSelectionDelete () {
		const l = this.selected.length;
		const ids = this.getSelectedObjectIds();

		const cb = () => {
			this.selected = [];
			this.selectionRender();
		};

		analytics.event('ShowDeletionWarning');
		popupStore.open('confirm', {
			data: {
				title: `Are you sure you want to delete ${l} ${Util.cntWord(l, 'object', 'objects')}?`,
				text: 'These objects will be deleted irrevocably. You can’t undo this action.',
				textConfirm: 'Delete',
				onConfirm: () => { 
					C.ObjectListDelete(ids); 
					cb();

					analytics.event('RemoveCompletely', { count: l });
				},
				onCancel: () => { cb(); }
			},
		});
	};
	
	onSelectionArchive (v: boolean) {
		const items = this.getList().filter((it: any) => { return this.selected.includes(it.id); });
		const ids = this.getSelectedObjectIds();

		this.selected = [];
		this.selectionRender();

		C.ObjectListSetIsArchived(ids, v, () => {
			analytics.event(v ? 'MoveToBin' : 'RestoreFromBin', { count: items.length });
		});
	};

	onSelectionFavorite (v: boolean) {
		const ids = this.getSelectedObjectIds();

		this.selected = [];
		this.selectionRender();

		C.ObjectListSetIsFavorite(ids, v);
	};

	onSelectionAll () {
		this.selected = this.getList().map((it: any) => { return it.id; });
		this.selectionRender();
	};

	onSelectionNone () {
		this.selected = [];
		this.selectionRender();
	};

	onSelectionClose (e: any) {
		this.selected = [];
		this.selectionRender();
	};

	onStore (e: any) {
		DataUtil.objectOpenPopup({ layout: I.ObjectLayout.Store });
	};
	
	onAdd (e: any) {
		DataUtil.pageCreate('', '', {}, I.BlockPosition.Bottom, '', {}, [ I.ObjectFlag.DeleteEmpty, I.ObjectFlag.SelectType ], (message: any) => {
			DataUtil.objectOpenPopup({ id: message.targetId });
		});
	};

	onMore (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const { tab } = this.state;
		const { root, recent, profile } = blockStore;
		const object = item.isBlock ? item._object_ : item;
		const rootId = tab == I.TabIndex.Recent ? recent : root;
		const subIds = [ 'searchObject' ];
		const favorites = blockStore.getChildren(blockStore.root, blockStore.root, (it: I.Block) => {
			return it.isLink() && (it.content.targetBlockId == object.id);
		});

		let menuContext = null;
		let archive = null;
		let link = null;
		let remove = null;
		let move = { id: 'move', icon: 'move', name: 'Move to', arrow: true };
		let types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map(it => it.id);
		
		if (favorites.length) {
			link = { id: 'unfav', icon: 'unfav', name: 'Remove from Favorites' };
		} else {
			link = { id: 'fav', icon: 'fav', name: 'Add to Favorites' };
		};

		if (object.isArchived) {
			link = null;
			remove = { id: 'remove', icon: 'remove', name: 'Delete' };
			archive = { id: 'unarchive', icon: 'undo', name: 'Restore from bin' };
		} else {
			archive = { id: 'archive', icon: 'remove', name: 'Move to bin' };
		};

		if (!blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Delete ])) {
			archive = null;
		};

		if ([ I.TabIndex.Favorite ].indexOf(tab) < 0) {
			move = null;
		};

		const options = [
			archive,
			remove,
			move,
			link,
		];

		menuStore.open('select', { 
			element: `#button-${item.id}-more`,
			offsetY: 8,
			horizontal: I.MenuDirection.Center,
			subIds: subIds,
			onOpen: (context: any) => {
				menuContext = context;
			},
			data: {
				options: options,
				onOver: (e: any, el: any) => {
					menuStore.closeAll(subIds, () => {
						if (el.id == 'move') {
							const filters = [
								{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types }
							];

							menuStore.open('searchObject', {
								element: `#menuSelect #item-${el.id}`,
								offsetX: menuContext.getSize().width,
								vertical: I.MenuDirection.Center,
								isSub: true,
								data: {
									rebind: menuContext.ref.rebind,
									rootId: rootId,
									blockId: item.id,
									blockIds: [ item.id ],
									type: I.NavigationType.Move, 
									skipIds: [ rootId ],
									filters: filters,
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

					this.selected = [ item.id ];

					switch (el.id) {
						case 'archive':
							this.onSelectionArchive(true);

							analytics.event('MoveToBin', { count: 1 });
							break;

						case 'unarchive':
							this.onSelectionArchive(false);

							analytics.event('RemoveFromFavorites', { count: 1 });
							break;

						case 'fav':
							this.onSelectionFavorite(true);

							analytics.event('AddToFavorites', { count: 1 });
							break;

						case 'unfav':
							this.onSelectionFavorite(false);

							analytics.event('RemoveFromFavorites', { count: 1 });
							break;

						case 'remove':
							this.onSelectionDelete();
							break;
					};
				},
			},
		});
	};

	onSortStart (param: any) {
		const { dataset } = this.props;
		const { node } = param;
		const { selection } = dataset;

		this.id = $(node).data('id');

		selection.preventSelect(true);
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { dataset } = this.props;
		const { selection } = dataset;

		selection.preventSelect(false);
		
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
		C.BlockListMoveToExistingObject(root, root, [ current.id ], target.id, position);

		analytics.event('ReorderObjects', { route: 'ScreenHome' });
	};
	
	resize () {
		const size = Constant.size.index;
		const win = $(window);
		const wh = win.height();
		const ww = win.width();
		const node = $(ReactDOM.findDOMNode(this));
		const title = node.find('#title');
		const body = node.find('#body');
		const documents = node.find('#documents');
		const items = node.find('#documents .item');
		const hh = Util.sizeHeader();

		const maxWidth = ww - size.border * 2;
		const cnt = Math.floor(maxWidth / (size.width + size.margin));
		const width = Math.floor((maxWidth - size.margin * (cnt - 1)) / cnt);
		const height = this.getListHeight();

		items.css({ width: width });
		title.css({ width: maxWidth });
		body.css({ width: maxWidth });
		documents.css({ marginTop: wh - size.titleY - height - hh });

		items.each((i: number, item: any) => {
			item = $(item);

			const n = i + 1;
			const icon = item.find('.iconObject');

			if (icon.length) {
				item.addClass('withIcon');
			};

			item.css({ marginRight: (n % cnt == 0) ? 0 : '' });
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
		const { tab, filter } = this.state;
		const records = dbStore.getRecords(Constant.subId.index, '');
		const isRecent = tab == I.TabIndex.Recent;

		let reg = null;
		let list: any[] = [];
		let rootId = root;
		let recentIds = [];

		if (filter) {
			reg = new RegExp(Util.filterFix(filter), 'gi');
		};

		switch (tab) {
			case I.TabIndex.Favorite:
			case I.TabIndex.Recent:
				if (isRecent) {
					rootId = recent;
					recentIds = crumbs.get(I.CrumbsType.Recent).ids;
				};

				list = blockStore.getChildren(rootId, rootId, (it: any) => {
					if (!it.content.targetBlockId) {
						return false;
					};

					const object = detailStore.get(rootId, it.content.targetBlockId, []);
					const { name, isArchived, isDeleted, type } = object;

					if (reg && name && !name.match(reg)) {
						return false;
					};
					if (isRecent && DataUtil.getSystemTypes().includes(type)) {
						return false;
					};

					return !isArchived && !isDeleted;
				}).map((it: any) => {
					if (isRecent) {
						it._order = recentIds.findIndex((id: string) => { return id == it.content.targetBlockId; });
					};

					it._object_ = detailStore.get(rootId, it.content.targetBlockId, [ 'templateIsBundled' ]);
					it.isBlock = true;
					return it;
				});

				if (isRecent) {
					list.sort((c1: any, c2: any) => {
						if (c1._order > c2._order) return -1;
						if (c2._order < c1._order) return 1;
						return 0;
					});
				};

				break;

			default:
				list = records.map((it: any) => {
					return detailStore.get(Constant.subId.index, it.id);
				});
				break;
		};

		return list;
	};

	getSelectedIndexes () {
		const list = this.getList();
		const indexes = this.selected.map(id => {
			return list.findIndex(it => it.id === id);
		});
		return indexes.filter(idx => idx >= 0);
	};

	getSelectionRange (index1: number, index2: number) {
		const [ start, end ] = (index1 >= index2) ? [ index2, index1 ] : [ index1 + 1, index2 + 1 ];
		return [ start, end ];
	};

	onClear () { 
		const recent = crumbs.get(I.CrumbsType.Recent);
		recent.ids = [];
		crumbs.save(I.CrumbsType.Recent, recent);
	};

});

export default PageMainIndex;