import * as React from 'react';
import $ from 'jquery';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, Icon, IconEmoji, EmptySearch } from 'Component';
import { I, C, UtilCommon, UtilSmile, UtilMenu, keyboard, translate, analytics, Preview, Action } from 'Lib';
import { menuStore } from 'Store';
import Constant from 'json/constant.json';
import EmojiData from 'json/emoji.json';

interface State {
	filter: string;
	page: number;
};

const LIMIT_RECENT = 18;
const LIMIT_ROW = 9;
const LIMIT_SEARCH = 12;
const HEIGHT_SECTION = 40;
const HEIGHT_ITEM = 40;
const ID_RECENT = 'recent';

class MenuSmile extends React.Component<I.Menu, State> {

	node: any = null;
	state = {
		filter: '',
		page: 0,
	};

	refFilter: any = null;
	refList: any = null;

	id = '';
	skin = 1;
	timeoutMenu = 0;
	timeoutFilter = 0;
	cache: any = null;
	groupCache: any[] = [];
	aliases = {};
	row: number = -1;
	n: number = 0;
	active: any = null;

	constructor (props: I.Menu) {
		super(props);
		
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onRandom = this.onRandom.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.unbind = this.unbind.bind(this);
		this.rebind = this.rebind.bind(this);
	};
	
	render () {
		const { filter } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { noHead, noUpload, noRemove } = data;
		const sections = this.getSections();
		const items = this.getItems();
		const groups = this.getGroups();

		if (!this.cache) {
			return null;
		};

		const Item = (item: any) => {
			const str = `:${item.itemId}::skin-${item.skin}:`;
			return (
				<div 
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
									return (
										<Item key={i} id={smile.id} {...smile} />
									);
								})}
							</div>
						)}
					</div>
				</CellMeasurer>
			);
		};
		
		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				{!noHead ? (
					<div className="head">
						<div className="btn" onClick={this.onRandom}>{translate('menuSmileRandom')}</div>
						{!noUpload ? <div className="btn" onClick={this.onUpload}>{translate('menuSmileUpload')}</div> : ''}
						{!noRemove ? <div className="btn" onClick={this.onRemove}>{translate('commonRemove')}</div> : ''}
					</div>
				) : ''}
				
				<Filter 
					ref={ref => this.refFilter = ref}
					value={filter}
					className={!noHead ? 'withHead' : ''} 
					onChange={(e: any) => { this.onKeyUp(e, false); }} 
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
			</div>
		);
	};
	
	componentDidMount () {
		const { storageGet } = this.props;

		this.skin = Number(storageGet().skin) || 1;
		this.aliases = {};

		for (let k in EmojiData.aliases) {
			this.aliases[EmojiData.aliases[k]] = k;
		};

		if (!this.cache) {
			const items = this.getItems();
			this.cache = new CellMeasurerCache({
				fixedWidth: true,
				defaultHeight: HEIGHT_SECTION,
				keyMapper: i => (items[i] || {}).id,
			});
			this.forceUpdate();
		};

		window.setTimeout(() => {
			if (this.refFilter) {
				this.refFilter.focus();
			};
		}, 15);

		this.rebind();
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
		const { param } = this.props;
		const { data } = param;
		const { rebind } = data;

		window.clearTimeout(this.timeoutMenu);
		window.clearTimeout(this.timeoutFilter);

		keyboard.setFocus(false);
		menuStore.close('smileSkin');

		this.unbind();

		if (rebind) {
			rebind();
		};
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
		return this.checkRecent(EmojiData.categories.map(it => ({ id: it.id, name: it.name })));
	};
	
	getSections () {
		const { filter } = this.state;
		const reg = new RegExp(filter, 'gi');

		let sections: any[] = [];

		EmojiData.categories.forEach((it: any) => {
			sections.push({
				id: it.id,
				name: it.name,
				children: it.emojis.map(id => {
					const item = EmojiData.emojis[id] || {};
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
					for (let w of c.keywords) {
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
		let ret: any[] = [];
		let length = sections.reduce((res: number, section: any) => { 
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

		for (let section of sections) {
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
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length < LIMIT_ROW) {
			ret.push(row);
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

		e.stopPropagation();
		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			e.preventDefault();

			this.refFilter.blur();
			this.onArrowVertical(pressed.match(/arrowup/) ? -1 : 1);
		});

		keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
			if (this.refFilter.isFocused && this.refFilter.getValue().length) {
				return;
			};

			e.preventDefault();
			this.refFilter.blur();
			this.onArrowHorizontal(pressed.match(/arrowleft/) ? -1 : 1);
		});

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			if (this.active) {
				this.onSelect(this.active.itemId, this.skin);
				close();
			};
		});

		keyboard.shortcut('tab, space', e, () => {
			if (this.refFilter.isFocused || !this.active) {
				return;
			};

			e.preventDefault();

			const item = EmojiData.emojis[this.active.itemId];

			if (!item || !item.skin_variations) {
				this.onSelect(this.active.itemId, this.skin);
				close();
			} else {
				this.onSkin(e, this.active.id, this.active.itemId);
			};

			Preview.tooltipHide(true);
		});
	};

	setActive (item?: any, row?: number) {
		const node = $(this.node);

		if (row) {
			this.refList.scrollToRow(Math.max(0, row));
		};

		Preview.tooltipHide(false);
		node.find('.active').removeClass('active');

		this.active = item;

		if (this.active) {
			const item = node.find(`#item-${$.escapeSelector(this.active.id)}`);

			item.addClass('active');

			Preview.tooltipShow({
				text: this.aliases[this.active.itemId] || this.active.itemId,
				element: item,
			});
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

		if (this.n > current.children.length) {
			this.n = 0;
		};

		this.setActive(current.children[this.n], this.row);
	};

	onArrowHorizontal (dir: number) {
		if (this.row == -1) {
			return;
		};

		this.n += dir;

		const rows = this.getItems();
		const current = rows[this.row];

		// Arrow left
		if (this.n < 0) {
			this.n = LIMIT_ROW - 1;
			this.onArrowVertical(dir);
			return;
		};

		// Arrow right
		if (this.n > current.children.length - 1) {
			this.n = 0;
			this.onArrowVertical(dir);
			return;
		};

		this.setActive(current.children[this.n], this.row);
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

		Action.openFile(Constant.extension.cover, paths => {
			C.FileUpload('', paths[0], I.FileType.Image, (message: any) => {
				if (!message.error.code && onUpload) {
					onUpload(message.hash);
				};
			});
		});
	};
	
	onSelect (id: string, skin: number) {
		const { param, storageSet } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		this.skin = Number(skin) || 1;
		this.setLastIds(id, this.skin);

		storageSet({ skin: this.skin });

		if (onSelect) {
			onSelect(UtilSmile.nativeById(id, this.skin));
		};

		analytics.event(id ? 'SetIcon' : 'RemoveIcon');
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.row = item.position.row;
			this.n = item.position.n;
			this.setActive(item);
		};
	};

	onMouseLeave () {
		if (!keyboard.isMouseDisabled) {
			this.setActive(null);
			this.n = 0;
		};
	};
	
	onMouseDown (e: any, n: string, id: string, skin: number) {
		const { close } = this.props;
		const win = $(window);
		const item = EmojiData.emojis[id];

		this.id = id;
		window.clearTimeout(this.timeoutMenu);

		if (e.button) {
			return;
		};

		if (item && item.skin_variations) {
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
			win.off('mouseup.smile')
		});
	};

	onSkin (e: any, n: string, id: string) {
		const { getId, close } = this.props;
		const item = EmojiData.emojis[id];

		if (!item || !item.skin_variations) {
			return;
		};

		menuStore.open('smileSkin', {
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
		this.n = -1;
	};

	getGroupCache () {
		if (this.groupCache.length) {
			return this.groupCache;
		};

		let items = this.getItems();
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
		for (let item of cache) {
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
	
};

export default MenuSmile;