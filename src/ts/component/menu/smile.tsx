import * as React from 'react';
import $ from 'jquery';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, Icon, IconEmoji, EmptySearch, Label, Loader } from 'Component';
import { I, C, UtilCommon, UtilSmile, UtilMenu, keyboard, translate, analytics, Preview, Action, UtilData } from 'Lib';
import { menuStore, commonStore } from 'Store';
const Constant = require('json/constant.json');

enum Tab {
	None	 = 0,
	Library	 = 1,
	Smile	 = 2,
	Upload	 = 3,
};

interface State {
	filter: string;
	page: number;
	tab: Tab;
	isLoading: boolean;
};

const LIMIT_SMILE_ROW = 9;
const LIMIT_LIBRARY_ROW = 4;
const LIMIT_RECENT = 18;
const LIMIT_SEARCH = 12;

const HEIGHT_SECTION = 40;
const HEIGHT_SMILE_ITEM = 40;
const HEIGHT_LIBRARY_ITEM = 94;

const ID_RECENT = 'recent';

class MenuSmile extends React.Component<I.Menu, State> {

	_isMounted = false;
	state = {
		filter: '',
		page: 0,
		isLoading: false,
		tab: Tab.None,
	};

	node = null;
	refFilter = null;
	refList = null;
	refItems = null;

	id = '';
	skin = 1;
	cache: any = null;
	groupCache: any[] = [];
	row = -1;
	coll = 0;
	active: any = null;
	items: any[] = [];
	timeoutMenu = 0;
	timeoutFilter = 0;

	constructor (props: I.Menu) {
		super(props);
		
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.unbind = this.unbind.bind(this);
		this.rebind = this.rebind.bind(this);
	};
	
	render () {
		const { filter, isLoading, tab } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { noHead } = data;
		const tabs = this.getTabs();
		const items = this.getItems();

		let content = null;

		switch (tab) {
			case Tab.Smile: {
				if (!this.cache) {
					break;
				};

				const sections = this.getSmileSections();
				const groups = this.getGroups();

				const Item = (item: any) => {
					const str = `:${item.itemId}::skin-tone-${item.skin}:`;
					return (
						<div 
							id={`item-${item.id}`} 
							className="item" 
							onMouseEnter={e => this.onMouseEnter(e, item)}
							onMouseLeave={() => this.onMouseLeave()} 
							onMouseDown={e => this.onMouseDown(e, item)}
							onContextMenu={e => this.onSkin(e, item)}
						>
							<div 
								className="iconObject c32" 
								{...UtilCommon.dataProps({ code: str })}
							>
								<IconEmoji className="c32" size={28} icon={str} />
							</div>
						</div>
					);
				};
				
				const rowRenderer = (param: any) => {
					const item = items[param.index];

					let content = null;
					if (item.isSection) {
						content = (
							<div className="section">
								<div className="name">{item.name}</div>
							</div>
						);
					} else {
						content = (
							<div className="row">
								{item.children.map((item: any, i: number) => (
									<Item key={item.id} {...item} />
								))}
							</div>
						);
					};

					return (
						<CellMeasurer
							key={param.key}
							parent={param.parent}
							cache={this.cache}
							columnIndex={0}
							rowIndex={param.index}
						>
							<div style={param.style}>
								{content}
							</div>
						</CellMeasurer>
					);
				};

				content = (
					<React.Fragment>
						<Filter 
							ref={ref => this.refFilter = ref}
							value={filter}
							className={[ 'outlined', (!noHead ? 'withHead' : '') ].join(' ')}
							onChange={e => this.onKeyUp(e, false)} 
							focusOnMount={true}
						/>
						
						<div ref={ref => this.refItems = ref} className="items">
							<InfiniteLoader
								rowCount={items.length}
								loadMoreRows={() => {}}
								isRowLoaded={({ index }) => !!items[index]}
							>
								{({ onRowsRendered }) => (
									<AutoSizer className="scrollArea">
										{({ width, height }) => (
											<List
												ref={ref => this.refList = ref}
												width={width}
												height={height}
												deferredMeasurmentCache={this.cache}
												rowCount={items.length}
												rowHeight={({ index }) => this.getRowHeight(items[index])}
												rowRenderer={rowRenderer}
												onRowsRendered={onRowsRendered}
												overscanRowCount={10}
												onScroll={this.onScroll}
												scrollToAlignment="center"
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>

							{!sections.length ? (
								<EmptySearch text={UtilCommon.sprintf(translate('menuSmileEmpty'), filter)} />
							): ''}
						</div>

						{sections.length ? (
							<div id="foot" className="foot">
								{groups.map((group: any, i: number) => (
									<Icon 
										key={i} 
										id={`item-${group.id}`}
										className={group.id} 
										tooltip={group.name} 
										tooltipY={I.MenuDirection.Bottom} 
										onClick={() => this.onGroup(group.id)} 
									/>
								))}
								<Icon 
									className="random" 
									tooltip={translate('menuSmileRandom')} 
									onClick={() => this.onRandom()}
								/>
							</div>
						) : ''}
					</React.Fragment>
				);
				break;
			};

			case Tab.Library: {
				const Item = (item: any) => (
					<div 
						id={`item-${item.id}`} 
						className="item" 
						onMouseEnter={e => this.onMouseEnter(e, item)}
						onMouseLeave={() => this.onMouseLeave()} 
						onMouseDown={e => this.onMouseDown(e, item)}
					>
						<div className="img" style={{ backgroundImage: `url("${commonStore.imageUrl(item.id, 72)}")` }} />
					</div>
				);
				
				const rowRenderer = (param: any) => {
					const item = items[param.index];

					return (
						<CellMeasurer
							key={param.key}
							parent={param.parent}
							cache={this.cache}
							columnIndex={0}
							rowIndex={param.index}
						>
							<div key={param.index} className="row" style={param.style}>
								{item.children.map((item: any, i: number) => (
									<Item key={item.id} {...item} />
								))}
							</div>
						</CellMeasurer>
					);
				};

				content = (
					<React.Fragment>
						<Filter 
							ref={ref => this.refFilter = ref}
							value={filter}
							className={[ 'outlined', (!noHead ? 'withHead' : '') ].join(' ')}
							onChange={e => this.onKeyUp(e, false)} 
							focusOnMount={true}
						/>

						<div className="items">
							<InfiniteLoader
								rowCount={items.length}
								loadMoreRows={() => {}}
								isRowLoaded={({ index }) => !!items[index]}
							>
								{({ onRowsRendered }) => (
									<AutoSizer className="scrollArea">
										{({ width, height }) => (
											<List
												ref={ref => this.refList = ref}
												width={width}
												height={height}
												deferredMeasurmentCache={this.cache}
												rowCount={items.length}
												rowHeight={({ index }) => this.getRowHeight(items[index])}
												rowRenderer={rowRenderer}
												onRowsRendered={onRowsRendered}
												overscanRowCount={10}
												scrollToAlignment="start"
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>

							{!items.length ? (
								<EmptySearch text={UtilCommon.sprintf(translate('menuSmileEmpty'), filter)} />
							): ''}
						</div>

					</React.Fragment>
				);
				break;
			};

			case Tab.Upload: {
				content = (
					<div 
						className="dropzone" 
						onDragOver={this.onDragOver} 
						onDragLeave={this.onDragLeave} 
						onDrop={this.onDrop}
						onClick={this.onUpload}
					>
						<Icon className="coverUpload" />
						<Label text={translate('menuBlockCoverChoose')} />
					</div>
				);
				break;
			};
		};

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				{tabs.length ? (
					<div className="head">
						{tabs.map((item, i) => (
							<div 
								key={i} 
								className={[ 'tab', (tab == item.id ? 'active' : '') ].join(' ')} 
								onClick={item.onClick || (() => this.onTab(item.id))}
							>
								{item.text}
							</div>
						))}
					</div>
				) : ''}
				
				<div className={[ 'body', Tab[tab].toLowerCase() ].join(' ')}>
					{isLoading ? <Loader /> : ''}
					{content}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		const { storageGet } = this.props;
		const items = this.getItems();
		const tabs = this.getTabs();

		this.rebind();

		this.skin = Number(storageGet().skin) || 1;
		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_SECTION,
			keyMapper: i => (items[i] || {}).id,
		});

		this.onTab(tabs.length ? tabs[0].id : Tab.Smile);
	};
	
	componentDidUpdate () {
		const node = $(this.node);
		
		if (this.id) {
			node.find(`#item-${this.id}`).addClass('active');
			this.id = '';
		};

		this.groupCache = [];
	};
	
	componentWillUnmount () {
		this._isMounted = false;

		window.clearTimeout(this.timeoutMenu);
		window.clearTimeout(this.timeoutFilter);

		keyboard.setFocus(false);
		menuStore.close('smileSkin');

		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	load () {
		const { filter, tab } = this.state;

		this.items = [];

		switch (tab) {
			case Tab.Library: {
				const filters: I.Filter[] = [
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Image },
				];
				const sorts = [ 
					{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
				];

				this.setState({ isLoading: true });

				UtilData.search({
					filters,
					sorts,
					fullText: filter,
					limit: 1000,
				}, (message: any) => {
					if (!message.error.code) {
						this.items = message.records || [];
					};

					this.setState({ isLoading: false });
				});
				break;
			};
		};
	};

	checkRecent (sections: any[]) {
		const { storageGet } = this.props;
		const recent = storageGet().recent || [];

		if (recent && recent.length) {
			recent.forEach((el: any) => {
				if (el.smile) {
					el.id = el.smile;
				};
			});

			sections.unshift({ id: ID_RECENT, name: translate('menuSmileRecent'), children: recent });
		};

		return sections;
	};

	getGroups () {
		return this.checkRecent(UtilSmile.getCategories().map(it => ({ id: it.id, name: it.name })));
	};
	
	getSmileSections () {
		const { filter } = this.state;
		const reg = new RegExp(filter, 'gi');

		let sections: any[] = [];

		UtilSmile.getCategories().forEach(it => {
			sections.push({
				...it,
				children: it.emojis.map(id => {
					const item = UtilSmile.data.emojis[id] || {};
					return { 
						id, 
						skin: this.skin, 
						keywords: item.keywords || [], 
						skins: item.skins || [],
					};
				}),
			});
		});

		if (filter) {
			sections = sections.filter((s: any) => {
				s.children = (s.children || []).filter(c => {
					if (c.id.match(reg)) {
						return true;
					};
					for (const w of c.keywords) {
						if (w.match(reg)) {
							return true;
						};
					};
					return false;
				});
				return s.children.length > 0;
			});
		};

		sections = this.checkRecent(sections);
		sections = UtilMenu.sectionsMap(sections);
		
		return sections;
	};

	getItems () {
		const { tab } = this.state;

		let ret = [];

		switch (tab) {
			case Tab.Smile: {
				ret = this.getSmileItems();
				break;
			};

			case Tab.Library: {
				ret = this.getLibraryItems();
				break;
			};
		};

		return ret.map((it, i) => {
			it.children = (it.children || []).map((c, n) => {
				c.position = { row: i, n };
				return c;	
			});
			return it;
		});
	};

	getLibraryItems () {
		const ret: any[] = [];

		let n = 0;
		let row = { children: [] };

		for (let i = 0; i < this.items.length; ++i) {
			const item = this.items[i];

			row.children.push(item);

			n++;
			if (n == LIMIT_LIBRARY_ROW) {
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length && (row.children.length < LIMIT_LIBRARY_ROW)) {
			ret.push(row);
		};

		return ret;
	};

	getSmileItems () {
		let sections = this.getSmileSections();
		let items: any[] = [];

		const ret: any[] = [];
		const length = sections.reduce((res: number, section: any) => { 
			return (section.id == ID_RECENT) ? res : res + section.children.length; 
		}, 0);

		if (length && (length <= LIMIT_SEARCH)) {
			sections = [
				{ 
					id: 'search', name: translate('menuSmileSearch'), isSection: true,
					children: sections.reduce((res: any[], section: any) => {
						return (section.id == ID_RECENT) ? res : res.concat(section.children); 
					}, [])
				}
			];
		};

		for (const section of sections) {
			items.push({ id: section.id, name: section.name, isSection: true });
			items = items.concat(section.children);
		};

		let n = 0;
		let row = { children: [] };

		for (let i = 0; i < items.length; ++i) {
			const item = items[i];
			const next = items[i + 1];

			if (item.isSection) {
				row = { children: [] };
				ret.push(item);
				n = 0;
				continue;
			};

			row.children.push(item);

			n++;
			if ((n == LIMIT_SMILE_ROW) || (next && next.isSection && (row.children.length > 0) && (row.children.length < LIMIT_SMILE_ROW))) {
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length && (row.children.length < LIMIT_SMILE_ROW)) {
			ret.push(row);
		};

		return ret;
	};
	
	getRowHeight (item: any) {
		if (item.isSection) {
			return HEIGHT_SECTION;
		};

		switch (this.state.tab) {
			case Tab.Smile: return HEIGHT_SMILE_ITEM;
			case Tab.Library: return HEIGHT_LIBRARY_ITEM;
		};

		return 0;
	};

	onKeyUp (e: any, force: boolean) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			this.setState({ page: 0, filter: UtilCommon.regexEscape(this.refFilter.getValue()) }, () => this.load());
		}, force ? 0 : 50);
	};

	onKeyDown (e: any) {
		if (menuStore.isOpen('smileSkin')) {
			return;
		};

		const { close } = this.props;
		const { tab } = this.state;
		const checkFilter = () => this.refFilter && this.refFilter.isFocused;

		e.stopPropagation();
		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			e.preventDefault();

			this.refFilter?.blur();
			this.onArrowVertical(pressed == 'arrowup' ? -1 : 1);
		});

		keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
			if (checkFilter()) {
				return;
			};

			e.preventDefault();
			this.refFilter?.blur();
			this.onArrowHorizontal(pressed == 'arrowleft' ? -1 : 1);
		});

		if (!this.active) {
			return;
		};

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			switch (tab) {
				case Tab.Smile: {
					this.onSmileSelect(this.active.itemId, this.skin);
					break;
				};

				case Tab.Library: {
					this.upload(this.active.id);
					break;
				};
			};
			close();
		});

		keyboard.shortcut('tab, space', e, () => {
			if (checkFilter()) {
				return;
			};

			e.preventDefault();

			switch (tab) {
				case Tab.Smile: {
					const item = UtilSmile.data.emojis[this.active.itemId];
					if (item.skins && (item.skins.length > 1)) {
						this.onSkin(e, this.active);
					} else {
						this.onSmileSelect(this.active.itemId, this.skin);
						close();
					};
					break;
				};

				case Tab.Library: {
					this.upload(this.active.id);
					break;
				};
			};

			Preview.tooltipHide(true);
		});
	};

	setActive (item?: any, row?: number) {
		const node = $(this.node);
		const items = $(this.refItems);

		if (row && this.refList) {
			this.refList.scrollToRow(Math.max(0, row));
		};

		Preview.tooltipHide(false);
		items.find('.active').removeClass('active');

		this.active = item;

		if (!item) {
			return;
		};

		const element = node.find(`#item-${$.escapeSelector(item.id)}`);

		element.addClass('active');
		Preview.tooltipShow({ text: this.getTooltip(item), element });
	};

	onArrowVertical (dir: number) {
		const rows = this.getItems();

		this.row += dir;

		// Arrow up
		if (this.row < 0) {
			this.row = rows.length - 1;
		};

		// Arrow down
		if (this.row > rows.length - 1) {
			this.row = 0;
		};

		const current = rows[this.row];
		if (!current) {
			return;
		};

		if (!current.children) {
			this.onArrowVertical(dir);
			return;
		};

		this.setActive(current.children[this.coll], this.row);
	};

	onArrowHorizontal (dir: number) {
		if (this.row == -1) {
			return;
		};

		const rows = this.getItems();
		const current = rows[this.row];

		if (!current) {
			return;
		};

		this.coll += dir;

		// Arrow left
		if (this.coll < 0) {
			this.coll = LIMIT_SMILE_ROW - 1;
			this.onArrowVertical(dir);
			return;
		};

		// Arrow right
		if (this.coll > current.children.length - 1) {
			this.coll = 0;
			this.onArrowVertical(dir);
			return;
		};

		this.setActive(current.children[this.coll], this.row);
	};

	onUpload () {
		this.props.close();

		Action.openFile(Constant.fileExtension.cover, paths => {
			C.FileUpload(commonStore.space, '', paths[0], I.FileType.Image, {}, (message: any) => {
				if (!message.error.code) {
					this.upload(message.objectId);
				};
			});
		});
	};
	
	onSmileSelect (id: string, skin: number) {
		const { param, storageSet } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		if (id) {
			this.skin = Number(skin) || 1;
			this.setLastIds(id, this.skin);

			storageSet({ skin: this.skin });
		};

		if (onSelect) {
			onSelect(id ? UtilSmile.nativeById(id, this.skin) : '');
		};

		analytics.event(id ? 'SetIcon' : 'RemoveIcon');
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.row = item.position.row;
			this.coll = item.position.n;
			this.setActive(item);
		};
	};

	onMouseLeave () {
		if (!keyboard.isMouseDisabled) {
			this.setActive(null);
			this.coll = 0;
		};
	};
	
	onMouseDown (e: any, item: any) {
		const { close } = this.props;
		const { tab } = this.state;
		const win = $(window);

		switch (tab) {
			case Tab.Smile: {
				const { itemId, skin } = item;

				this.id = itemId;
				window.clearTimeout(this.timeoutMenu);

				if (e.button) {
					return;
				};

				if (item && item.skins && (item.skins.length > 1)) {
					this.timeoutMenu = window.setTimeout(() => {
						win.off('mouseup.smile');
						this.onSkin(e, item);
					}, 200);
				};

				win.off('mouseup.smile').on('mouseup.smile', () => {
					if (menuStore.isOpen('smileSkin')) {
						return;
					};

					if (this.id) {
						this.onSmileSelect(itemId, skin);
						close();
					};

					window.clearTimeout(this.timeoutMenu);
					win.off('mouseup.smile');
				});
				break;
			};

			case Tab.Library: {
				this.upload(item.id);
				break;
			};
		};
	};

	onSkin (e: any, item: any) {
		const el = UtilSmile.data.emojis[item.itemId];
		if (el.skins.length <= 1) {
			return;
		};

		const { getId, close, param } = this.props;

		menuStore.open('smileSkin', {
			...param,
			type: I.MenuType.Horizontal,
			element: `#${getId()} #item-${$.escapeSelector(item.id)}`,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Center,
			data: {
				smileId: item.itemId,
				onSelect: (skin: number) => {
					this.onSmileSelect(item.itemId, skin);
					close();
				},
				rebind: this.rebind
			},
			onClose: () => {
				this.id = '';
			}
		});
	};
	
	setLastIds (id: string, skin: number) {
		if (!id) {
			return;
		};

		const { storageGet, storageSet } = this.props;
		
		let ids = storageGet().recent || [];
		
		ids = ids.map((it: any) => {
			it.key = [ it.id, it.skin ].join(',');
			return it;
		});
		
		ids.unshift({ id, skin, key: [ id, skin ].join(',') });
		
		ids = UtilCommon.arrayUniqueObjects(ids, 'key');
		ids = ids.slice(0, LIMIT_RECENT);
		ids = ids.map((it: any) => {
			delete(it.key);
			return it;
		});

		storageSet({ recent: ids });
	};
	
	onRemove () {
		this.onSmileSelect('', 1);
		this.props.close();
	};

	onGroup (id: string) {
		const items = this.getItems();
		const idx = items.findIndex(it => it.id == id);

		this.refList.scrollToRow(Math.max(0, idx));
		this.row = Math.max(0, idx);
		this.coll = 0;
	};

	getGroupCache () {
		if (this.groupCache.length) {
			return this.groupCache;
		};

		const items = this.getItems();

		let t = 0;
		let last = null;

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			if (item.isSection) {
				last = this.groupCache[this.groupCache.length - 1];
				if (last) {
					last.end = t;
				};

				this.groupCache.push({ id: item.id, start: t, end: 0 });
			};

			t += this.getRowHeight(item);
		};

		last = this.groupCache[this.groupCache.length - 1];
		if (last) {
			last.end = t;
		};
		return this.groupCache;
	};

	onScroll ({ scrollTop }) {
		const cache = this.getGroupCache();
		const top = scrollTop + this.refList?.props.height / 2;

		for (const item of cache) {
			if ((top >= item.start) && (top < item.end)) {
				this.setActiveGroup(item.id);
				break;
			};
		};
	};

	setActiveGroup (id: string) {
		const node = $(this.node);
		const foot = node.find('#foot');

		foot.find('.active').removeClass('active');
		foot.find(`#item-${id}`).addClass('active');
	};

	onDragOver (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		$(this.node).find('.dropzone').addClass('isDraggingOver');
	};
	
	onDragLeave (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		$(this.node).find('.dropzone').removeClass('isDraggingOver');
	};
	
	onDrop (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const { dataset, close } = this.props;
		const { preventCommonDrop } = dataset || {};
		const file = e.dataTransfer.files[0].path;
		const node = $(this.node);
		const zone = node.find('.dropzone');
		
		preventCommonDrop(true);

		zone.removeClass('isDraggingOver');
		this.setState({ isLoading: true });
		
		C.FileUpload(commonStore.space, '', file, I.FileType.Image, {}, (message: any) => {
			this.setState({ isLoading: false });
			
			preventCommonDrop(false);
			
			if (!message.error.code) {
				this.upload(message.objectId);
			};
		
			close();
		});
	};

	getTabs () {
		const { param } = this.props;
		const { data } = param;
		const { noHead, noGallery, noUpload, noRemove } = data;

		if (noHead) {
			return [];
		};

		let tabs: any[] = [];

		if (!noUpload) {
			tabs.push({ id: Tab.Library, text: translate('commonLibrary') });
		};

		if (!noGallery) {
			tabs.push({ id: Tab.Smile, text: translate('menuSmileGallery') });
		};

		if (!noUpload) {
			tabs.push({ id: Tab.Upload, text: translate('menuSmileUpload') });
		};

		if (!noRemove) {
			tabs.push({ text: translate('commonRemove'), onClick: this.onRemove });
		};

		return tabs;
	};

	onTab (tab: Tab) {
		this.setState({ tab }, () => this.load());
	};

	onRandom () {
		const param = UtilSmile.randomParam();

		this.onSmileSelect(param.id, param.skin);
		this.forceUpdate();
	};

	upload (id: string) {
		const { param } = this.props;
		const { data } = param;
		const { onUpload } = data;

		if (onUpload) {
			onUpload(id);
		};
	};

	getTooltip (item) {
		switch (this.state.tab) {
			case Tab.Smile: {
				return UtilSmile.aliases[item.itemId] || item.itemId;
			};

			case Tab.Library: {
				return item.name;
			};
		};
	};

};

export default MenuSmile;