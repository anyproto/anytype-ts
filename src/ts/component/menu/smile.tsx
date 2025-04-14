import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, Icon, IconEmoji, EmptySearch, Label, Loader, IconObject } from 'Component';
import { I, C, S, U, J, keyboard, translate, analytics, Preview, Action } from 'Lib';

enum Tab {
	None	 = 0,
	Library	 = 1,
	Smile	 = 2,
	Upload	 = 3,
	Icon 	 = 4,
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
const HEIGHT_LIBRARY_ITEM = 96;

const ID_RECENT = 'recent';

const MenuSmile = observer(class MenuSmile extends React.Component<I.Menu, State> {

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
	refIcons = null;

	id = '';
	skin = 1;
	iconColor = 1;
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
		const { noHead, noRemove, value } = data;
		const tabs = this.getTabs();
		const items = this.getItems();

		let content = null;

		switch (tab) {
			case Tab.Icon: {
				if (!this.cache) {
					break;
				};

				const Item = (item: any) => (
					<div
						id={`item-${item.id}`}
						className="item"
						onMouseEnter={e => this.onMouseEnter(e, item)}
						onMouseLeave={() => this.onMouseLeave()}
						onMouseDown={e => this.onMouseDown(e, item)}
						onContextMenu={e => this.onSkin(e, item)}
					>
						<IconObject object={item} size={30} iconSize={30} tooltipParam={{ text: item.id }} />
					</div>
				);

				const rowRenderer = (param: any) => (
					<CellMeasurer
						key={param.key}
						parent={param.parent}
						cache={this.cache}
						columnIndex={0}
						rowIndex={param.index}
					>
						<div style={param.style}>
							<div className="row">
								{items[param.index].children.map((item: any, i: number) => (
									<Item key={item.id} {...item} />
								))}
							</div>
						</div>
					</CellMeasurer>
				);

				content = (
					<>
						<Filter 
							ref={ref => this.refFilter = ref}
							value={filter}
							className={[ 'outlined', (!noHead ? 'withHead' : '') ].join(' ')}
							onChange={e => this.onKeyUp(e, false)} 
							focusOnMount={true}
						/>

						<div ref={ref => this.refIcons = ref} className="items">
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
												rowHeight={HEIGHT_SMILE_ITEM}
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
						</div>
					</>
				);
				break;
			};

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
								{...U.Common.dataProps({ code: str })}
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
					<>
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
								<EmptySearch text={filter ? U.Common.sprintf(translate('menuSmileEmptyFilter'), filter) : translate('menuSmileEmpty')} />
							): ''}
						</div>

						{sections.length ? (
							<div id="foot" className="foot">
								{groups.map((group: any, i: number) => (
									<Icon 
										key={i} 
										id={`item-${group.id}`}
										className={group.id} 
										tooltipParam={{ text: group.name, typeY: I.MenuDirection.Bottom }} 
										onClick={() => this.onGroup(group.id)} 
									/>
								))}
								<Icon 
									className="random" 
									tooltipParam={{ text: translate('menuSmileRandom') }} 
									onClick={() => this.onRandom()}
								/>
							</div>
						) : ''}
					</>
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
						<div className="img" style={{ backgroundImage: `url("${S.Common.imageUrl(item.id, 72)}")` }} />
						<div className="name">{item.name}</div>
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
					<>
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
								<EmptySearch text={filter ? U.Common.sprintf(translate('menuSmileEmptyFilter'), filter) : translate('menuSmileEmpty')} />
							): ''}
						</div>

					</>
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
				{!noHead ? (
					<div className="head">
						<div className="side left">
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
						<div className="side right">
							{!noRemove && value ? (
								<div className="tab" onClick={this.onRemove}>
									{translate('commonRemove')}
								</div>
							) : ''}
						</div>
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
		const storage = storageGet();
		const { tab, skin, iconColor } = storage;

		this.rebind();

		this.skin = Number(skin) || 1;
		this.iconColor = Number(iconColor) || 1;
		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_SECTION,
			keyMapper: i => (items[i] || {}).id,
		});

		let t = Tab.Smile;
		if (tab && tabs.find(it => it.id == tab)) {
			t = tab;
		} else 
		if (tabs.length) {
			t = tabs[0].id;
		};

		this.setState({ tab: t }, () => this.load());
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
		S.Menu.close('smileColor');

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
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Image },
				];
				const sorts = [ 
					{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
					{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
				];

				this.setLoading(true);

				U.Data.search({
					filters,
					sorts,
					fullText: filter,
					limit: 1000,
				}, (message: any) => {
					if (!message.error.code) {
						this.items = message.records || [];
					};

					this.setLoading(false);
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
		return this.checkRecent(U.Smile.getCategories().map(it => ({ id: it.id, name: it.name })));
	};
	
	getSmileSections () {
		const { filter } = this.state;
		const reg = new RegExp(U.Common.regexEscape(filter), 'gi');

		let sections: any[] = [];

		U.Smile.getCategories().forEach(it => {
			sections.push({
				...it,
				children: it.emojis.map(id => {
					const item = J.Emoji.emojis[id] || {};
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
		sections = U.Menu.sectionsMap(sections);
		
		return sections;
	};

	getItems () {
		const { tab } = this.state;

		let ret = [];

		switch (tab) {
			case Tab.Icon: {
				ret = this.getIconItems();
				break;
			};

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

	getIconItems () {
		const { filter } = this.state;
		const ret: any[] = [];
		const reg = new RegExp(U.Common.regexEscape(filter), 'gi');

		let items = U.Common.objectCopy(J.Icon);
		if (filter) {
			items = items.filter(it => it.id.match(reg));
		};

		let n = 0;
		let row = { children: [] };

		for (let i = 0; i < items.length; i++) {
			const id = items[i].id;

			row.children.push({
				id,
				itemId: id,
				iconName: id,
				iconOption: 1,
				layout: I.ObjectLayout.Type
			});
			n++;

			if (n == LIMIT_SMILE_ROW) {
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
			case Tab.Icon:
			case Tab.Smile: return HEIGHT_SMILE_ITEM;
			case Tab.Library: return HEIGHT_LIBRARY_ITEM;
		};

		return 0;
	};

	onKeyUp (e: any, force: boolean) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			this.setState({ page: 0, filter: U.Common.regexEscape(this.refFilter.getValue()) }, () => this.load());
		}, force ? 0 : 50);
	};

	onKeyDown (e: any) {
		if (S.Menu.isOpen('smileColor')) {
			return;
		};

		const { close } = this.props;
		const { tab } = this.state;
		const checkFilter = () => this.refFilter && this.refFilter.isFocused();

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
				case Tab.Icon: {
					this.onSmileSelect(this.active.itemId, 1);
					break;
				};

				case Tab.Smile: {
					this.onSmileSelect(this.active.itemId, this.skin);
					break;
				};

				case Tab.Library: {
					this.onObjectSelect(this.active.id);
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
				case Tab.Icon: {
					this.onSkin(e, this.active);
					break;
				};

				case Tab.Smile: {
					const item = J.Emoji.emojis[this.active.itemId];
					if (item.skins && (item.skins.length > 1)) {
						this.onSkin(e, this.active);
					} else {
						this.onSmileSelect(this.active.itemId, this.skin);
						close();
					};
					break;
				};

				case Tab.Library: {
					this.onObjectSelect(this.active.id);
					break;
				};
			};

			Preview.tooltipHide(true);
		});
	};

	setActive (item?: any, row?: number) {
		const node = $(this.node);
		const items = node.find('.items');

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
		const tt = this.getTooltip(item);

		element.addClass('active');
		if (tt) {
			Preview.tooltipShow({ text: tt, element });
		};
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

	onSmileSelect (id: string, color: number) {
		color = Number(color) || 1;

		const { tab } = this.state;
		const { param, storageSet } = this.props;
		const { data } = param;
		const { onSelect, onIconSelect } = data;

		if (tab == Tab.Icon) {
			this.iconColor = color;

			storageSet({ iconColor: color });

			if (onIconSelect) {
				onIconSelect(id, color);
			};
		} else {
			const value = id ? U.Smile.nativeById(id, color) : '';

			data.value = value;

			if (value) {
				this.skin = color;
				this.setLastIds(id, color);

				storageSet({ skin: color });
			};

			if (onSelect) {
				onSelect(value);
			};
		};

		analytics.event(id ? 'SetIcon' : 'RemoveIcon');
	};

	onObjectSelect (id: string) {
		const { param } = this.props;
		const { data } = param;
		const { onUpload } = data;

		data.value = id;

		if (onUpload) {
			onUpload(id);
		};
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
		const timeout = tab == Tab.Icon ? 0 : 200;

		const callBack = (id, color) => {
			this.id = id;
			window.clearTimeout(this.timeoutMenu);

			if (e.button) {
				return;
			};

			if (this.hasSkins(item)) {
				this.timeoutMenu = window.setTimeout(() => {
					win.off('mouseup.smile');
					this.onSkin(e, item);
				}, timeout);
			};

			win.off('mouseup.smile').on('mouseup.smile', () => {
				if (S.Menu.isOpen('smileColor')) {
					return;
				};

				if (this.id) {
					this.onSmileSelect(id, color);
					close();
				};

				window.clearTimeout(this.timeoutMenu);
				win.off('mouseup.smile');
			});
		};

		switch (tab) {
			case Tab.Icon: {
				callBack(item.itemId, this.iconColor);
				break;
			};
			case Tab.Smile: {
				callBack(item.itemId, item.skin);
				break;
			};

			case Tab.Library: {
				this.onObjectSelect(item.id);
				break;
			};
		};
	};

	hasSkins (item: any) {
		const { tab } = this.state;
		return (tab == Tab.Icon) || ((tab == Tab.Smile) && (item.skins && item.skins.length > 1));
	};

	onSkin (e: any, item: any) {
		const hasSkins = this.hasSkins(item);

		if (!hasSkins) {
			return;
		};

		const { id, getId, close, param } = this.props;
		const element = `#${getId()} #item-${$.escapeSelector(item.id)}`;

		S.Menu.open('smileColor', {
			...param,
			element,
			type: I.MenuType.Horizontal,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Center,
			rebind: this.rebind,
			parentId: id,
			data: {
				itemId: item.itemId,
				isEmoji: item.skins,
				onSelect: (skin: number) => {
					this.onSmileSelect(item.itemId, skin);
					close();
				},
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
		
		ids = U.Common.arrayUniqueObjects(ids, 'key');
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
		if (!this._isMounted || !U.File.checkDropFiles(e)) {
			return;
		};
		
		$(this.node).find('.dropzone').addClass('isDraggingOver');
	};
	
	onDragLeave (e: any) {
		if (!this._isMounted || !U.File.checkDropFiles(e)) {
			return;
		};
		
		$(this.node).find('.dropzone').removeClass('isDraggingOver');
	};
	
	onDrop (e: any) {
		if (!this._isMounted || !U.File.checkDropFiles(e)) {
			return;
		};
		
		const { close } = this.props;
		const electron = U.Common.getElectron();
		const file = electron.webFilePath(e.dataTransfer.files[0]);
		const node = $(this.node);
		const zone = node.find('.dropzone');
		
		zone.removeClass('isDraggingOver');
		this.setLoading(true);
		keyboard.disableCommonDrop(true);
		
		C.FileUpload(this.getSpaceId(), '', file, I.FileType.Image, {}, (message: any) => {
			this.setLoading(false);
			keyboard.disableCommonDrop(false);
			
			if (!message.error.code) {
				this.onObjectSelect(message.objectId);
			};
		
			close();
		});
	};

	onUpload () {
		Action.openFileDialog({ extensions: J.Constant.fileExtension.cover }, paths => {
			if (!paths.length) {
				return;
			};

			this.setLoading(true);

			C.FileUpload(this.getSpaceId(), '', paths[0], I.FileType.Image, {}, (message: any) => {
				this.setLoading(false);

				if (!message.error.code) {
					this.onObjectSelect(message.objectId);
				};

				this.props.close();
			});
		});
	};

	getSpaceId () {
		return this.props.param.data.spaceId || S.Common.space;
	};

	getTabs () {
		const { param } = this.props;
		const { data } = param;
		const { noHead, noGallery, noUpload, withIcons } = data;

		if (noHead) {
			return [];
		};

		let tabs: any[] = [];

		if (withIcons) {
			tabs.push({ id: Tab.Icon, text: translate('menuSmileIcons') });
		};

		if (!noGallery) {
			tabs.push({ id: Tab.Smile, text: translate('menuSmileGallery') });
		};

		if (!noUpload) {
			tabs = tabs.concat([
				{ id: Tab.Library, text: translate('commonLibrary') },
				{ id: Tab.Upload, text: translate('menuSmileUpload') }
			]);
		};

		return tabs;
	};

	onTab (tab: Tab) {
		this.setState({ tab }, () => this.load());
		this.props.storageSet({ tab });
	};

	onRandom () {
		const param = U.Smile.randomParam();

		this.onSmileSelect(param.id, param.skin);
		this.forceUpdate();
	};

	getTooltip (item) {
		switch (this.state.tab) {
			case Tab.Smile: {
				return U.Smile.aliases[item.itemId] || item.itemId;
			};
		};
	};

	setLoading (v: boolean) {
		this.setState({ isLoading: v });
	};

});

export default MenuSmile;
