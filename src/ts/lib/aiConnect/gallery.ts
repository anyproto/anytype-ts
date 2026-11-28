/**
 * Connect to AI apps: the gallery model (Settings ▸ AI apps, §5.1). Pure: the cards, what Anytype found on
 * this computer and the account's connections go in; sections of rows come out, each with its status text
 * key and its one action. The page and the stories render this model; nothing here touches a key.
 */
import type { AiAppCatalogItem, AiAppId, AiBundleState, AiConnection, AiDetection, AiTargetId } from '../../interface/aiConnect';
import { searchCatalog } from './catalog';

/** The lookup a card needs: by app id (a Map, MobX's observable map, or a plain object) */
export type DetectionMap = { get (appId: AiAppId): AiDetection | undefined } | Record<string, AiDetection>;

const detectionOf = (map: DetectionMap, appId: AiAppId): AiDetection | null => {
	if (!map) {
		return null;
	};
	return ((typeof map.get == 'function') ? (map as { get (id: AiAppId): AiDetection }).get(appId) : (map as Record<string, AiDetection>)[appId]) || null;
};

/** Records the user sees: not removed, or removed with a revoke still outstanding (shown with Retry at once, V5) */
export const visibleConnections = (list: AiConnection[]): AiConnection[] => (list || []).filter(it => !it.removed || (it.status == 'revokeFailed') || !!it.revokePending?.length);

/** The record a card's detection maps to: same target id, and its file is one the card reads (or it has none) */
export const mapsTo = (det: AiDetection | null, connection: AiConnection): boolean => {
	if (!det || !det.targetId || (det.targetId != connection.id)) {
		return false;
	};
	return !connection.targetPath || (det.targetPaths || []).includes(connection.targetPath);
};

/** The connection a card shows (canonical-path mapping, R2-22) */
export const connectionForCard = (appId: AiAppId, detections: DetectionMap, list: AiConnection[]): AiConnection | null => {
	const det = detectionOf(detections, appId);
	return visibleConnections(list).find(it => (it.appId != 'other') && mapsTo(det, it)) || null;
};

/** The record main compares `expectedHash` with: whatever record sits at the card's target id, wherever its file is */
export const connectionAtTarget = (targetId: AiTargetId | undefined, list: AiConnection[]): AiConnection | null => {
	return (targetId && (list || []).find(it => it.id == targetId)) || null;
};

/** Other installed app cards whose detection maps to the same record (ChatGPT and Codex, for example) */
export const siblingCards = (connection: AiConnection, catalog: AiAppCatalogItem[], detections: DetectionMap): AiAppId[] => {
	if (!connection || (connection.appId == 'other')) {
		return [];
	};
	return catalog.filter(item => {
		const det = detectionOf(detections, item.id);
		return (item.kind == 'app') && (item.id != connection.appId) && !!det?.installed && mapsTo(det, connection);
	}).map(it => it.id);
};

/**
 * A card whose target moved away from its record (a new CODEX_HOME, R3-7): the record of the same card that
 * maps to no card any more. The sheet then offers to connect the new location; the old row stays.
 */
export const movedConnection = (appId: AiAppId, detections: DetectionMap, list: AiConnection[]): AiConnection | null => {
	const det = detectionOf(detections, appId);

	if (!det || !det.installed || !det.targetId) {
		return null;
	};
	return visibleConnections(list).find(it => (it.appId == appId) && !it.removed && (it.id != det.targetId) && !!it.targetPath && !(det.targetPaths || []).includes(it.targetPath)) || null;
};

/**
 * One record whose card now reads another place (W10): a file record whose file isn't one the card reads, or
 * a manual record (no file) at another target id than the card's. Reconnect is then a choice of location.
 */
export const isMovedRecord = (c: AiConnection, detections: DetectionMap): boolean => {
	if (!c || (c.appId == 'other') || c.removed) {
		return false;
	};

	const det = detectionOf(detections, c.appId);

	if (!det || !det.installed || !det.targetId || (det.targetId == c.id)) {
		return false;
	};
	return c.targetPath ? !(det.targetPaths || []).includes(c.targetPath) : (c.method == 'manual');
};

export type RowState =
	| 'connect' | 'notInstalled' | 'unknown' | 'shared' | 'unsupported' | 'other'
	| 'added' | 'connected' | 'finish' | 'pending' | 'probeFailed'
	| 'removed' | 'accessEnded' | 'unreadable' | 'reconnect' | 'conflict' | 'revokeFailed' | 'gone' | 'checking'
	/** Claude's extension: set up, not "Connected" yet (`connection.bundleState` says which step); its key retired for a Reconnect */
	| 'bundle' | 'disconnected';

export type RowAction = 'connect' | 'getApp' | 'setUpManually' | 'setUpRemote' | 'manage' | 'continue' | 'retryCheck' | 'fix' | 'retry' | 'forget' | 'details' | 'setUp';

export interface RowStatus {
	/** Text key; its %s is `args` */
	key: string;
	args?: string[];
	dot?: 'success' | 'error';
	/** A text key shown after it (`aiAppsStatusRevokePending`: a replaced key heart hasn't confirmed revoked yet) */
	suffix?: string;
};

export interface GalleryRow {
	/** Unique in the page: a connection id or a card id */
	id: string;
	appId: AiAppId;
	name: string;
	connection: AiConnection | null;
	state: RowState;
	status: RowStatus | null;
	/** Installed cards that use the same connection */
	alsoIn: string[];
	/** The one verb (the not-installed card also offers manual setup) */
	actions: { id: RowAction; disabled: boolean }[];
};

export interface Gallery {
	connected: GalleryRow[];
	detected: GalleryRow[];
	other: GalleryRow[];
	/** The scan finished and found no supported app */
	nothingDetected: boolean;
	/** A search that matches no card in Other apps */
	searchEmpty: boolean;
};

export interface GalleryInput {
	catalog: AiAppCatalogItem[];
	detections: DetectionMap;
	connections: AiConnection[];
	scanOk: boolean;
	isDesktop: boolean;
	/** Main's detections were read at least once (else nothing is known about this computer, V21) */
	loaded: boolean;
	/** Minting and healing need it; Manage, Disconnect, Forget and Retry don't */
	apiListening: boolean;
	query: string;
	/** Display name of a card (brand names, or the translation of its name key) */
	nameOf: (item: AiAppCatalogItem) => string;
};

/** What a connection's row shows: a removed record first, error states, a failed probe, an unconfirmed delivery, an outstanding step */
export const connectionState = (c: AiConnection): RowState => {
	// Disconnected (cleanup done) and a revoke still outstanding: Retry, whatever the last status said
	if (c.removed) {
		return 'revokeFailed';
	};

	switch (c.status) {
		case 'revokeFailed':
		case 'removed':
		case 'accessEnded':
		case 'unreadable':
		case 'reconnect':
		case 'conflict': {
			return c.status;
		};
		case 'notInstalled': {
			return 'gone';
		};
		case 'disconnected': {
			return 'disconnected';
		};
	};

	// Claude's extension: "Connected" is heart's isActive, latched by main (status `ok`); never probed (§3.3)
	if (c.method == 'package') {
		return (c.status == 'ok') ? 'connected' : 'bundle';
	};
	if (![ 'none', 'ok' ].includes(c.lastProbe)) {
		return 'probeFailed';
	};
	// A CLI write whose end is unknown: waiting until a check settles it (V16); an older candidate kept next
	// to a confirmed key (main's status isn't `pending` then) doesn't hide the key's next step (W12)
	if (c.unconfirmed?.length && (c.status == 'pending')) {
		return 'checking';
	};
	if (c.nextStep != 'none') {
		return 'finish';
	};
	if (c.status == 'pending') {
		return 'pending';
	};
	return c.firstUsedAt ? 'connected' : 'added';
};

/**
 * A surviving record (live or retired) with a replaced key heart hasn't confirmed revoked: "Revocation pending"
 * next to its state until heart does (tokens-plan §3.2, D1C-16). A removed one says so in its own state
 */
export const revocationPending = (c: AiConnection | null): boolean => !!c && !c.removed && (c.revokePending || []).some(h => !!h && (h != c.appHash));

/** The status text of Claude's extension before "Connected", by main's `bundleState` (§3.3) */
export const BUNDLE_STATUS: Record<AiBundleState, string> = {
	finish: 'aiAppsStatusBundleFinish',
	off: 'aiAppsStatusBundleOff',
	notConfirmed: 'aiAppsStatusBundleNotConfirmed',
	updated: 'aiAppsStatusBundleUpdated',
};

/** Status line and action of a state; `name` is the card's name */
const describe = (state: RowState, name: string, item: AiAppCatalogItem | null, apiListening: boolean, c: AiConnection | null = null): Pick<GalleryRow, 'status' | 'actions'> => {
	const act = (id: RowAction, needsApi = false) => ({ id, disabled: needsApi && !apiListening });

	switch (state) {
		case 'connect': {
			// Hermes: its guide for another machine stays reachable (also with the Local API off, H17)
			const actions = item?.remoteSetup ? [ act('connect', true), act('setUpRemote') ] : [ act('connect', true) ];
			return { status: item?.covers ? { key: item.covers } : null, actions };
		};
		case 'notInstalled': {
			// A card that also runs elsewhere (Hermes) offers that instead of a manual setup here
			const second = item?.remoteSetup ? act('setUpRemote') : act('setUpManually');
			const actions = item?.getUrl ? [ act('getApp'), second ] : [ second ];
			return { status: { key: 'aiAppsNotInstalled' }, actions };
		};
		case 'unknown': {
			return { status: { key: 'aiAppsStatusUnknown' }, actions: [ act('setUpManually') ] };
		};
		case 'checking': {
			return { status: { key: 'aiAppsStatusChecking', args: [ name ] }, actions: [ act('manage') ] };
		};
		case 'unsupported': {
			return { status: { key: 'aiAppsStatusCantConnect' }, actions: [ act('details') ] };
		};
		case 'other': {
			return { status: { key: 'aiAppsOtherDescription' }, actions: [ act('setUp') ] };
		};
		case 'added': {
			return { status: { key: 'aiAppsStatusAdded', dot: 'success' }, actions: [ act('manage') ] };
		};
		case 'connected': {
			return { status: { key: 'aiAppsStatusConnected', dot: 'success' }, actions: [ act('manage') ] };
		};
		case 'finish': {
			return { status: { key: 'aiAppsStatusFinish', args: [ name ] }, actions: [ act('continue', true) ] };
		};
		case 'pending': {
			return { status: { key: 'aiAppsStatusPending', args: [ name ] }, actions: [ act('manage') ] };
		};
		case 'probeFailed': {
			return { status: { key: 'aiAppsStatusProbeFailed', dot: 'error' }, actions: [ act('retryCheck', true) ] };
		};
		case 'removed': {
			return { status: { key: 'aiAppsStatusRemoved', args: [ name ], dot: 'error' }, actions: [ act('fix', true) ] };
		};
		case 'accessEnded': {
			return { status: { key: 'aiAppsStatusAccessEnded', dot: 'error' }, actions: [ act('fix', true) ] };
		};
		case 'unreadable': {
			return { status: { key: 'aiAppsStatusUnreadable', args: [ name ], dot: 'error' }, actions: [ act('fix', true) ] };
		};
		case 'reconnect': {
			return { status: { key: 'aiAppsStatusAttention', dot: 'error' }, actions: [ act('fix', true) ] };
		};
		case 'conflict': {
			// Claude has Anytype twice (the settings-file entry and the extension): Manage says which to remove (D1C-14)
			const status: RowStatus = c?.bothRoutes ? { key: 'aiAppsStatusBothRoutes', args: [ name ], dot: 'error' } : { key: 'aiAppsStatusConflict', dot: 'error' };

			return { status, actions: [ act('fix', true) ] };
		};
		case 'revokeFailed': {
			return { status: { key: 'aiAppsStatusRevokeFailed', dot: 'error' }, actions: [ act('retry') ] };
		};
		case 'gone': {
			return { status: { key: 'aiAppsNotInstalled' }, actions: [ act('forget') ] };
		};
		case 'bundle': {
			return { status: { key: BUNDLE_STATUS[c?.bundleState || 'finish'], args: [ name ] }, actions: [ act('continue') ] };
		};
		case 'disconnected': {
			return { status: { key: 'aiAppsStatusDisconnected', dot: 'error' }, actions: [ act('fix', true) ] };
		};
	};
	return { status: null, actions: [] };
};

/** The sections of the gallery */
export const buildGallery = (input: GalleryInput): Gallery => {
	const { catalog, detections, scanOk, isDesktop, loaded, apiListening, query, nameOf } = input;
	const list = visibleConnections(input.connections);
	const byId = (id: AiAppId) => catalog.find(it => it.id == id) || null;
	const installed = (id: AiAppId) => !!detectionOf(detections, id)?.installed;
	const strip = (row: GalleryRow): GalleryRow => isDesktop ? row : { ...row, actions: [] };

	// Connected: one row per connection, named after the card that created it; Other-app ones follow, by name
	const named = list.map(c => {
		const item = byId(c.appId);
		const name = (c.appId == 'other') ? (c.name || (item ? nameOf(item) : '')) : (item ? nameOf(item) : c.name);
		const state = connectionState(c);
		const alsoIn = siblingCards(c, catalog, detections).map(id => nameOf(byId(id)));

		const described = describe(state, name, item, apiListening, c);

		if (described.status && revocationPending(c)) {
			described.status = { ...described.status, suffix: 'aiAppsStatusRevokePending' };
		};
		return strip({ id: c.id, appId: c.appId, name, connection: c, state, alsoIn, ...described });
	});
	const connected = [
		...named.filter(it => it.appId != 'other'),
		...named.filter(it => it.appId == 'other').sort((a, b) => a.name.localeCompare(b.name)),
	];

	const detected: GalleryRow[] = [];
	const other: GalleryRow[] = [];

	for (const item of catalog) {
		// A card shown only where its app is (the Gemini app): absent otherwise, also while the scan can't tell
		if (item.onlyInstalled && !(scanOk && isDesktop && installed(item.id))) {
			continue;
		};

		const mapped = (item.kind == 'app') ? connectionForCard(item.id, detections, list) : null;

		// The card's own connection is its row in Connected. A record of this card that maps to no card any
		// more (a moved Codex home) stays there too, and the card itself is offered again for the new place
		if (mapped && (mapped.appId == item.id)) {
			continue;
		};

		const name = nameOf(item);
		const det = detectionOf(detections, item.id);
		let state: RowState = 'connect';

		if (item.kind == 'manual') {
			state = 'other';
		} else
		if (item.kind == 'unsupported') {
			state = 'unsupported';
		} else
		if (mapped && (mapped.appId != item.id)) {
			state = 'shared';
		} else
		if (!det?.installed) {
			// Absence is known only from a completed scan; otherwise it is unknown, not "Not on this computer" (V21)
			state = (isDesktop && (!loaded || !scanOk)) ? 'unknown' : 'notInstalled';
		};

		const row: GalleryRow = (state == 'shared')
			? {
				id: item.id, appId: item.id, name, connection: mapped, state, alsoIn: [],
				status: { key: 'aiAppsStatusShared', args: [ nameOf(byId(mapped.appId)) ] }, actions: [ { id: 'manage', disabled: false } ],
			}
			: { id: item.id, appId: item.id, name, connection: null, state, alsoIn: [], ...describe(state, name, item, apiListening) };

		// On this computer: installed cards only, and only when the scan can be trusted
		const isDetected = scanOk && isDesktop && (item.kind != 'manual') && installed(item.id);

		(isDetected ? detected : other).push(strip(row));
	};

	const matches = new Set(searchCatalog(query, nameOf).map(it => it.id));
	const filtered = other.filter(it => matches.has(it.appId));
	const ordered = [ ...filtered.filter(it => it.appId != 'other'), ...filtered.filter(it => it.appId == 'other') ];
	const anyInstalled = catalog.some(it => (it.kind != 'manual') && installed(it.id));

	return {
		connected,
		detected,
		other: ordered,
		nothingDetected: loaded && scanOk && isDesktop && !anyInstalled,
		searchEmpty: !!String(query || '').trim() && !ordered.length,
	};
};
