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
// Cross-space fulltext page size: smaller than the in-space page (100) - the vault-wide
// fulltext query is the slow path and time-to-first-results matters more than page depth
// (infinite scroll fills the rest)
const GLOBAL_QUERY_LIMIT = 50;
// Person chips shown inline in the suggestion row besides "My objects"; the full people
// list stays reachable via /by
const PERSON_CHIP_LIMIT = 3;
// More members fit in the row while the what group is filled and its chips are hidden
// (the row scrolls with the edge fade on overflow)
const PERSON_CHIP_LIMIT_FILLED = 10;
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

// Filter tokens rendered inside the search input. Tokens combine across groups (AND) and
// replace within a group. The space kind is part of the model for the global/scoped modes
// (spec phases 2-3); phase 1 never creates one
type TokenKind = 'space' | 'kind' | 'type' | 'creator' | 'backlink';

interface SearchToken {
	kind: TokenKind;
	id: string;
	object?: any;
	// Back snapshot for row-added tokens (drills, caption clicks, People picks) - removing
	// the most recently row-added token restores the pre-add spot
	back?: any;
	// Insertion sequence - identifies the most recently row-added token
	seq?: number;
};

// Exclusivity groups - at most one token per group; adding another replaces in place
const TOKEN_GROUPS: { [key: string]: string } = {
	space: 'scope',
	kind: 'what',
	type: 'what',
	creator: 'who',
	backlink: 'relation',
};

// Translation keys of the layout-bucket ("kind") token names
const KIND_NAME_KEYS: { [key: string]: string } = {
	[SEARCH_TYPE_MESSAGE]: 'popupSearchTypeMessages',
	[SEARCH_TYPE_PAGE]: 'popupSearchTypePages',
	[SEARCH_TYPE_MEDIA]: 'commonMedia',
	[SEARCH_TYPE_BOOKMARK]: 'popupSearchTypeBookmarks',
	[SEARCH_TYPE_COLLECTION]: 'popupSearchTypeCollections',
	[SEARCH_TYPE_QUERY]: 'popupSearchTypeQueries',
	[SEARCH_TYPE_CHAT]: 'popupSearchTypeChats',
	[SEARCH_TYPE_TYPE]: 'popupSearchTypeTypes',
};

// Singular forms for the "/" list's command-argument grammar ("/is Page", not "/is Pages")
const KIND_NAME_KEYS_SINGULAR: { [key: string]: string } = {
	[SEARCH_TYPE_MESSAGE]: 'popupSearchKindMessage',
	[SEARCH_TYPE_PAGE]: 'popupSearchKindPage',
	[SEARCH_TYPE_MEDIA]: 'commonMedia',
	[SEARCH_TYPE_BOOKMARK]: 'popupSearchKindBookmark',
	[SEARCH_TYPE_COLLECTION]: 'popupSearchKindCollection',
	[SEARCH_TYPE_QUERY]: 'popupSearchKindQuery',
	[SEARCH_TYPE_CHAT]: 'popupSearchKindChat',
	[SEARCH_TYPE_TYPE]: 'popupSearchKindType',
};

const isMac = U.Common.isPlatformMac();

// Cross-space search dependencies, shared across popup instances for the app session.
// Two live subscriptions (participants, types) started on first global-search use; rows read
// these compact plain maps - never the detail store on the hot path. Reopens ingest new ids
// incrementally from the stores, so results render attributed on first paint with no redraw
const GLOBAL_DEPS = {
	accountId: '',
	subscribed: false,
	// True from issuing the subscriptions until the first participants reply lands -
	// the liveness ("dead") heuristic must not fire in that window
	pending: false,
	participants: new Map<string, any>(),
	participantCounts: new Map<string, number>(),
	types: new Map<string, any>(),
	// The open popup's redraw hook - the newest registrant wins, so a subscription
	// reply landing after a quick close+reopen notifies the live popup, not a dead
	// closure (registered in subscribeGlobalDeps, cleared on unmount)
	onLoad: null as (() => void) | null,
};

const SUB_GLOBAL_PARTICIPANTS = 'searchGlobalParticipants';
const SUB_GLOBAL_TYPES = 'searchGlobalTypes';
// Only what rendering reads - keeps the payload and the maps compact
const KEYS_GLOBAL_PARTICIPANT = [ 'id', 'spaceId', 'name', 'globalName', 'iconImage', 'layout', 'resolvedLayout', 'isDeleted', 'participantStatus' ];
const KEYS_GLOBAL_TYPE = [ 'id', 'spaceId', 'name', 'pluralName', 'uniqueKey', 'layout', 'recommendedLayout', 'resolvedLayout', 'isDeleted', 'isHidden', 'iconName', 'iconEmoji', 'iconImage', 'iconOption' ];

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

// Rebuild the compact maps from the live subscription stores: subscription events
// stream into the record store between (and during) popup opens, so entries refresh
// (renames, deletions, left Channels evict) on every entry into cross-space mode -
// the maps are a per-entry snapshot, not a live mirror
const syncGlobalDeps = () => {
	GLOBAL_DEPS.participants.clear();
	GLOBAL_DEPS.participantCounts.clear();
	GLOBAL_DEPS.types.clear();

	S.Record.getRecordIds(SUB_GLOBAL_PARTICIPANTS, '').forEach(id => {
		ingestGlobalParticipant(S.Detail.get(SUB_GLOBAL_PARTICIPANTS, id, KEYS_GLOBAL_PARTICIPANT));
	});

	S.Record.getRecordIds(SUB_GLOBAL_TYPES, '').forEach(id => {
		ingestGlobalType(S.Detail.get(SUB_GLOBAL_TYPES, id, KEYS_GLOBAL_TYPE));
	});
};

const subscribeGlobalDeps = (onLoad: () => void) => {
	const accountId = S.Auth.account?.id || '';

	// Register before any early return: a popup opened while the first subscription
	// reply is still in flight must get the redraw when it lands
	GLOBAL_DEPS.onLoad = onLoad;
	// Logout destroys all subscriptions and wipes the record store; a live participants
	// subscription always holds at least your own participant - empty means "dead".
	// Not while the first replies are still in flight though: a second call in that
	// window (mount effect + resolveTokens) must not wipe the maps and re-subscribe
	const dead = !GLOBAL_DEPS.pending && !S.Record.getRecordIds(SUB_GLOBAL_PARTICIPANTS, '').length;

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
	GLOBAL_DEPS.pending = true;
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
		GLOBAL_DEPS.pending = false;
		(message.records || []).forEach(it => ingestGlobalParticipant(S.Detail.mapper(it)));
		GLOBAL_DEPS.onLoad?.();
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
		GLOBAL_DEPS.onLoad?.();
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
	const { route, onObjectSelect, skipIds } = data;
	// data.isGlobal is an entry-point alias: Cmd+Shift+K and the vault icon open without
	// the space scope token, everything else opens scoped to the current space. The live
	// mode derives from the tokens (isGlobal()), not from this param
	const initialGlobal = Boolean(data.isGlobal) && !data.onObjectSelect;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	// Filter tokens shown inside the search input: what (kind bucket / specific type),
	// who (creator) and relation (backlink) combine across groups and replace within one
	const tokensRef = useRef<SearchToken[]>([]);
	// Monotonic insertion counter - identifies the most recently row-added token for Back
	const tokenSeqRef = useRef(0);
	// Seed the scope slot synchronously so the very first paint renders the right mode -
	// the full token restore (storage, resolution) is async in the mount effect
	const seededRef = useRef(false);

	if (!seededRef.current) {
		seededRef.current = true;

		if (!initialGlobal) {
			const spaceview = U.Space.getSpaceview();

			if (spaceview && !spaceview._empty_) {
				// The token id is the spaceId (the filter and comparison currency); the
				// object renders the pill
				tokensRef.current.push({ kind: 'space', id: spaceview.targetSpaceId, object: { ...spaceview, id: spaceview.targetSpaceId }, seq: ++tokenSeqRef.current });
			};
		};
	};
	// Transient Tab highlight over the suggestion chips - keyed by chip id, not index, so
	// the row recomputing under it (subscription events, member churn) can never shift the
	// highlight onto a different chip; dropped by typing, arrows, Escape, any token change
	const chipHighlightRef = useRef('');
	const nodeRef = useRef(null);
	const filterInputRef = useRef(null);
	const listRef = useRef(null);
	const rowsRef = useRef([]);
	const timeoutRef = useRef(0);
	const rebindTimeoutRef = useRef(0);
	const delayRef = useRef(0);
	// The measurement cache is keyed by stable row identity, not index: appends shift
	// the trailing rows (Actions section) and row removals remap indexes - index keys
	// would re-apply a neighbour's measured height to the wrong row
	const renderItemsRef = useRef<any[]>([]);
	const cacheRef = useRef(new CellMeasurerCache({
		fixedWidth: true,
		defaultHeight: HEIGHT_SECTION,
		keyMapper: (index: number) => {
			const it = renderItemsRef.current[index];
			return it ? (it.isSection ? `section-${it.name}` : it.id) : `sentinel-${index}`;
		},
	}));
	const itemsRef = useRef([]);
	const nRef = useRef(0);
	const topRef = useRef(0);
	const offsetRef = useRef(0);
	const rangeRef = useRef<I.TextRange>({ from: 0, to: 0 });
	const storage = storageGet();
	// Phase 1 of the token work kept a second key set for the global popup; until the
	// one-shot merge in the mount effect clears it, the side used more recently wins
	const legacyGlobalSide = (Number(storage.lastUsedGlobal) || 0) > (Number(storage.lastUsed) || 0);
	const lastUsed = Math.max(Number(storage.lastUsed) || 0, Number(storage.lastUsedGlobal) || 0);
	// Stale session: reset query and tokens to defaults instead of restoring
	const isStale = Boolean(lastUsed && (Date.now() - lastUsed > STATE_RESET_TIMEOUT));
	const filter = isStale ? '' : String((legacyGlobalSide ? storage.filterGlobal : storage.filter) || '');
	const filterValueRef = useRef(filter);
	// The input value as of the last input event or programmatic write - onFilterChange
	// compares against it to ignore no-change keyups during the debounce window
	const pendingValueRef = useRef(filter);
	// Empty-browse order of All/My objects: 'edited' (lastModifiedDate) or 'created' (createdDate)
	const recentSortRef = useRef(String((legacyGlobalSide ? storage.recentSortGlobal : storage.recentSort) || 'edited'));
	// The token signature the currently held items were loaded for ({ id, what }). During
	// a quiet reload the previous list stays on screen - render it by its own mode, not by
	// the freshly changed tokens
	const itemsModeRef = useRef<any>(null);
	const typeSelectRef = useRef(null);
	const chatIdsRef = useRef<string[]>([]);
	// Whether the last page came back full - drives the infinite-scroll sentinel row
	const hasMoreRef = useRef(false);
	// Bumped on every clear-load: responses stamped with an older generation are dropped,
	// so a slow superseded query can never clobber the current list
	const loadGenRef = useRef(0);
	// True while a clear-load is in flight; infinite-scroll appends hold off (they would
	// share the clear's generation and race it across a token/mode change)
	const clearLoadPendingRef = useRef(false);
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
		// Escape only closes - tokens are never removed by it (removal is x and Backspace
		// at the query start). A transient chip highlight absorbs the press first
		keyboard.shortcut('escape', e, () => {
			if (chipHighlightRef.current) {
				clearChipHighlight(true);
				return;
			};

			close();
		});

		keyboard.shortcut('shift+enter', e, () => {
			if (item && getDrillKind(item)) {
				onDrill(e, item);
			};
		});

		// Backspace with the caret at position 0 and no selection removes the rightmost
		// token (the GitHub in-input scope pattern). The live DOM selection, not the
		// Input's cached range - the cache goes stale after programmatic setValue
		keyboard.shortcut('backspace', e, () => {
			const tokens = getTokens();

			if (!tokens.length) {
				return;
			};

			const node = filterInputRef.current?.getNode();

			// A blurred input still reports selection offsets of 0 - only a focused
			// input's caret position means anything (clicking e.g. the sort switch
			// drops focus to body; Backspace then must not eat a token)
			if (!node || (document.activeElement != node) || node.selectionStart || node.selectionEnd) {
				return;
			};

			e.preventDefault();
			removeToken(tokens[tokens.length - 1], 'Backspace');
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
			clearChipHighlight(true);

			const dir = [ 'arrowup', 'ctrl+p' ].includes(pressed) ? -1 : 1;
			onArrow(dir);
		});

		// Focus stays in the input (command palette convention) - Tab walks a highlight
		// across the suggestion chips (wrapping); Enter applies the highlighted one. The
		// highlight is transient: typing, arrows and Escape drop it
		keyboard.shortcut('tab, shift+tab', e, (pressed: string) => {
			if (onObjectSelect) {
				return;
			};

			e.preventDefault();

			const chips = getSuggestionItems();

			if (!chips.length) {
				return;
			};

			const dir = (pressed == 'tab') ? 1 : -1;
			const current = chips.findIndex(it => it.id == chipHighlightRef.current);
			const next = (current < 0) ?
				((dir > 0) ? 0 : chips.length - 1) :
				(current + dir + chips.length) % chips.length;

			chipHighlightRef.current = chips[next].id;
			setDummy(prev => prev + 1);
			scrollToActiveChip();
		});

		keyboard.shortcut(`${cmd}+shift+enter`, e, () => {
			const item = items[nRef.current];
			if (item) {
				onClick(e, item);
			};
		});

		keyboard.shortcut(`enter, ${cmd}+enter`, e, (pressed: string) => {
			// Enter applies the highlighted suggestion chip while the Tab highlight is up;
			// matched by id - a vanished chip falls through to the list action
			if ((pressed == 'enter') && chipHighlightRef.current) {
				const chip = getSuggestionItems().find(it => it.id == chipHighlightRef.current);

				clearChipHighlight(false);

				if (chip) {
					onChipAdd(chip);
					return;
				};
			};

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
			if (item && item.isObject && !item.isCommandSuggest) {
				const spaceview = U.Space.getSpaceviewBySpaceId(item.spaceId || S.Common.space);

				if (spaceview) {
					U.Object.copyLink(item, spaceview, 'web', route);
				};
			};
		});

		// The create shortcut triggers the active browse's create action, same as its
		// Actions row
		keyboard.shortcut('createObject', e, () => {
			e.preventDefault();
			e.stopPropagation();

			const what = getWhatToken();

			// Global mode and a foreign Channel scope have no per-chip create actions
			// (creation targets the current space) - fall back to the default create
			if (!isCurrentSpace()) {
				close(() => pageCreate(filter));
			} else
			if (what && (what.kind == 'kind') && (what.id == SEARCH_TYPE_MEDIA)) {
				close();
				window.setTimeout(() => {
					U.Menu.onFileUploadPopup(I.ObjectLayout.File, '', {}, undefined, analytics.route.uploadGlobalMenu);
				}, S.Popup.getTimeout());
			} else
			if (what && (what.kind == 'type')) {
				close(() => createTypedObject(what.id, filter));
			} else {
				close(() => pageCreate(filter));
			};
		});

		keyboard.shortcut('search', e, () => close());

		// Cmd+Shift+K toggles the space scope token in place: removing it widens the
		// same query vault-wide, re-adding narrows back. keyboard.ts always yields the
		// combo while the popup is open
		if (!onObjectSelect) {
			keyboard.shortcut(`${cmd}+shift+k`, e, () => {
				e.preventDefault();
				onScopeToggle();
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
			// While more pages are loading the end is not the end - stay on the last
			// row instead of a surprising jump to the top
			nRef.current = hasMoreRef.current ? l - 1 : 0;
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

		// The List renders with 8px vertical padding - without it the active row's
		// bottom edge stays clipped at the container edge
		const pad = 8;

		if (offset - headH < top) {
			listRef.current.scrollToPosition(Math.max(0, offset - headH));
		} else
		if (offset + rowH + pad > top + listHeight) {
			listRef.current.scrollToPosition(offset + rowH + pad - listHeight);
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
		// Keyups that did not change the text (Tab, arrows, modifiers) must not drop
		// the chip highlight or push back the pending debounce - compare against the
		// last SEEN input value, not the committed one (which lags by the debounce)
		if (pendingValueRef.current == v) {
			return;
		};

		pendingValueRef.current = v;
		window.clearTimeout(timeoutRef.current);

		if (filterValueRef.current == v) {
			return;
		};

		// Typing drops the transient chip highlight
		clearChipHighlight(true);

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

	// Drill kind of a row: type rows search the type's instances, participant rows search
	// objects created by the person, rows with links search related objects (in-space only -
	// the object graph is per-space)
	const getDrillKind = (item: any): string => {
		if (!item || !item.isObject || item.isCommandSuggest) {
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

		// Global rows carry no links data (the one-shot RPC zeroes them) - the data
		// gate alone decides in both modes
		if (links.length || backlinks.length) {
			return 'backlink';
		};

		return '';
	};

	// Derived, never stored: no space scope token = vault-wide (global) search. A
	// function, not a render const - closures bound once at mount (the window keydown
	// handler) must read the live value
	const isGlobal = (): boolean => {
		return !tokensRef.current.some(it => it.kind == 'space');
	};

	// The scope token's space id; '' = no scope (global mode)
	const getScopeId = (): string => {
		return tokensRef.current.find(it => it.kind == 'space')?.id || '';
	};

	// The scope is the current space - the local data path (space stores, fulltext
	// highlights, settings rows, create actions). Not the inverse of isGlobal(): a scope
	// on ANOTHER Channel shows the Channel token and its chips but rides the cross-space
	// data path, so those gates must read this, not isGlobal()
	const isCurrentSpace = (): boolean => {
		return getScopeId() == S.Common.space;
	};

	// Scoped to another Channel (phase 3): the Channel token and that Channel's chips,
	// with the cross-space one-shot loaders (no highlights, no create actions)
	const isForeignScope = (): boolean => {
		const scopeId = getScopeId();
		return Boolean(scopeId) && (scopeId != S.Common.space);
	};

	// Row presentation during a quiet reload follows the mode the on-screen items were
	// loaded for - the tokens may already be flipped while the previous list shows
	const isRenderGlobal = (): boolean => {
		return itemsModeRef.current ? Boolean(itemsModeRef.current.isGlobal) : isGlobal();
	};

	const isRenderForeign = (): boolean => {
		const mode = itemsModeRef.current;
		return mode ? Boolean(mode.spaceId) && (mode.spaceId != S.Common.space) : isForeignScope();
	};

	// Rows loaded by the cross-space path (global mode or another Channel's scope):
	// space captions, cross-space chat/author resolution, no context menu
	const isRenderCross = (): boolean => {
		return isRenderGlobal() || isRenderForeign();
	};

	// Insertion order with the scope first: the space token renders leftmost, and
	// Backspace-at-0 pops from the right of the rendered order (the scope falls last).
	// Pickers pin the scope to the current space - not rendered, not removable
	const getTokens = (): SearchToken[] => {
		const tokens = tokensRef.current;
		const scope = onObjectSelect ? [] : tokens.filter(it => it.kind == 'space');

		return [ ...scope, ...tokens.filter(it => it.kind != 'space') ];
	};

	const getTokenByGroup = (group: string): SearchToken | null => {
		return tokensRef.current.find(it => TOKEN_GROUPS[it.kind] == group) || null;
	};

	const getWhatToken = () => getTokenByGroup('what');
	const getCreatorToken = () => getTokenByGroup('who');
	const getBacklinkToken = () => getTokenByGroup('relation');

	// creator tokens hold a participant id; the identity is encoded in it (or carried on
	// the resolved object)
	const getTokenIdentity = (token: SearchToken): string => {
		return token.object?.identity || U.Space.getAccountFromParticipantId(token.id) || token.id;
	};

	const isSelfToken = (token: SearchToken): boolean => {
		return Boolean(S.Auth.account) && (getTokenIdentity(token) == S.Auth.account.id);
	};

	// Tokens persist as bare { kind, id } and resolve on open; Back snapshots are session-only
	const persistTokens = () => {
		storageSet({ tokens: tokensRef.current.map(it => ({ kind: it.kind, id: it.id })) });
	};

	// Programmatic query changes must also write the ref and storage - the Input keeps its
	// value in React state, so getValue() lags one commit behind setValue
	const clearQuery = () => {
		window.clearTimeout(timeoutRef.current);
		filterInputRef.current?.setValue('');
		filterValueRef.current = '';
		pendingValueRef.current = '';
		storageSet({ filter: '' });
	};

	const clearChipHighlight = (render?: boolean) => {
		if (!chipHighlightRef.current) {
			return;
		};

		chipHighlightRef.current = '';

		if (render) {
			setDummy(prev => prev + 1);
		};
	};

	// Keep focus in the input after mouse-started token mutations (bare divs steal focus).
	// Any token change recomputes the suggestion row, so the chip highlight drops
	const afterTokenChange = () => {
		chipHighlightRef.current = '';
		setDummy(prev => prev + 1);
		filterInputRef.current?.focus();
		reload(true);
	};

	// Add a token, replacing any token in the same exclusivity group. fromRow: the token
	// came from a drill-style gesture (row arrow, caption click, People pick) - push a Back
	// snapshot and clear the query (the row was found by the old query; the new search is
	// about the drilled thing). Chip- and command-added tokens keep the query
	const addToken = (kind: TokenKind, object: any, param?: { source?: string; fromRow?: boolean }) => {
		if (!object || !object.id) {
			return;
		};

		const { source, fromRow } = param || {};
		const prevScopeId = getScopeId();
		const tokens = tokensRef.current;
		const group = TOKEN_GROUPS[kind];
		const idx = tokens.findIndex(it => TOKEN_GROUPS[it.kind] == group);
		const existing = (idx >= 0) ? tokens[idx] : null;

		// Same token again - nothing to change; a row gesture still clears the query
		// (drill semantics), then get back to results
		if (existing && (existing.kind == kind) && (existing.id == object.id)) {
			if (fromRow) {
				clearQuery();
			};

			afterTokenChange();
			return;
		};

		const token: SearchToken = { kind, id: object.id, object, seq: ++tokenSeqRef.current };

		if (fromRow) {
			token.back = {
				tokens: tokens.map(it => ({ ...it })),
				filter: filterValueRef.current,
				itemId: getItems()[nRef.current]?.id || '',
				top: topRef.current,
				count: itemsRef.current.length,
			};
		};

		if (idx >= 0) {
			tokens.splice(idx, 1, token);
		} else {
			tokens.push(token);
		};

		if (fromRow) {
			clearQuery();
		};

		// Any scope change - adding a scope to a global search, or re-pointing it at
		// another Channel - crosses the mode boundary in place
		if (prevScopeId != getScopeId()) {
			onCrossBoundary();
		};

		persistTokens();
		afterTokenChange();

		// Alias emissions for continuity with the drill-era analytics
		if (kind == 'backlink') {
			analytics.event('SearchBacklink', { route, type: 'Empty' });
		};

		if (fromRow) {
			analytics.event('SearchDrill', { route, type: 'Empty', drillType: kind, isGlobal: isGlobal() });
		};

		analytics.event('SearchToken', { type: U.String.ucFirst(kind), action: (existing ? 'Replace' : 'Add'), source: source || '', isGlobal: isGlobal() });
	};

	// Removing the most recently row-added token via its x or Backspace pops its Back
	// snapshot (restores tokens, query, loaded depth, scroll and the active row); any
	// other removal just reloads with the query kept
	const removeToken = (token: SearchToken, source?: string) => {
		if (!token) {
			return;
		};

		const tokens = tokensRef.current;
		const idx = tokens.findIndex(it => (it.kind == token.kind) && (it.id == token.id));

		if (idx < 0) {
			return;
		};

		const prevScopeId = getScopeId();
		const maxRowSeq = Math.max(0, ...tokens.filter(it => it.back).map(it => it.seq || 0));
		const canRestore = Boolean(token.back) && (token.seq == maxRowSeq) && [ 'Token', 'Backspace' ].includes(source);

		tokens.splice(idx, 1);

		// Removing the space token widens to vault-wide search in place, mapping the
		// what token across the boundary; a snapshot restore instead swaps the whole
		// state (exact undo - no mapping)
		if (!canRestore && (prevScopeId != getScopeId())) {
			onCrossBoundary();
		};

		persistTokens();

		analytics.event('SearchToken', { type: U.String.ucFirst(token.kind), action: 'Remove', source: source || '', isGlobal: isGlobal() });

		if (canRestore) {
			restoreBack(token.back);

			// The restored state may sit on the other side of a scope boundary - global
			// mode and a foreign scope both need the cross-space deps (idempotent)
			if (!isCurrentSpace()) {
				subscribeGlobalDeps(onGlobalDepsLoad);
			};
		} else {
			// An explicitly removed token must not resurrect from another token's Back
			// snapshot later - strip it from every remaining snapshot (snapshots nest)
			const strip = (list: SearchToken[]) => {
				list.forEach(it => {
					if (it.back?.tokens) {
						it.back.tokens = it.back.tokens.filter(t => !((t.kind == token.kind) && (t.id == token.id)));
						strip(it.back.tokens);
					};
				});
			};

			// The live array - a boundary crossing may have replaced its identity
			strip(tokensRef.current);
			afterTokenChange();
		};
	};

	// Back restores the pre-add spot: tokens, query, loaded depth, scroll, active row
	const restoreBack = (back: any) => {
		window.clearTimeout(timeoutRef.current);
		offsetRef.current = 0;

		tokensRef.current = (back.tokens || []).map(it => ({ ...it }));
		persistTokens();

		const filter = String(back.filter || '');

		filterValueRef.current = filter;
		pendingValueRef.current = filter;
		filterInputRef.current?.setValue(filter);
		filterInputRef.current?.setRange({ from: filter.length, to: filter.length });
		filterInputRef.current?.focus();
		storageSet({ filter });

		nRef.current = 0;
		topRef.current = 0;
		chipHighlightRef.current = '';
		setDummy(prev => prev + 1);

		// load(clear) bumps the generation synchronously on entry - precompute it so a
		// synchronously answering load path passes the gen check too
		const restoreGen = loadGenRef.current + 1;

		const step = () => {
			// The restore load was superseded (user typed / switched) - stop refilling
			if (restoreGen != loadGenRef.current) {
				return;
			};

			const items = getItems();
			const idx = items.findIndex(it => it.id == back.itemId);

			// Refill page by page to the pre-add depth so the saved row exists again
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
			});
		};

		load(true, step, true);
	};

	// Space caption on a cross-space row: clicking scopes the search to that Channel
	// (the /in construction - token id is the spaceId, spaceview as the object). The
	// query stays: scope changes widen or narrow the same search
	const onSpaceCaption = (e: any, spaceview: any) => {
		e.stopPropagation();

		if (onObjectSelect || !spaceview) {
			return;
		};

		addToken('space', { ...spaceview, id: spaceview.targetSpaceId }, { source: 'Caption' });
	};

	const onDrill = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		const kind = getDrillKind(item);

		if (kind) {
			addToken(kind as TokenKind, item, { source: 'Row', fromRow: true });
		};
	};

	// The Messages scope searches chats and discussions - offer it only when there is at least
	// one of either: in the space (space subscriptions) or anywhere (global subscriptions)
	const hasMessageContainers = (): boolean => {
		const scopeId = getScopeId();

		if (scopeId == S.Common.space) {
			return [ J.Constant.subId.chat, J.Constant.subId.discussion ].some(it => {
				return S.Record.getRecordIds(U.Subscription.spaceSubId(it), '').length > 0;
			});
		};

		// The app-lifetime cross-space chat subscriptions: any container anywhere
		// (global mode) or any container of the scoped Channel (foreign scope)
		return [ J.Constant.subId.chatGlobal, J.Constant.subId.discussionGlobal ].some(subId => {
			const ids = S.Record.getRecordIds(subId, '');

			if (!scopeId) {
				return ids.length > 0;
			};

			return ids.some(id => S.Detail.get(subId, id, [ 'spaceId' ]).spaceId == scopeId);
		});
	};

	// Members chip only makes sense with someone besides you: globally >1 distinct
	// identities in the participants map, in-space >1 active members. The global answer is
	// cached once it turns true (data only grows within a popup's lifetime)
	const globalMembersRef = useRef(false);

	const hasMembers = (): boolean => {
		const scopeId = getScopeId();

		// Any concrete scope - the current space or another Channel (per-space counts
		// from the cross-space participants map)
		if (scopeId) {
			return spaceHasMembers(scopeId);
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

	const getKindName = (id: string): string => {
		return KIND_NAME_KEYS[id] ? translate(KIND_NAME_KEYS[id]) : '';
	};

	// The mode the token set loads: the Messages loader or objects. tokens carries the
	// count for presentation gates keyed to the loaded list
	const getLoadMode = (): any => {
		const what = getWhatToken();
		// The scope token is the resting state, not a filter - presentation gates keyed
		// to "no tokens" (settings rows) must not count it
		const tokens = tokensRef.current.filter(it => it.kind != 'space').length;
		const global = isGlobal();
		// The concrete scope ('' = global) - the row renderer and the cross-space
		// loader read it off itemsModeRef so quiet-reload windows stay consistent
		const spaceId = getScopeId();

		if (what && (what.kind == 'kind') && (what.id == SEARCH_TYPE_MESSAGE)) {
			return { id: SEARCH_TYPE_MESSAGE, what, tokens, isGlobal: global, spaceId };
		};

		return { id: 'object', what, tokens, isGlobal: global, spaceId };
	};

	// Space members in the vault's 1:1-first order, then alphabetical
	const getSpacePeople = (): any[] => {
		const oneToOneOrder = new Map<string, number>();

		U.Menu.getVaultItems().forEach((it: any) => {
			if (it.isOneToOne && it.oneToOneIdentity && !oneToOneOrder.has(it.oneToOneIdentity)) {
				oneToOneOrder.set(it.oneToOneIdentity, oneToOneOrder.size);
			};
		});

		const identity = (it: any) => it.identity || U.Space.getAccountFromParticipantId(it.id);

		return [ ...U.Space.getParticipantsList([ I.ParticipantStatus.Active ]) ].sort((a: any, b: any) => {
			const oa = oneToOneOrder.has(identity(a)) ? oneToOneOrder.get(identity(a)) : -1;
			const ob = oneToOneOrder.has(identity(b)) ? oneToOneOrder.get(identity(b)) : -1;

			if ((oa >= 0) && (ob >= 0)) {
				return oa - ob;
			};
			if (oa >= 0) {
				return -1;
			};
			if (ob >= 0) {
				return 1;
			};

			return String(a.name || '').localeCompare(String(b.name || ''));
		});
	};

	// Members of another Channel, from the cross-space participants map (the exact
	// member list only exists for the current space), name order
	const getForeignSpacePeople = (spaceId: string): any[] => {
		const ret: any[] = [];

		GLOBAL_DEPS.participants.forEach((it: any) => {
			if ((it.spaceId == spaceId) && (it.participantStatus == I.ParticipantStatus.Active) && !it.isDeleted) {
				ret.push(it);
			};
		});

		return ret.sort(U.Data.sortByName);
	};

	// Another Channel's types, from the cross-space types map, name order - the
	// Types-widget order (instance counts) only exists for the current space. The same
	// noise gates as the in-space chip row, minus the instance-count gate (the per-type
	// instance subscriptions are current-space-only)
	const getForeignSpaceTypes = (spaceId: string): any[] => {
		const skip = U.Object.getFileLayouts().concat([ I.ObjectLayout.Chat, I.ObjectLayout.ChatOld, I.ObjectLayout.Discussion ]);
		const ret: any[] = [];

		GLOBAL_DEPS.types.forEach((it: any) => {
			if ((it.spaceId != spaceId) || it.isDeleted || (it.uniqueKey == J.Constant.typeKey.template)) {
				return;
			};

			const layout = it.recommendedLayout;

			if (skip.includes(layout) || U.Object.isInSystemLayouts(layout) || U.Object.isDateLayout(layout) || U.Object.isParticipantLayout(layout)) {
				return;
			};

			ret.push(it);
		});

		return S.Record.checkHiddenObjects(ret).sort(U.Data.sortByName);
	};

	// Member person chips ("By <name>", Gmail-style operator wording): a few members in
	// the vault 1:1-first ordering (in-space) / the People aggregate's ordering (global),
	// capped to keep one row together with the kind chips; the full list stays reachable
	// via /by. Hidden while a creator token is set, gated on >1 member
	const getMemberChips = (): any[] => {
		if (getCreatorToken() || !hasMembers()) {
			return [];
		};

		const { account } = S.Auth;
		const identity = (it: any) => it.identity || U.Space.getAccountFromParticipantId(it.id);

		const scopeId = getScopeId();

		let people: any[] = [];

		if (!scopeId) {
			people = getGlobalPeople().map(it => it.object);
		} else
		if (scopeId == S.Common.space) {
			people = getSpacePeople();
		} else {
			people = getForeignSpacePeople(scopeId);
		};

		if (account) {
			people = people.filter(it => identity(it) != account.id);
		};

		const limit = getWhatToken() ? PERSON_CHIP_LIMIT_FILLED : PERSON_CHIP_LIMIT;

		return people.slice(0, limit).map(it => ({
			id: it.id,
			name: U.String.sprintf(translate('popupSearchChipByName'), U.Object.name(it)),
			isPerson: true,
			object: it,
		}));
	};

	// The suggestion row (the Gmail model): only tokens you could still add - a filled
	// group's chips are hidden until its token is removed. No selected state, no All chip.
	// Order: Messages, By me, the remaining what-group chips (Media, types / global
	// buckets), then the member person chips
	const getSuggestionItems = () => {
		const ret: any[] = [];
		const what = getWhatToken();
		const withPeople = !getCreatorToken() && hasMembers();
		const kindChip = (id: string) => ({ id, name: getKindName(id), isKind: true });

		// The way back after removing the Channel token: the scope group's own addable
		// value, first in the row - "In <current Channel>" (the By-grammar for places)
		if (!getTokenByGroup('scope') && !onObjectSelect) {
			const spaceview = U.Space.getSpaceview();

			if (spaceview && !spaceview._empty_) {
				ret.push({
					id: `scope-${spaceview.targetSpaceId}`,
					name: translate('popupSearchChipInCurrent'),
					isScope: true,
					object: spaceview,
				});
			};
		};

		if (!what && hasMessageContainers()) {
			ret.push(kindChip(SEARCH_TYPE_MESSAGE));
		};

		if (withPeople) {
			const self = U.Space.getParticipant();

			if (self) {
				ret.push({ id: 'mine', name: translate('popupSearchChipByMe'), isPerson: true, object: self });
			};
		};

		if (!what) {
			if (isGlobal()) {
				ret.push(
					kindChip(SEARCH_TYPE_PAGE),
					kindChip(SEARCH_TYPE_MEDIA),
					kindChip(SEARCH_TYPE_BOOKMARK),
					kindChip(SEARCH_TYPE_COLLECTION),
					kindChip(SEARCH_TYPE_QUERY),
					kindChip(SEARCH_TYPE_CHAT),
					kindChip(SEARCH_TYPE_TYPE),
				);
			} else
			if (isForeignScope()) {
				// That Channel's chips (Decision 2): Media plus its own types by name -
				// the Types-widget order only exists for the current space
				ret.push(kindChip(SEARCH_TYPE_MEDIA));

				getForeignSpaceTypes(getScopeId()).forEach(it => ret.push({ id: it.id, name: U.Object.name(it, true), isType: true, object: it }));
			} else {
				ret.push(kindChip(SEARCH_TYPE_MEDIA));

				const skip = U.Object.getFileLayouts().concat([ I.ObjectLayout.Chat, I.ObjectLayout.ChatOld, I.ObjectLayout.Discussion ]);

				U.Data.getWidgetTypes().
					filter(it => !skip.includes(it.recommendedLayout)).
					forEach(it => ret.push({ id: it.id, name: U.Object.name(it, true), isType: true, object: it }));
			};
		};

		return ret.concat(getMemberChips());
	};

	// Keep the Tab-highlighted chip visible when the row overflows
	const scrollToActiveChip = () => {
		window.setTimeout(() => {
			const active = U.Dom.select('.typeItem.active', typeSelectRef.current) as HTMLElement;
			active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		});
	};

	// A suggestion chip has exactly one verb: click (or Enter on the highlight) adds its
	// token. The group's chips are hidden while filled, so replace-within-group and
	// toggle-off never apply here; removal is the token x and Backspace-at-0 only
	const onChipAdd = (item: any) => {
		// A chip add keeps a normal query (narrowing the same search) but never a "/"
		// command query - reload() would re-enter command mode and the results would
		// never appear
		if (filterValueRef.current.startsWith('/')) {
			clearQuery();
		};

		if (item.isScope) {
			addSpaceScope('Chip');
			return;
		};

		if (item.isPerson) {
			addToken('creator', item.object, { source: 'Chip' });
			return;
		};

		if (item.isType) {
			addToken('type', item.object || { id: item.id, name: item.name }, { source: 'Chip' });
		} else {
			addToken('kind', { id: item.id, name: item.name }, { source: 'Chip' });
		};

		// Alias emission for continuity with the chip-switch-era analytics (what-group)
		const known = [
			SEARCH_TYPE_MESSAGE, SEARCH_TYPE_PAGE, SEARCH_TYPE_MEDIA, SEARCH_TYPE_BOOKMARK,
			SEARCH_TYPE_COLLECTION, SEARCH_TYPE_QUERY, SEARCH_TYPE_CHAT, SEARCH_TYPE_TYPE,
		];
		const type = known.includes(item.id) ? U.String.ucFirst(item.id) : 'Type';

		analytics.event('SwitchSearchType', { route, type, isGlobal: isGlobal() });
	};

	// The scope half of the token model: removing the space token switches to vault-wide
	// (global) search IN PLACE - global chips, global loaders, space captions - keeping
	// the typed query; re-adding narrows back. No close+reopen, no storage handoff
	const removeSpaceScope = (source: string) => {
		// Pickers stay pinned to the current space (attachments are per-space)
		if (onObjectSelect) {
			return;
		};

		const scope = getTokenByGroup('scope');

		if (scope) {
			removeToken(scope, source);
		};
	};

	const addSpaceScope = (source: string) => {
		const spaceview = U.Space.getSpaceview();

		if (spaceview && !spaceview._empty_) {
			addToken('space', { ...spaceview, id: spaceview.targetSpaceId }, { source });
		};
	};

	// Cmd+Shift+K: toggle the scope in place. A "/" command query clears first - the
	// flip must land on results, not the command list
	const onScopeToggle = () => {
		const scope = getTokenByGroup('scope');

		// Nothing to toggle: no scope to remove and no spaceview to add - don't
		// half-apply (the query clear must ride an actual flip)
		if (!scope) {
			const spaceview = U.Space.getSpaceview();

			if (!spaceview || spaceview._empty_) {
				return;
			};
		};

		if (filterValueRef.current.startsWith('/')) {
			clearQuery();
		};

		if (scope) {
			removeSpaceScope('Command');
		} else {
			addSpaceScope('Command');
		};
	};

	// Crossing a scope boundary (current space <-> another Channel <-> global) maps the
	// what token: entering global, a specific type becomes its layout bucket (types
	// can't merge across spaces in the bucket row); entering a concrete scope, a
	// global-only bucket clears and a type re-points at that space's own same-key type
	// where one exists. Creator and backlink tokens carry as-is - the identity and id
	// filters work vault-wide
	const mapTokensAcrossBoundary = () => {
		const scopeId = getScopeId();
		const toGlobal = !scopeId;
		const what = getWhatToken();

		if (!what) {
			return;
		};

		const drop = () => {
			tokensRef.current = tokensRef.current.filter(it => it != what);
		};

		if (what.kind == 'type') {
			if (toGlobal) {
				// Row-drilled type tokens hold the raw search record, which lacks
				// recommendedLayout - fall back to the type stores
				const typeObject = S.Record.getTypeById(what.id) || GLOBAL_DEPS.types.get(what.id) || what.object;
				const layout = typeObject?.recommendedLayout;
				const bucket = Object.keys(GLOBAL_LAYOUTS).find(key => GLOBAL_LAYOUTS[key].includes(layout));

				drop();

				if (bucket) {
					tokensRef.current.push({ kind: 'kind', id: bucket, seq: ++tokenSeqRef.current });
				};
			} else
			if (scopeId == S.Common.space) {
				// Row-drilled tokens can lack uniqueKey on the object - fall back to the
				// cross-space cache, same as the toGlobal and foreign arms
				const uniqueKey = what.object?.uniqueKey || GLOBAL_DEPS.types.get(what.id)?.uniqueKey;
				const local = S.Record.getTypeById(what.id) ||
					(uniqueKey ? S.Record.getTypes().find(it => it.uniqueKey == uniqueKey) : null);

				if (local) {
					what.id = local.id;
					what.object = local;
				};
			} else {
				// Another Channel: re-point at the target space's own same-uniqueKey
				// type where it exists; else the token stays as-is (the uniqueKey
				// filter still applies - deviation 26's rule, generalized)
				const current = GLOBAL_DEPS.types.get(what.id) || S.Record.getTypeById(what.id) || what.object;
				const uniqueKey = what.object?.uniqueKey || current?.uniqueKey;

				if (current?.spaceId == scopeId) {
					return;
				};

				let target = null;

				if (uniqueKey) {
					GLOBAL_DEPS.types.forEach((it: any) => {
						if (!target && (it.spaceId == scopeId) && (it.uniqueKey == uniqueKey) && !it.isDeleted) {
							target = it;
						};
					});
				};

				if (target) {
					what.id = target.id;
					what.object = target;
				};
			};
		} else
		if ((what.kind == 'kind') && !toGlobal && ![ SEARCH_TYPE_MESSAGE, SEARCH_TYPE_MEDIA ].includes(what.id)) {
			// The global-only buckets have no chip in a concrete scope's row
			drop();
		};
	};

	// One redraw when the cross-space maps land; a creator filter built while they were
	// cold misses the per-space participant ids - re-run the search with the full set
	const onGlobalDepsLoad = () => {
		const what = getWhatToken();
		const typeAgg = Boolean(what) && (what.kind == 'kind') && (what.id == SEARCH_TYPE_TYPE);

		// The "/" command list does no backend query - a reload would only reset it.
		// Global mode and a foreign scope build the creator filter and the Types
		// aggregate off the maps - both need a re-run once the maps land
		if (!isCurrentSpace() && (getCreatorToken() || typeAgg) && !filterValueRef.current.startsWith('/')) {
			reload(true);
		} else {
			setDummy(prev => prev + 1);
		};
	};

	// Any scope change (current space <-> another Channel <-> global) maps the what
	// token and wires the cross-space deps where the new scope reads them
	const onCrossBoundary = () => {
		mapTokensAcrossBoundary();

		// Global mode and a foreign scope both read the cross-space maps (chips, /by,
		// /type, creator filters); the first use starts the app-lifetime subscriptions
		if (!isCurrentSpace()) {
			subscribeGlobalDeps(onGlobalDepsLoad);
		};
	};

	// Toggle the empty-browse order of All/My objects between recently edited and created
	const onRecentSortToggle = () => {
		recentSortRef.current = (recentSortRef.current == 'created') ? 'edited' : 'created';
		storageSet({ recentSort: recentSortRef.current });
		reload(true);
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

		// Cross-space rows (global mode or a foreign scope): the app-lifetime
		// chatGlobal subscription holds every chat object
		let object = isRenderCross() ?
			S.Detail.get(J.Constant.subId.chatGlobal, chatId, []) :
			S.Detail.get(U.Subscription.spaceSubId(J.Constant.subId.chat), chatId, []);

		if (object._empty_) {
			// The discussion parent map is fed by the cross-space discussionGlobal subscription
			const parentId = S.Chat.discussionParentMap.get(spaceId)?.get(chatId);

			if (parentId) {
				object = S.Chat.getDiscussionParentDetail(spaceId, parentId, []);

				if (object._empty_ && !isRenderCross()) {
					object = S.Detail.get(U.Subscription.spaceSubId(J.Constant.subId.discussion), parentId, []);
				};
			};
		};

		if (object._empty_ && !isRenderCross()) {
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
			// Chat captions render only once the chats resolve - row heights change
			listEpochRef.current++;
			setDummy(prev => prev + 1);
		});
	};

	const getMessageAuthor = (item: any): any => {
		const spaceId = item.spaceId || S.Common.space;
		const participantId = U.Space.getParticipantId(spaceId, item.message?.creator);

		if (!isRenderCross() || (spaceId == S.Common.space)) {
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
			return translate('popupSearchByMe');
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

	// Type token: uniqueKey matches the same-named type in every space
	const getTypeTokenFilter = (object: any): any => {
		const type = S.Record.getTypeById(object.id) || GLOBAL_DEPS.types.get(object.id) || null;
		const uniqueKey = object.uniqueKey || type?.uniqueKey;

		return uniqueKey ?
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.Equal, value: uniqueKey } :
			{ relationKey: 'type', condition: I.FilterCondition.Equal, value: object.id };
	};

	// Creator token: every per-space participant id of the person + the bare identity (for
	// legacy records). creator only - lastModifiedBy is noisy because of automatic changes.
	// The chat-container exclusion applies to any creator token - chat containers are
	// created implicitly with the space and all carry the space creator
	const getCreatorTokenFilters = (token: SearchToken): any[] => {
		const identity = getTokenIdentity(token);
		const ids: string[] = [ identity ];

		// Global mode and a foreign scope both collect every per-space participant id
		// of the person - a spaceId filter (foreign) narrows the extra ids away
		if (!isCurrentSpace()) {
			GLOBAL_DEPS.participants.forEach((v: any, id: string) => {
				if (U.Space.getAccountFromParticipantId(id) == identity) {
					ids.push(id);
				};
			});

			// The participants map may lag behind the space list on a fresh session
			if (S.Auth.account && (identity == S.Auth.account.id)) {
				U.Space.getList().forEach(it => ids.push(U.Space.getParticipantId(it.targetSpaceId, identity)));
			};
		} else {
			ids.push(U.Space.getParticipantId(S.Common.space, identity));
		};

		const ret: any[] = [
			{ relationKey: 'creator', condition: I.FilterCondition.In, value: U.Common.arrayUnique(ids) },
		];

		// ...except when the user explicitly asked for the Chats bucket - the two
		// filters would contradict and every result set would be empty
		const what = getWhatToken();

		if (!what || (what.kind != 'kind') || (what.id != SEARCH_TYPE_CHAT)) {
			ret.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: [ I.ObjectLayout.Chat, I.ObjectLayout.ChatOld, I.ObjectLayout.Discussion ] });
		};

		return ret;
	};

	// The token filters for object searches (type + creator + backlink, ANDed); the kind
	// buckets are applied by the loaders - their layout sets differ per mode
	const getTokenFilters = (): any[] => {
		const ret: any[] = [];
		const what = getWhatToken();
		const creator = getCreatorToken();
		const backlink = getBacklinkToken();

		if (what && (what.kind == 'type')) {
			ret.push(getTypeTokenFilter(what.object || { id: what.id }));
		};

		if (creator) {
			getCreatorTokenFilters(creator).forEach(it => ret.push(it));
		};

		// Object ids are vault-unique - the id filter works on the cross-space path too,
		// so a backlink token survives the mode flip
		if (backlink) {
			const links = Relation.getArrayValue(backlink.object?.links);
			const backlinks = Relation.getArrayValue(backlink.object?.backlinks);

			ret.push({ relationKey: 'id', condition: I.FilterCondition.In, value: [].concat(links, backlinks) });
		};

		return ret;
	};

	const loadMessages = (clear: boolean, gen: number, callBack?: () => void, quiet?: boolean) => {
		const global = isGlobal();
		// '' = every chat in every space (global mode); otherwise the scoped Channel -
		// the current space or another one
		const scopeId = getScopeId();
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
				// A superseded non-quiet load already released the spinner; a same-value
				// setState bails out of rendering, so bump the list explicitly too
				setIsLoading(false);
				setDummy(prev => prev + 1);
			};
		};

		if (clear) {
			chatIdsRef.current = [];

			if (!quiet) {
				setIsLoading(true);
			};
		};

		// A creator token narrows messages to the person's identity (heart PR #3246); type
		// and backlink tokens do not apply to messages and are visibly ignored (they stay
		// in the token bar)
		const creatorToken = getCreatorToken();
		const creators = creatorToken ? [ getTokenIdentity(creatorToken) ] : [];

		C.ChatSearch(scopeId, '', text, offsetRef.current, J.Constant.limit.menuRecords, sorts, creators, (message: any) => {
			// A newer query started while this one was in flight - drop the stale response
			if (gen != loadGenRef.current) {
				// Release the loader this request engaged - the superseding load may be
				// quiet and would never clear it (the append freeze stays with the newer
				// clear, which lifts it on landing)
				if (clear && !quiet) {
					setIsLoading(false);
				};

				callBack?.();
				return;
			};

			// The current clear landed - appends may flow again
			if (clear) {
				clearLoadPendingRef.current = false;
			};

			if (message.error.code) {
				if (clear) {
					itemsRef.current = [];
					itemsModeRef.current = { id: SEARCH_TYPE_MESSAGE, isGlobal: global, spaceId: scopeId };
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
			itemsModeRef.current = { id: SEARCH_TYPE_MESSAGE, isGlobal: global, spaceId: scopeId };
			hasMoreRef.current = records.length == J.Constant.limit.menuRecords;

			if (!clear) {
				setDummy(prev => prev + 1);
			};

			// Only current-space chats need the per-open resolver; cross-space rows
			// (global mode or a foreign scope) resolve via chatGlobal/discussionGlobal
			if (scopeId == S.Common.space) {
				resolveMessageChats(records);
			};

			done();
			callBack?.();
		});
	};

	const loadMoreRows = ({ startIndex, stopIndex }) => {
		return new Promise((resolve, reject) => {
			// No appends while a clear-load is in flight (see load) - the sentinel
			// belongs to the outgoing list
			if (!hasMoreRef.current || clearLoadPendingRef.current) {
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

	// The global People aggregate: a local view over the participants map - deduplicated
	// by identity with a per-person space count. People you have 1:1 Channels with come
	// first, in the Vault sidebar's own order (the 1:1 spaceview carries the other
	// person's identity); the rest alphabetically
	const getGlobalPeople = (): any[] => {
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

		const oneToOneOrder = new Map<string, number>();

		U.Menu.getVaultItems().forEach((it: any) => {
			if (it.isOneToOne && it.oneToOneIdentity && !oneToOneOrder.has(it.oneToOneIdentity)) {
				oneToOneOrder.set(it.oneToOneIdentity, oneToOneOrder.size);
			};
		});

		return [ ...byIdentity.values() ].sort((a: any, b: any) => {
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
	};

	// The global Types aggregate: one row per uniqueKey across every Channel, with a
	// per-type space count - the same in-memory view over the cross-space maps as the
	// People aggregate (no round trip, no new subscriptions). The representative object
	// is the current space's instance when one exists, else the lowest-spaceId instance
	// (a stable pick); rows text-filter by name/pluralName. spaceId narrows to one
	// Channel (a defensive arm - the Types bucket is only offered globally)
	const getGlobalTypeAggregate = (text: string, spaceId?: string): any[] => {
		const t = String(text || '').toLowerCase();
		const byKey = new Map<string, { object: any; spaces: Set<string> }>();
		const instances: any[] = [];

		GLOBAL_DEPS.types.forEach((it: any) => {
			if (it.isDeleted || (it.uniqueKey == J.Constant.typeKey.template)) {
				return;
			};

			if (spaceId && (it.spaceId != spaceId)) {
				return;
			};

			instances.push(it);
		});

		// Hidden instances drop BEFORE grouping - a hidden representative must not
		// suppress a group that is visible elsewhere, and the counts stay honest
		S.Record.checkHiddenObjects(instances).forEach((it: any) => {
			const key = String(it.uniqueKey || it.id);

			let entry = byKey.get(key);

			if (!entry) {
				entry = { object: it, spaces: new Set() };
				byKey.set(key, entry);
			};

			entry.spaces.add(it.spaceId);

			if ((it.spaceId == S.Common.space) || ((entry.object.spaceId != S.Common.space) && (it.spaceId < entry.object.spaceId))) {
				entry.object = it;
			};
		});

		let list = [ ...byKey.values() ];

		if (t) {
			list = list.filter(({ object }) => [ object.name, object.pluralName ].some(n => String(n || '').toLowerCase().includes(t)));
		};

		return list.map(({ object, spaces }) => {
			const spaceview = U.Space.getSpaceviewBySpaceId(object.spaceId);

			return {
				...object,
				metaList: [],
				links: [],
				backlinks: [],
				isTypeAgg: true,
				spaceCount: spaces.size,
				aggSpaceName: spaceview ? U.Object.name(spaceview) : '',
			};
		}).sort(U.Data.sortByName);
	};

	// Global mode: one-shot cross-space search, no subscription. allStoresLoaded=false means
	// the sequential per-space store warm-up is still running and the view is partial - no
	// auto-retry in v1, the next keystroke/chip switch re-queries anyway
	const loadGlobalObjects = (clear: boolean, gen: number, callBack?: () => void, quiet?: boolean) => {
		const mode = getLoadMode();
		const what = mode.what;
		const isChatKind = Boolean(what) && (what.kind == 'kind') && (what.id == SEARCH_TYPE_CHAT);
		const layouts = U.Object.getSystemLayouts().filter(it => !U.Object.isTypeLayout(it));
		// ignoreChat defaults to the CURRENT spaceview's isOneToOne, which would inject
		// resolvedLayout/recommendedLayout NotIn [Chat, ChatOld, Discussion] and hide every
		// chat object from the vault-wide search - chats are a first-class chip here
		const filters: any[] = U.Subscription.getBaseFilters({ ignoreChat: false }).concat([
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: layouts },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
		]);

		if (what && (what.kind == 'kind') && GLOBAL_LAYOUTS[what.id]) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: GLOBAL_LAYOUTS[what.id] });
		};

		getTokenFilters().forEach(it => filters.push(it));

		// A scope on another Channel narrows the cross-space search to it
		if (mode.spaceId) {
			filters.push({ relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: mode.spaceId });
		};

		// Type objects are noise in the empty (recent) browse - every space ships a full
		// set of bundled types; they stay searchable by text and via the Types chip
		if (!what && !filterValueRef.current) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: [ I.ObjectLayout.Type ] });
		};

		let fullText = filterValueRef.current;

		// Chat objects are not in the fulltext index - a text query through fullText finds
		// nothing, so filter by name instead (store query, not FT)
		if (isChatKind && fullText) {
			filters.push({ relationKey: 'name', condition: I.FilterCondition.Like, value: fullText });
			fullText = '';
		};

		// Browse follows the toggle order shown in the section title: the what-token's
		// primary recency order or createdDate. Text queries keep FT relevance, except
		// chats which never have an FT score (their text path filters by name)
		let sorts: any[] = [];

		if (isChatKind || !fullText) {
			const orders = getRecentOrders((what && (what.kind == 'kind')) ? what.id : '');
			sorts = ((recentSortRef.current == 'created') && orders.secondary) ? orders.secondary.sorts : orders.primary.sorts;
		};

		sorts = sorts.map(U.Subscription.sortMapper);

		let limit = GLOBAL_QUERY_LIMIT;

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
				// A superseded non-quiet load already released the spinner; a same-value
				// setState bails out of rendering, so bump the list explicitly too
				setIsLoading(false);
				setDummy(prev => prev + 1);
			};
		};

		if (clear && !quiet) {
			setIsLoading(true);
		};

		C.ObjectCrossSpaceSearch(filters, sorts, J.Relation.default.concat([ 'pluralName', 'creator' ]), fullText, offsetRef.current, limit, (message: any) => {
			// A newer query started while this one was in flight - drop the stale response
			if (gen != loadGenRef.current) {
				// Release the loader this request engaged - the superseding load may be
				// quiet and would never clear it (the append freeze stays with the newer
				// clear, which lifts it on landing)
				if (clear && !quiet) {
					setIsLoading(false);
				};

				callBack?.();
				return;
			};

			// The current clear landed - appends may flow again
			if (clear) {
				clearLoadPendingRef.current = false;
			};

			if (message.error.code) {
				if (clear) {
					itemsRef.current = [];
					itemsModeRef.current = mode;
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
			itemsModeRef.current = mode;
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
			// Freeze infinite-scroll appends until this clear lands - the old list (and
			// its sentinel) stays mounted through a quiet reload, and an append fired in
			// that window would route by the NEW tokens yet share the clear's generation
			clearLoadPendingRef.current = true;
		};

		const gen = loadGenRef.current;

		// "/" command mode searches chips/actions locally - no backend query
		if (filterValueRef.current.startsWith('/')) {
			itemsRef.current = [];
			itemsModeRef.current = getLoadMode();
			hasMoreRef.current = false;
			clearLoadPendingRef.current = false;

			// A synchronous swap leaves no load in flight - release a spinner an
			// in-flight (now superseded) clear may have engaged
			if (clear) {
				setIsLoading(false);
			};

			listEpochRef.current++;
			setDummy(prev => prev + 1);
			callBack?.();
			return;
		};

		const mode = getLoadMode();

		if (mode.id == SEARCH_TYPE_MESSAGE) {
			loadMessages(clear, gen, callBack, quiet);
			return;
		};

		// The cross-space Types bucket is served from the in-memory types map - no
		// round trip. Synchronous swap: lift the append freeze and bump the list epoch
		// exactly like the "/" branch; the mode stamp carries the aggregate flag so
		// the section header and captions render by what actually loaded
		if (!isCurrentSpace() && mode.what && (mode.what.kind == 'kind') && (mode.what.id == SEARCH_TYPE_TYPE)) {
			itemsRef.current = getGlobalTypeAggregate(filterValueRef.current, mode.spaceId);
			itemsModeRef.current = { ...mode, isTypeAgg: true };
			hasMoreRef.current = false;
			clearLoadPendingRef.current = false;

			// Same spinner release as the "/" branch above
			if (clear) {
				setIsLoading(false);
			};

			listEpochRef.current++;
			setDummy(prev => prev + 1);
			callBack?.();
			return;
		};

		// Global mode and a foreign Channel scope both ride the cross-space one-shot
		if (!isCurrentSpace()) {
			loadGlobalObjects(clear, gen, callBack, quiet);
			return;
		};

		const what = mode.what;
		const { space } = S.Common;
		const layouts = U.Object.getSystemLayouts().filter(it => !U.Object.isTypeLayout(it));
		const filters: any[] = U.Subscription.getBaseFilters().concat([
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: layouts },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
		]);

		if (what && (what.kind == 'kind')) {
			const kindLayouts = (what.id == SEARCH_TYPE_MEDIA) ? U.Object.getFileLayouts() : GLOBAL_LAYOUTS[what.id];

			if (kindLayouts) {
				filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: kindLayouts });
			};
		};

		getTokenFilters().forEach(it => filters.push(it));

		// Type objects are noise in the empty (recent) browse; they stay searchable by text
		if (!what && !filterValueRef.current) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: [ I.ObjectLayout.Type ] });
		};

		let sorts: any[] = [
			{ relationKey: '_final_score', type: I.SortType.Desc },
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			{ relationKey: 'type', type: I.SortType.Asc },
		];

		// Empty browse follows the toggle order shown in the section title
		if (!filterValueRef.current) {
			const orders = getRecentOrders((what && (what.kind == 'kind')) ? what.id : '');
			sorts = ((recentSortRef.current == 'created') && orders.secondary) ? orders.secondary.sorts : orders.primary.sorts;
		};

		sorts = sorts.map(U.Subscription.sortMapper);

		// The first browse page is small so the recent section stays a glance, not a wall;
		// infinite scroll fills the rest
		let limit = J.Constant.limit.menuRecords;

		if (!filterValueRef.current && clear) {
			limit = RECENT_LIMIT;
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

			listEpochRef.current++;

			if (quiet) {
				setDummy(prev => prev + 1);
			} else {
				// A superseded non-quiet load already released the spinner; a same-value
				// setState bails out of rendering, so bump the list explicitly too
				setIsLoading(false);
				setDummy(prev => prev + 1);
			};
		};

		C.ObjectSearchWithMeta(space, filters, sorts, J.Relation.default.concat([ 'pluralName', 'links', 'backlinks', 'creator', '_final_score' ]), filterValueRef.current, offsetRef.current, limit, (message) => {
			// A newer query started while this one was in flight - drop the stale response
			if (gen != loadGenRef.current) {
				// Release the loader this request engaged - the superseding load may be
				// quiet and would never clear it (the append freeze stays with the newer
				// clear, which lifts it on landing)
				if (clear && !quiet) {
					setIsLoading(false);
				};

				callBack?.();
				return;
			};

			// The current clear landed - appends may flow again
			if (clear) {
				clearLoadPendingRef.current = false;
			};

			if (message.error.code) {
				if (clear) {
					itemsRef.current = [];
					itemsModeRef.current = mode;
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
				it.links = Relation.getArrayValue(it.links);
				it.backlinks = Relation.getArrayValue(it.backlinks);
				return it;
			});

			itemsRef.current = itemsRef.current.concat(records);
			itemsModeRef.current = mode;
			hasMoreRef.current = records.length == limit;

			if (!clear) {
				setDummy(prev => prev + 1);
			};

			done();
			callBack?.();
		});
	};

	// Typed completions that resolve to tokens ("/by kay" - the Slack pattern). An empty
	// query is the person-browse list: 1:1-first order, the global rows with their
	// space-count captions
	const getPeopleSuggestions = (text: string) => {
		const t = text.toLowerCase();

		const scopeId = getScopeId();

		let list: any[] = [];

		if (!scopeId) {
			list = getGlobalPeople().map(({ object, spaceCount }) => ({ ...object, metaList: [], links: [], backlinks: [], isMemberAgg: true, spaceCount }));
		} else
		if (scopeId == S.Common.space) {
			list = getSpacePeople();
		} else {
			list = getForeignSpacePeople(scopeId);
		};

		if (t) {
			list = list.filter(it => [ it.name, it.globalName ].some(n => String(n || '').toLowerCase().includes(t)));
		};

		return list.map(it => ({ ...it, isObject: true, isCommandSuggest: true, tokenKind: 'creator', shortcut: [] }));
	};

	const getTypeSuggestions = (text: string) => {
		const t = text.toLowerCase();

		// Global mode: grouped by uniqueKey with the space-count caption - the same
		// aggregate the Types bucket renders
		if (isGlobal()) {
			return getGlobalTypeAggregate(text).map(it => ({ ...it, isObject: true, isCommandSuggest: true, tokenKind: 'type', shortcut: [] }));
		};

		let list: any[] = [];

		if (isForeignScope()) {
			// The scoped Channel's own types (the template exclusion below applies)
			GLOBAL_DEPS.types.forEach((it: any) => {
				if ((it.spaceId == getScopeId()) && !it.isDeleted) {
					list.push(it);
				};
			});

			list = S.Record.checkHiddenObjects(list);
		} else {
			list = S.Record.checkHiddenObjects(S.Record.getTypes());
		};

		list = list.filter(it => it.uniqueKey != J.Constant.typeKey.template);

		if (t) {
			list = list.filter(it => [ it.name, it.pluralName ].some(n => String(n || '').toLowerCase().includes(t)));
		};

		return [ ...list ].sort(U.Data.sortByName).map(it => ({ ...it, isObject: true, isCommandSuggest: true, tokenKind: 'type', shortcut: [] }));
	};

	// "/in" completions: every Channel in the vault sidebar's own order, 1:1 Channels
	// included; picking one scopes the search to it. The token id is the spaceId with
	// the spaceview as the render object - the same construction as the seeded scope
	const getSpaceSuggestions = (text: string) => {
		// Pickers pin the scope to the current space - never offer another one
		if (onObjectSelect) {
			return [];
		};

		const t = text.toLowerCase();

		let list: any[] = U.Menu.getVaultItems().filter(it => it.targetSpaceId);

		if (t) {
			list = list.filter(it => String(it.name || '').toLowerCase().includes(t));
		};

		// creator/links stripped: a spaceview row must not render an attribution
		// caption or a drill arrow
		return list.map(it => ({ ...it, id: it.targetSpaceId, isObject: true, isCommandSuggest: true, tokenKind: 'space', type: '', metaList: [], links: [], backlinks: [], creator: '', shortcut: [] }));
	};

	// "/" command mode: search the chips and actions themselves, plus typed completions
	// that resolve to tokens (/by <person>, /type <type>). Selecting a chip applies it as
	// a chip click (single match + Enter selects it via the auto-active first row)
	const getCommandItems = (query: string) => {
		const match = query.match(/^(by|type|is|in)(\s+(.*))?$/i);

		if (match) {
			const command = match[1].toLowerCase();
			const text = String(match[3] || '').trim();

			if (command == 'by') {
				return getPeopleSuggestions(text);
			};

			if (command == 'in') {
				return getSpaceSuggestions(text);
			};

			return getTypeSuggestions(text);
		};

		const reg = query ? new RegExp(U.String.regexEscape(query), 'gi') : null;
		const canWrite = U.Space.canMyParticipantWrite();

		let items: any[] = [];

		// The Filter entries lead the list as one group, prefilling "/by " etc. - the
		// mechanic teaches its own syntax. Filled groups hide their entries like
		// everywhere else; pickers pin the scope, so the Channel entry never shows there
		if (!getCreatorToken() && hasMembers()) {
			items.push({ id: 'cmdBy', name: translate('popupSearchCommandBy'), arg: translate('popupSearchCmdArgPerson'), description: translate('popupSearchCommandBy'), prefix: '/by', iconParam: { name: 'common/search' }, isCommand: true, command: 'by' });
		};

		if (!getWhatToken()) {
			items.push({ id: 'cmdType', name: translate('popupSearchCommandType'), arg: translate('popupSearchCmdArgType'), description: translate('popupSearchCommandType'), prefix: '/is', iconParam: { name: 'common/search' }, isCommand: true, command: 'is' });
		};

		if (!getTokenByGroup('scope') && !onObjectSelect) {
			items.push({ id: 'cmdIn', name: translate('popupSearchCommandIn'), arg: translate('popupSearchCmdArgChannel'), description: translate('popupSearchCommandIn'), prefix: '/in', iconParam: { name: 'common/search' }, isCommand: true, command: 'in' });
		};

		items = items.concat(getSuggestionItems().map(it => {
			// Command-argument grammar: the row reads as what you would type after the
			// command - singular kinds, bare person names, "me" for yourself
			let name = it.name;

			if (it.isScope) {
				name = translate('popupSearchCmdThisChannel');
			} else
			if (it.isPerson) {
				name = (it.id == 'mine') ? translate('popupSearchCmdMe') : U.Object.name(it.object || {});
			} else
			if (it.isKind && KIND_NAME_KEYS_SINGULAR[it.id]) {
				name = translate(KIND_NAME_KEYS_SINGULAR[it.id]);
			} else
			if (it.isType) {
				name = U.Object.name(it.object || {});
			};

			return {
			...it,
			id: `chip-${it.id}`,
			chipId: it.id,
			name,
			prefix: it.isScope ? '/in' : (it.isPerson ? '/by' : '/is'),
			iconParam: { name: 'common/search' },
			isChip: true,
			};
		}));

		// Creation acts in the current space - a foreign scope hides it like global
		// does; the widen action shows for any concrete scope
		if (isCurrentSpace() && canWrite) {
			items.push({ id: 'add', name: translate('commonCreateObject'), iconParam: { name: 'plus/menu' } });
			items.push({ id: 'upload', name: translate('popupSearchUploadFile'), iconParam: { name: 'plus/menu' } });
		};

		if (reg) {
			items = items.filter(it => [ it.name, it.prefix, it.arg ].some(m => String(m || '').match(reg)));
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
		// previous list stays on screen while the tokens already changed
		const mode = itemsModeRef.current || getLoadMode();
		const what = mode.what || null;
		// Present by the mode the on-screen items were loaded for - during a quiet
		// reload the previous list stays up while the tokens are already flipped
		const modeGlobal = Boolean(mode.isGlobal);
		// A scope on another Channel rides the cross-space data path - like global for
		// the settings/actions gates (settings and creation act in the current space)
		const modeForeign = Boolean(mode.spaceId) && (mode.spaceId != S.Common.space);

		if (mode.id == SEARCH_TYPE_MESSAGE) {
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

		if (!filter && items.length && mode.isTypeAgg) {
			// The cross-space Types aggregate lists by name - no recency toggle
			items.unshift({ name: translate('popupSearchTypeTypes'), isSection: true });
		} else
		if (!filter && items.length) {
			// Every browse states its order in the title; the right-side action switches
			// between the primary recency order and recently created
			const { primary, secondary } = getRecentOrders((what && (what.kind == 'kind')) ? what.id : '');
			const created = (recentSortRef.current == 'created') && Boolean(secondary);

			let noun = '';

			if (what) {
				noun = (what.kind == 'kind') ? getKindName(what.id) : U.Object.name(what.object || {}, true);
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

		if (filter && !modeGlobal && !modeForeign && (mode.id == 'object') && !mode.tokens) {
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

		// Global mode has no actions in v1 (creation targets a specific space); a
		// foreign scope keeps only the widen action
		if (!modeGlobal) {
			const actions: any[] = [];

			if (canWrite && !modeForeign) {
				if (what && (what.kind == 'type')) {
					const type = S.Record.getTypeById(what.id);

					if (type) {
						const typeName = U.Object.name(type);
						const label = filter ?
							U.String.sprintf(translate('popupSearchCreateTypeWithName'), typeName, filter) :
							U.String.sprintf(translate('popupSearchCreateType'), typeName);

						actions.push({ id: 'addType', typeId: type.id, name: label, iconParam: { name: 'plus/menu' }, shortcut: keyboard.getSymbolsFromKeys(keyboard.getKeys('createObject')) });
					};
				} else
				if (what && (what.kind == 'kind') && (what.id == SEARCH_TYPE_MEDIA)) {
					actions.push({ id: 'upload', name: translate('popupSearchUploadFile'), iconParam: { name: 'plus/menu' }, shortcut: keyboard.getSymbolsFromKeys(keyboard.getKeys('createObject')) });
				} else
				if (!what) {
					actions.push({ id: 'add', name, iconParam: { name: 'plus/menu' }, shortcut: keyboard.getSymbolsFromKeys(keyboard.getKeys('createObject')) });
					actions.push({ id: 'upload', name: translate('popupSearchUploadFile'), iconParam: { name: 'plus/menu' } });
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

		// Chip picked from "/" command mode: add its token, clear the command query, keep
		// the popup. Cancel the pending debounced filter change - it would re-apply the
		// stale "/query" after the switch and empty the list
		if (item.isChip) {
			clearQuery();
			onChipAdd({ ...item, id: item.chipId });
			return;
		};

		// Typed completion entry ("/by", "/type"): prefill the command and keep typing
		if (item.isCommand) {
			const v = `/${item.command} `;

			window.clearTimeout(timeoutRef.current);
			filterInputRef.current?.setValue(v);
			filterInputRef.current?.setRange({ from: v.length, to: v.length });
			filterInputRef.current?.focus();
			filterValueRef.current = v;
			pendingValueRef.current = v;
			storageSet({ filter: v });
			reload(true);
			return;
		};

		// Typed completion pick ("/by kay" -> a person): resolve to its token
		if (item.isCommandSuggest) {
			clearQuery();
			addToken(item.tokenKind, item, { source: 'Command' });
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
		// The object context menu acts within the current space - skip for cross-space
		// results (global mode or a foreign scope)
		if (isRenderCross()) {
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

		if (initialGlobal) {
			// First-ever use starts the app-lifetime subscriptions (one redraw when the
			// initial data lands); later opens sync from memory - no redraw
			subscribeGlobalDeps(onGlobalDepsLoad);
		};

		// Pre-token releases stored the active chip and drill separately - migrate once
		const migrateLegacyTokens = (global: boolean): any[] => {
			const ret: any[] = [];
			const legacyType = String(storage[global ? 'searchTypeGlobal' : 'searchType'] || '');
			const legacyDrill = storage[global ? 'drillGlobal' : 'drill'];

			if (legacyDrill && legacyDrill.kind && legacyDrill.id) {
				ret.push({ kind: legacyDrill.kind, id: legacyDrill.id });
			} else
			if (!global && storage.backlink) {
				ret.push({ kind: 'backlink', id: storage.backlink });
			};

			const hasWhat = ret.some(it => TOKEN_GROUPS[it.kind] == 'what');
			const hasWho = ret.some(it => TOKEN_GROUPS[it.kind] == 'who');

			if (legacyType == SEARCH_TYPE_MINE) {
				if (!hasWho && S.Auth.account) {
					ret.push({ kind: 'creator', id: U.Space.getCurrentParticipantId() });
				};
			} else
			if (KIND_NAME_KEYS[legacyType]) {
				if (!hasWhat) {
					ret.push({ kind: 'kind', id: legacyType });
				};
			} else
			if (legacyType && ![ SEARCH_TYPE_ALL, SEARCH_TYPE_MEMBER ].includes(legacyType)) {
				// In-space per-type chips stored the type object id
				if (!hasWhat && !global) {
					ret.push({ kind: 'type', id: legacyType });
				};
			};

			return ret;
		};

		const resolveTokens = (raw: any[], callBack: (tokens: SearchToken[]) => void) => {
			const slots: any[] = [];

			(raw || []).forEach(it => {
				if (!it || !it.kind || !it.id || !TOKEN_GROUPS[it.kind]) {
					return;
				};

				// One token per group - first wins
				if (slots.some(t => TOKEN_GROUPS[t.kind] == TOKEN_GROUPS[it.kind])) {
					return;
				};

				const slot: any = { kind: it.kind, id: it.id, object: null };

				if (it.kind == 'space') {
					const spaceview = U.Space.getSpaceviewBySpaceId(it.id);

					// The token id is the spaceId (the filter and comparison currency);
					// the object renders the pill
					slot.object = (spaceview && !spaceview._empty_) ? { ...spaceview, id: it.id } : null;
				} else
				if (it.kind == 'type') {
					slot.object = S.Record.getTypeById(it.id) || GLOBAL_DEPS.types.get(it.id) || null;
				} else
				if (it.kind == 'creator') {
					// The cross-space map is cold on the first global use of a session;
					// the current-space participant store covers the common pivot case
					slot.object = GLOBAL_DEPS.participants.get(it.id) || U.Space.getParticipant(it.id);
				};

				slots.push(slot);
			});

			const done = () => {
				// Unresolvable tokens are dropped silently
				callBack(slots.filter(it => (it.kind == 'kind') || it.object).map(it => ({ ...it, seq: ++tokenSeqRef.current })));
			};

			// In-space misses (and backlink tokens, which need links/backlinks) resolve by
			// search; global misses drop - the in-memory maps are the source there
			const pendingIds = initialGlobal ? [] : slots.filter(it => ![ 'kind', 'space' ].includes(it.kind) && !it.object).map(it => it.id);

			if (!pendingIds.length) {
				done();
				return;
			};

			// getByIds always fires; getById drops the callback on a miss (deleted target)
			// and the popup would never run its initial load
			U.Object.getByIds(pendingIds, {}, records => {
				(records || []).forEach(record => {
					const slot = slots.find(it => it.id == record.id);

					if (slot) {
						slot.object = record;
					};
				});

				done();
			});
		};

		// Restore tokens from the unified key set. Two legacy generations chain into it,
		// one-shot each: the phase-1 split global keys (*Global - the side used more
		// recently wins the merge) and the pre-token chip/drill/backlink keys
		const legacyGlobalKeys = [ 'filterGlobal', 'tokensGlobal', 'recentSortGlobal', 'lastUsedGlobal', 'searchTypeGlobal', 'drillGlobal' ];
		const hasLegacyGlobal = legacyGlobalKeys.some(key => (storage[key] !== undefined) && (storage[key] !== null));

		let raw: any[] = [];

		if (!isStale) {
			if (legacyGlobalSide && (storage.tokensGlobal !== undefined) && (storage.tokensGlobal !== null)) {
				raw = U.Common.objectCopy(storage.tokensGlobal || []);
			} else
			if (legacyGlobalSide) {
				raw = migrateLegacyTokens(true);
			} else
			if (storage.tokens !== undefined) {
				raw = U.Common.objectCopy(storage.tokens || []);
			} else {
				raw = migrateLegacyTokens(false);
			};
		};

		if (hasLegacyGlobal || (storage.tokens === undefined)) {
			const cleanup: any = { tokens: raw, searchType: null, drill: null, backlink: '' };

			// undefined drops the key entirely on serialization - the merge stays one-shot
			legacyGlobalKeys.forEach(key => cleanup[key] = undefined);

			if (hasLegacyGlobal) {
				cleanup.lastUsed = lastUsed;
				cleanup.filter = filter;
				cleanup.recentSort = recentSortRef.current;
			};

			storageSet(cleanup);
		};

		// The entry point owns the scope slot: Cmd+K and in-editor searches open scoped
		// to the current space, Cmd+Shift+K and the vault icon open vault-wide
		raw = raw.filter(it => it && (it.kind != 'space'));

		if (!initialGlobal) {
			raw.unshift({ kind: 'space', id: S.Common.space });
		};

		// Interactions during the async resolve (typing, a scope toggle) supersede the
		// restore - each of them runs a reload, so the generation is the signal
		const openGen = loadGenRef.current;

		resolveTokens(raw, tokens => {
			if (loadGenRef.current != openGen) {
				return;
			};

			tokensRef.current = tokens;

			// A scoped open can still land global (unresolvable spaceview drops the
			// scope slot) - any non-current scope needs the cross-space deps
			if (!isCurrentSpace()) {
				subscribeGlobalDeps(onGlobalDepsLoad);
			};

			// Drop what failed to resolve from storage too - but only in-space, where
			// resolution is authoritative; the global maps may simply be cold on the
			// first use of a session and the token must survive for the next open
			if (!initialGlobal && (tokens.length != raw.length)) {
				persistTokens();
			};

			// Alias emissions for continuity with the drill-era analytics; the scope
			// token is entry-point state, not a saved drill
			tokens.filter(it => ![ 'kind', 'space' ].includes(it.kind)).forEach(it => {
				analytics.event('SearchDrill', { route, type: 'Saved', drillType: it.kind, isGlobal: isGlobal() });
			});

			setFilter();
		});

		analytics.event('ScreenSearch', { route, type: (filter ? 'Saved' : 'Empty') });

		return () => {
			unbind();
			window.clearTimeout(timeoutRef.current);
			window.clearTimeout(rebindTimeoutRef.current);

			// Stop notifying a dead closure; the next popup re-registers on subscribe
			GLOBAL_DEPS.onLoad = null;

			if (chatsSubActiveRef.current) {
				U.Subscription.destroyList([ chatsSubId ], true);
			};

			// Closing stamps the session - the next open compares against it
			storageSet({ lastUsed: Date.now() });
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

	renderItemsRef.current = items;

	const shift = keyboard.shiftSymbol();
	const suggestions = getSuggestionItems();
	const tokens = getTokens();

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
			// The space caption shows whenever the user looks from outside the space -
			// global mode or a scope on another Channel
			const spaceview = isRenderCross() ? U.Space.getSpaceviewBySpaceId(item.spaceId) : null;
			// A 1:1 space's chat is always named "General" - label it "Direct" instead (the
			// person is already visible: space caption in global mode, the space itself in-space)
			const isOneToOne = Boolean((isRenderCross() ? spaceview : U.Space.getSpaceview())?.isOneToOne);
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
										onClick={e => { e.stopPropagation(); addToken('creator', author, { source: 'Caption', fromRow: true }); }}
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
											<div className="drillLink spaceLink" onClick={e => onSpaceCaption(e, spaceview)}>
												<IconObject object={spaceview} size={14} />
												<ObjectName object={spaceview} />
											</div>
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
			const type = S.Record.getTypeById(item.type) || GLOBAL_DEPS.types.get(item.type) || null;

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

			const spaceview = (isRenderCross() && !item.isMemberAgg && !item.isTypeAgg) ? U.Space.getSpaceviewBySpaceId(item.spaceId) : null;
			const creatorLabel = getObjectCreatorLabel(item);
			const creatorObject = creatorLabel ? getObjectCreator(item) : null;
			let aggSpaces = '';

			if (item.isMemberAgg) {
				aggSpaces = `${translate('popupSearchInSpace')} ${item.spaceCount} ${U.Common.plural(item.spaceCount, translate('pluralChannel'))}`;
			} else
			if (item.isTypeAgg && item.aggSpaceName) {
				// "in <Channel>" - the representative's Channel; "+ N other Channels"
				// when the same uniqueKey exists elsewhere too
				aggSpaces = `${translate('popupSearchInSpace')} ${item.aggSpaceName}`;

				if (item.spaceCount > 1) {
					const n = item.spaceCount - 1;
					aggSpaces += ` ${U.String.sprintf(translate('popupSearchAggOtherChannels'), n, U.Common.plural(n, translate('pluralChannel')))}`;
				};
			};

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

			if (isRenderCross()) {
				cn.push('isGlobal');
			};

			content = (
				<div className="sides" onContextMenu={e => onContext(e, item)}>
					<div className="side left">
						<div className="name" dangerouslySetInnerHTML={{ __html: U.String.sanitize(name) }} />
						{Context(meta)}
						<div className="caption">
							{aggSpaces ? <div className="prep">{aggSpaces}</div> : (
								<div className="drillLink" onClick={e => { e.stopPropagation(); addToken('type', type, { source: 'Caption', fromRow: true }); }}>
									<ObjectType object={type} />
								</div>
							)}
							{creatorLabel ? (
								<>
									<div className="bullet" />
									{creatorObject ? (
										<div className="creator drillLink" onClick={e => { e.stopPropagation(); addToken('creator', creatorObject, { source: 'Caption', fromRow: true }); }}>{creatorLabel}</div>
									) : (
										<div className="creator">{creatorLabel}</div>
									)}
								</>
							) : ''}
							{spaceview ? (
								<>
									<div className="bullet" />
									<div className="prep">{translate('popupSearchInSpace')}</div>
									<div className="drillLink spaceLink" onClick={e => onSpaceCaption(e, spaceview)}>
										<IconObject object={spaceview} size={14} />
										<ObjectName object={spaceview} />
									</div>
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
						<div className="name">
							{item.prefix ? <span className="cmdPrefix">{item.prefix}</span> : ''}
							{item.arg ? <span className="cmdArg">{item.arg}</span> : item.name}
						</div>
					</div>
					<div className="side right">
						<div className="caption">
							{item.description ? <div className="cmdDesc">{item.description}</div> : ''}
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

	// Token pill in the head: the same pill family as the chips - 16px icon, name, x
	const TokenItem = (token: SearchToken) => {
		// 'filterToken', not 'token' - Prism's syntax CSS styles .token globally
		const cn = [ 'filterToken', `filterToken-${token.kind}` ];

		let icon = null;
		let name = '';

		switch (token.kind) {
			case 'space': {
				icon = <IconObject object={token.object} size={16} />;
				name = U.Object.name(token.object || {});
				break;
			};

			case 'kind': {
				name = getKindName(token.id);
				break;
			};

			case 'type': {
				icon = <IconObject object={token.object} size={16} />;
				name = U.Object.name(token.object || {}, true);
				break;
			};

			case 'creator': {
				// The operator stays in the applied state (Gmail-style): "By me" / "By <name>"
				icon = <IconObject object={{ ...(token.object || {}), layout: I.ObjectLayout.Participant }} size={16} />;
				name = isSelfToken(token) ? translate('popupSearchChipByMe') : U.String.sprintf(translate('popupSearchChipByName'), U.Object.name(token.object || {}));
				break;
			};

			case 'backlink': {
				icon = <Icon name="arrow/forward" className="backlink" size={16} />;
				name = U.String.sprintf(translate('popupSearchBacklinksFrom'), U.Object.name(token.object || {}));
				break;
			};
		};

		return (
			<div key={`token-${token.kind}-${token.id}`} className={cn.join(' ')}>
				{icon}
				<div className="name">{name}</div>
				<Icon className="clear" name="common/clear" size={16} onClick={() => removeToken(token, 'Token')} />
			</div>
		);
	};

	const rowRenderer = ({ index, key, style, parent }) => {
		const item = items[index];

		// Sentinel row past the loaded set - InfiniteLoader fetches the next page for it.
		// Rendered outside CellMeasurer: measuring the empty div would cache height 0
		if (!item) {
			return <div key={key} className="row" style={style} />;
		};

		let content = null;
		if (item.isSection) {
			content = (
				<div className={[ 'sectionName', (index == 0 ? 'first' : '') ].join(' ')} style={style}>
					{item.name}
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

		const isObject = item && item.isObject && !item.isCommandSuggest;
		const isMessage = item && item.isMessage;
		const isAction = item && (item.isSettings || item.isImport || item.isChip || item.isCommand || item.isCommandSuggest || [ 'add', 'addType', 'upload', 'graph', 'navigation' ].includes(item.id));

		return (
			<div className="foot">
				<Shortcut keys={[ 'arrowup', 'arrowdown', 'arrowright' ]} label={translate('popupSearchShortcutNavigate')} />
				{!onObjectSelect ? (
					<Shortcut keys={[ 'tab', '/' ]} separator={translate('commonOr')} label={translate('popupSearchShortcutRefine')} />
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
				<Icon className="search" name="common/search" />

				{tokens.length ? (
					<div className="tokens">
						{tokens.map(token => TokenItem(token))}
					</div>
				) : ''}

				<Filter
					className="underlined"
					value={filterValueRef.current}
					ref={filterInputRef}
					placeholder={tokens.length ? translate('commonSearch') : translate('popupSearchPlaceholder')}
					onSelect={onFilterSelect}
					onChange={v => onFilterChange(v)}
					onKeyUp={(e, v) => onFilterChange(v)}
					onClear={onFilterClear}
				/>
			</div>

			{!onObjectSelect && suggestions.length ? (
				<div className="typeSelectWrap">
					<div ref={typeSelectRef} className="typeSelect" onWheel={onTypeWheel} onScroll={checkTypeSelectFade}>
						{suggestions.map((item: any) => {
							const cn = [ 'typeItem', (item.id == chipHighlightRef.current ? 'active' : '') ];

							return (
								<div
									key={item.id}
									role="button"
									className={cn.join(' ')}
									onClick={() => onChipAdd(item)}
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
						text={(getLoadMode().id == SEARCH_TYPE_MESSAGE) ? translate('menuSearchChatEmptySearch') : ''}
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
