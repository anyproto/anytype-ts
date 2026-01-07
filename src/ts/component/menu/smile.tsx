import React, { forwardRef, useEffect, useState, useRef } from 'react';
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

const LIMIT_SMILE_ROW = 9;
const LIMIT_LIBRARY_ROW = 4;
const LIMIT_RECENT = 18;
const LIMIT_SEARCH = 12;

const HEIGHT_SECTION = 40;
const HEIGHT_SMILE_ITEM = 40;
const HEIGHT_LIBRARY_ITEM = 96;

const ID_RECENT = 'recent';

const MenuSmile = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const [ filter, setFilter ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const [ tab, setTab ] = useState(Tab.None);
	const [ dummy, setDummy ] = useState(0);
	const { param, close, storageGet, storageSet, getId } = props;
	const { data } = param;
	const { noHead, noRemove, value, onSelect, onIconSelect, onUpload, noGallery, noUpload, withIcons } = data;
	const spaceId = data.spaceId || S.Common.space;
	const nodeRef = useRef(null);
	const filterRef = useRef(null);
	const listRef = useRef(null);
	const dropzoneRef = useRef(null);
	const idRef = useRef('');
	const skinRef = useRef(1);
	const iconColorRef = useRef(1);
	const groupCache = useRef([]);
	const row = useRef(-1);
	const coll = useRef(0);
	const active = useRef(null);
	const itemsRef = useRef([]);
	const timeoutMenu = useRef(0);
	const timeoutFilter = useRef(0);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT_SECTION }));

	useEffect(() => {
		const tabs = getTabs();
		const storage = storageGet();
		const { tab, skin, iconColor } = storage;

		rebind();
		skinRef.current = Number(skin) || 1;
		iconColorRef.current = Number(iconColor) || 1;

		let t = Tab.Smile;
		if (tab && tabs.find(it => it.id == tab)) {
			t = tab;
		} else 
		if (tabs.length) {
			t = tabs[0].id;
		};

		setTab(t);
		analytics.event('ScreenEmoji', { route: data?.route });

		return () => {
			window.clearTimeout(timeoutMenu.current);
			window.clearTimeout(timeoutFilter.current);

			keyboard.setFocus(false);
			S.Menu.close('smileColor');

			unbind();
		};
	}, []);
	
	useEffect(() => {
		const node = $(nodeRef.current);
		
		if (idRef.current) {
			node.find(`#item-${idRef.current}`).addClass('active');
			idRef.current = '';
		};

		groupCache.current = [];
		window.setTimeout(() => filterRef.current?.focus(), 15);
	});
	
	useEffect(() => {
		load();
	}, [ tab, filter ]);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const load = () => {
		itemsRef.current = [];

		switch (tab) {
			case Tab.Library: {
				const filters: I.Filter[] = [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Image },
					//{ relationKey: 'imageKind', condition: I.FilterCondition.Equal, value: I.ImageKind.Icon },
				];
				const sorts = [ 
					{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
					{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
				];

				setIsLoading(true);
				U.Subscription.search({
					filters,
					sorts,
					fullText: filter,
					limit: 1000,
				}, (message: any) => {
					if (!message.error.code) {
						itemsRef.current = message.records || [];
					};

					setIsLoading(false);
				});
				break;
			};
		};
	};

	const checkRecent = (sections: any[]) => {
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

	const getGroups = () => {
		return checkRecent(U.Smile.getCategories().map(it => ({ id: it.id, name: it.name })));
	};
	
	const getSmileSections = () => {
		const reg = new RegExp(U.String.regexEscape(filter), 'gi');

		let sections: any[] = [];

		U.Smile.getCategories().forEach(it => {
			sections.push({
				...it,
				children: it.emojis.map(id => {
					const item = J.Emoji.emojis[id] || {};
					return { 
						id, 
						name: item.name,
						skin: skinRef.current, 
						keywords: item.keywords || [], 
						skins: item.skins || [],
					};
				}),
			});
		});

		if (filter) {
			sections = sections.filter((s: any) => {
				s.children = (s.children || []).filter(c => {
					if (c.id.match(reg) || c.name.match(reg)) {
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

		sections = checkRecent(sections);
		sections = U.Menu.sectionsMap(sections);
		
		return sections;
	};

	const getItems = () => {
		let ret = [];

		switch (tab) {
			case Tab.Icon: {
				ret = getIconItems();
				break;
			};

			case Tab.Smile: {
				ret = getSmileItems();
				break;
			};

			case Tab.Library: {
				ret = getLibraryItems();
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

	const getLibraryItems = () => {
		const ret: any[] = [];

		let n = 0;
		let row = { children: [] };

		for (let i = 0; i < itemsRef.current.length; ++i) {
			const item = itemsRef.current[i];

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

	const getSmileItems = () => {
		let sections = getSmileSections();
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

	const getIconItems = () => {
		const ret: any[] = [];
		const reg = new RegExp(U.String.regexEscape(filter), 'gi');

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
	
	const getRowHeight = (item: any) => {
		if (item.isSection) {
			return HEIGHT_SECTION;
		};

		switch (tab) {
			case Tab.Icon:
			case Tab.Smile: return HEIGHT_SMILE_ITEM;
			case Tab.Library: return HEIGHT_LIBRARY_ITEM;
		};

		return 0;
	};

	const onKeyUp = (e: any, force: boolean) => {
		window.clearTimeout(timeoutFilter.current);
		timeoutFilter.current = window.setTimeout(() => {
			setFilter(U.String.regexEscape(filterRef.current.getValue()));
		}, force ? 0 : 50);
	};

	const onKeyDown = (e: any) => {
		if (S.Menu.isOpen('smileColor')) {
			return;
		};

		const checkFilter = () => filterRef.current && filterRef.current.isFocused();

		e.stopPropagation();
		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			e.preventDefault();

			filterRef.current?.blur();
			onArrowVertical(pressed == 'arrowup' ? -1 : 1);
		});

		keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
			if (checkFilter()) {
				return;
			};

			e.preventDefault();
			filterRef.current?.blur();
			onArrowHorizontal(pressed == 'arrowleft' ? -1 : 1);
		});

		if (!active.current) {
			return;
		};

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			switch (tab) {
				case Tab.Icon: {
					onSmileSelect(active.current.itemId, 1);
					break;
				};

				case Tab.Smile: {
					onSmileSelect(active.current.itemId, skinRef.current);
					break;
				};

				case Tab.Library: {
					onObjectSelect(active.current.id);
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
					onSkin(e, active.current);
					break;
				};

				case Tab.Smile: {
					const item = J.Emoji.emojis[active.current.itemId];
					if (item.skins && (item.skins.length > 1)) {
						onSkin(e, active.current);
					} else {
						onSmileSelect(active.current.itemId, skinRef.current);
						close();
					};
					break;
				};

				case Tab.Library: {
					onObjectSelect(active.current.id);
					close();
					break;
				};
			};

			Preview.tooltipHide(true);
		});
	};

	const setActive = (item?: any, row?: number) => {
		const node = $(nodeRef.current);
		const items = node.find('.items');

		if (row && listRef.current) {
			listRef.current.scrollToRow(Math.max(0, row));
		};

		Preview.tooltipHide(false);
		items.find('.active').removeClass('active');

		active.current = item;

		if (!item) {
			return;
		};

		const element = node.find(`#item-${$.escapeSelector(item.id)}`);
		const tt = getTooltip(item);

		element.addClass('active');
		if (tt) {
			Preview.tooltipShow({ text: tt, element });
		};
	};

	const onArrowVertical = (dir: number) => {
		const rows = getItems();

		row.current += dir;

		// Arrow up
		if (row.current < 0) {
			row.current = rows.length - 1;
		};

		// Arrow down
		if (row.current > rows.length - 1) {
			row.current = 0;
		};

		const current = rows[row.current];
		if (!current) {
			return;
		};

		if (!current.children || !current.children.length) {
			onArrowVertical(dir);
			return;
		};

		setActive(current.children[coll.current], row.current);
	};

	const onArrowHorizontal = (dir: number) => {
		if (row.current == -1) {
			return;
		};

		const rows = getItems();
		const current = rows[row.current];

		if (!current) {
			return;
		};

		coll.current += dir;

		// Arrow left
		if (coll.current < 0) {
			coll.current = LIMIT_SMILE_ROW - 1;
			onArrowVertical(dir);
			return;
		};

		// Arrow right
		if (coll.current > current.children.length - 1) {
			coll.current = 0;
			onArrowVertical(dir);
			return;
		};

		setActive(current.children[coll.current], row.current);
	};

	const onSmileSelect = (id: string, color: number) => {
		color = Number(color) || 1;

		if (tab == Tab.Icon) {
			iconColorRef.current = color;

			storageSet({ iconColor: color });

			if (onIconSelect) {
				onIconSelect(id, color);
			};
		} else {
			const value = id ? U.Smile.nativeById(id, color) : '';

			data.value = value;

			if (value) {
				skinRef.current = color;
				setLastIds(id, color);

				storageSet({ skin: color });
			};

			if (onSelect) {
				onSelect(value);
			};
		};

		analytics.event(id ? 'SetIcon' : 'RemoveIcon');
	};

	const onObjectSelect = (id: string) => {
		data.value = id;
		onUpload?.(id);
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			row.current = item.position.row;
			coll.current = item.position.n;
			setActive(item);
		};
	};

	const onMouseLeave = () => {
		if (!keyboard.isMouseDisabled) {
			setActive(null);
			coll.current = 0;
		};
	};
	
	const onMouseDown = (e: any, item: any) => {
		const win = $(window);
		const timeout = tab == Tab.Icon ? 0 : 200;

		const callBack = (id, color) => {
			idRef.current = id;
			window.clearTimeout(timeoutMenu.current);

			if (e.button) {
				return;
			};

			if (hasSkins(item)) {
				timeoutMenu.current = window.setTimeout(() => {
					win.off('mouseup.smile');
					onSkin(e, item);
				}, timeout);
			};

			win.off('mouseup.smile').on('mouseup.smile', () => {
				if (S.Menu.isOpen('smileColor')) {
					return;
				};

				if (idRef.current) {
					onSmileSelect(id, color);
					close();
				};

				window.clearTimeout(timeoutMenu.current);
				win.off('mouseup.smile');
			});
		};

		switch (tab) {
			case Tab.Icon: {
				callBack(item.itemId, iconColorRef.current);
				break;
			};
			case Tab.Smile: {
				callBack(item.itemId, item.skin);
				break;
			};

			case Tab.Library: {
				onObjectSelect(item.id);
				close();
				break;
			};
		};
	};

	const hasSkins = (item: any) => {
		return (tab == Tab.Icon) || ((tab == Tab.Smile) && (item.skins && item.skins.length > 1));
	};

	const onSkin = (e: any, item: any) => {
		if (!hasSkins(item)) {
			return;
		};

		const element = `#${getId()} #item-${$.escapeSelector(item.id)}`;

		S.Menu.open('smileColor', {
			...param,
			element,
			type: I.MenuType.Horizontal,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Center,
			rebind,
			parentId: props.id,
			data: {
				itemId: item.itemId,
				isEmoji: item.skins,
				onSelect: (skin: number) => {
					onSmileSelect(item.itemId, skin);
					close();
				},
			},
			onClose: () => {
				idRef.current = '';
			}
		});
	};
	
	const setLastIds = (id: string, skin: number) => {
		if (!id) {
			return;
		};

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
	
	const onRemove = () => {
		onSmileSelect('', 1);
		close();
	};

	const onGroup = (id: string) => {
		const items = getItems();
		const idx = items.findIndex(it => it.id == id);

		listRef.current.scrollToRow(Math.max(0, idx));
		row.current = Math.max(0, idx);
		coll.current = 0;
	};

	const getGroupCache = () => {
		if (groupCache.current.length) {
			return groupCache.current;
		};

		const items = getItems();

		let t = 0;
		let last = null;

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			if (item.isSection) {
				last = groupCache.current[groupCache.current.length - 1];
				if (last) {
					last.end = t;
				};

				groupCache.current.push({ id: item.id, start: t, end: 0 });
			};

			t += getRowHeight(item);
		};

		last = groupCache.current[groupCache.current.length - 1];
		if (last) {
			last.end = t;
		};
		return groupCache.current;
	};

	const onScroll = ({ scrollTop }) => {
		const cache = getGroupCache();
		const top = scrollTop + listRef.current?.props.height / 2;

		for (const item of cache) {
			if ((top >= item.start) && (top < item.end)) {
				setActiveGroup(item.id);
				break;
			};
		};
	};

	const setActiveGroup = (id: string) => {
		const node = $(nodeRef.current);
		const foot = node.find('#foot');

		foot.find('.active').removeClass('active');
		foot.find(`#item-${id}`).addClass('active');
	};

	const onDragOver = (e: any) => {
		if (!U.File.checkDropFiles(e)) {
			return;
		};
		
		$(dropzoneRef.current).addClass('isDraggingOver');
	};
	
	const onDragLeave = (e: any) => {
		if (!U.File.checkDropFiles(e)) {
			return;
		};
		
		$(dropzoneRef.current).removeClass('isDraggingOver');
	};
	
	const onDrop = (e: any) => {
		if (!U.File.checkDropFiles(e)) {
			return;
		};
		
		const electron = U.Common.getElectron();
		const file = electron.webFilePath(e.dataTransfer.files[0]);
		
		$(dropzoneRef.current).removeClass('isDraggingOver');
		setIsLoading(true);
		keyboard.disableCommonDrop(true);
		
		C.FileUpload(spaceId, '', file, I.FileType.Image, {}, false, '', I.ImageKind.Icon, (message: any) => {
			setIsLoading(false);
			keyboard.disableCommonDrop(false);
			
			if (!message.error.code) {
				onObjectSelect(message.objectId);
			};
		
			close();
		});
	};

	const onUploadHandler = () => {
		Action.openFileDialog({ extensions: J.Constant.fileExtension.cover }, paths => {
			if (!paths.length) {
				return;
			};

			setIsLoading(true);

			C.FileUpload(spaceId, '', paths[0], I.FileType.Image, {}, false, '', I.ImageKind.Icon, (message: any) => {
				setIsLoading(false);

				if (!message.error.code) {
					onObjectSelect(message.objectId);
				};

				close();
			});
		});
	};

	const getTabs = () => {
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

	const onTab = (tab: Tab) => {
		setTab(tab);
		storageSet({ tab });
	};

	const onRandom = () => {
		const param = U.Smile.randomParam();

		onSmileSelect(param.id, param.skin);
		setDummy(dummy + 1);
	};

	const getTooltip = (item) => {
		switch (tab) {
			case Tab.Smile: {
				return U.Smile.aliases[item.itemId] || item.itemId;
			};
		};
	};

	const tabs = getTabs();
	const items = getItems();
	const cnb = [ 'body', `tab${Tab[tab]}` ];
	
	const filterElement = (
		<Filter 
			ref={filterRef}
			value={filter}
			className={[ 'outlined', (!noHead ? 'withHead' : '') ].join(' ')}
			onChange={e => onKeyUp(e, false)} 
			focusOnMount={true}
		/>
	);

	let content = null;

	switch (tab) {
		case Tab.Icon: {
			const Item = (item: any) => (
				<div
					id={`item-${item.id}`}
					className="item"
					onMouseEnter={e => onMouseEnter(e, item)}
					onMouseLeave={() => onMouseLeave()}
					onMouseDown={e => onMouseDown(e, item)}
					onContextMenu={e => onSkin(e, item)}
				>
					<IconObject object={item} size={30} iconSize={30} tooltipParam={{ text: item.id }} />
				</div>
			);

			const rowRenderer = (param: any) => (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={cache.current}
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
					{filterElement}

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
											ref={listRef}
											width={width}
											height={height}
											deferredMeasurmentCache={cache.current}
											rowCount={items.length}
											rowHeight={HEIGHT_SMILE_ITEM}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={10}
											onScroll={onScroll}
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
			const sections = getSmileSections();
			const groups = getGroups();

			const Item = (item: any) => {
				const str = `:${item.itemId}::skin-tone-${item.skin}:`;
				return (
					<div 
						id={`item-${item.id}`} 
						className="item" 
						onMouseEnter={e => onMouseEnter(e, item)}
						onMouseLeave={() => onMouseLeave()} 
						onMouseDown={e => onMouseDown(e, item)}
						onContextMenu={e => onSkin(e, item)}
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
						cache={cache.current}
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
					{filterElement}
					
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
											ref={listRef}
											width={width}
											height={height}
											deferredMeasurmentCache={cache.current}
											rowCount={items.length}
											rowHeight={({ index }) => getRowHeight(items[index])}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={10}
											onScroll={onScroll}
											scrollToAlignment="center"
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>

						{!sections.length ? (
							<EmptySearch text={filter ? U.String.sprintf(translate('menuSmileEmptyFilter'), filter) : translate('menuSmileEmpty')} />
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
									onClick={() => onGroup(group.id)} 
								/>
							))}
							<Icon 
								className="random" 
								tooltipParam={{ text: translate('menuSmileRandom') }} 
								onClick={() => onRandom()}
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
					onMouseEnter={e => onMouseEnter(e, item)}
					onMouseLeave={() => onMouseLeave()} 
					onMouseDown={e => onMouseDown(e, item)}
				>
					<div className="img" style={{ backgroundImage: `url("${S.Common.imageUrl(item.id, I.ImageSize.Small)}")` }} />
					<div className="name">{item.name}</div>
				</div>
			);
			
			const rowRenderer = (param: any) => {
				const item = items[param.index];

				return (
					<CellMeasurer
						key={param.key}
						parent={param.parent}
						cache={cache.current}
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
					{filterElement}

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
											ref={listRef}
											width={width}
											height={height}
											deferredMeasurmentCache={cache.current}
											rowCount={items.length}
											rowHeight={({ index }) => getRowHeight(items[index])}
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
							<EmptySearch text={filter ? U.String.sprintf(translate('menuSmileEmptyFilter'), filter) : translate('menuSmileEmpty')} />
						): ''}
					</div>

				</>
			);
			break;
		};

		case Tab.Upload: {
			content = (
				<div 
					ref={dropzoneRef}
					className="dropzone" 
					onDragOver={onDragOver} 
					onDragLeave={onDragLeave} 
					onDrop={onDrop}
					onClick={onUploadHandler}
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
			ref={nodeRef}
			className="wrap"
		>
			{!noHead ? (
				<div className="head">
					<div className="side left">
						{tabs.map((item, i) => (
							<div 
								key={i} 
								className={[ 'tab', (tab == item.id ? 'active' : '') ].join(' ')} 
								onClick={item.onClick || (() => onTab(item.id))}
							>
								{item.text}
							</div>
						))}
					</div>
					<div className="side right">
						{!noRemove && value ? (
							<div className="tab" onClick={onRemove}>
								{translate('commonRemove')}
							</div>
						) : ''}
					</div>
				</div>
			) : ''}
			
			<div className={cnb.join(' ')}>
				{isLoading ? <Loader /> : ''}
				{content}
			</div>
		</div>
	);
	
}));

export default MenuSmile;