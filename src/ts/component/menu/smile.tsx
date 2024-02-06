import * as React from 'react';
import $ from 'jquery';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, Icon, IconEmoji, EmptySearch, Label, Loader } from 'Component';
import { I, C, UtilCommon, UtilSmile, UtilMenu, keyboard, translate, analytics, Preview, Action } from 'Lib';
import { menuStore, commonStore } from 'Store';
import Constant from 'json/constant.json';

enum Tab {
	Gallery	 = 0,
	Upload	 = 1,
};

interface State {
	filter: string;
	page: number;
	tab: Tab;
	isLoading: boolean;
};

const LIMIT_RECENT = 18;
const LIMIT_ROW = 9;
const LIMIT_SEARCH = 12;
const HEIGHT_SECTION = 40;
const HEIGHT_ITEM = 40;

const ID_RECENT = 'recent';
const ID_BLANK = 'blank';

class MenuSmile extends React.Component<I.Menu, State> {

	node: any = null;
	_isMounted = false;
	state = {
		filter: '',
		page: 0,
		isLoading: false,
		tab: Tab.Gallery,
	};

	refFilter: any = null;
	refList: any = null;

	id = '';
	skin = 1;
	timeoutMenu = 0;
	timeoutFilter = 0;
	cache: any = null;
	groupCache: any[] = [];
	row: number = -1;
	coll: number = 0;
	active: any = null;

	constructor (props: I.Menu) {
		super(props);
		
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onRandom = this.onRandom.bind(this);
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
		const { noHead, noGallery, noUpload, noRemove } = data;

		let content = null;

		switch (tab) {
			case Tab.Gallery: {
				if (!this.cache) {
					break;
				};

				const sections = this.getSections();
				const items = this.getItems();
				const groups = this.getGroups();

				const Item = (item: any) => {
					const str = `:${item.itemId}::skin-tone-${item.skin}:`;
					return (
						item.itemId == ID_BLANK ? <div className="item" /> : <div 
							id={'item-' + item.id} 
							className="item" 
							onMouseEnter={e => this.onMouseEnter(e, item)}
							onMouseLeave={() => this.onMouseLeave()} 
							onMouseDown={e => this.onMouseDown(e, item.id, item.itemId, item.skin)}
							onContextMenu={e => this.onSkin(e, item.id, item.itemId)}
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

					return (
						<CellMeasurer
							key={param.key}
							parent={param.parent}
							cache={this.cache}
							columnIndex={0}
							rowIndex={param.index}
						>
							<div style={param.style}>
								{item.isSection ? (
									<div className="section">
										{item.name ? <div className="name">{item.name}</div> : ''}
									</div>
								) : (
									<div className="row">
										{item.children.map((smile: any, i: number) => {
											smile.position = { row: param.index, n: i };
											return <Item key={i} id={smile.id} {...smile} />;
										})}
									</div>
								)}
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
							</div>
						) : ''}
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

		if (isLoading) {
			content = <Loader />;
		};

		let buttons: any[] = [];

		if (!noHead) {
			if (!noGallery) {
				buttons = buttons.concat([
					{ text: translate('menuSmileRandom'), onClick: this.onRandom },
					{ text: translate('menuSmileGallery'), onClick: () => this.onTab(Tab.Gallery), isActive: (tab == Tab.Gallery) },
				]);
			};
			if (!noUpload) {
				buttons.push({ text: translate('menuSmileUpload'), onClick: () => this.onTab(Tab.Upload), isActive: (tab == Tab.Upload) });
			};
			if (!noRemove) {
				buttons.push({ text: translate('commonRemove'), onClick: this.onRemove });
			};
		};

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				{buttons.length ? (
					<div className="head">
						{buttons.map((item, i) => (
							<div 
								key={i} 
								className={[ 'btn', (item.isActive ? 'active' : '') ].join(' ')} 
								onClick={item.onClick}
							>
								{item.text}
							</div>
						))}
					</div>
				) : ''}
				
				<div className={[ 'body', Tab[tab].toLowerCase() ].join(' ')}>
					{content}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		const { storageGet, param } = this.props;
		const { data } = param;
		const { noGallery } = data;
		const items = this.getItems();

		this.rebind();

		this.skin = Number(storageGet().skin) || 1;
		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_SECTION,
			keyMapper: i => (items[i] || {}).id,
		});

		if (noGallery) {
			this.onTab(Tab.Upload);
		} else {
			this.forceUpdate();
		};
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
	
	getSections () {
		const { filter } = this.state;
		const reg = new RegExp(filter, 'gi');

		let sections: any[] = [];

		UtilSmile.getCategories().forEach(it => {
			sections.push({
				...it,
				children: it.emojis.map(id => {
					const item = UtilSmile.data.emojis[id] || {};
					return { id, skin: this.skin, keywords: item.keywords || [] };
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
		let sections = this.getSections();
		let items: any[] = [];

		const ret: any[] = [];
		const length = sections.reduce((res: number, section: any) => { 
			return (section.id == ID_RECENT) ? res : res + section.children.length; 
		}, 0);

		const fillRowWithBlankChildren = row => {
			const len = row.children.length;

			if ((len > 0) && (len < LIMIT_ROW)) {
				row.children.push(...new Array(LIMIT_ROW - len).fill({ itemId: ID_BLANK }));
			};

			return row;
		};

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
			if ((n == LIMIT_ROW) || (next && next.isSection && (row.children.length > 0) && (row.children.length < LIMIT_ROW))) {
				ret.push(fillRowWithBlankChildren(row));
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length < LIMIT_ROW) {
			ret.push(fillRowWithBlankChildren(row));
		};

		return ret;
	};
	
	getRowHeight (item: any) {
		return item.isSection ? HEIGHT_SECTION : HEIGHT_ITEM;
	};

	onKeyUp (e: any, force: boolean) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			this.setState({ page: 0, filter: UtilCommon.regexEscape(this.refFilter.getValue()) });
		}, force ? 0 : 50);
	};

	onKeyDown (e: any) {
		if (menuStore.isOpen('smileSkin')) {
			return;
		};

		const { close } = this.props;
		const checkFilter = () => {
			return this.refFilter && this.refFilter.isFocused;
		};

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

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			if (this.active) {
				this.onSelect(this.active.itemId, this.skin);
				close();
			};
		});

		keyboard.shortcut('tab, space', e, () => {
			if (checkFilter() || !this.active) {
				return;
			};

			e.preventDefault();

			const item = UtilSmile.data.emojis[this.active.itemId];

			if (item.skins && (item.skins.length > 1)) {
				this.onSkin(e, this.active.id, this.active.itemId);
			} else {
				this.onSelect(this.active.itemId, this.skin);
				close();
			};

			Preview.tooltipHide(true);
		});
	};

	setActive (item?: any, row?: number) {
		const node = $(this.node);

		if (row && this.refList) {
			this.refList.scrollToRow(Math.max(0, row));
		};

		Preview.tooltipHide(false);
		node.find('.active').removeClass('active');

		this.active = item;

		if (this.active) {
			const element = node.find(`#item-${$.escapeSelector(this.active.id)}`);

			element.addClass('active');
			Preview.tooltipShow({ text: (UtilSmile.aliases[this.active.itemId] || this.active.itemId), element });
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

		if (!current.children) {
			this.onArrowVertical(dir);
			return;
		};

		const firstBlank = current.children.findIndex(it => it.itemId == ID_BLANK);
		if ((firstBlank >= 0) && (firstBlank <= this.coll)) {
			this.coll = firstBlank - 1;
		};

		this.setActive(current.children[this.coll], this.row);
	};

	onArrowHorizontal (dir: number) {
		if (this.row == -1) {
			return;
		};

		this.coll += dir;

		const rows = this.getItems();
		const current = rows[this.row];

		// Arrow left
		if (this.coll < 0) {
			this.coll = LIMIT_ROW - 1;
			this.onArrowVertical(dir);
			return;
		};

		// Arrow right
		if ((this.coll > current.children.length - 1) || (current.children[this.coll].itemId == ID_BLANK)) {
			this.coll = 0;
			this.onArrowVertical(dir);
			return;
		};

		this.setActive(current.children[this.coll], this.row);
	};

	onRandom () {
		const param = UtilSmile.randomParam();

		this.onSelect(param.id, param.skin);
		this.forceUpdate();
	};

	onUpload () {
		const { param, close } = this.props;
		const { data } = param;
		const { onUpload } = data;

		close();

		Action.openFile(Constant.fileExtension.cover, paths => {
			C.FileUpload(commonStore.space, '', paths[0], I.FileType.Image, {}, (message: any) => {
				if (!message.error.code && onUpload) {
					onUpload(message.objectId);
				};
			});
		});
	};
	
	onSelect (id: string, skin: number) {
		if (id == ID_BLANK) {
			return;
		}
		
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
	
	onMouseDown (e: any, n: string, id: string, skin: number) {
		if (id == ID_BLANK) {
			return;
		}

		const { close } = this.props;
		const win = $(window);
		const item = UtilSmile.data.emojis[id];

		this.id = id;
		window.clearTimeout(this.timeoutMenu);

		if (e.button) {
			return;
		};

		if (item && (item.skins.length > 1)) {
			this.timeoutMenu = window.setTimeout(() => {
				win.off('mouseup.smile');
				this.onSkin(e, n, id);
			}, 200);
		};

		win.off('mouseup.smile').on('mouseup.smile', () => {
			if (menuStore.isOpen('smileSkin')) {
				return;
			};
			if (this.id) {
				this.onSelect(id, skin);
				close();
			};
			window.clearTimeout(this.timeoutMenu);
			win.off('mouseup.smile');
		});
	};

	onSkin (e: any, n: string, id: string) {
		const { getId, close, param } = this.props;
		const item = UtilSmile.data.emojis[id];

		if (item.skins.length <= 1) {
			return;
		};

		menuStore.open('smileSkin', {
			...param,
			type: I.MenuType.Horizontal,
			element: `#${getId()} #item-${$.escapeSelector(n)}`,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Center,
			data: {
				smileId: id,
				onSelect: (skin: number) => {
					this.onSelect(id, skin);
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
		
		ids.unshift({ 
			id: id,
			skin: skin, 
			key: [ id, skin ].join(',') 
		});
		
		ids = UtilCommon.arrayUniqueObjects(ids, 'key');
		ids = ids.slice(0, LIMIT_RECENT);
		ids = ids.map((it: any) => {
			delete(it.key);
			return it;
		});

		storageSet({ recent: ids });
	};
	
	onRemove () {
		this.onSelect('', 1);
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
		for (const item of cache) {
			if ((scrollTop >= item.start) && (scrollTop < item.end)) {
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
		
		const { dataset, param, close } = this.props;
		const { data } = param;
		const { onUpload } = data;
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
				onUpload(message.objectId);
			};
		
			close();
		});
	};

	onTab (tab: Tab) {
		this.setState({ tab });
	};

};

export default MenuSmile;
