/**
 * Exact-shape validation of every aiConnect* IPC parameter, and the sender gate predicate.
 * Pure: no Electron, no file system. Anything the renderer sends passes through here first;
 * no path, command, URL, host or scheme ever comes from the renderer.
 */
import type { AiAppId, AiError, AiRoute, LinkAppGrant } from './types';
import { getCatalogItem, isValidPort, TIERS } from '../../../../src/ts/lib/aiConnect/catalog';
import { isValidLinkGrant } from '../../../../src/ts/lib/linkApprovalGrant';

export const VALIDATION_ERROR: AiError = Object.freeze({ stage: 'validate', category: 'unknown' }) as AiError;

const ROUTES: AiRoute[] = [ 'http', 'stdio', 'skill' ];
const HASH_RE = /^[A-Za-z0-9+/=_.:-]+$/;
const KEY_RE = /^[\x21-\x7E]+$/;
const KEY_FORBIDDEN = /["'`\\$<>]/;
const CONNECTION_ID_RE = /^[a-z0-9-]{1,64}$/;
const DIGEST_RE = /^[0-9a-f]{64}$/;
const NAME_MAX_BYTES = 128;
const KEYS_MAX = 1000;

type Rule = (v: any) => boolean;

const isPlainObject = (v: any): boolean => !!v && (typeof v == 'object') && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);

/** Own properties only: names on Object.prototype (`toString`, `__proto__`) are never schema members */
const own = (o: any, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k);

export const isBool: Rule = v => (typeof v == 'boolean');
export const isTier: Rule = v => TIERS.includes(v);
export const isRoute: Rule = v => ROUTES.includes(v);
export const isHash: Rule = v => (typeof v == 'string') && (v.length >= 1) && (v.length <= 256) && HASH_RE.test(v);
export const isExpectedHash: Rule = v => (v === null) || isHash(v);
export const isConnectionId: Rule = v => (typeof v == 'string') && CONNECTION_ID_RE.test(v);
export const isExpireAt: Rule = v => Number.isSafeInteger(v) && (v >= 0);
export const isAppId: Rule = v => (typeof v == 'string') && !!getCatalogItem(v);
export const isDigest: Rule = v => (typeof v == 'string') && DIGEST_RE.test(v);

/** A key as heart issues it: printable ASCII, nothing a shell, JSON or TOML string would treat specially */
export const isKey: Rule = v => (typeof v == 'string') && (v.length >= 16) && (v.length <= 512) && KEY_RE.test(v) && !KEY_FORBIDDEN.test(v);

export const isGrant: Rule = v => {
	if (!checkShape(v, { spaceIds: Array.isArray, allSpaces: isBool, perm: (n: any) => (typeof n == 'number') })) {
		return false;
	};
	if ((v.spaceIds.length > KEYS_MAX) || v.spaceIds.some((id: any) => (typeof id != 'string') || (id.length > 256))) {
		return false;
	};
	return isValidLinkGrant(v);
};

/** Control characters removed, then trimmed; '' when the result is empty or longer than 128 UTF-8 bytes */
export const cleanName = (v: any): string => {
	if (typeof v != 'string') {
		return '';
	};

	const name = v.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
	const bytes = Buffer.byteLength(name, 'utf8');

	return ((bytes >= 1) && (bytes <= NAME_MAX_BYTES)) ? name : '';
};

const isName: Rule = v => !!cleanName(v);

const isCheckKey: Rule = v => checkShape(v, { hash: isHash, present: isBool }, { grant: isGrant, expireAt: isExpireAt });
const isCheckKeys: Rule = v => (v === null) || (Array.isArray(v) && (v.length <= KEYS_MAX) && v.every(isCheckKey));
const isMethod: Rule = v => (v === 'config') || (v === 'command');
const isIntentId: Rule = v => (typeof v == 'string') && /^[0-9a-f]{16}$/.test(v);
const isIntentTime: Rule = v => Number.isSafeInteger(v) && (v >= 0);
const isWhat: Rule = v => [ 'bundle', 'target' ].includes(v);

/** The plan's canonical target, echoed back: compared with today's targets, never used as a path */
const isPreviewTarget: Rule = v => (typeof v == 'string') && (v.length <= 4096);

/** What the user agreed to replace: compared with the live entry, never used as a path */
const isReplace: Rule = v => checkShape(v, {
	targetPath: (p: any) => (typeof p == 'string') && (p.length >= 1) && (p.length <= 4096),
	foreignDigest: isDigest,
});

/** Every required property present (own) and valid, every optional one valid when present, nothing else */
const checkShape = (v: any, required: Record<string, Rule>, optional: Record<string, Rule> = {}): boolean => {
	if (!isPlainObject(v)) {
		return false;
	};

	for (const k of Object.keys(v)) {
		if (!own(required, k) && !own(optional, k)) {
			return false;
		};
	};

	for (const k of Object.keys(required)) {
		if (!own(v, k) || !required[k](v[k])) {
			return false;
		};
	};

	for (const k of Object.keys(optional)) {
		if (own(v, k) && (v[k] !== undefined) && !optional[k](v[k])) {
			return false;
		};
	};

	return true;
};

/** `command` is Other app's stdio setup only (`config`: an app's settings-file route) */
const methodOfApp = (p: any): boolean => (p.method !== 'command') || ((p.appId == 'other') && (p.route == 'stdio'));

/** The route must be one the card offers */
const routeOfApp = (appId: AiAppId, route: AiRoute): boolean => !!getCatalogItem(appId)?.routes.includes(route);

const SHAPES: Record<string, { required: Record<string, Rule>; optional?: Record<string, Rule>; extra?: (p: any) => boolean }> = {
	aiConnectList: {
		required: { accountId: isHash },
		optional: { refresh: isBool },
	},
	aiConnectPlan: {
		required: { accountId: isHash, appId: isAppId, route: isRoute, tier: isTier, port: isValidPort },
		optional: { method: isMethod, connectionId: isConnectionId, fresh: isBool },
		extra: p => routeOfApp(p.appId, p.route) && methodOfApp(p),
	},
	aiConnectApply: {
		required: {
			accountId: isHash, appId: isAppId, route: isRoute, tier: isTier, recommendedTier: isTier, port: isValidPort, key: isKey,
			appHash: isHash, name: isName, grant: isGrant, expireAt: isExpireAt, expectedHash: isExpectedHash,
		},
		// `connectionId`: only with `method: 'command'` (reconnects that Command connection); `intentId`: the mint intent this key came from
		optional: {
			method: isMethod, allowQuit: isBool, quitConfirmed: isBool, replace: isReplace, manual: isBool, previewTarget: isPreviewTarget,
			connectionId: isConnectionId, intentId: isIntentId,
		},
		extra: p => routeOfApp(p.appId, p.route) && methodOfApp(p) && (!p.connectionId || (p.method == 'command')),
	},
	aiConnectRecordManual: {
		required: {
			accountId: isHash, appId: isAppId, route: isRoute, tier: isTier, recommendedTier: isTier, port: isValidPort,
			appHash: isHash, name: isName, grant: isGrant, expireAt: isExpireAt, expectedHash: isExpectedHash,
		},
		optional: { connectionId: isConnectionId, previewTarget: isPreviewTarget, intentId: isIntentId },
		extra: p => routeOfApp(p.appId, p.route),
	},
	aiConnectUpdate: {
		required: { accountId: isHash, connectionId: isConnectionId, expectedHash: isExpectedHash, port: isValidPort },
		optional: { tier: isTier },
	},
	aiConnectRemove: {
		required: { accountId: isHash, connectionId: isConnectionId, expectedHash: isExpectedHash },
		optional: { forget: isBool },
	},
	aiConnectRevoked: {
		required: { accountId: isHash, connectionId: isConnectionId, hash: isHash },
	},
	aiConnectCheck: {
		// The port matters only while the API listens: then it must be valid. Offline it is never
		// looked at (any value, or none) and is dropped from the result
		required: { accountId: isHash, apiListening: isBool, keys: isCheckKeys },
		optional: { port: () => true },
		extra: p => !p.apiListening || isValidPort(p.port),
	},
	aiConnectProbe: {
		required: { port: isValidPort, tier: isTier, route: isRoute, key: isKey },
		optional: { accountId: isHash, connectionId: isConnectionId },
		extra: p => !p.connectionId || !!p.accountId,
	},
	aiConnectStepDone: {
		required: { accountId: isHash, connectionId: isConnectionId },
	},
	aiConnectRestartApp: {
		required: { appId: isAppId },
	},
	aiConnectReveal: {
		// Either a stored connection, or a card's bundle / target before any record exists
		required: {},
		optional: { accountId: isHash, connectionId: isConnectionId, appId: isAppId, what: isWhat },
		extra: p => {
			const byRecord = !!p.accountId && !!p.connectionId && !p.appId && !p.what;
			const byApp = !!p.appId && !!p.what && !p.accountId && !p.connectionId;

			return byRecord || byApp;
		},
	},
	aiConnectOpenApp: {
		required: { appId: isAppId },
	},
	aiConnectClaimNudge: {
		required: { accountId: isHash },
	},
	aiConnectBundleInfo: {
		required: {},
	},
	aiConnectMintIntent: {
		// Before CreateApp: the key's name and the time (seconds). Afterwards: `id` + `done` once the key was released
		required: { accountId: isHash },
		optional: { name: isName, time: isIntentTime, id: isIntentId, done: isBool },
		extra: p => (p.done === true) ? (!!p.id && (p.name === undefined) && (p.time === undefined)) : (!!p.name && (p.time !== undefined) && (p.id === undefined) && (p.done === undefined)),
	},
	aiConnectOrphan: {
		// A key whose release failed (`done` absent), or one whose revoke has now succeeded (`done: true`)
		// `intentId`: the hash was found by intent recovery (a key matching an earlier run's mint intent), which main re-checks
		required: { accountId: isHash, hash: isHash },
		// `key`: that key itself, so main can look for it in every record's own target before it is queued (T2)
		optional: { done: isBool, intentId: isIntentId, key: isKey },
		extra: p => (!p.intentId && (p.key === undefined)) || (!!p.intentId && !!p.key && (p.done === undefined)),
	},
};

export const AI_CONNECT_METHODS = Object.keys(SHAPES);

const cleanGrant = (g: any): LinkAppGrant => Object.assign(Object.create(null), { spaceIds: [ ...g.spaceIds ], allSpaces: g.allSpaces, perm: g.perm });

/** A validated value copied into a null-prototype structure, nested shapes included */
const cleanValue = (k: string, v: any): any => {
	switch (k) {
		case 'name': {
			return cleanName(v);
		};
		case 'grant': {
			return cleanGrant(v);
		};
		case 'replace': {
			return Object.assign(Object.create(null), { targetPath: v.targetPath, foreignDigest: v.foreignDigest });
		};
		case 'keys': {
			return (v === null) ? null : v.map((it: any) => {
				const key = Object.assign(Object.create(null), { hash: it.hash, present: it.present });

				if (own(it, 'grant') && (it.grant !== undefined)) {
					key.grant = cleanGrant(it.grant);
				};
				if (own(it, 'expireAt') && (it.expireAt !== undefined)) {
					key.expireAt = it.expireAt;
				};
				return key;
			});
		};
	};

	return v;
};

/**
 * Validates `param` for `method` and returns a clean copy: a null-prototype object holding only the
 * declared properties (`name` cleaned, nested shapes rebuilt), or null. Whether a `connectionId`
 * exists in the registry is checked by the service, in its queue.
 */
export const validateParam = <T = any>(method: string, param: any): T | null => {
	const shape = own(SHAPES, method) ? SHAPES[method] : null;

	if (!shape || !checkShape(param, shape.required, shape.optional)) {
		return null;
	};

	if (shape.extra && !shape.extra(param)) {
		return null;
	};

	const ret = Object.create(null);
	const declared = Object.keys(shape.required).concat(Object.keys(shape.optional || {}));

	// aiConnectCheck: the port is ignored unless the API listens
	const ignored = ((method == 'aiConnectCheck') && !param.apiListening) ? [ 'port' ] : [];

	for (const k of declared) {
		if (own(param, k) && (param[k] !== undefined) && !ignored.includes(k)) {
			ret[k] = cleanValue(k, param[k]);
		};
	};

	return ret as T;
};

// ---------------------- Live API state ---------------------- //

/**
 * The API listens on `port` now, as the renderer's shared settings say (Z4, A1): `localApi` (enabled, port; the
 * window that changes it writes it first) and `localApiBind` (heart's last bind outcome, written by every window
 * that sees it). Disabled, another configured port, or a failed or unknown bind → not listening: nothing heals.
 */
export const liveApiListening = (port: number, localApi: any, bind: any): boolean => {
	const cfg = (localApi && (typeof localApi == 'object')) ? localApi : null;
	const last = (bind && (typeof bind == 'object')) ? bind : null;
	const configured = Number(cfg?.port);

	if (!isValidPort(port) || (cfg?.enabled === false) || (isValidPort(configured) && (configured !== port))) {
		return false;
	};
	if (!last || (last.success !== true)) {
		return false;
	};
	return Number(String(last.addr || '').split(':').pop()) === port;
};

// ---------------------- Sender gate ---------------------- //

export interface AiSenderWindow {
	isQuickSearch: boolean;
	isApproval: boolean;
	isFocused: boolean;
	/** webContents id of the window's active tab view, or null */
	activeViewId: number | null;
};

export interface AiSenderInfo {
	cmd: string;
	/** webContents id of the sender */
	senderId: number;
	/** The call comes from the sender's top frame */
	isMainFrame: boolean;
};

/**
 * aiConnect* IPC is accepted only from the active tab's top frame of a normal app window:
 * not Quick Search, not the approval prompt, not the tab strip (the window's own webContents),
 * not a background tab, not a sub-frame. Claiming the nudge also needs a focused window.
 * A correctness gate, not containment of a hostile renderer.
 */
export const aiConnectSenderAllowed = (win: AiSenderWindow, sender: AiSenderInfo): boolean => {
	if (!win || !sender || win.isQuickSearch || win.isApproval) {
		return false;
	};

	if ((win.activeViewId === null) || (sender.senderId !== win.activeViewId) || !sender.isMainFrame) {
		return false;
	};

	if ((sender.cmd == 'aiConnectClaimNudge') && !win.isFocused) {
		return false;
	};

	return true;
};

