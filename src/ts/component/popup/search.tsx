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
const RECENT_LIMIT = 20;

const SEARCH_TYPE_ALL = 'all';
const SEARCH_TYPE_MINE = 'mine';
const SEARCH_TYPE_MESSAGE = 'message';
const SEARCH_TYPE_MEDIA = 'media';
const SEARCH_TYPE_BOOKMARK = 'bookmark';
const SEARCH_TYPE_COLLECTION = 'collection';
const SEARCH_TYPE_QUERY = 'query';
const SEARCH_TYPE_CHAT = 'chat';
const SEARCH_TYPE_TYPE = 'type';

// Global (cross-space) mode filters by resolvedLayout - types can't be merged across spaces
const GLOBAL_LAYOUTS: { [key: string]: I.ObjectLayout[] } = {
	[SEARCH_TYPE_MEDIA]: [ I.ObjectLayout.File, I.ObjectLayout.Pdf, I.ObjectLayout.Audio, I.ObjectLayout.Video, I.ObjectLayout.Image ],
	[SEARCH_TYPE_BOOKMARK]: [ I.ObjectLayout.Bookmark ],
	[SEARCH_TYPE_COLLECTION]: [ I.ObjectLayout.Collection ],
	[SEARCH_TYPE_QUERY]: [ I.ObjectLayout.Set ],
	[SEARCH_TYPE_CHAT]: [ I.ObjectLayout.Chat ],
	[SEARCH_TYPE_TYPE]: [ I.ObjectLayout.Type ],
};

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
	const { route, onObjectSelect, skipIds, isGlobal } = data;
	// Global mode persists its state under separate keys so the two popups don't clobber each other
	const filterKey = isGlobal ? 'filterGlobal' : 'filter';
	const searchTypeKey = isGlobal ? 'searchTypeGlobal' : 'searchType';
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
	const filter = String(storage[filterKey] || '');
	const filterValueRef = useRef(filter);
	const searchTypeRef = useRef(String(storage[searchTypeKey] || SEARCH_TYPE_ALL));
	// Empty-browse order of All/My objects: 'edited' (lastModifiedDate) or 'created' (createdDate)
	const recentSortKey = isGlobal ? 'recentSortGlobal' : 'recentSort';
	const recentSortRef = useRef(String(storage[recentSortKey] || 'edited'));
	// The mode the currently held items were loaded for. During a quiet reload the previous
	// list stays on screen - render it by its own mode, not by the freshly selected chip
	const itemsModeRef = useRef('');
	const typeSelectRef = useRef(null);
	const chatIdsRef = useRef<string[]>([]);
	// Whether the last page came back full - drives the infinite-scroll sentinel row
	const hasMoreRef = useRef(false);
	const chatsSubId = [ getId(), 'chats' ].join('-');
	// Cross-space object types resolved via one-shot search and cached per popup
	const depsRef = useRef(new Map<string, any>());
	// All participants of all spaces: one unary snapshot fetched on popup open, held for the
	// popup's lifetime (fresh on reopen, evicted on close). Staleness is acceptable
	const participantsRef = useRef(new Map<string, any>());

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
				U.Object.copyLink(item, item.spaceId || S.Common.space, 'web', route);
			};
		});

		// The create shortcut triggers the active tab's create action, same as its Actions row
		keyboard.shortcut('createObject', e, () => {
			e.preventDefault();
			e.stopPropagation();

			const searchType = getSearchType();

			// Global mode has no per-chip create actions - fall back to the default create
			if (isGlobal) {
				close(() => pageCreate(filter));
			} else
			if (searchType == SEARCH_TYPE_MEDIA) {
				close();
				window.setTimeout(() => {
					U.Menu.onFileUploadPopup(I.ObjectLayout.File, '', {}, undefined, analytics.route.uploadGlobalMenu);
				}, S.Popup.getTimeout());
			} else
			if (![ SEARCH_TYPE_ALL, SEARCH_TYPE_MINE, SEARCH_TYPE_MESSAGE ].includes(searchType)) {
				close(() => createTypedObject(searchType, filter));
			} else {
				close(() => pageCreate(filter));
			};
		});

		keyboard.shortcut('search', e, () => close());

		// Widened-scope search (Cmd+K -> Cmd+Shift+K, the VS Code/Obsidian shift convention)
		if (!isGlobal && !onObjectSelect) {
			keyboard.shortcut(`${cmd}+shift+k`, e, () => {
				e.preventDefault();

				close();
				onSearchGlobal();
			});
		};
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
			storageSet({ [filterKey]: v });

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
		storageSet({ [filterKey]: '' });
		analytics.event('SearchInput', { route });
	};

	const onBacklink = (e: MouseEvent, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		// Backlink search is per-space (object graph)
		if (isGlobal) {
			return;
		};

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

	// The Messages scope searches chats and discussions - offer it only when there is at least
	// one of either: in the space (space subscriptions) or anywhere (global subscriptions)
	const hasMessageContainers = (): boolean => {
		if (isGlobal) {
			return [ J.Constant.subId.chatGlobal, J.Constant.subId.discussionGlobal ].some(it => {
				return S.Record.getRecordIds(it, '').length > 0;
			});
		};

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

		if (isGlobal) {
			return getTypeItems().map(it => it.id).includes(type) ? type : SEARCH_TYPE_ALL;
		};

		if (type == SEARCH_TYPE_MESSAGE) {
			return hasMessageContainers() ? type : SEARCH_TYPE_ALL;
		};

		if ([ SEARCH_TYPE_ALL, SEARCH_TYPE_MINE, SEARCH_TYPE_MEDIA ].includes(type)) {
			return type;
		};

		return S.Record.getTypeById(type) ? type : SEARCH_TYPE_ALL;
	};

	const getTypeItems = () => {
		const ret: any[] = [
			{ id: SEARCH_TYPE_ALL, name: translate('popupSearchTypeAll') },
			{ id: SEARCH_TYPE_MINE, name: translate('popupSearchTypeMine') },
		];

		if (hasMessageContainers()) {
			ret.push({ id: SEARCH_TYPE_MESSAGE, name: translate('popupSearchTypeMessages') });
		};

		if (isGlobal) {
			return ret.concat([
				{ id: SEARCH_TYPE_MEDIA, name: translate('commonMedia') },
				{ id: SEARCH_TYPE_BOOKMARK, name: translate('popupSearchTypeBookmarks') },
				{ id: SEARCH_TYPE_COLLECTION, name: translate('popupSearchTypeCollections') },
				{ id: SEARCH_TYPE_QUERY, name: translate('popupSearchTypeQueries') },
				{ id: SEARCH_TYPE_CHAT, name: translate('popupSearchTypeChats') },
				{ id: SEARCH_TYPE_TYPE, name: translate('popupSearchTypeTypes') },
			]);
		};

		const skip = U.Object.getFileLayouts().concat([ I.ObjectLayout.Chat, I.ObjectLayout.ChatOld, I.ObjectLayout.Discussion ]);
		const types = U.Data.getWidgetTypes().
			filter(it => !skip.includes(it.recommendedLayout)).
			map(it => ({ id: it.id, name: U.Object.name(it, true) }));

		ret.push({ id: SEARCH_TYPE_MEDIA, name: translate('commonMedia') });

		return ret.concat(types);
	};

	const onSearchTypeSwitch = (id: string) => {
		if (searchTypeRef.current == id) {
			return;
		};

		searchTypeRef.current = id;
		storageSet({ [searchTypeKey]: id });

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

		const known = [
			SEARCH_TYPE_ALL, SEARCH_TYPE_MINE, SEARCH_TYPE_MESSAGE, SEARCH_TYPE_MEDIA, SEARCH_TYPE_BOOKMARK,
			SEARCH_TYPE_COLLECTION, SEARCH_TYPE_QUERY, SEARCH_TYPE_CHAT, SEARCH_TYPE_TYPE,
		];
		const type = known.includes(id) ? U.String.ucFirst(id) : 'Type';

		analytics.event('SwitchSearchType', { route, type, isGlobal: Boolean(isGlobal) });
	};

	// Reopen the popup in global (cross-space) mode; callers close the current popup first
	const onSearchGlobal = () => {
		window.setTimeout(() => keyboard.onSearchPopup(route, { data: { isGlobal: true } }), S.Popup.getTimeout());
	};

	// Toggle the empty-browse order of All/My objects between recently edited and created
	const onRecentSortToggle = () => {
		recentSortRef.current = (recentSortRef.current == 'created') ? 'edited' : 'created';
		storageSet({ [recentSortKey]: recentSortRef.current });
		reload(true);
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

	const getMessageChat = (item: any): any => {
		const chatId = item.chatId;
		const spaceId = item.spaceId || S.Common.space;

		// Global mode: the chatGlobal cross-space subscription holds every chat object
		let object = isGlobal ?
			S.Detail.get(J.Constant.subId.chatGlobal, chatId, []) :
			S.Detail.get(U.Subscription.spaceSubId(J.Constant.subId.chat), chatId, []);

		if (object._empty_) {
			// The discussion parent map is fed by the cross-space discussionGlobal subscription
			const parentId = S.Chat.discussionParentMap.get(spaceId)?.get(chatId);

			if (parentId) {
				object = S.Chat.getDiscussionParentDetail(spaceId, parentId, []);

				if (object._empty_ && !isGlobal) {
					object = S.Detail.get(U.Subscription.spaceSubId(J.Constant.subId.discussion), parentId, []);
				};
			};
		};

		if (object._empty_ && !isGlobal) {
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
		const ids = U.Common.arrayUnique(records.filter(it => !getMessageChat(it)).map(it => it.chatId)).filter(it => it);

		if (!ids.length) {
			return;
		};

		chatIdsRef.current = U.Common.arrayUnique(chatIdsRef.current.concat(ids));

		U.Subscription.subscribeIds({ subId: chatsSubId, ids: chatIdsRef.current, noDeps: true }, () => {
			setDummy(prev => prev + 1);
		});
	};

	const getMessageAuthor = (item: any): any => {
		const spaceId = item.spaceId || S.Common.space;
		const participantId = U.Space.getParticipantId(spaceId, item.message?.creator);

		if (!isGlobal || (spaceId == S.Common.space)) {
			return U.Space.getParticipant(participantId);
		};

		return participantsRef.current.get(participantId) || null;
	};

	// Creator attribution only makes sense in spaces with more than one member. The exact
	// member list only exists for the current space; other spaces use isShared as the proxy
	// (a non-shared space cannot have a second member)
	const spaceHasMembers = (spaceId: string): boolean => {
		if (spaceId == S.Common.space) {
			return U.Space.getParticipantsList([ I.ParticipantStatus.Active ]).length > 1;
		};

		const spaceview = U.Space.getSpaceviewBySpaceId(spaceId);

		if (!spaceview) {
			return false;
		};

		// spaceAccessType may be absent on the stored record - attribute rather than hide
		if (undefined === spaceview.spaceAccessType) {
			return true;
		};

		// 1:1 spaces are multi-member but not "Shared" access type
		return Boolean(spaceview.isShared || spaceview.isOneToOne);
	};

	// creator may hold a participant id or (on older objects) the bare identity -
	// normalize to the participant id of the object's space
	const getCreatorParticipantId = (item: any): string => {
		const creator = String(item.creator || '');

		if (!creator || creator.startsWith('_participant_')) {
			return creator;
		};

		return U.Space.getParticipantId(item.spaceId || S.Common.space, creator);
	};

	// Whether the row should carry a "by ..." caption: multi-member spaces attribute every
	// row (own objects read "by You"); single-member spaces show nothing
	const wantsCreator = (item: any): boolean => {
		return Boolean(item.creator && S.Auth.account && spaceHasMembers(item.spaceId || S.Common.space));
	};

	// "by You" / "by <name>"; empty when attribution is off for the row
	const getObjectCreatorLabel = (item: any): string => {
		if (!wantsCreator(item)) {
			return '';
		};

		const spaceId = item.spaceId || S.Common.space;

		if (getCreatorParticipantId(item) == U.Space.getParticipantId(spaceId, S.Auth.account.id)) {
			return translate('popupSearchByYou');
		};

		const creator = getObjectCreator(item);
		return creator ? U.String.sprintf(translate('popupSearchByCreator'), U.Object.name(creator)) : '';
	};

	// The object's creator participant, for the "by <name>" caption
	const getObjectCreator = (item: any): any => {
		const spaceId = item.spaceId || S.Common.space;

		if (!wantsCreator(item)) {
			return null;
		};

		const participantId = getCreatorParticipantId(item);
		const object = S.Detail.get(U.Subscription.spaceSubId(J.Constant.subId.participant), participantId, []);

		if (!object._empty_) {
			return object;
		};

		return participantsRef.current.get(participantId) || null;
	};

	// Batch-resolve type objects of cross-space results - the type store only holds the
	// current space's types, so captions of results from other spaces need a lookup
	const resolveObjectTypes = (records: any[]) => {
		const ids = U.Common.arrayUnique(records.map(it => it.type)).filter(id => {
			return id && !S.Record.getTypeById(id) && !depsRef.current.has(id);
		});

		if (!ids.length) {
			return;
		};

		const filters: any[] = [
			{ relationKey: 'id', condition: I.FilterCondition.In, value: ids },
		];

		C.ObjectCrossSpaceSearch(filters, [], U.Subscription.typeRelationKeys(false), '', 0, ids.length, (message: any) => {
			if (message.error.code || !message.records.length) {
				return;
			};

			message.records.forEach(it => depsRef.current.set(it.id, S.Detail.mapper(it)));
			setDummy(prev => prev + 1);
		});
	};

	// One unary snapshot of all participants in all spaces (global mode) - the map serves
	// every creator/author lookup of this popup instance
	const loadParticipants = () => {
		const filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
		];

		C.ObjectCrossSpaceSearch(filters, [], U.Subscription.participantRelationKeys(), '', 0, 0, (message: any) => {
			if (message.error.code || !message.records.length) {
				return;
			};

			message.records.forEach(it => participantsRef.current.set(it.id, S.Detail.mapper(it)));
			setDummy(prev => prev + 1);
		});
	};

	// Browse orders of a chip. label is the bare translate key; appending "Type" gives the
	// "%s"-noun variant. Primary: chats live by activity, types by usage, everything else by
	// edit date. Secondary (the -> switch target): creation date; null = no switch. File
	// chips have a single meaningful order - the date the file was added to the vault
	// (createdDate carries the original file date from exif/meta, edits are rare)
	const getRecentOrders = (searchType: string): { primary: { label: string; sorts: any[] }; secondary: { label: string; sorts: any[] } | null } => {
		if (searchType == SEARCH_TYPE_MEDIA) {
			return {
				primary: { label: 'popupSearchRecentAdded', sorts: [ { relationKey: 'addedDate', type: I.SortType.Desc } ] },
				secondary: null,
			};
		};

		let primary = { label: 'popupSearchRecentEdited', sorts: [ { relationKey: 'lastModifiedDate', type: I.SortType.Desc } ] };

		if (searchType == SEARCH_TYPE_CHAT) {
			primary = { label: 'popupSearchRecentActive', sorts: [ { relationKey: 'lastMessageDate', type: I.SortType.Desc } ] };
		} else
		if (searchType == SEARCH_TYPE_TYPE) {
			primary = {
				label: 'popupSearchRecentUsed',
				sorts: [
					{ relationKey: 'lastUsedDate', type: I.SortType.Desc },
					{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
				],
			};
		};

		return {
			primary,
			secondary: { label: 'popupSearchRecentCreated', sorts: [ { relationKey: 'createdDate', type: I.SortType.Desc } ] },
		};
	};

	// Objects created by the current account (creator only - lastModifiedBy is noisy because
	// of automatic changes). creator holds participant ids, which are per-space - global mode
	// matches against the account's participant id in every space
	const getMineFilter = (): any[] => {
		const { account } = S.Auth;
		const ids = isGlobal ?
			U.Space.getList().map(it => U.Space.getParticipantId(it.targetSpaceId, account.id)) :
			[ U.Space.getCurrentParticipantId() ];

		return [
			{ relationKey: 'creator', condition: I.FilterCondition.In, value: ids },
			// Chat containers are created implicitly with their space and all carry the space
			// creator - noise in My objects; they have their own chips
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: [ I.ObjectLayout.Chat, I.ObjectLayout.ChatOld, I.ObjectLayout.Discussion ] },
		];
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

		// Empty spaceId + empty chatId = all chats in all spaces (global mode)
		C.ChatSearch(isGlobal ? '' : space, '', text, offsetRef.current, J.Constant.limit.menuRecords, sorts, (message: any) => {
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
			hasMoreRef.current = records.length == J.Constant.limit.menuRecords;

			if (!clear) {
				setDummy(prev => prev + 1);
			};

			if (!isGlobal) {
				resolveMessageChats(records);
			};

			done();
			callBack?.();
		});
	};

	const loadMoreRows = ({ startIndex, stopIndex }) => {
		return new Promise((resolve, reject) => {
			if (!hasMoreRef.current) {
				resolve(null);
				return;
			};

			// Continue from the loaded count - the first browse page is smaller than the
			// regular page size
			offsetRef.current = itemsRef.current.length;
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

	// Global mode: one-shot cross-space search, no subscription. allStoresLoaded=false means
	// the sequential per-space store warm-up is still running and the view is partial - no
	// auto-retry in v1, the next keystroke/chip switch re-queries anyway
	const loadGlobalObjects = (clear: boolean, callBack?: () => void, quiet?: boolean) => {
		const searchType = getSearchType();
		const layouts = U.Object.getSystemLayouts().filter(it => !U.Object.isTypeLayout(it));
		// ignoreChat defaults to the CURRENT spaceview's isOneToOne, which would inject
		// resolvedLayout/recommendedLayout NotIn [Chat, ChatOld, Discussion] and hide every
		// chat object from the vault-wide search - chats are a first-class chip here
		const filters: any[] = U.Subscription.getBaseFilters({ ignoreChat: false }).concat([
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: layouts },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
		]);

		if (GLOBAL_LAYOUTS[searchType]) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: GLOBAL_LAYOUTS[searchType] });
		};

		if (searchType == SEARCH_TYPE_MINE) {
			filters.push(...getMineFilter());
		};

		// Type objects are noise in the empty (recent) browse of All/My objects - every space
		// ships a full set of bundled types; they stay searchable by text and via the Types chip
		if ([ SEARCH_TYPE_ALL, SEARCH_TYPE_MINE ].includes(searchType) && !filterValueRef.current) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: [ I.ObjectLayout.Type ] });
		};

		let fullText = filterValueRef.current;

		// Chat objects are not in the fulltext index - a text query through fullText finds
		// nothing, so filter by name instead (store query, not FT)
		if ((searchType == SEARCH_TYPE_CHAT) && fullText) {
			filters.push({ relationKey: 'name', condition: I.FilterCondition.Like, value: fullText });
			fullText = '';
		};

		// Browse follows the toggle order shown in the section title: the chip's primary
		// recency order or createdDate. Text queries keep FT relevance, except chats which
		// never have an FT score (their text path filters by name)
		let sorts: any[] = [];

		if ((searchType == SEARCH_TYPE_CHAT) || !fullText) {
			const orders = getRecentOrders(searchType);
			sorts = ((recentSortRef.current == 'created') && orders.secondary) ? orders.secondary.sorts : orders.primary.sorts;
		};

		sorts = sorts.map(U.Subscription.sortMapper);

		let limit = J.Constant.limit.menuRecords;

		if (!filterValueRef.current && clear) {
			limit = RECENT_LIMIT;
		};

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

		if (clear && !quiet) {
			setIsLoading(true);
		};

		C.ObjectCrossSpaceSearch(filters, sorts, J.Relation.default.concat([ 'pluralName', 'creator' ]), fullText, offsetRef.current, limit, (message: any) => {
			if (message.error.code) {
				if (clear) {
					itemsRef.current = [];
					itemsModeRef.current = searchType;
				};

				done();
				callBack?.();
				return;
			};

			if (clear) {
				itemsRef.current = [];
			};

			const records = (message.records || []).map(it => {
				it = S.Detail.mapper(it);
				// Match the ObjectSearchWithMeta record shape - the one-shot RPC carries no meta
				it.metaList = [];
				it.links = [];
				it.backlinks = [];
				return it;
			});

			itemsRef.current = itemsRef.current.concat(records);
			itemsModeRef.current = searchType;
			hasMoreRef.current = records.length == limit;
			resolveObjectTypes(records);


			if (!clear) {
				setDummy(prev => prev + 1);
			};

			done();
			callBack?.();
		});
	};

	const load = (clear: boolean, callBack?: () => void, quiet?: boolean) => {
		const searchType = getSearchType();

		if (searchType == SEARCH_TYPE_MESSAGE) {
			loadMessages(clear, callBack, quiet);
			return;
		};

		if (isGlobal) {
			loadGlobalObjects(clear, callBack, quiet);
			return;
		};

		const { space } = S.Common;
		const layouts = U.Object.getSystemLayouts().filter(it => !U.Object.isTypeLayout(it));
		const filters: any[] = U.Subscription.getBaseFilters().concat([
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: layouts },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
		]);

		// Type objects are noise in the empty (recent) browse of All/My objects; they stay
		// searchable by text
		if ([ SEARCH_TYPE_ALL, SEARCH_TYPE_MINE ].includes(searchType) && !filterValueRef.current) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: [ I.ObjectLayout.Type ] });
		};

		if (searchType == SEARCH_TYPE_MINE) {
			filters.push(...getMineFilter());
		} else
		if (searchType == SEARCH_TYPE_MEDIA) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() });
		} else
		if (searchType != SEARCH_TYPE_ALL) {
			const type = S.Record.getTypeById(searchType);

			if (type) {
				filters.push({ relationKey: 'type.uniqueKey', condition: I.FilterCondition.Equal, value: type.uniqueKey });
			};
		};
		let sorts: any[] = [
			{ relationKey: '_final_score', type: I.SortType.Desc },
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			{ relationKey: 'type', type: I.SortType.Asc },
		];

		// Empty browse follows the toggle order shown in the section title
		if (!filterValueRef.current) {
			const orders = getRecentOrders(searchType);
			sorts = ((recentSortRef.current == 'created') && orders.secondary) ? orders.secondary.sorts : orders.primary.sorts;
		};

		sorts = sorts.map(U.Subscription.sortMapper);

		let limit = J.Constant.limit.menuRecords;

		if (!filterValueRef.current && clear && !backlinkRef.current) {
			limit = RECENT_LIMIT;
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
			hasMoreRef.current = records.length == limit;

			if (!clear) {
				setDummy(prev => prev + 1);
			};

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
			// Every object chip states its browse order in the title; the right-side action
			// switches between the chip's primary recency order and recently created
			const { primary, secondary } = getRecentOrders(searchType);
			const created = (recentSortRef.current == 'created') && Boolean(secondary);

			let noun = '';

			if (searchType == SEARCH_TYPE_MEDIA) {
				noun = translate('commonMedia');
			} else
			if (!isAll && (searchType != SEARCH_TYPE_MINE)) {
				if (isGlobal) {
					noun = getTypeItems().find(it => it.id == searchType)?.name || '';
				} else {
					const type = S.Record.getTypeById(searchType);
					noun = type ? U.Object.name(type, true) : '';
				};
			};

			const current = created ? secondary : primary;
			const other = created ? primary : secondary;
			const sectionName = noun ?
				U.String.sprintf(translate(`${current.label}Type`), noun) :
				translate(current.label);

			items.unshift({
				name: sectionName,
				isSection: true,
				withSort: Boolean(secondary),
				sortSwitchText: other ? translate(other.label) : '',
			});
		};

		items = items.map(it => {
			it.isObject = true;
			return it;
		});

		if (onObjectSelect) {
			return items;
		};

		/* Settings and pages */

		if (filter && isAll && !isGlobal) {
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

		// Global mode has no actions in v1 (creation targets a specific space)
		if (!isGlobal) {
			const actions: any[] = [];

			if (canWrite) {
				if (isAll || (searchType == SEARCH_TYPE_MINE)) {
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
			};

			actions.push({
				id: 'searchGlobal',
				name: translate('popupSearchSearchGlobal'),
				iconParam: { name: 'common/search' },
				shortcut: keyboard.getSymbolsFromKeys([ keyboard.cmdKey(), 'shift', 'k' ]),
			});

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
					className: 'fixed',
					classNameWrap: 'fromPopup',
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
			const chat = getMessageChat(item);

			close(() => {
				if (!chat) {
					return;
				};

				// The container is already open: navigating to the same route does not
				// remount the page, and messageId is only read on mount - scroll directly
				// (the same event the in-chat search menu uses, which also loads around
				// messages that are not in the current window)
				if (chat.id == rootId) {
					if (U.Object.isChatLayout(chat.layout)) {
						U.Dom.eventDispatch(window, 'scrollToMessage', { id: item.messageId });
					} else {
						U.Comment.scrollToMessage(item.messageId);
					};
				} else {
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

					case 'searchGlobal': {
						onSearchGlobal();
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
		// The object context menu acts within the current space - skip for cross-space results
		if (isGlobal) {
			return;
		};

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
		if (!item) {
			return HEIGHT_SMALL;
		};

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
		const filter = String(storage[filterKey] || '');

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

		if (isGlobal) {
			loadParticipants();
		};

		if (storage.backlink && !isGlobal) {
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
			const { showRelativeDates, dateFormat, timeFormat } = S.Common;
			const message = item.message || {};
			const author = getMessageAuthor(item);
			const chat = getMessageChat(item);
			const spaceview = isGlobal ? U.Space.getSpaceviewBySpaceId(item.spaceId) : null;
			// A 1:1 space's chat is always named "General" - label it "Direct" instead (the
			// person is already visible: space caption in global mode, the space itself in-space)
			const isOneToOne = Boolean((isGlobal ? spaceview : U.Space.getSpaceview())?.isOneToOne);
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
							{chat || spaceview ? (
								<div className="caption">
									{chat ? (
										<>
											<IconObject object={chat} size={16} />
											{isOneToOne ? <div className="name">{translate('popupSearchDirectChat')}</div> : <ObjectName object={chat} />}
										</>
									) : ''}
									{chat && spaceview ? <div className="bullet" /> : ''}
									{spaceview ? (
										<>
											<IconObject object={spaceview} size={16} />
											<ObjectName object={spaceview} />
										</>
									) : ''}
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
			// Global (cross-space) results carry no meta - the one-shot RPC has no highlights
			const metaList = item.metaList || [];
			const meta = metaList[0] || {};
			// Types of other spaces are not in the current space's type store - fall back to
			// the batch-resolved cross-space cache
			const type = S.Record.getTypeById(item.type) || (isGlobal ? depsRef.current.get(item.type) : null);

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

			const spaceview = isGlobal ? U.Space.getSpaceviewBySpaceId(item.spaceId) : null;
			const creatorLabel = getObjectCreatorLabel(item);

			let name = U.Object.name(item, true);

			// A 1:1 space's chat is always named "General" - show the person (the 1:1
			// spaceview is named after the other participant, same as the vault list)
			if (spaceview?.isOneToOne && U.Object.isChatLayout(item.layout)) {
				name = U.Object.name(spaceview);
			};

			if (meta.highlight && [ 'name', 'pluralName' ].includes(meta.relationKey)) {
				name = Mark.toHtml(meta.highlight, meta.ranges.map(it => ({ type: I.MarkType.Highlight, range: it })));

				if (U.Object.isInFileLayouts(item.layout)) {
					name = U.File.name({ ...object, name });
				};
			} else {
				name = U.String.htmlSpecialChars(name);
			};

			if (isGlobal) {
				cn.push('isGlobal');
			};

			content = (
				<div className="sides" onContextMenu={e => onContext(e, item)}>
					<div className="side left">
						<div className="name" dangerouslySetInnerHTML={{ __html: U.String.sanitize(name) }} />
						{Context(meta)}
						<div className="caption">
							<ObjectType object={type} />
							{creatorLabel ? (
								<>
									<div className="bullet" />
									<div className="creator">{creatorLabel}</div>
								</>
							) : ''}
							{spaceview ? (
								<>
									<div className="bullet" />
									<IconObject object={spaceview} size={16} />
									<ObjectName object={spaceview} />
								</>
							) : ''}
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
		if (!item) {
			// Sentinel row past the loaded set - InfiniteLoader fetches the next page for it
			content = <div className="row" style={style} />;
		} else
		if (item.isSection) {
			content = (
				<div className={[ 'sectionName', (index == 0 ? 'first' : '') ].join(' ')} style={style}>
					{item.name}
					{item.withClear ? <div onClick={onClearSearch} className="clear">{translate('commonClear')}</div> : ''}
					{item.withSort ? (
						<div onClick={onRecentSortToggle} className="clear">
							{`→ ${item.sortSwitchText}`}
						</div>
					) : ''}
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
		const isAction = item && (item.isSettings || item.isImport || [ 'add', 'addType', 'upload', 'graph', 'navigation', 'searchGlobal' ].includes(item.id));

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
					placeholder={translate(searchType == SEARCH_TYPE_MESSAGE ? 'popupSearchPlaceholderMessage' : 'popupSearchPlaceholder')}
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
						rowCount={items.length + (hasMoreRef.current ? 1 : 0)}
						loadMoreRows={loadMoreRows}
						isRowLoaded={({ index }) => index < items.length}
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
										rowCount={items.length + (hasMoreRef.current ? 1 : 0)}
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
