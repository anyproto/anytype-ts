import React, { forwardRef, useEffect, useRef, useState, MouseEvent } from 'react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Icon, Loader, IconObject, EmptySearch, Label, Filter, ObjectType, ObjectName } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const HEIGHT_SECTION = 28;
const HEIGHT_SMALL = 38;
const HEIGHT_ITEM = 60;
const HEIGHT_MESSAGE = 76;
// Prefetch when within this many rows of the sentinel - must stay below RECENT_LIMIT minus
// the visible row count, or the second page loads immediately on open
const LOAD_THRESHOLD = 5;
const RECENT_LIMIT = 20;
// Restore chip/query on quick reopen; treat the popup as a fresh task after this long
// (the Raycast pop-to-root / Alfred latest-query-window pattern)
const STATE_RESET_TIMEOUT = 5 * 60 * 1000;

const SEARCH_TYPE_ALL = 'all';
const SEARCH_TYPE_MINE = 'mine';
const SEARCH_TYPE_MESSAGE = 'message';
const SEARCH_TYPE_PAGE = 'page';
const SEARCH_TYPE_MEDIA = 'media';
const SEARCH_TYPE_BOOKMARK = 'bookmark';
const SEARCH_TYPE_COLLECTION = 'collection';
const SEARCH_TYPE_QUERY = 'query';
const SEARCH_TYPE_CHAT = 'chat';
const SEARCH_TYPE_TYPE = 'type';
const SEARCH_TYPE_MEMBER = 'member';

// Global (cross-space) mode filters by resolvedLayout - types can't be merged across spaces
const GLOBAL_LAYOUTS: { [key: string]: I.ObjectLayout[] } = {
	[SEARCH_TYPE_PAGE]: [ I.ObjectLayout.Page, I.ObjectLayout.Note ],
	[SEARCH_TYPE_MEDIA]: [ I.ObjectLayout.File, I.ObjectLayout.Pdf, I.ObjectLayout.Audio, I.ObjectLayout.Video, I.ObjectLayout.Image ],
	[SEARCH_TYPE_BOOKMARK]: [ I.ObjectLayout.Bookmark ],
	[SEARCH_TYPE_COLLECTION]: [ I.ObjectLayout.Collection ],
	[SEARCH_TYPE_QUERY]: [ I.ObjectLayout.Set ],
	[SEARCH_TYPE_CHAT]: [ I.ObjectLayout.Chat ],
	[SEARCH_TYPE_TYPE]: [ I.ObjectLayout.Type ],
};

const isMac = U.Common.isPlatformMac();

// Cross-space search dependencies, shared across popup instances for the app session.
// Two live subscriptions (participants, types) started on first global-search use; rows read
// these compact plain maps - never the detail store on the hot path. Reopens ingest new ids
// incrementally from the stores, so results render attributed on first paint with no redraw
const GLOBAL_DEPS = {
	accountId: '',
	subscribed: false,
	participants: new Map<string, any>(),
	participantCounts: new Map<string, number>(),
	types: new Map<string, any>(),
};

const SUB_GLOBAL_PARTICIPANTS = 'searchGlobalParticipants';
const SUB_GLOBAL_TYPES = 'searchGlobalTypes';
// Only what rendering reads - keeps the payload and the maps compact
const KEYS_GLOBAL_PARTICIPANT = [ 'id', 'spaceId', 'name', 'globalName', 'iconImage', 'layout', 'resolvedLayout', 'isDeleted', 'participantStatus' ];
const KEYS_GLOBAL_TYPE = [ 'id', 'spaceId', 'name', 'pluralName', 'uniqueKey', 'layout', 'resolvedLayout', 'isDeleted' ];

const ingestGlobalParticipant = (it: any) => {
	if (GLOBAL_DEPS.participants.has(it.id)) {
		return;
	};

	GLOBAL_DEPS.participants.set(it.id, it);

	if (it.spaceId && (it.participantStatus == I.ParticipantStatus.Active)) {
		GLOBAL_DEPS.participantCounts.set(it.spaceId, (GLOBAL_DEPS.participantCounts.get(it.spaceId) || 0) + 1);
	};
};

const ingestGlobalType = (it: any) => {
	if (!GLOBAL_DEPS.types.has(it.id)) {
		GLOBAL_DEPS.types.set(it.id, it);
	};
};

// Pick up records that streamed in while no popup was open - subscription events land in
// the stores; the maps ingest only ids they have not seen
const syncGlobalDeps = () => {
	S.Record.getRecordIds(SUB_GLOBAL_PARTICIPANTS, '').forEach(id => {
		if (!GLOBAL_DEPS.participants.has(id)) {
			ingestGlobalParticipant(S.Detail.get(SUB_GLOBAL_PARTICIPANTS, id, KEYS_GLOBAL_PARTICIPANT));
		};
	});

	S.Record.getRecordIds(SUB_GLOBAL_TYPES, '').forEach(id => {
		if (!GLOBAL_DEPS.types.has(id)) {
			ingestGlobalType(S.Detail.get(SUB_GLOBAL_TYPES, id, KEYS_GLOBAL_TYPE));
		};
	});
};

const subscribeGlobalDeps = (onLoad: () => void) => {
	const accountId = S.Auth.account?.id || '';
	// Logout destroys all subscriptions and wipes the record store; a live participants
	// subscription always holds at least your own participant - empty means "dead"
	const dead = !S.Record.getRecordIds(SUB_GLOBAL_PARTICIPANTS, '').length;

	// Account switch or logout/login invalidates everything
	if (GLOBAL_DEPS.subscribed && ((GLOBAL_DEPS.accountId != accountId) || dead)) {
		GLOBAL_DEPS.subscribed = false;
		GLOBAL_DEPS.participants.clear();
		GLOBAL_DEPS.participantCounts.clear();
		GLOBAL_DEPS.types.clear();
	};

	if (GLOBAL_DEPS.subscribed) {
		syncGlobalDeps();
		return;
	};

	GLOBAL_DEPS.subscribed = true;
	GLOBAL_DEPS.accountId = accountId;

	U.Subscription.subscribe({
		subId: SUB_GLOBAL_PARTICIPANTS,
		filters: [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
		],
		keys: KEYS_GLOBAL_PARTICIPANT,
		ignoreHidden: false,
		noDeps: true,
		crossSpace: true,
	}, (message: any) => {
		(message.records || []).forEach(it => ingestGlobalParticipant(S.Detail.mapper(it)));
		onLoad();
	});

	U.Subscription.subscribe({
		subId: SUB_GLOBAL_TYPES,
		filters: [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
		],
		keys: KEYS_GLOBAL_TYPE,
		ignoreHidden: false,
		noDeps: true,
		crossSpace: true,
	}, (message: any) => {
		(message.records || []).forEach(it => ingestGlobalType(S.Detail.mapper(it)));
		onLoad();
	});
};

// Module-level so its identity is stable across renders - a component re-created inside the
// render body reads as a new type to React and remounts its DOM every render (visible blink)
const Shortcut = (props: { keys: string[]; label: string; separator?: string }) => {
	const symbols = keyboard.getSymbolsFromKeys(props.keys);
	return (
		<div className="item">
			<div className="keys">
				{symbols.map((s, i) => (
					<React.Fragment key={i}>
						{props.separator && (i > 0) ? <div className="sep">{props.separator}</div> : ''}
						<Label text={s} />
					</React.Fragment>
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
	const drillKey = isGlobal ? 'drillGlobal' : 'drill';
	const [ isLoading, setIsLoading ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	// Active drill: pivot the whole search around one row - related objects (backlink),
	// instances of a type, or objects created by a person
	const drillRef = useRef<{ kind: string; object: any } | null>(null);
	// Where the user was when the drill started - Back (left arrow / Escape / Clear)
	// restores chip, query, loaded depth, scroll offset and the active row
	const drillBackRef = useRef<{ searchType: string; filter: string; itemId: string; top: number; count: number } | null>(null);
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
	const lastUsedKey = isGlobal ? 'lastUsedGlobal' : 'lastUsed';
	// Stale session: reset chip, query and drill to defaults instead of restoring
	const isStale = Boolean(storage[lastUsedKey] && (Date.now() - storage[lastUsedKey] > STATE_RESET_TIMEOUT));
	const filter = isStale ? '' : String(storage[filterKey] || '');
	const filterValueRef = useRef(filter);
	const searchTypeRef = useRef(isStale ? SEARCH_TYPE_ALL : String(storage[searchTypeKey] || SEARCH_TYPE_ALL));
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
	// Bumped on every clear-load: responses stamped with an older generation are dropped,
	// so a slow superseded query can never clobber the current list
	const loadGenRef = useRef(0);
	// Bumped when a clear-load actually swaps the list data; the measurement cache is
	// reset exactly then. Request-time signals fire too early (an unrelated re-render
	// would wipe and re-measure the OLD rows) and appends must never wipe it
	const listEpochRef = useRef(0);
	// Last epoch the measurement cache was reset for
	const cacheGenRef = useRef(0);
	// Whether the per-open chats subscription was ever created (teardown gate)
	const chatsSubActiveRef = useRef(false);
	const chatsSubId = [ getId(), 'chats' ].join('-');

	const onScroll = ({ scrollTop }) => {
		topRef.current = scrollTop;
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
			if (drillRef.current) {
				onClearSearch();
			} else {
				close();
			};
		});

		keyboard.shortcut('shift+enter', e, () => {
			if (item && getDrillKind(item)) {
				onDrill(e, item);
			};
		});

		// Left arrow at the query start clears the active drill, mirroring Escape
		keyboard.shortcut('arrowleft', e, () => {
			if (!drillRef.current) {
				return;
			};

			const range = filterInputRef.current?.getRange();

			if (range && (range.from || range.to)) {
				return;
			};

			e.preventDefault();
			onClearSearch();
		});

		// Right arrow drills like shift+enter - but only when the caret sits at the end of
		// the query, so arrows keep editing text otherwise
		keyboard.shortcut('arrowright', e, () => {
			if (!item || !getDrillKind(item)) {
				return;
			};

			const range = filterInputRef.current?.getRange();

			if (range && (range.to < filter.length)) {
				return;
			};

			e.preventDefault();
			onDrill(e, item);
		});

		keyboard.shortcut(`${shortcutPrev}, ${shortcutNext}` , e, (pressed: string) => {
			e.preventDefault();

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
				const spaceview = U.Space.getSpaceviewBySpaceId(item.spaceId || S.Common.space);

				if (spaceview) {
					U.Object.copyLink(item, spaceview, 'web', route);
				};
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

		// Cmd+Shift+K pivots to global, carrying the query and chip over; keyboard.ts
		// yields the combo while the in-space popup is open (global mode toggles there)
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

		// Nothing selectable (e.g. a drill with zero results renders only its header)
		if (!items.some(it => !it.isSection)) {
			return;
		};

		nRef.current += dir;

		if ((dir > 0) && (nRef.current > l - 1)) {
			nRef.current = 0;
		};

		if ((dir < 0) && (nRef.current < 0)) {
			// No wrap-around upwards: with lazy loading the "last" row is just the last
			// loaded one, so jumping there reads as random - stay on the first entry
			const first = items.findIndex(it => !it.isSection);

			nRef.current = first >= 0 ? first : 0;
			scrollToRow(items, nRef.current);
			setActive(items[nRef.current]);
			return;
		};

		const item = items[nRef.current];
		if (item && item.isSection) {
			onArrow(dir);
			return;
		};

		scrollToRow(items, nRef.current);
		setActive(item);
	};

	// Minimal scrolling: only move when the active row is outside the viewport, and only
	// just enough to reveal it. Re-centering on every press fought the async re-renders
	// (lazy-load appends, cell re-measure) and read as the scroll jumping back and forth
	const scrollToRow = (items: any[], index: number) => {
		if (!listRef.current || !items.length) {
			return;
		};

		const listHeight = listRef.current.props.height;
		const rowH = getRowHeight(items[index], index);

		let offset = 0;
		for (let i = 0; i < index; ++i) {
			offset += getRowHeight(items[i], i);
		};

		// When the row sits right under its section header, keep the header in view too
		const prev = items[index - 1];
		const headH = (prev && prev.isSection) ? getRowHeight(prev, index - 1) : 0;
		const top = topRef.current;

		if (offset - headH < top) {
			listRef.current.scrollToPosition(Math.max(0, offset - headH));
		} else
		if (offset + rowH > top + listHeight) {
			listRef.current.scrollToPosition(offset + rowH - listHeight);
		};
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

	// Drill kind of a row: type rows search the type's instances, participant rows search
	// objects created by the person, rows with links search related objects (in-space only -
	// the object graph is per-space)
	const getDrillKind = (item: any): string => {
		if (!item || !item.isObject) {
			return '';
		};

		if (U.Object.isTypeLayout(item.layout)) {
			return 'type';
		};

		if (U.Object.isParticipantLayout(item.layout)) {
			return 'creator';
		};

		const links = Relation.getArrayValue(item.links);
		const backlinks = Relation.getArrayValue(item.backlinks);

		if (!isGlobal && (links.length || backlinks.length)) {
			return 'backlink';
		};

		return '';
	};

	const startDrill = (kind: string, object: any) => {
		if (!object) {
			return;
		};

		// A chained drill keeps the original snapshot: Back always returns to the pre-drill list
		if (!drillRef.current) {
			drillBackRef.current = {
				searchType: searchTypeRef.current,
				filter: filterValueRef.current,
				itemId: getItems()[nRef.current]?.id || '',
				top: topRef.current,
				count: itemsRef.current.length,
			};
		};

		storageSet({ [drillKey]: { kind, id: object.id, back: drillBackRef.current } });
		setDrillState(kind, object, 'Empty', () => reload(true));
	};

	const onDrill = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		const kind = getDrillKind(item);

		if (kind) {
			startDrill(kind, item);
		};
	};

	const setDrillState = (kind: string, item: any, type: string, callBack?: () => void) => {
		window.clearTimeout(timeoutRef.current);
		filterInputRef.current?.setValue('');
		filterInputRef.current?.focus();

		// A fresh drill starts with an empty query - setValue alone leaves the ref and
		// storage stale, and the next load would silently keep filtering by the old text
		if (type != 'Saved') {
			filterValueRef.current = '';
			storageSet({ [filterKey]: '' });
		};

		drillRef.current = { kind, object: item };

		// A specific type is narrower than any chip - force All while type-drilled.
		// A creator drill replaces the creator-flavored chips (My objects, Members)
		if ((kind == 'type') || ((kind == 'creator') && [ SEARCH_TYPE_MINE, SEARCH_TYPE_MEMBER ].includes(searchTypeRef.current))) {
			searchTypeRef.current = SEARCH_TYPE_ALL;
		};

		if (kind == 'backlink') {
			analytics.event('SearchBacklink', { route, type });
		};

		analytics.event('SearchDrill', { route, type, drillType: kind, isGlobal: Boolean(isGlobal) });
		callBack?.();
	};

	const onClearSearch = () => {
		window.clearTimeout(timeoutRef.current);
		offsetRef.current = 0;
		drillRef.current = null;
		storageSet({ [drillKey]: null, backlink: '' });

		const back = drillBackRef.current;
		drillBackRef.current = null;

		if (!back) {
			filterInputRef.current?.setValue('');
			filterValueRef.current = '';
			storageSet({ [filterKey]: '' });
			reload(true);
			return;
		};

		// Back restores the pre-drill spot: chip, query, loaded depth, scroll, active row
		searchTypeRef.current = back.searchType;
		filterValueRef.current = back.filter;
		filterInputRef.current?.setValue(back.filter);
		filterInputRef.current?.setRange({ from: back.filter.length, to: back.filter.length });
		storageSet({ [searchTypeKey]: back.searchType, [filterKey]: back.filter });

		nRef.current = 0;
		topRef.current = 0;

		const step = () => {
			const items = getItems();
			const idx = items.findIndex(it => it.id == back.itemId);

			// Refill page by page to the pre-drill depth so the saved row exists again
			if ((idx < 0) && hasMoreRef.current && (itemsRef.current.length < back.count)) {
				offsetRef.current = itemsRef.current.length;
				load(false, step);
				return;
			};

			nRef.current = Math.max(0, (idx >= 0) ? idx : items.findIndex(it => !it.isSection));

			window.setTimeout(() => {
				listRef.current?.scrollToPosition(back.top);
				topRef.current = back.top;
				setActive(getItems()[nRef.current]);
				scrollToActiveChip();
			});
		};

		load(true, step, true);
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

	// Members chip only makes sense with someone besides you: globally >1 distinct
	// identities in the participants map, in-space >1 active members. The global answer is
	// cached once it turns true (data only grows within a popup's lifetime)
	const globalMembersRef = useRef(false);

	const hasMembers = (): boolean => {
		if (!isGlobal) {
			return spaceHasMembers(S.Common.space);
		};

		if (globalMembersRef.current) {
			return true;
		};

		const identities = new Set<string>();

		GLOBAL_DEPS.participants.forEach((it: any, id: string) => {
			if (it.participantStatus == I.ParticipantStatus.Active) {
				identities.add(U.Space.getAccountFromParticipantId(id));
			};
		});

		globalMembersRef.current = identities.size > 1;
		return globalMembersRef.current;
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

		if (type == SEARCH_TYPE_MEMBER) {
			return hasMembers() ? type : SEARCH_TYPE_ALL;
		};

		if ([ SEARCH_TYPE_ALL, SEARCH_TYPE_MINE, SEARCH_TYPE_MEDIA ].includes(type)) {
			return type;
		};

		return S.Record.getTypeById(type) ? type : SEARCH_TYPE_ALL;
	};

	// The in-space chip's global counterpart: fixed chips map 1:1, type chips bucket by
	// the layout their objects get (recommendedLayout -> the global layout chips)
	const getGlobalSearchType = (): string => {
		const type = getSearchType();

		if ([ SEARCH_TYPE_ALL, SEARCH_TYPE_MINE, SEARCH_TYPE_MESSAGE, SEARCH_TYPE_MEDIA, SEARCH_TYPE_MEMBER ].includes(type)) {
			return type;
		};

		const object = S.Record.getTypeById(type);
		const layout = object ? object.recommendedLayout : null;

		if (layout == I.ObjectLayout.Participant) {
			return SEARCH_TYPE_MEMBER;
		};

		return Object.keys(GLOBAL_LAYOUTS).find(key => GLOBAL_LAYOUTS[key].includes(layout)) || SEARCH_TYPE_ALL;
	};

	const getTypeItems = () => {
		// The creator drill replaces the creator-flavored chips (My objects, Members)
		const applyDrillGating = (list: any[]) => {
			return (drillRef.current?.kind == 'creator') ?
				list.filter(it => ![ SEARCH_TYPE_MINE, SEARCH_TYPE_MEMBER ].includes(it.id)) : list;
		};

		const ret: any[] = [
			{ id: SEARCH_TYPE_ALL, name: translate('popupSearchTypeAll') },
			{ id: SEARCH_TYPE_MINE, name: translate('popupSearchTypeMine') },
		];

		if (hasMessageContainers()) {
			ret.push({ id: SEARCH_TYPE_MESSAGE, name: translate('popupSearchTypeMessages') });
		};

		if (isGlobal) {
			const list: any[] = [
				{ id: SEARCH_TYPE_PAGE, name: translate('popupSearchTypePages') },
			];

			if (hasMembers()) {
				list.push({ id: SEARCH_TYPE_MEMBER, name: translate('popupSearchTypeMembers') });
			};

			return applyDrillGating(ret.concat(list, [
				{ id: SEARCH_TYPE_MEDIA, name: translate('commonMedia') },
				{ id: SEARCH_TYPE_BOOKMARK, name: translate('popupSearchTypeBookmarks') },
				{ id: SEARCH_TYPE_COLLECTION, name: translate('popupSearchTypeCollections') },
				{ id: SEARCH_TYPE_QUERY, name: translate('popupSearchTypeQueries') },
				{ id: SEARCH_TYPE_CHAT, name: translate('popupSearchTypeChats') },
				{ id: SEARCH_TYPE_TYPE, name: translate('popupSearchTypeTypes') },
			]));
		};

		const skip = U.Object.getFileLayouts().concat([ I.ObjectLayout.Chat, I.ObjectLayout.ChatOld, I.ObjectLayout.Discussion ]);
		const types = U.Data.getWidgetTypes().
			filter(it => !skip.includes(it.recommendedLayout)).
			map(it => ({ id: it.id, name: U.Object.name(it, true) }));

		ret.push({ id: SEARCH_TYPE_MEDIA, name: translate('commonMedia') });

		if (hasMembers()) {
			ret.push({ id: SEARCH_TYPE_MEMBER, name: translate('popupSearchTypeMembers') });
		};

		return applyDrillGating(ret.concat(types));
	};

	// Keep the active chip visible when the row overflows - selection, restore and "/" mode
	// can land on a chip that is scrolled out of view
	const scrollToActiveChip = () => {
		window.setTimeout(() => {
			const active = U.Dom.select('.typeItem.active', typeSelectRef.current) as HTMLElement;
			active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		});
	};

	const onSearchTypeSwitch = (id: string) => {
		if (searchTypeRef.current == id) {
			return;
		};

		searchTypeRef.current = id;
		storageSet({ [searchTypeKey]: id });

		// The creator drill composes with chips (except My objects - two creator filters
		// would contradict); type/backlink drills clear on any chip switch
		if (drillRef.current && ((drillRef.current.kind != 'creator') || (id == SEARCH_TYPE_MINE))) {
			drillRef.current = null;
			drillBackRef.current = null;
			storageSet({ [drillKey]: null, backlink: '' });
		};

		setDummy(prev => prev + 1);
		filterInputRef.current?.focus();
		reload(true);

		scrollToActiveChip();

		const known = [
			SEARCH_TYPE_ALL, SEARCH_TYPE_MINE, SEARCH_TYPE_MESSAGE, SEARCH_TYPE_PAGE, SEARCH_TYPE_MEDIA, SEARCH_TYPE_MEMBER, SEARCH_TYPE_BOOKMARK,
			SEARCH_TYPE_COLLECTION, SEARCH_TYPE_QUERY, SEARCH_TYPE_CHAT, SEARCH_TYPE_TYPE,
		];
		const type = known.includes(id) ? U.String.ucFirst(id) : 'Type';

		analytics.event('SwitchSearchType', { route, type, isGlobal: Boolean(isGlobal) });
	};

	// Reopen the popup in global (cross-space) mode; callers close the current popup first.
	// The pivot carries the typed query over, maps the active chip to its global
	// counterpart and clears any drill filters - a fresh, widened take on the same search
	const onSearchGlobal = () => {
		const query = filterValueRef.current.startsWith('/') ? '' : filterValueRef.current;

		storageSet({
			filterGlobal: query,
			searchTypeGlobal: getGlobalSearchType(),
			drillGlobal: null,
			lastUsedGlobal: Date.now(),
		});

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

		chatsSubActiveRef.current = true;

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

		return GLOBAL_DEPS.participants.get(participantId) || null;
	};

	// Creator attribution only makes sense in spaces with more than one member. The exact
	// member list only exists for the current space; other spaces use isShared as the proxy
	// (a non-shared space cannot have a second member)
	// Computed once per popup open: getParticipantsList maps every participant record
	// through the detail store - calling it per row was 87% of scroll CPU (perf trace)
	const currentSpaceMembersRef = useRef<boolean | null>(null);

	const spaceHasMembers = (spaceId: string): boolean => {
		if (spaceId == S.Common.space) {
			if (currentSpaceMembersRef.current === null) {
				currentSpaceMembersRef.current = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]).length > 1;
			};

			return currentSpaceMembersRef.current;
		};

		// Other spaces: count actual active members from the participants snapshot -
		// spaceview heuristics (isShared etc.) are unreliable for joined spaces
		return (GLOBAL_DEPS.participantCounts.get(spaceId) || 0) > 1;
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
		// Derived objects (types, chat containers) are created implicitly with the space and
		// always resolve to the space creator - attribution is meaningless there
		if (U.Object.isTypeLayout(item.layout) || U.Object.isChatLayout(item.layout) || (item.layout == I.ObjectLayout.ChatOld) || U.Object.isParticipantLayout(item.layout)) {
			return false;
		};

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

	// The object's creator participant, for the "by <name>" caption.
	// Contract: the caller has already checked wantsCreator - re-checking here doubled the
	// per-row cost (perf trace)
	const getObjectCreator = (item: any): any => {
		const participantId = getCreatorParticipantId(item);
		const object = S.Detail.get(U.Subscription.spaceSubId(J.Constant.subId.participant), participantId, []);

		if (!object._empty_) {
			return object;
		};

		return GLOBAL_DEPS.participants.get(participantId) || null;
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

	// Drill filters. Type: uniqueKey matches the same-named type in every space; creator:
	// every per-space participant id of the person (+ the bare identity for legacy records)
	const getDrillTypeFilter = (object: any): any => {
		const type = S.Record.getTypeById(object.id) || (isGlobal ? GLOBAL_DEPS.types.get(object.id) : null);
		const uniqueKey = object.uniqueKey || type?.uniqueKey;

		return uniqueKey ?
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.Equal, value: uniqueKey } :
			{ relationKey: 'type', condition: I.FilterCondition.Equal, value: object.id };
	};

	const getDrillIdentity = (object: any): string => {
		return object.identity || U.Space.getAccountFromParticipantId(object.id);
	};

	const getDrillCreatorFilter = (object: any): any => {
		const identity = getDrillIdentity(object);
		const ids: string[] = [ identity ];

		if (isGlobal) {
			GLOBAL_DEPS.participants.forEach((v: any, id: string) => {
				if (U.Space.getAccountFromParticipantId(id) == identity) {
					ids.push(id);
				};
			});
		} else {
			ids.push(U.Space.getParticipantId(S.Common.space, identity));
		};

		return { relationKey: 'creator', condition: I.FilterCondition.In, value: ids };
	};

	// The active drill's filter for object searches; backlink stays in-space only
	const getDrillFilters = (): any[] => {
		const drill = drillRef.current;

		if (!drill) {
			return [];
		};

		switch (drill.kind) {
			case 'backlink': {
				const links = Relation.getArrayValue(drill.object.links);
				const backlinks = Relation.getArrayValue(drill.object.backlinks);

				return [ { relationKey: 'id', condition: I.FilterCondition.In, value: [].concat(links, backlinks) } ];
			};

			case 'type': {
				return [ getDrillTypeFilter(drill.object) ];
			};

			case 'creator': {
				return [ getDrillCreatorFilter(drill.object) ];
			};
		};

		return [];
	};

	const loadMessages = (clear: boolean, gen: number, callBack?: () => void, quiet?: boolean) => {
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

			listEpochRef.current++;

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

		// Creator drill narrows messages to the person's identity (heart PR #3246)
		const creators = (drillRef.current?.kind == 'creator') ? [ getDrillIdentity(drillRef.current.object) ] : [];

		// Empty spaceId + empty chatId = all chats in all spaces (global mode)
		C.ChatSearch(isGlobal ? '' : space, '', text, offsetRef.current, J.Constant.limit.menuRecords, sorts, creators, (message: any) => {
			// A newer query started while this one was in flight - drop the stale response
			if (gen != loadGenRef.current) {
				callBack?.();
				return;
			};

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
			// New list: back to the top (quiet reloads keep the List mounted mid-scroll)
			listRef.current?.scrollToPosition(0);

			const items = getItems().filter(it => !it.isSection);

			if (items.length) {
				window.setTimeout(() => setActive(items[0]));
			};
		}, quiet);
	};

	// Global mode: one-shot cross-space search, no subscription. allStoresLoaded=false means
	// the sequential per-space store warm-up is still running and the view is partial - no
	// auto-retry in v1, the next keystroke/chip switch re-queries anyway
	// Global Members: a local view over the participants map - deduplicated by identity with
	// a per-person space count; name matching is a substring test, no fulltext roundtrip
	const loadGlobalMembers = (callBack?: () => void) => {
		const text = filterValueRef.current.toLowerCase();
		const byIdentity = new Map<string, { identity: string; object: any; spaceCount: number }>();

		GLOBAL_DEPS.participants.forEach((it: any, id: string) => {
			if ((it.participantStatus != I.ParticipantStatus.Active) || it.isDeleted) {
				return;
			};

			const identity = U.Space.getAccountFromParticipantId(id);

			let entry = byIdentity.get(identity);

			if (!entry) {
				entry = { identity, object: it, spaceCount: 0 };
				byIdentity.set(identity, entry);
			};

			entry.spaceCount++;

			// Prefer the current space's participant object as the representative
			if (it.spaceId == S.Common.space) {
				entry.object = it;
			};
		});

		let list = [ ...byIdentity.values() ];

		if (text) {
			list = list.filter(({ object }) => {
				return [ object.name, object.globalName ].some(n => String(n || '').toLowerCase().includes(text));
			});
		};

		// People you have 1:1 Channels with come first, in the Vault sidebar's own order
		// (the 1:1 spaceview carries the other person's identity); the rest alphabetically
		const oneToOneOrder = new Map<string, number>();

		U.Menu.getVaultItems().forEach((it: any) => {
			if (it.isOneToOne && it.oneToOneIdentity && !oneToOneOrder.has(it.oneToOneIdentity)) {
				oneToOneOrder.set(it.oneToOneIdentity, oneToOneOrder.size);
			};
		});

		list.sort((a: any, b: any) => {
			const oa = oneToOneOrder.has(a.identity) ? oneToOneOrder.get(a.identity) : -1;
			const ob = oneToOneOrder.has(b.identity) ? oneToOneOrder.get(b.identity) : -1;

			if ((oa >= 0) && (ob >= 0)) {
				return oa - ob;
			};
			if (oa >= 0) {
				return -1;
			};
			if (ob >= 0) {
				return 1;
			};

			return String(a.object.name || '').localeCompare(String(b.object.name || ''));
		});

		itemsRef.current = list.map(({ object, spaceCount }) => ({ ...object, metaList: [], links: [], backlinks: [], isMemberAgg: true, spaceCount }));
		itemsModeRef.current = SEARCH_TYPE_MEMBER;
		hasMoreRef.current = false;
		listEpochRef.current++;

		setIsLoading(false);
		setDummy(prev => prev + 1);
		callBack?.();
	};

	const loadGlobalObjects = (clear: boolean, gen: number, callBack?: () => void, quiet?: boolean) => {
		const searchType = getSearchType();

		if (searchType == SEARCH_TYPE_MEMBER) {
			loadGlobalMembers(callBack);
			return;
		};
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

		getDrillFilters().forEach(it => filters.push(it));

		// Type objects are noise in the empty (recent) browse of All/My objects - every space
		// ships a full set of bundled types; they stay searchable by text and via the Types chip
		if ([ SEARCH_TYPE_ALL, SEARCH_TYPE_MINE ].includes(searchType) && !filterValueRef.current && !drillRef.current) {
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

			listEpochRef.current++;

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
			// A newer query started while this one was in flight - drop the stale response
			if (gen != loadGenRef.current) {
				callBack?.();
				return;
			};

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


			if (!clear) {
				setDummy(prev => prev + 1);
			};

			done();
			callBack?.();
		});
	};

	const load = (clear: boolean, callBack?: () => void, quiet?: boolean) => {
		if (clear) {
			loadGenRef.current++;
		};

		const gen = loadGenRef.current;

		// "/" command mode searches chips/actions locally - no backend query
		if (filterValueRef.current.startsWith('/')) {
			itemsRef.current = [];
			hasMoreRef.current = false;
			listEpochRef.current++;
			setDummy(prev => prev + 1);
			callBack?.();
			return;
		};

		const searchType = getSearchType();

		if (searchType == SEARCH_TYPE_MESSAGE) {
			loadMessages(clear, gen, callBack, quiet);
			return;
		};

		if (isGlobal) {
			loadGlobalObjects(clear, gen, callBack, quiet);
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
		if (searchType == SEARCH_TYPE_MEMBER) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: [ I.ObjectLayout.Participant ] });
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

		if (!filterValueRef.current && clear && !drillRef.current) {
			limit = RECENT_LIMIT;
		};

		getDrillFilters().forEach(it => filters.push(it));

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

			listEpochRef.current++;

			if (quiet) {
				setDummy(prev => prev + 1);
			} else {
				setIsLoading(false);
			};
		};

		C.ObjectSearchWithMeta(space, filters, sorts, J.Relation.default.concat([ 'pluralName', 'links', 'backlinks', 'creator', '_final_score' ]), filterValueRef.current, offsetRef.current, limit, (message) => {
			// A newer query started while this one was in flight - drop the stale response
			if (gen != loadGenRef.current) {
				callBack?.();
				return;
			};

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

	// "/" command mode: search the chips and actions themselves; selecting a chip switches
	// to it (single match + Enter selects it via the auto-active first row)
	const getCommandItems = (query: string) => {
		const reg = query ? new RegExp(U.String.regexEscape(query), 'gi') : null;
		const canWrite = U.Space.canMyParticipantWrite();

		let items: any[] = getTypeItems().map(it => ({
			id: `chip-${it.id}`,
			chipId: it.id,
			name: it.name,
			iconParam: { name: 'common/search' },
			isChip: true,
		}));

		if (!isGlobal) {
			if (canWrite) {
				items.push({ id: 'add', name: translate('commonCreateObject'), iconParam: { name: 'plus/menu' } });
				items.push({ id: 'upload', name: translate('popupSearchUploadFile'), iconParam: { name: 'plus/menu' } });
			};

			items.push({ id: 'searchGlobal', name: translate('popupSearchSearchGlobal'), iconParam: { name: 'common/search' } });
		};

		if (reg) {
			items = items.filter(it => String(it.name || '').match(reg));
		};

		return items.map(it => ({ ...it, isSmall: true, shortcut: [] }));
	};

	const getItems = () => {
		// filterValueRef, not the input handle: Input keeps its value in React state, so
		// getValue() lags one commit behind programmatic setValue('') - deriving the mode
		// from it left the list stuck in "/" command mode after selecting a chip
		const filter = filterValueRef.current;

		if (filter.startsWith('/')) {
			return getCommandItems(filter.substring(1).trim());
		};
		const lang = J.Constant.default.interfaceLang;
		const canWrite = U.Space.canMyParticipantWrite();
		// Present the items by the mode they were loaded for - during a quiet reload the
		// previous list stays on screen while the selected chip already changed
		const searchType = itemsModeRef.current || getSearchType();
		const isAll = searchType == SEARCH_TYPE_ALL;

		if (searchType == SEARCH_TYPE_MESSAGE) {
			const items: any[] = [].concat(itemsRef.current).map(it => ({ ...it, isMessage: true, shortcut: [] }));

			// The creator drill composes with the Messages chip - keep its header visible
			if (drillRef.current?.kind == 'creator') {
				items.unshift({
					name: U.String.sprintf(translate('popupSearchDrillCreator'), U.Object.name(drillRef.current.object)),
					isSection: true,
					withClear: true,
					shortcut: [],
				});
			} else
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

		if (drillRef.current) {
			const { kind, object } = drillRef.current;

			let name = '';

			switch (kind) {
				case 'backlink': name = U.String.sprintf(translate('popupSearchBacklinksFrom'), object.name); break;
				case 'type': name = U.String.sprintf(translate('popupSearchDrillType'), U.Object.name(object, true)); break;
				case 'creator': name = U.String.sprintf(translate('popupSearchDrillCreator'), U.Object.name(object)); break;
			};

			items.unshift({ name, isSection: true, withClear: true });
		} else
		if (!filter && items.length) {
			// The global Members list is a local alphabetical aggregate - plain title, no order
			if (isGlobal && (searchType == SEARCH_TYPE_MEMBER)) {
				items.unshift({ name: translate('popupSearchTypeMembers'), isSection: true });
			} else {

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

		// Chip picked from "/" command mode: switch to it, clear the query, keep the popup.
		// Cancel the pending debounced filter change - it would re-apply the stale "/query"
		// after the switch and empty the list
		if (item.isChip) {
			window.clearTimeout(timeoutRef.current);
			filterInputRef.current?.setValue('');
			filterValueRef.current = '';
			storageSet({ [filterKey]: '' });

			if (searchTypeRef.current == item.chipId) {
				reload(true);
				scrollToActiveChip();
			} else {
				onSearchTypeSwitch(item.chipId);
			};

			return;
		};

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
		const filter = isStale ? '' : String(storage[filterKey] || '');

		const setFilter = () => {
			if (!filterInputRef.current) {
				return;
			};

			rangeRef.current = { from: 0, to: filter.length };
			filterInputRef.current.setValue(filter);
			filterInputRef.current.setRange(rangeRef.current);

			reload();
			scrollToActiveChip();
		};

		focus.clear(true);
		rebindTimeoutRef.current = window.setTimeout(() => rebind(), J.Constant.delay.popup);

		if (isGlobal) {
			// First-ever use starts the app-lifetime subscriptions (one redraw when the
			// initial data lands); later opens sync from memory - no redraw
			subscribeGlobalDeps(() => {
				if (getSearchType() == SEARCH_TYPE_MEMBER) {
					reload(true);
				} else {
					setDummy(prev => prev + 1);
				};
			});
		};

		// Restore a saved drill (legacy storage.backlink migrates to the backlink kind)
		let saved: any = !isStale ? storage[drillKey] : null;

		if (!saved && !isStale && !isGlobal && storage.backlink) {
			saved = { kind: 'backlink', id: storage.backlink };
		};

		if (saved && !isGlobal) {
			drillBackRef.current = saved.back || null;

			// getByIds always fires; getById drops the callback on a miss (deleted target)
			// and the popup would never run its initial load
			U.Object.getByIds([ saved.id ], {}, records => {
				const item = (records || [])[0];

				if (item) {
					setDrillState(saved.kind, item, 'Saved', () => setFilter());
				} else {
					drillBackRef.current = null;
					storageSet({ [drillKey]: null, backlink: '' });
					setFilter();
				};
			});
		} else
		if (saved && isGlobal) {
			// Global drills restore from the in-memory maps; a miss drops the drill
			const object = (saved.kind == 'type') ? GLOBAL_DEPS.types.get(saved.id) : GLOBAL_DEPS.participants.get(saved.id);

			if (object) {
				drillBackRef.current = saved.back || null;
				setDrillState(saved.kind, object, 'Saved', () => setFilter());
			} else {
				setFilter();
			};
		} else {
			setFilter();
		};

		analytics.event('ScreenSearch', { route, type: (filter ? 'Saved' : 'Empty') });

		return () => {
			unbind();
			window.clearTimeout(timeoutRef.current);
			window.clearTimeout(rebindTimeoutRef.current);

			if (chatsSubActiveRef.current) {
				U.Subscription.destroyList([ chatsSubId ], true);
			};

			// Closing stamps the session - the next open compares against it
			storageSet({ [lastUsedKey]: Date.now() });
		};
	}, []);

	useEffect(() => {
		const items = getItems();

		// nRef often points at a section header after a reload (no id, nothing to highlight)
		// - fall to the first real row
		let active = items[nRef.current];

		if (!active || active.isSection) {
			active = items.find(it => !it.isSection);
		};

		setActive(active);
		checkTypeSelectFade();

		// Reset measured heights only when a new list replaced the old one; wiping the
		// cache on infinite-scroll appends collapsed every off-screen row to its estimate
		// and made the list jump under the cursor
		if (listRef.current && (cacheGenRef.current != listEpochRef.current)) {
			cacheGenRef.current = listEpochRef.current;
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
								{author ? (
									<ObjectName
										object={author}
										className="name drillLink"
										onClick={e => { e.stopPropagation(); startDrill('creator', author); }}
									/>
								) : (
									<ObjectName object={author} />
								)}
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
											<div className="prep">{translate('popupSearchInSpace')}</div>
											<IconObject object={spaceview} size={14} />
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
			const type = S.Record.getTypeById(item.type) || (isGlobal ? GLOBAL_DEPS.types.get(item.type) : null);

			const drillKind = getDrillKind(item);

			let advanced = null;

			if (drillKind) {
				const tooltips = {
					backlink: 'popupSearchTooltipSearchByBacklinks',
					type: 'popupSearchTooltipSearchByType',
					creator: 'popupSearchTooltipSearchByCreator',
				};

				advanced = (
					<Icon
						name="arrow/forward" 
						className="advanced"
						size={28}
						tooltipParam={{ 
							text: translate(tooltips[drillKind]), 
							caption: `${shift} + Enter ${translate('commonOr')} →`
						}}
						onClick={e => onDrill(e, item)}
					/>
				);
			};

			const spaceview = (isGlobal && !item.isMemberAgg) ? U.Space.getSpaceviewBySpaceId(item.spaceId) : null;
			const creatorLabel = getObjectCreatorLabel(item);
			const creatorObject = creatorLabel ? getObjectCreator(item) : null;
			const memberSpaces = item.isMemberAgg ?
				`${translate('popupSearchInSpace')} ${item.spaceCount} ${U.Common.plural(item.spaceCount, translate('pluralChannel'))}` : '';

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
							{memberSpaces ? <div className="prep">{memberSpaces}</div> : (
								<div className="drillLink" onClick={e => { e.stopPropagation(); startDrill('type', type); }}>
									<ObjectType object={type} />
								</div>
							)}
							{creatorLabel ? (
								<>
									<div className="bullet" />
									{creatorObject ? (
										<div className="creator drillLink" onClick={e => { e.stopPropagation(); startDrill('creator', creatorObject); }}>{creatorLabel}</div>
									) : (
										<div className="creator">{creatorLabel}</div>
									)}
								</>
							) : ''}
							{spaceview ? (
								<>
									<div className="bullet" />
									<div className="prep">{translate('popupSearchInSpace')}</div>
									<IconObject object={spaceview} size={14} />
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
		const isAction = item && (item.isSettings || item.isImport || item.isChip || [ 'add', 'addType', 'upload', 'graph', 'navigation', 'searchGlobal' ].includes(item.id));

		return (
			<div className="foot">
				<Shortcut keys={[ 'arrowup', 'arrowdown', 'arrowright' ]} label={translate('popupSearchShortcutNavigate')} />
				{!onObjectSelect ? (
					<Shortcut keys={[ 'tab', '/' ]} separator={translate('commonOr')} label={translate('popupSearchShortcutSwitchType')} />
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

			{/* Always mounted: the popup height is fixed - the middle zone holding its
			space keeps the footer and chips from jumping while a load swaps the content */}
			<div className="items">
				{!items.length && !isLoading ? (
					<EmptySearch
						filter={filterValueRef.current}
						text={(searchType == SEARCH_TYPE_MESSAGE) ? translate('menuSearchChatEmptySearch') : ''}
					/>
				) : ''}

				{cacheRef.current && items.length && !isLoading ? (
					<InfiniteLoader
						rowCount={items.length + (hasMoreRef.current ? 1 : 0)}
						loadMoreRows={loadMoreRows}
						isRowLoaded={({ index }) => index < items.length}
						threshold={LOAD_THRESHOLD}
					>
						{({ onRowsRendered }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={listRef}
										width={width}
										height={height}
										deferredMeasurementCache={cacheRef.current}
										rowCount={items.length + (hasMoreRef.current ? 1 : 0)}
										rowHeight={param => getRowHeight(items[param.index], param.index)}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										onScroll={onScroll}
										scrollToAlignment="center"
										overscanRowCount={10}
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				) : ''}
			</div>

			{Footer()}
		</div>
	);

});

export default PopupSearch;
