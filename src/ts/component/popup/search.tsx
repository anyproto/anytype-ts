import React, { forwardRef, useEffect, useRef, useState, MouseEvent } from 'react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Icon, Loader, IconObject, EmptySearch, Label, Filter, ObjectType, ObjectName } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const HEIGHT_SECTION = 28;
const HEIGHT_SMALL = 38;
const HEIGHT_ITEM = 60;
const HEIGHT_MESSAGE = 76;
const LIMIT_HEIGHT = 15;

const SEARCH_TYPE_ALL = 'all';
const SEARCH_TYPE_MESSAGE = 'message';
const SEARCH_TYPE_MEDIA = 'media';

const isMac = U.Common.isPlatformMac();

// Module-level so its identity is stable across renders - a component re-created inside the
// render body reads as a new type to React and remounts its DOM every render (visible blink)
const Shortcut = (props: { keys: string[]; label: string }) => {
	const symbols = keyboard.getSymbolsFromKeys(props.keys);
	return (
		<div className="item">
			<div className="keys">
				{symbols.map((s, i) => (
					<Label key={i} text={s} />
				))}
			</div>
			<div className="label">{props.label}</div>
		</div>
	);
};

const PopupSearch = forwardRef<{}, I.Popup>((props, ref) => {

	const { param, storageGet, storageSet, getId, close } = props;
	const { data } = param;
	const { route, onObjectSelect, skipIds } = data;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const backlinkRef = useRef(null);
	const nodeRef = useRef(null);
	const filterInputRef = useRef(null);
	const listRef = useRef(null);
	const rowsRef = useRef([]);
	const timeoutRef = useRef(0);
	const rebindTimeoutRef = useRef(0);
	const delayRef = useRef(0);
	const cacheRef = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT_SECTION }));
	const itemsRef = useRef([]);
	const nRef = useRef(0);
	const topRef = useRef(0);
	const offsetRef = useRef(0);
	const rangeRef = useRef<I.TextRange>({ from: 0, to: 0 });
	const storage = storageGet();
	const filter = String(storage.filter || '');
	const filterValueRef = useRef(filter);
	const searchTypeRef = useRef(String(storage.searchType || SEARCH_TYPE_ALL));
	// The mode the currently held items were loaded for. During a quiet reload the previous
	// list stays on screen - render it by its own mode, not by the freshly selected chip
	const itemsModeRef = useRef('');
	const typeSelectRef = useRef(null);
	const chatIdsRef = useRef<string[]>([]);
	const chatsSubId = [ getId(), 'chats' ].join('-');

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			topRef.current = scrollTop;
		};
	};

	const keydownHandler = useRef<(e: any) => void>(null);
	const archiveHandler = useRef<(e: any) => void>(null);

	const rebind = () => {
		unbind();

		keydownHandler.current = (e: any) => onKeyDown(e);
		archiveHandler.current = (e: any) => {
			const d = e.detail;
			const ids = U.Common.objectCopy(d?.ids);
			itemsRef.current = itemsRef.current.filter(it => !ids.includes(it.id));

			setDummy(dummy + 1);
		};

		U.Dom.addEvents(window, [
			['keydown', keydownHandler.current],
			['archiveObject', archiveHandler.current],
		]);
	};

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
		if (archiveHandler.current) {
			U.Dom.removeEvent(window, 'archiveObject', archiveHandler.current);
			archiveHandler.current = null;
		};
	};

	const onKeyDown = (e: any) => {
		e.stopPropagation();

		if (keyboard.isComposition) {
			return;
		};

		const items = getItems();
		const cmd = keyboard.cmdKey();
		const filter = getFilter();
		const item = items[nRef.current];
		const shortcutPrev = isMac ? 'arrowup, ctrl+p' : 'arrowup';
		const shortcutNext = isMac ? 'arrowdown, ctrl+n' : 'arrowdown';

		keyboard.disableMouse(true);
		keyboard.shortcut('escape', e, () => {
			if (backlinkRef.current) {
				onClearSearch();
			} else {
				close();
			};
		});

		keyboard.shortcut('shift+enter', e, () => {
			if (!item) {
				return;
			};

			const links = Relation.getArrayValue(item.links);
			const backlinks = Relation.getArrayValue(item.backlinks);

			if (links.length || backlinks.length) {
				onBacklink(e, item);
			};
		});

		keyboard.shortcut(`${shortcutPrev}, ${shortcutNext}` , e, (pressed: string) => {
			const dir = [ 'arrowup', 'ctrl+p' ].includes(pressed) ? -1 : 1;
			onArrow(dir);
		});

		// Focus stays in the input (command palette convention) - Tab cycles the search type
		// chips instead of moving focus, matching Linear/GitHub-style palettes
		keyboard.shortcut('tab, shift+tab', e, (pressed: string) => {
			if (onObjectSelect) {
				return;
			};

			e.preventDefault();
			onSearchTypeCycle(pressed == 'tab' ? 1 : -1);
		});

		keyboard.shortcut(`${cmd}+shift+enter`, e, () => {
			const item = items[nRef.current];
			if (item) {
				onClick(e, item);
			};
		});

		keyboard.shortcut(`enter, ${cmd}+enter`, e, () => {
			// Only try to parse the filter as a URL when it actually looks like one -
			// getRouteFromUrl logs a warning on arbitrary text otherwise
			const isUrl = U.String.matchUrl(filter) || filter.startsWith(`${J.Constant.protocol}://`);
			const route = isUrl ? U.Common.getRouteFromUrl(filter) : '';

			if (route) {
				U.Router.go(route, {});
				return;
			};

			const item = items[nRef.current];
			if (item) {
				onClick(e, item);
			};
		});

		keyboard.shortcut(`${cmd}+l`, e, () => {
			e.preventDefault();

			const item = items[nRef.current];
			if (item && item.isObject) {
				U.Object.copyLink(item, S.Common.space, 'web', route);
			};
		});

		// The create shortcut triggers the active tab's create action, same as its Actions row
		keyboard.shortcut('createObject', e, () => {
			e.preventDefault();
			e.stopPropagation();

			const searchType = getSearchType();

			if (searchType == SEARCH_TYPE_MEDIA) {
				close();
				window.setTimeout(() => {
					U.Menu.onFileUploadPopup(I.ObjectLayout.File, '', {}, undefined, analytics.route.uploadGlobalMenu);
				}, S.Popup.getTimeout());
			} else
			if (![ SEARCH_TYPE_ALL, SEARCH_TYPE_MESSAGE ].includes(searchType)) {
				close(() => createTypedObject(searchType, filter));
			} else {
				close(() => pageCreate(filter));
			};
		});

		keyboard.shortcut('search', e, () => close());
	};

	const onArrow = (dir: number) => {
		if (!listRef.current) {
			return;
		};

		const items = getItems();
		const l = items.length;

		nRef.current += dir;

		if ((dir > 0) && (nRef.current > l - 1)) {
			nRef.current = 0;
		};

		if ((dir < 0) && (nRef.current < 0)) {
			nRef.current = l - 1;
		};

		const item = items[nRef.current];
		if (item && item.isSection) {
			onArrow(dir);
			return;
		};

		scrollToRow(items, nRef.current);
		setActive(item);
	};

	const scrollToRow = (items: any[], index: number) => {
		if (!listRef.current || !items.length) {
			return;
		};

		const listHeight = listRef.current.props.height;
		const rowH = getRowHeight(items[index], index);

		let offset = 0;
		let total = 0;

		for (let i = 0; i < items.length; ++i) {
			const h = getRowHeight(items[i], i);

			if (i < index) {
				offset += h;
			};
			total += h;
		};

		if (offset + rowH < listHeight) {
			offset = 0;
		} else {
			offset -= listHeight / 2 - rowH / 2;
		};

		offset = Math.min(offset, total - listHeight + 16);
		listRef.current.scrollToPosition(offset);
	};

	const setActive = (item: any) => {
		if (!item) {
			return;
		};

		nRef.current = getItems().findIndex(it => it.id == item.id);
		unsetActive();

		U.Dom.addClass(U.Dom.select(`#item-${U.Common.esc(item.id)}`, nodeRef.current), 'active');
	};

	const unsetActive = () => {
		U.Dom.selectAll('.item.active', nodeRef.current).forEach(el => U.Dom.removeClass(el, 'active'));
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(timeoutRef.current);

		if (filterValueRef.current == v) {
			return;
		};

		timeoutRef.current = window.setTimeout(() => {
			storageSet({ filter: v });

			if (filterValueRef.current != v) {
				analytics.event('SearchInput', { route });
			};

			filterValueRef.current = v;
			rangeRef.current = filterInputRef.current?.getRange();
			reload();

			if (!delayRef.current) {
				delayRef.current = J.Constant.delay.keyboard;
			};
		}, delayRef.current);
	};

	const onFilterSelect = (e: any) => {
		rangeRef.current = filterInputRef.current.getRange();
	};

	const onFilterClear = () => {
		storageSet({ filter: '' });
		analytics.event('SearchInput', { route });
	};

	const onBacklink = (e: MouseEvent, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		storageSet({ backlink: item.id });
		filterInputRef.current?.setValue('');
		setBacklinkState(item, 'Empty', () => reload());
	};

	const setBacklinkState = (item: any, type: string, callBack?: () => void) => {
		filterInputRef.current?.setValue('');
		backlinkRef.current = item;

		analytics.event('SearchBacklink', { route, type });
		callBack?.();
	};

	const onClearSearch = () => {
		offsetRef.current = 0;
		filterInputRef.current?.setValue('');
		backlinkRef.current = null;

		storageSet({ backlink: '' });
		reload();
	};

	// The Messages scope searches chats and discussions - offer it only when the space has at
	// least one of either (both space subscriptions are always on)
	const hasMessageContainers = (): boolean => {
		return [ J.Constant.subId.chat, J.Constant.subId.discussion ].some(it => {
			return S.Record.getRecordIds(U.Subscription.spaceSubId(it), '').length > 0;
		});
	};

	const getSearchType = (): string => {
		const type = searchTypeRef.current;

		// Object select mode is a plain object picker - no type selector
		if (onObjectSelect) {
			return SEARCH_TYPE_ALL;
		};

		if (type == SEARCH_TYPE_MESSAGE) {
			return hasMessageContainers() ? type : SEARCH_TYPE_ALL;
		};

		if ([ SEARCH_TYPE_ALL, SEARCH_TYPE_MEDIA ].includes(type)) {
			return type;
		};

		return S.Record.getTypeById(type) ? type : SEARCH_TYPE_ALL;
	};

	const getTypeItems = () => {
		const skip = U.Object.getFileLayouts().concat([ I.ObjectLayout.Chat, I.ObjectLayout.ChatOld, I.ObjectLayout.Discussion ]);
		const types = U.Data.getWidgetTypes().
			filter(it => !skip.includes(it.recommendedLayout)).
			map(it => ({ id: it.id, name: U.Object.name(it, true) }));

		const ret: any[] = [
			{ id: SEARCH_TYPE_ALL, name: translate('popupSearchTypeAll') },
		];

		if (hasMessageContainers()) {
			ret.push({ id: SEARCH_TYPE_MESSAGE, name: translate('popupSearchTypeMessages') });
		};

		ret.push({ id: SEARCH_TYPE_MEDIA, name: translate('commonMedia') });

		return ret.concat(types);
	};

	const onSearchTypeSwitch = (id: string) => {
		if (searchTypeRef.current == id) {
			return;
		};

		searchTypeRef.current = id;
		storageSet({ searchType: id });

		if (backlinkRef.current) {
			backlinkRef.current = null;
			storageSet({ backlink: '' });
		};

		setDummy(prev => prev + 1);
		filterInputRef.current?.focus();
		reload(true);

		// Keep the newly active chip visible when the row overflows
		window.setTimeout(() => {
			const active = U.Dom.select('.typeItem.active', typeSelectRef.current) as HTMLElement;
			active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		});

		let type = 'Type';
		if ([ SEARCH_TYPE_ALL, SEARCH_TYPE_MESSAGE, SEARCH_TYPE_MEDIA ].includes(id)) {
			type = U.String.ucFirst(id);
		};

		analytics.event('SwitchSearchType', { route, type });
	};

	const onSearchTypeCycle = (dir: number) => {
		const items = getTypeItems();
		const idx = items.findIndex(it => it.id == getSearchType());
		const next = items[(idx + dir + items.length) % items.length];

		if (next) {
			onSearchTypeSwitch(next.id);
		};
	};

	const onTypeWheel = (e: any) => {
		const node = typeSelectRef.current;

		if (node && !e.deltaX) {
			node.scrollLeft += e.deltaY;
		};
	};

	// Fade on the right edge only while there is actually content scrolled out of view
	const checkTypeSelectFade = () => {
		const node = typeSelectRef.current;
		const wrap = node?.parentElement;

		if (!node || !wrap) {
			return;
		};

		if (node.scrollLeft + node.clientWidth < node.scrollWidth - 1) {
			U.Dom.addClass(wrap, 'withFade');
		} else {
			U.Dom.removeClass(wrap, 'withFade');
		};
	};

	const getMessageChat = (chatId: string): any => {
		const { space } = S.Common;

		let object = S.Detail.get(U.Subscription.spaceSubId(J.Constant.subId.chat), chatId, []);

		if (object._empty_) {
			const parentId = S.Chat.discussionParentMap.get(space)?.get(chatId);

			if (parentId) {
				object = S.Chat.getDiscussionParentDetail(space, parentId, []);

				if (object._empty_) {
					object = S.Detail.get(U.Subscription.spaceSubId(J.Constant.subId.discussion), parentId, []);
				};
			};
		};

		if (object._empty_) {
			object = S.Detail.get(chatsSubId, chatId, []);

			// A discussion object itself is not openable and carries no display name - without
			// a resolved parent object the row renders without chat attribution
			if (!object._empty_ && (object.layout == I.ObjectLayout.Discussion)) {
				return null;
			};
		};

		return object._empty_ ? null : object;
	};

	const resolveMessageChats = (records: any[]) => {
		const ids = U.Common.arrayUnique(records.map(it => it.chatId)).filter(id => id && !getMessageChat(id));

		if (!ids.length) {
			return;
		};

		chatIdsRef.current = U.Common.arrayUnique(chatIdsRef.current.concat(ids));

		U.Subscription.subscribeIds({ subId: chatsSubId, ids: chatIdsRef.current, noDeps: true }, () => {
			setDummy(prev => prev + 1);
		});
	};

	const loadMessages = (clear: boolean, callBack?: () => void, quiet?: boolean) => {
		const { space } = S.Common;
		const text = filterValueRef.current;
		// Date desc for text searches too: the backend's score sort groups equal-score hits
		// per chat, which reads as random grouping; recency is consistent with the empty-query
		// browse and with the single-chat search menu
		const sorts = [ { key: I.SearchSortKey.CreatedAt, type: I.SortType.Desc } ];

		// Quiet mode (chip switch): keep the previous list on screen instead of flashing the
		// loader overlay, re-render once when the new results arrive
		const done = () => {
			if (!clear) {
				return;
			};

			if (quiet) {
				setDummy(prev => prev + 1);
			} else {
				setIsLoading(false);
			};
		};

		if (clear) {
			chatIdsRef.current = [];

			if (!quiet) {
				setIsLoading(true);
			};
		};

		C.ChatSearch(space, '', text, offsetRef.current, J.Constant.limit.menuRecords, sorts, (message: any) => {
			if (message.error.code) {
				if (clear) {
					itemsRef.current = [];
					itemsModeRef.current = SEARCH_TYPE_MESSAGE;
				};

				done();
				callBack?.();
				return;
			};

			if (clear) {
				itemsRef.current = [];
			};

			const records = (message.list || []).map(it => ({ ...it, id: it.messageId, isMessage: true }));

			itemsRef.current = itemsRef.current.concat(records);
			itemsModeRef.current = SEARCH_TYPE_MESSAGE;
			resolveMessageChats(records);

			done();
			callBack?.();
		});
	};

	const loadMoreRows = ({ startIndex, stopIndex }) => {
		return new Promise((resolve, reject) => {
			offsetRef.current += J.Constant.limit.menuRecords;
			load(false, () => resolve(null));
		});
	};

	const reload = (quiet?: boolean) => {
		nRef.current = 0;
		offsetRef.current = 0;
		topRef.current = 0;
		load(true, () => {
			const items = getItems().filter(it => !it.isSection);

			if (items.length) {
				window.setTimeout(() => setActive(items[0]));
			};
		}, quiet);
	};

	const load = (clear: boolean, callBack?: () => void, quiet?: boolean) => {
		const searchType = getSearchType();

		if (searchType == SEARCH_TYPE_MESSAGE) {
			loadMessages(clear, callBack, quiet);
			return;
		};

		const { space } = S.Common;
		const layouts = U.Object.getSystemLayouts().filter(it => !U.Object.isTypeLayout(it));
		const filters: any[] = U.Subscription.getBaseFilters().concat([
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: layouts },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
		]);

		if (searchType == SEARCH_TYPE_MEDIA) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() });
		} else
		if (searchType != SEARCH_TYPE_ALL) {
			const type = S.Record.getTypeById(searchType);

			if (type) {
				filters.push({ relationKey: 'type.uniqueKey', condition: I.FilterCondition.Equal, value: type.uniqueKey });
			};
		};
		const sorts = [
			{ relationKey: '_final_score', type: I.SortType.Desc },
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			{ relationKey: 'type', type: I.SortType.Asc },
		].map(U.Subscription.sortMapper);

		let limit = J.Constant.limit.menuRecords;

		if (!filterValueRef.current && clear && !backlinkRef.current) {
			limit = 9;
		};

		if (backlinkRef.current) {
			const links = Relation.getArrayValue(backlinkRef.current.links);
			const backlinks = Relation.getArrayValue(backlinkRef.current.backlinks);

			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: [].concat(links, backlinks) });
		};

		if (skipIds && skipIds.length) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (clear && !quiet) {
			setIsLoading(true);
		};

		// Quiet mode (chip switch): keep the previous list on screen instead of flashing the
		// loader overlay, re-render once when the new results arrive
		const done = () => {
			if (!clear) {
				return;
			};

			if (quiet) {
				setDummy(prev => prev + 1);
			} else {
				setIsLoading(false);
			};
		};

		C.ObjectSearchWithMeta(space, filters, sorts, J.Relation.default.concat([ 'pluralName', 'links', 'backlinks', 'creator', '_final_score' ]), filterValueRef.current, offsetRef.current, limit, (message) => {
			if (message.error.code) {
				if (clear) {
					itemsRef.current = [];
					itemsModeRef.current = searchType;
				};

				done();
				return;
			};

			if (clear) {
				itemsRef.current = [];
			};

			const records = (message.records || []).map(it => {
				it = S.Detail.mapper(it);
				it.links = Relation.getArrayValue(it.links);
				it.backlinks = Relation.getArrayValue(it.backlinks);
				return it;
			});

			itemsRef.current = itemsRef.current.concat(records);
			itemsModeRef.current = searchType;

			done();
			callBack?.();
		});
	};

	const getItems = () => {
		const filter = getFilter();
		const lang = J.Constant.default.interfaceLang;
		const canWrite = U.Space.canMyParticipantWrite();
		// Present the items by the mode they were loaded for - during a quiet reload the
		// previous list stays on screen while the selected chip already changed
		const searchType = itemsModeRef.current || getSearchType();
		const isAll = searchType == SEARCH_TYPE_ALL;

		if (searchType == SEARCH_TYPE_MESSAGE) {
			const items: any[] = [].concat(itemsRef.current).map(it => ({ ...it, isMessage: true, shortcut: [] }));

			if (!filter && items.length) {
				items.unshift({ name: translate('popupSearchRecentMessages'), isSection: true, shortcut: [] });
			};

			return items;
		};

		let name = '';
		if (filter) {
			name = U.String.sprintf(translate('commonCreateObjectWithName'), filter);
		} else {
			name = translate('commonCreateObject');
		};

		let items = S.Record.checkHiddenObjects(itemsRef.current);

		if (backlinkRef.current) {
			items.unshift({ name: U.String.sprintf(translate('popupSearchBacklinksFrom'), backlinkRef.current.name), isSection: true, withClear: true });
		} else
		if (!filter && items.length) {
			items.unshift({ name: translate('popupSearchRecentObjects'), isSection: true });
		};

		items = items.map(it => {
			it.isObject = true;
			return it;
		});

		if (onObjectSelect) {
			return items;
		};

		/* Settings and pages */

		if (filter && isAll) {
			const reg = new RegExp(U.String.regexEscape(filter), 'gi');

			let itemsImport: any[] = [];
			if (canWrite) {
				itemsImport = ([
					{ id: 'importHtml', iconParam: { name: 'import/html' }, name: translate('popupSettingsImportHtmlTitle'), format: I.ImportType.Html },
					{ id: 'importText', iconParam: { name: 'import/text' }, name: translate('popupSettingsImportTextTitle'), format: I.ImportType.Text },
					{ id: 'importProtobuf', iconParam: { name: 'import/protobuf' }, name: translate('popupSettingsImportProtobufTitle'), format: I.ImportType.Protobuf },
					{ id: 'importMarkdown', iconParam: { name: 'import/markdown' }, name: translate('popupSettingsImportMarkdownTitle'), format: I.ImportType.Markdown },
				] as any[]).map(it => ({ ...it, isImport: true, isSmall: true }));
			};

			let settingsSpace: any[] = [
				{ id: 'spaceIndex', name: translate('popupSettingsSpaceTitle') },

				{ id: 'exportIndex', iconParam: { name: 'menu/action/export' }, icon: 'settings-export', name: translate('popupSettingsExportTitle') },
				{ id: 'exportProtobuf', iconParam: { name: 'import/protobuf' }, name: translate('popupSettingsExportProtobufTitle') },
				{ id: 'exportMarkdown', iconParam: { name: 'import/markdown' }, name: translate('popupSettingsExportMarkdownTitle') },
			];

			if (canWrite) {
				settingsSpace = settingsSpace.concat([
					{ id: 'importIndex', iconParam: { name: 'menu/action/import' }, icon: 'settings-import', name: translate('popupSettingsImportTitle') },
					{ id: 'importNotion', iconParam: { name: 'import/notion' }, name: translate('popupSettingsImportNotionTitle') },
					{ id: 'importCsv', iconParam: { name: 'import/csv' }, name: translate('popupSettingsImportCsvTitle') },
				]);
			};

			settingsSpace = settingsSpace.map(it => ({ ...it, isSpace: true, className: 'isSpace' }));

			const settingsAccount: any[] = [
				{ id: 'account', name: translate('popupSettingsProfileTitle') },
				{
					id: 'personal', iconParam: { name: 'settings/personal' }, icon: 'settings-personal', name: translate('popupSettingsPersonalTitle'),
					aliases: [
						translate('commonLanguage', lang), translate('commonLanguage'),
						translate('commonSpelling', lang), translate('commonSpelling'),
					]
				},
				{
					id: 'personal', iconParam: { name: 'settings/personal' }, icon: 'settings-personal', name: translate('pageSettingsColorMode'),
					aliases: [ translate('commonSidebar', lang), translate('commonSidebar') ]
				},
				{ id: 'pinIndex', iconParam: { name: 'settings/pin' }, icon: 'settings-pin', name: translate('popupSettingsPinTitle') },
				{ id: 'dataIndex', iconParam: { name: 'settings/storage' }, icon: 'settings-storage', name: translate('popupSettingsLocalStorageTitle') },
				{ id: 'phrase', iconParam: { name: 'settings/phrase' }, icon: 'settings-phrase', name: translate('popupSettingsPhraseTitle') },
				{ id: 'spaceList', iconParam: { name: 'settings/spaces' }, icon: 'settings-spaces', name: translate('popupSettingsSpacesListTitle') },
				{ id: 'dataPublish', iconParam: { name: 'settings/sites' }, icon: 'settings-sites', name: translate('popupSettingsDataManagementDataPublishTitle') },
				{ id: 'api', iconParam: { name: 'settings/api' }, icon: 'settings-api', name: translate('popupSettingsApiTitle') },
			];

			const pageItems: any[] = [
				{ id: 'graph', iconParam: { name: 'header/graph' }, name: translate('commonGraph'), shortcut: keyboard.getSymbolsFromKeys(keyboard.getKeys('graph')), layout: I.ObjectLayout.Graph },
				{ id: 'navigation', iconParam: { name: 'menu/action/navigation' }, name: translate('commonFlow'), shortcut: keyboard.getSymbolsFromKeys(keyboard.getKeys('navigation')), layout: I.ObjectLayout.Navigation },
			].map(it => ({ ...it, isSmall: true }));

			const settingsItems = settingsAccount.concat(settingsSpace).map(it => ({ ...it, isSettings: true, isSmall: true }));
			const filtered = itemsImport.concat(settingsItems).concat(pageItems).filter(it => {
				if (it.name.match(reg)) {
					return true;
				};

				if (it.aliases && it.aliases.length) {
					for (const alias of it.aliases) {
						if (alias.match(reg)) {
							return true;
						};
					};
				};

				return false;
			});

			if (filtered.length) {
				filtered.sort(U.Data.sortByName);
				filtered.unshift({ name: translate('commonSettings'), isSection: true });

				items = filtered.concat(items);
			};
		};

		if (canWrite) {
			const actions: any[] = [];

			if (isAll) {
				actions.push({ id: 'add', name, iconParam: { name: 'plus/menu' }, shortcut: keyboard.getSymbolsFromKeys(keyboard.getKeys('createObject')) });
				actions.push({ id: 'upload', name: translate('popupSearchUploadFile'), iconParam: { name: 'plus/menu' } });
			} else
			if (searchType == SEARCH_TYPE_MEDIA) {
				actions.push({ id: 'upload', name: translate('popupSearchUploadFile'), iconParam: { name: 'plus/menu' }, shortcut: keyboard.getSymbolsFromKeys(keyboard.getKeys('createObject')) });
			} else {
				const type = S.Record.getTypeById(searchType);

				if (type) {
					const typeName = U.Object.name(type);
					const label = filter ?
						U.String.sprintf(translate('popupSearchCreateTypeWithName'), typeName, filter) :
						U.String.sprintf(translate('popupSearchCreateType'), typeName);

					actions.push({ id: 'addType', typeId: type.id, name: label, iconParam: { name: 'plus/menu' }, shortcut: keyboard.getSymbolsFromKeys(keyboard.getKeys('createObject')) });
				};
			};

			if (actions.length) {
				items.push({ name: translate('commonActions'), isSection: true });
				actions.forEach(it => items.push({ ...it, isSmall: true }));
			};
		};

		return items.map(it => {
			it.shortcut = it.shortcut || [];
			return it;
		});
	};

	const pageCreate = (name: string) => {
		keyboard.pageCreate({ name }, analytics.route.search, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
	};

	// Create an object of the given type. Mirrors the U.Menu.typeSuggest dispatch; file and
	// chat layouts never appear as chips (covered by the Media and Messages chips).
	// The filter is passed in explicitly - it is captured before the popup closes
	const createTypedObject = (typeId: string, filter: string) => {
		const type = S.Record.getTypeById(typeId);

		if (!type) {
			return;
		};

		const cb = (object: any) => {
			if (object) {
				U.Object.openAuto(object);
				analytics.createObject(object.type, object.layout, analytics.route.search, 0);
			};
		};

		if (U.Object.isBookmarkLayout(type.recommendedLayout)) {
			window.setTimeout(() => {
				U.Menu.onBookmarkMenu({
					recalcRect: () => {
						const { ww, wh } = U.Dom.getWindowDimensions();
						return { width: 0, height: 0, x: ww / 2, y: wh / 2 };
					},
					vertical: I.MenuDirection.Center,
					horizontal: I.MenuDirection.Center,
					data: { details: {} },
				}, cb);
			}, S.Popup.getTimeout());
		} else {
			const details: any = {};

			if (filter) {
				details.name = filter;
			};

			C.ObjectCreate(details, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ], type.defaultTemplateId, type.uniqueKey, S.Common.space, (message: any) => {
				if (!message.error.code) {
					cb(message.details);
				};
			});
		};
	};

	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			nRef.current = item.index;
			setActive(item);
		};
	};

	const onClick = (e: any, item: any) => {
		if (!item) {
			return;
		};

		if (e.persist) {
			e.persist();
		};

		e.stopPropagation();

		const filter = getFilter();
		const rootId = keyboard.getRootId();
		const metaList = item.metaList || [];
		const meta = metaList.length ? metaList[0] : {};

		if (item.isMessage) {
			const chat = getMessageChat(item.chatId);

			close(() => {
				if (chat) {
					U.Object.openEvent(e, { ...chat, _routeParam_: { messageId: item.messageId } });
				};
			});

			analytics.event('SearchResult', { route, index: item.index + 1, length: filter.length });
			return;
		};

		close(() => {
			// Object
			if (item.isObject) {
				if (onObjectSelect) {
					onObjectSelect(item);
					return;
				};

				U.Object.openEvent(e, { ...item, id: item.id }, {
					onRouteChange: () => {
						if (!meta.blockId) {
							return;
						};

						window.setTimeout(() => {
							focus.scroll(keyboard.isPopup(), meta.blockId);
						}, J.Constant.delay.route);
					},
				});
			} else

			// Settings item
			if (item.isSettings) {
				Action.openSettings(item.id, '');
			} else
			// Import action
			if (item.isImport) {
				Action.import(item.format, J.Constant.fileExtension.import[item.format]);

			// Buttons
			} else {
				switch (item.id) {
					case 'add': {
						pageCreate(filter);
						break;
					};

					case 'upload': {
						close();
						window.setTimeout(() => {
							U.Menu.onFileUploadPopup(I.ObjectLayout.File, '', {}, undefined, analytics.route.uploadGlobalMenu);
						}, S.Popup.getTimeout());
						break;
					};

					case 'addType': {
						createTypedObject(item.typeId, filter);
						break;
					};

					case 'graph':
					case 'navigation': {
						U.Object.openEvent(e, { id: rootId, layout: item.layout });
						break;
					};
				};
			};
		});

		analytics.event('SearchResult', { route, index: item.index + 1, length: filter.length });
	};

	const onContext = (e: any, item: any) => {
		S.Menu.open('objectContext', {
			element: `#${getId()} #item-${U.Common.esc(item.id)}`,
			recalcRect: () => {
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			className: 'fixed',
			classNameWrap: 'fromPopup',
			vertical: I.MenuDirection.Center,
			data: {
				getObject: id => itemsRef.current.find(it => it.id == id),
				route,
				objectIds: [ item.id ],
				allowedNewTab: true,
			},
		});
	};

	const getRowHeight = (item: any, index: number) => {
		let h = HEIGHT_ITEM;
		if (item.isSection) {
			h = HEIGHT_SECTION;
		} else
		if (item.isSmall) {
			h = HEIGHT_SMALL;
		} else
		if (item.isMessage) {
			h = HEIGHT_MESSAGE;
		};
		if (cacheRef.current && (cacheRef.current as any).rowHeight) {
			h = Math.max((cacheRef.current as any).rowHeight({ index }), h);
		};
		return h;
	};

	const getFilter = () => {
		return String(filterInputRef.current?.getValue() || '');
	};

	useEffect(() => {
		const storage = storageGet();
		const filter = String(storage.filter || '');

		const setFilter = () => {
			if (!filterInputRef.current) {
				return;
			};

			rangeRef.current = { from: 0, to: filter.length };
			filterInputRef.current.setValue(filter);
			filterInputRef.current.setRange(rangeRef.current);

			reload();
		};

		focus.clear(true);
		rebindTimeoutRef.current = window.setTimeout(() => rebind(), J.Constant.delay.popup);

		if (storage.backlink) {
			U.Object.getById(storage.backlink, {}, item => setBacklinkState(item, 'Saved', () => setFilter()));
		} else {
			setFilter();
		};

		analytics.event('ScreenSearch', { route, type: (filter ? 'Saved' : 'Empty') });

		return () => {
			unbind();
			window.clearTimeout(timeoutRef.current);
			window.clearTimeout(rebindTimeoutRef.current);

			if (chatIdsRef.current.length) {
				U.Subscription.destroyList([ chatsSubId ], true);
			};
		};
	}, []);

	useEffect(() => {
		const items = getItems();

		setActive(items[nRef.current]);
		checkTypeSelectFade();

		if (listRef.current) {
			cacheRef.current.clearAll();
			listRef.current.recomputeRowHeights(0);
		};
	}, [ isLoading, dummy ]);

	const items = getItems();
	const shift = keyboard.shiftSymbol();
	const typeItems = getTypeItems();
	const searchType = getSearchType();

	const Context = (meta: any): any => {
		const { highlight, relationKey, ranges } = meta;
		const relationDetails = meta.relationDetails || {};

		let key: any = '';
		let value: any = '';

		if (relationKey) {
			if ([ 'name', 'pluralName', 'type', 'snippet' ].includes(relationKey)) {
				return '';
			} else {
				const relation = S.Record.getRelationByKey(relationKey);
				key = relation ? <div className="key">{relation.name}:</div> : '';
			};
		};

		if (highlight) {
			const text = Mark.toHtml(highlight, ranges.map(it => ({ type: I.MarkType.Highlight, range: it })));

			value = <div className="value" dangerouslySetInnerHTML={{ __html: U.String.sanitize(text) }} />;
		} else
		if (relationDetails.name) {
			const { relationOptionColor } = relationDetails;
			const color = relationOptionColor ? `textColor-${relationOptionColor}` : '';
			const cn = [ 'value' ];

			if (color) {
				cn.push(`textColor-${relationOptionColor}`);
				cn.push(`bgColor-${relationOptionColor}`);
			};

			value = <div className={cn.join(' ')}>{relationDetails.name}</div>;
		};

		return value ? (
			<div className="context">
				{key}
				{value}
			</div>
		) : '';
	};

	const Item = (item: any) => {
		const cn = [ 'item' ];

		if (item.isHidden) {
			cn.push('isHidden');
		};
		if (item.isSmall) {
			cn.push('isSmall');
		};

		if (item.isMessage) {
			const { space, showRelativeDates, dateFormat, timeFormat } = S.Common;
			const message = item.message || {};
			const author = U.Space.getParticipant(U.Space.getParticipantId(space, message.creator));
			const chat = getMessageChat(item.chatId);
			const day = showRelativeDates ? U.Date.dayString(message.createdAt) : null;
			const date = [ (day ? day : U.Date.dateWithFormat(dateFormat, message.createdAt)), U.Date.timeWithFormat(timeFormat, message.createdAt) ].join(', ');

			cn.push('isMessage');

			return (
				<div
					ref={node => rowsRef.current[item.index] = node}
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onMouseEnter={e => onOver(e, item)}
					onClick={e => onClick(e, item)}
					onAuxClick={e => onClick(e, item)}
				>
					<IconObject object={{ ...author, layout: I.ObjectLayout.Participant }} size={40} />
					<div className="sides">
						<div className="side left">
							<div className="nameWrapper">
								<ObjectName object={author} />
								<div className="time">{date}</div>
							</div>
							<div className="text" dangerouslySetInnerHTML={{ __html: U.Chat.getSearchResultHtml(item) }} />
							{chat ? (
								<div className="caption">
									<IconObject object={chat} size={16} />
									<ObjectName object={chat} />
								</div>
							) : ''}
						</div>
					</div>
				</div>
			);
		};

		let content = null;
		let icon = null;
		let object = null;
		let size = 40;

		if (item.isObject) {
			object = item;
		} else
		if (item.id == 'account') {
			object = U.Space.getParticipant();
		} else
		if (item.id == 'spaceIndex') {
			object = U.Space.getSpaceview();
		};

		if ([ 'account', 'spaceIndex' ].includes(item.id)) {
			size = 20;
		};

		if (object) {
			icon = <IconObject object={object} size={size} />;
		} else {
			icon = <Icon className={item.icon} {...(item.iconParam || {})} />;
		};

		if (item.isObject) {
			const { metaList } = item;
			const meta = metaList[0] || {};
			const type = S.Record.getTypeById(item.type);

			let advanced = null;

			if (item.links.length || item.backlinks.length) {
				advanced = (
					<Icon
						name="arrow/forward" 
						className="advanced"
						size={28}
						tooltipParam={{ 
							text: translate('popupSearchTooltipSearchByBacklinks'), 
							caption: `${shift} + Enter`
						}}
						onClick={e => onBacklink(e, item)}
					/>
				);
			};

			let name = U.Object.name(item, true);

			if (meta.highlight && [ 'name', 'pluralName' ].includes(meta.relationKey)) {
				name = Mark.toHtml(meta.highlight, meta.ranges.map(it => ({ type: I.MarkType.Highlight, range: it })));

				if (U.Object.isInFileLayouts(item.layout)) {
					name = U.File.name({ ...object, name });
				};
			} else {
				name = U.String.htmlSpecialChars(name);
			};

			content = (
				<div className="sides" onContextMenu={e => onContext(e, item)}>
					<div className="side left">
						<div className="name" dangerouslySetInnerHTML={{ __html: U.String.sanitize(name) }} />
						{Context(meta)}
						<div className="caption">
							<ObjectType object={type} />
						</div>
					</div>
					<div className="side right">
						{advanced}
					</div>
				</div>
			);
		} else {
			content = (
				<div className="sides">
					<div className="side left">
						<div className="name">{item.name}</div>
					</div>
					<div className="side right">
						<div className="caption">
							{item.shortcut.map((item, i) => (
								<Label key={i} text={item} />
							))}
						</div>
					</div>
				</div>
			);
		};

		return (
			<div
				ref={node => rowsRef.current[item.index] = node}
				id={`item-${item.id}`}
				className={cn.join(' ')}
				onMouseEnter={e => onOver(e, item)}
				onClick={e => onClick(e, item)}
				onAuxClick={e => onClick(e, item)}
			>
				{icon}
				{content}
			</div>
		);
	};

	const rowRenderer = ({ index, key, style, parent }) => {
		const item = items[index];

		let content = null;
		if (item.isSection) {
			content = (
				<div className={[ 'sectionName', (index == 0 ? 'first' : '') ].join(' ')} style={style}>
					{item.name}
					{item.withClear ? <div onClick={onClearSearch} className="clear">{translate('commonClear')}</div> : ''}
				</div>
			);
		} else {
			content = (
				<div className="row" style={style}>
					{Item({ ...item, index })}
				</div>
			);
		};

		return (
			<CellMeasurer
				key={key}
				parent={parent}
				cache={cacheRef.current}
				columnIndex={0}
				rowIndex={index}
			>
				{content}
			</CellMeasurer>
		);
	};

	const Footer = () => {
		const item = items[nRef.current];
		const cmd = keyboard.cmdKey();

		const isObject = item && item.isObject;
		const isMessage = item && item.isMessage;
		const isAction = item && (item.isSettings || item.isImport || [ 'add', 'addType', 'upload', 'graph', 'navigation' ].includes(item.id));

		return (
			<div className="foot">
				<Shortcut keys={[ 'arrowup', 'arrowdown' ]} label={translate('popupSearchShortcutNavigate')} />
				{!onObjectSelect ? (
					<Shortcut keys={[ 'tab' ]} label={translate('popupSearchShortcutSwitchType')} />
				) : ''}
				<Shortcut keys={[ 'escape' ]} label={translate('popupSearchShortcutClose')} />
				{isObject ? (
					<>
						<Shortcut keys={[ 'enter' ]} label={translate('popupSearchShortcutOpen')} />
						<Shortcut keys={[ cmd, 'l' ]} label={translate('popupSearchShortcutCopyLink')} />
					</>
				) : ''}
				{isAction ? (
					<Shortcut keys={[ 'enter' ]} label={translate('popupSearchShortcutSelect')} />
				) : ''}
				{isMessage ? (
					<Shortcut keys={[ 'enter' ]} label={translate('popupSearchShortcutOpen')} />
				) : ''}
			</div>
		);
	};

	return (
		<div
			ref={nodeRef}
			className="wrap"
		>
			{isLoading ? <Loader id="loader" /> : ''}

			<div className="head">
				<Filter
					className="underlined"
					iconParam={{ name: 'common/search' }}
					value={filterValueRef.current}
					ref={filterInputRef}
					placeholder={translate('popupSearchPlaceholder')}
					onSelect={onFilterSelect}
					onChange={v => onFilterChange(v)}
					onKeyUp={(e, v) => onFilterChange(v)}
					onClear={onFilterClear}
				/>
			</div>

			{!onObjectSelect ? (
				<div className="typeSelectWrap">
					<div ref={typeSelectRef} className="typeSelect" role="tablist" onWheel={onTypeWheel} onScroll={checkTypeSelectFade}>
						{typeItems.map((item: any) => {
							const cnt = [ 'typeItem', (item.id == searchType ? 'active' : '') ];

							return (
								<div
									key={item.id}
									role="tab"
									aria-selected={item.id == searchType}
									className={cnt.join(' ')}
									onClick={() => onSearchTypeSwitch(item.id)}
								>
									{item.name}
								</div>
							);
						})}
					</div>
				</div>
			) : ''}

			{!items.length && !isLoading ? (
				<EmptySearch
					filter={filterValueRef.current}
					text={(searchType == SEARCH_TYPE_MESSAGE) ? translate('menuSearchChatEmptySearch') : ''}
				/>
			) : ''}

			{cacheRef.current && items.length && !isLoading ? (
				<div key="items" className="items">
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={loadMoreRows}
						isRowLoaded={({ index }) => !!items[index]}
						threshold={LIMIT_HEIGHT}
					>
						{({ onRowsRendered }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={listRef}
										width={width}
										height={height}
										deferredMeasurmentCache={cacheRef.current}
										rowCount={items.length}
										rowHeight={param => getRowHeight(items[param.index], param.index)}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										onScroll={onScroll}
										scrollToAlignment="center"
										overscanRowCount={20}
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				</div>
			) : ''}

			{Footer()}
		</div>
	);

});

export default PopupSearch;
