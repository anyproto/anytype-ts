/**
 * Connect to AI apps: renderer orchestration (§4.2, §4.3).
 *
 * Every call to main or heart goes through here; the popup controller and the page only call these
 * functions. A key lives in one place in the renderer: this module's `operation`, only while it is
 * undelivered (one per connect / reconnect / manual flow; never MobX, Storage, a route, analytics, a log or a
 * component's state). Once main or the user has it, only its hash stays (tokens-plan §3.2): a Copy fetches it
 * from heart's list by that hash into the call (`copySecret`). Closing the popup never abandons a delivery:
 * `releasePendingKey()` waits for the call in flight, then keeps a committed key or revokes an uncommitted one (R3-1).
 *
 * An operation belongs to the account that started it: after every await it stops when it was cancelled
 * or the account changed, and its cleanup never runs under another account's session.
 *
 * Uses the app's globals `C`, `S`, `Renderer` and `analytics` (through `events.ts`; tests stub them) and nothing from `U`.
 */
import type {
	AiApiState, AiAppId, AiApplyResult, AiBundleInfoResult, AiCheckResult, AiClaimNudgeResult, AiConnection, AiCopySecretResult, AiError, AiErrorCategory, AiListResult,
	AiMintIntentResult, AiOpenAppResult, AiOrphanResult, AiPlan, AiPlanResult, AiProbeResult, AiRecordManualResult, AiRemoveResult, AiReplace, AiRestartResult,
	AiRetireResult, AiRevealResult, AiRevokedResult, AiRoute, AiSetup, AiStep, AiStepDoneResult, AiTier, AiUpdateResult,
} from '../../interface/aiConnect';
import type { LinkAppGrant } from '../../interface/linkApproval';
import { isValidLinkGrant } from '../linkApprovalGrant';
import { isValidPort, KEY_PLACEHOLDER } from './catalog';
import { track } from './events';
import { stepsNeedKey } from './steps';

/**
 * The real preload exposes `aiConnect: true` on `window.Electron`. The web mock and the extension
 * mock both define `Api` but not this capability, so without it no key is minted and no key-bearing
 * IPC is sent.
 */
export const isDesktop = (electron?: any): boolean => {
	const bridge = (electron !== undefined) ? electron : ((typeof window != 'undefined') ? (window as any).Electron : null);
	return !!bridge && (bridge.aiConnect === true);
};

/** Timings, adjustable by tests */
export const flowConfig = {
	/** Between key lookups after CreateApp */
	lookupDelay: 300,
	lookupRetries: 3,
	/** An account RPC that never answers counts as failed after this; a late CreateApp is still released */
	rpcTimeout: 30000,
	pollInterval: 3000,
	pollTimeout: 120000,
	/** Claude's extension: heart's isActive is read this often while the Finish view is open, for at most this long (§3.3) */
	bundlePollInterval: 5000,
	bundlePollTimeout: 10 * 60 * 1000,
	/** A mint intent that matches no key is kept this long (a grant heart couldn't read for a moment is not lost), then dropped */
	intentKeepSec: 24 * 3600,
	/** CreateApp runs right after its mint intent is saved: only a key created this soon after the intent can be its key (D1C-06) */
	intentWindowSec: 10 * 60,
	/** A closing tab waits this long for its undelivered key to be revoked (X5); main gives the tab 5 s in all */
	closeTimeout: 2500,
};

/** heart's RevokeApp `NOT_FOUND`: the key is already gone, which counts as revoked */
const REVOKE_NOT_FOUND = 3;

const UNKNOWN: AiError = { stage: 'validate', category: 'unknown' };
const API_OFF: AiError = { stage: 'key', category: 'apiOff' };

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// ---------------------- API state ---------------------- //

export const portOf = (addr: string): number => Number(String(addr || '').split(':').pop());

/** The Local API as AI apps see it: work that needs it runs only in `listening` */
export const apiState = (): AiApiState => {
	const auth = S.Auth;

	if (!auth.localApiConfig.enabled) {
		return 'disabled';
	};

	const status = auth.jsonApiStatus;

	if (!status) {
		return 'unknown';
	};
	if (!status.success) {
		return 'failed';
	};
	return isValidPort(portOf(status.listenAddr)) ? 'listening' : 'failed';
};

/** The live port, only while the API listens; 0 otherwise */
export const getPort = (): number => (apiState() == 'listening') ? portOf(S.Auth.jsonApiStatus.listenAddr) : 0;

/** For previews and manual steps while the API is off: the configured port */
export const previewPort = (): number => getPort() || S.Auth.localApiConfig.port;

/**
 * Anytype's API listens on `port` now: only then may a key go out in instructions that name that port
 * (Show, Copy, "I've updated"); the configured port while the API failed never counts (X4)
 */
export const liveFor = (port: number): boolean => !!port && (getPort() == port);

/**
 * The record's file moved while its target id stayed (an LM Studio or Copilot home): the plan's canonical
 * file differs from the record's on the same route (Claude Desktop's methods use different files) (X3)
 */
export const movedFile = (c: AiConnection | null | undefined, p: AiPlan | null | undefined): boolean => {
	if (!c?.targetPath || !p?.targetPath || (c.method == 'manual') || (p.route != c.route)) {
		return false;
	};
	if ((c.appId == 'claude-desktop') && (p.method != c.method)) {
		return false;
	};
	return p.targetPath != c.targetPath;
};

const accountId = (): string => String(S.Auth.account?.id || '');

// ---------------------- calls ---------------------- //

/** One aiConnect* call to main; null when this isn't the desktop app or main gave no answer */
const ipc = async <T>(cmd: string, param: any): Promise<T | null> => {
	if (!isDesktop()) {
		return null;
	};

	try {
		const res = await Renderer.send(cmd, param);
		return (res && (typeof res == 'object')) ? res as T : null;
	} catch (e) {
		return null;
	};
};

/** A heart RPC as a promise; one that never answers resolves with `fallback` */
const rpc = <T>(start: (done: (v: T) => void) => void, fallback: T): Promise<T> => new Promise(resolve => {
	let settled = false;
	let timer: ReturnType<typeof setTimeout> = null;
	const done = (v: T) => {
		if (!settled) {
			settled = true;
			clearTimeout(timer);
			resolve(v);
		};
	};

	timer = setTimeout(() => done(fallback), flowConfig.rpcTimeout);
	try {
		start(done);
	} catch (e) {
		done(fallback);
	};
});

interface AppRow { hash: string; apiKey: string; name?: string; createdAt?: number; grant?: LinkAppGrant; expireAt: number; isActive?: boolean };

/**
 * The first 16 hex of sha256(key), as main's keyFingerprint: what the renderer keeps of a key it couldn't
 * identify yet (never the key itself)
 */
export const keyFingerprint = async (key: string): Promise<string> => {
	const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(key || '')));

	return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
};

/** The key list (key-bearing): only in the desktop app (V14) */
const listApps = (): Promise<{ ok: boolean; list: AppRow[] }> => {
	if (!isDesktop()) {
		return Promise.resolve({ ok: false, list: [] });
	};
	return rpc<{ ok: boolean; list: AppRow[] }>(done => {
		C.AccountLocalLinkListApps((message: any) => done(message?.error?.code ? { ok: false, list: [] } : { ok: true, list: message?.list || [] }));
	}, { ok: false, list: [] });
};

/** No timeout of its own: the real answer is always awaited by someone (a late key is released, V13) */
const createApp = (app: { name: string; grant: LinkAppGrant; expireAt: number }): Promise<{ ok: boolean; key?: string }> => new Promise(resolve => {
	try {
		C.AccountLocalLinkCreateApp(app, (message: any) => resolve((message?.error?.code || !message?.key) ? { ok: false } : { ok: true, key: message.key }));
	} catch (e) {
		resolve({ ok: false });
	};
});

/**
 * `ok` and `notFound` both mean the key is gone. Only heart's own answer says so (S1): a transport error
 * carries grpc-web's code (HTTP 400 → 3, the same number as heart's NOT_FOUND) and leaves the key valid
 */
const revokeApp = (hash: string): Promise<'ok' | 'notFound' | 'failed'> => rpc<'ok' | 'notFound' | 'failed'>(done => {
	C.AccountLocalLinkRevokeApp(hash, (message: any) => {
		const code = Number(message?.error?.code) || 0;

		if (!message || message.error?.transport) {
			done('failed');
			return;
		};
		done(!code ? 'ok' : ((code == REVOKE_NOT_FOUND) ? 'notFound' : 'failed'));
	});
}, 'failed');

const updateApp = (hash: string, grant: LinkAppGrant): Promise<boolean> => rpc<boolean>(done => {
	C.AccountLocalLinkUpdateApp(hash, grant, (message: any) => done(!message?.error?.code));
}, false);

const nowSec = (): number => Math.floor(Date.now() / 1000);
const isExpired = (row: AppRow): boolean => !!row.expireAt && (row.expireAt <= nowSec());

export const sameGrant = (a?: LinkAppGrant, b?: LinkAppGrant): boolean => !!a && !!b && (a.allSpaces == b.allSpaces) && (a.perm == b.perm)
	&& (a.spaceIds.length == b.spaceIds.length) && a.spaceIds.every(id => b.spaceIds.includes(id));

const planOf = (res: AiPlanResult): AiPlan => {
	const ret: any = { ...res };

	delete ret.ok;
	return ret as AiPlan;
};

// ---------------------- cleanup that couldn't run yet ---------------------- //

/**
 * Undelivered keys whose revoke failed and that main couldn't take as orphans either (or whose account isn't
 * signed in now), retried by every check of that account (V12). Usually only the hash; a key minted whose
 * hash couldn't be looked up under its own account (a late CreateApp, an account switch) keeps the key's
 * fingerprint until that account's list shows a key with it (W6, tokens-plan §3.2). Module memory only:
 * never MobX, Storage or a log.
 */
const leftovers: { accountId: string; hash: string; fp: string; attempts: number; misses: number; intentId?: string; ifUnowned?: boolean }[] = [];

/** The mint intent's time lies a little before CreateApp: heart stamps the key with this machine's clock, in whole seconds */
const INTENT_SKEW = 2;

/** The key of this mint intent is accounted for (revoked, or handed to main as an orphan): main forgets the intent */
const clearIntent = async (account: string, intentId?: string): Promise<void> => {
	if (account && intentId) {
		await ipc<AiMintIntentResult>('aiConnectMintIntent', { accountId: account, id: intentId, done: true });
	};
};

/** An unidentified key missing from this many successful lists of its account was revoked elsewhere (X6) */
const MAX_MISSES = 5;

/**
 * A key to revoke later: its hash, or (not identified yet) its fingerprint. `ifUnowned`: a delivery whose answer
 * was lost and whose outcome no list could tell (D1C-03): revoked only once a successful list shows that no
 * record owns it; a record that has it means main committed it, and it is dropped from here
 */
const remember = (account: string, hash: string, fp = '', intentId?: string, ifUnowned = false): void => {
	if (!account || (!hash && !fp)) {
		return;
	};
	if (!leftovers.some(it => (it.accountId == account) && ((hash && (it.hash == hash)) || (fp && (it.fp == fp))))) {
		// The intent stays with main until this key is gone: if Anytype dies first, the next run finds the key by it
		leftovers.push({ accountId: account, hash, fp: hash ? '' : fp, attempts: 0, misses: 0, ...(intentId ? { intentId } : {}), ...(ifUnowned ? { ifUnowned } : {}) });
	};
	if (accountId() == account) {
		S.AiConnect.setCleanupFailed(cleanupFailed());
	};
};

/**
 * Cleanup of the current account that keeps failing, or a key it couldn't identify yet: the page shows the
 * Local API hint
 */
export const cleanupFailed = (): boolean => leftovers.some(it => (it.accountId == accountId()) && ((it.attempts > 0) || !it.hash));

/**
 * Revokes a key that was never delivered, under the account that minted it. A failed revoke goes to main's
 * orphan list; when that fails too, or another account is signed in now, the hash waits in memory.
 */
const releaseKey = async (hash: string, account: string, intentId?: string): Promise<void> => {
	if (!account || !hash) {
		return;
	};
	if (accountId() != account) {
		remember(account, hash, '', intentId);
		return;
	};
	if ((await revokeApp(hash)) != 'failed') {
		await clearIntent(account, intentId);
		return;
	};

	const res = await ipc<AiOrphanResult>('aiConnectOrphan', { accountId: account, hash });

	if (!res?.ok) {
		remember(account, hash, '', intentId);
		return;
	};
	// Main's orphan list has it now
	await clearIntent(account, intentId);
};

// ---------------------- the operation ---------------------- //

/**
 * A key this flow holds, with what it was minted with. `key` is '' once a Copy handed it over (D1S-11): only its
 * hash stays, and an action that needs the key again reads it from heart's list by that hash
 */
interface HeldKey { key: string; appHash: string; name: string; grant: LinkAppGrant; expireAt: number; intentId?: string };

interface Operation {
	id: number;
	/** The account that started it: nothing of it runs under another one */
	accountId: string;
	/** Minted for this flow and not delivered yet: revoked when the flow ends */
	pending: HeldKey | null;
	/** Delivered (or left with main as unconfirmed): never revoked here. Its hash only: the key went to main or the user */
	committed: Omit<HeldKey, 'key'> | null;
	/** The call that hasn't answered yet */
	inFlight: Promise<unknown> | null;
	cancelRequested: boolean;
};

let operation: Operation | null = null;
let operationSeq = 0;

const ensureOperation = (): Operation => {
	if (!operation) {
		operation = { id: ++operationSeq, accountId: accountId(), pending: null, committed: null, inFlight: null, cancelRequested: false };
	};
	return operation;
};

/** The operation may go on: not cancelled, and its account is still the signed-in one */
const alive = (op: Operation): boolean => !op.cancelRequested && (accountId() == op.accountId);

/**
 * Runs `fn` as the operation's call in flight, registered before its first await (V1): one at a time, and
 * every close waits for it.
 */
const inOperation = async <T>(fn: (op: Operation) => Promise<T>, busy: T): Promise<T> => {
	const op = ensureOperation();

	if (op.inFlight) {
		return busy;
	};

	const run = fn(op);

	op.inFlight = run;
	try {
		return await run;
	} finally {
		if (op.inFlight === run) {
			op.inFlight = null;
		};
	};
};

/**
 * The key this flow holds, by its hash only: the pending (undelivered) one, else the one it delivered. null
 * once the flow ended. Never the key: a view that shows one masks it, and Copy goes through `copySecret`.
 */
export const heldKey = (): { appHash: string; committed: boolean } | null => {
	const held = operation?.pending || operation?.committed;
	return held ? { appHash: held.appHash, committed: !operation.pending } : null;
};

/** A delivery committed: the pending key belongs to the record now, and only its hash stays here (§3.2) */
const commit = (op: Operation): void => {
	if (op.pending) {
		const { key: _key, ...rest } = op.pending;

		op.committed = rest;
		op.pending = null;
	};
};

const settle = async (op: Operation): Promise<void> => {
	while (op.inFlight) {
		try {
			await op.inFlight;
		} catch (e) { /* settled */ };
	};
};

/** Revokes the pending key of `op` now (the caller is `op`'s call in flight, or waited for it) */
const dropPending = async (op: Operation): Promise<void> => {
	const held = op.pending;

	op.pending = null;
	if (held) {
		await releaseKey(held.appHash, op.accountId, held.intentId);
	};
};

/**
 * A delivery whose answer was lost, and no list could say whether main committed it (D1C-03): the pending key
 * leaves the flow unrevoked, and only its hash waits for a successful list of its account (`remember`'s `ifUnowned`)
 */
const undecided = (op: Operation): void => {
	const held = op.pending;

	op.pending = null;
	if (held) {
		remember(op.accountId, held.appHash, '', held.intentId, true);
	};
};

/**
 * Every close path of the popup ends here (Cancel, Esc, navigation, Close). Waits for the call in flight;
 * then a committed key is kept (its rotation and probe finish normally) and an uncommitted one is revoked.
 */
/**
 * The popup's close, synchronously (W11): the operation stops before its next side effect; the release
 * (`releasePendingKey`, on unmount) still waits for the call in flight
 */
export const requestCancel = (): void => {
	if (operation) {
		operation.cancelRequested = true;
	};
};

/** Releases still running (a popup's unmount started one): a closing tab waits for them too (Y1) */
const releasing = new Set<Promise<void>>();

export const releasePendingKey = (): Promise<void> => {
	const op = operation;

	if (!op) {
		return Promise.resolve();
	};

	operation = null;
	op.cancelRequested = true;

	const run = (async () => {
		await settle(op);
		await dropPending(op);
		op.committed = null;
	})();

	releasing.add(run);
	run.catch(() => {}).finally(() => releasing.delete(run));
	return run;
};

/** The pending key fits a request only when it was minted with the same name, access and expiry */
const fits = (held: HeldKey, app: { name: string; grant: LinkAppGrant; expireAt: number }): boolean => {
	return (held.name == app.name) && sameGrant(held.grant, app.grant) && (held.expireAt == app.expireAt);
};

/** The undelivered key was minted with exactly these values (the manual view shows it only then, X1) */
export const pendingFits = (app: { name: string; grant: LinkAppGrant; expireAt: number }): boolean => !!operation?.pending && fits(operation.pending, app);

/** Revokes the undelivered key now and keeps the flow (its access was edited, or the user put the old entry back) */
export const releasePending = (): Promise<boolean> => inOperation<boolean>(async op => {
	await dropPending(op);
	return true;
}, false);

/**
 * The tab's session is about to close (its `close-session` handler): the flow stops and an undelivered key is
 * revoked while the session can still do it, then `close` runs; never longer than `closeTimeout`. A
 * committed key is left alone (X5).
 */
export const beforeSessionClose = async (close: () => void): Promise<void> => {
	let timer: ReturnType<typeof setTimeout> = null;

	requestCancel();
	releasePendingKey();
	await Promise.race([
		// This flow's release and any one already under way (the popup's unmount), Y1
		Promise.all([ ...releasing ]).catch(() => {}),
		new Promise<void>(resolve => {
			timer = setTimeout(resolve, flowConfig.closeTimeout);
		}),
	]);
	clearTimeout(timer);
	close();
};

// ---------------------- keys ---------------------- //

export type MintResult = { ok: true; key: string; appHash: string; intentId?: string } | { ok: false; error: AiError };

/**
 * The hash of a key: the ListApps row whose key matches (never the name); the lookup is retried, CreateApp
 * never. Only under `account`: another account's list can't have it ('' then).
 */
const hashOf = async (key: string, account: string): Promise<string> => {
	for (let attempt = 0; attempt <= flowConfig.lookupRetries; attempt++) {
		if (attempt) {
			await wait(flowConfig.lookupDelay);
		};
		if (accountId() != account) {
			return '';
		};

		const res = await listApps();

		if (accountId() != account) {
			return '';
		};
		const row = res.ok ? res.list.find(it => it.apiKey === key) : null;

		if (row?.hash) {
			return row.hash;
		};
	};
	return '';
};

/**
 * The only place a key is created (R2-1). A CreateApp that takes too long reports a timeout, but its answer
 * is still awaited: a key that arrives late is looked up and released, never dropped (V13).
 *
 * Before CreateApp, main saves a mint intent (account, key name, time): if Anytype dies between CreateApp and
 * the delivery, the next check of that account finds the key by it and revokes it (anytype-mcp-plan §2.9).
 * No intent, no key.
 */
export const mintKey = async (app: { name: string; grant: LinkAppGrant; expireAt: number }, account = accountId()): Promise<MintResult> => {
	if (!isDesktop() || (apiState() != 'listening')) {
		return { ok: false, error: API_OFF };
	};
	// CreateApp runs under the session signed in now: only for the account the key is for (W6)
	if (!account || (accountId() != account)) {
		return { ok: false, error: UNKNOWN };
	};
	// No key without an explicit choice of spaces (one, several or All spaces): nothing is preselected
	if (!isValidLinkGrant(app.grant)) {
		return { ok: false, error: UNKNOWN };
	};

	// The intent names the access and expiry too: recovery takes only a key made with exactly these (D1S-18)
	const save = () => ipc<AiMintIntentResult>('aiConnectMintIntent', { accountId: account, name: app.name, time: Math.max(0, nowSec() - INTENT_SKEW), grant: app.grant, expireAt: app.expireAt });
	let intent = await save();

	if (!intent?.ok) {
		return { ok: false, error: { stage: 'write', category: 'unsaved' } };
	};
	// The time main saved (its queue may have kept the request waiting). A window that has run out since (the machine
	// slept) gets a fresh intent first: CreateApp always runs inside its intent's window (D1C-22)
	if ((accountId() == account) && ((nowSec() - (intent.time ?? nowSec())) >= (flowConfig.intentWindowSec / 2))) {
		const old = intent.id;

		intent = await save();
		await clearIntent(account, old);
		if (!intent?.ok) {
			return { ok: false, error: { stage: 'write', category: 'unsaved' } };
		};
	};
	// Another account signed in while main saved it: nothing was created
	if (accountId() != account) {
		await clearIntent(account, intent.id);
		return { ok: false, error: UNKNOWN };
	};

	const intentId = intent.id;
	const created = createApp({ name: app.name, grant: app.grant, expireAt: app.expireAt });
	let timer: ReturnType<typeof setTimeout> = null;
	const late = new Promise<'late'>(resolve => {
		timer = setTimeout(() => resolve('late'), flowConfig.rpcTimeout);
	});
	const first = await Promise.race([ created, late ]);

	clearTimeout(timer);

	if (first == 'late') {
		// Q6: a CreateApp that failed, or whose answer never came, may still have minted the key: the intent stays
		// (the next run's check clears an intent no key matches)
		created.then(res => {
			if (res.ok) {
				releaseUnknown(res.key, account, intentId);
			};
		});
		return { ok: false, error: { stage: 'key', category: 'timeout' } };
	};
	if (!first.ok) {
		// Q6: "failed" covers a lost reply too (a transport error, an empty answer), and heart may have minted the
		// key all the same: the intent stays until the next run's check finds that key or none
		return { ok: false, error: { stage: 'key', category: 'unknown' } };
	};

	const hash = await hashOf(first.key, account);

	if (!hash) {
		// Created but not identified (the list didn't show it, or another account signed in): its account's next
		// check releases it, found by the key's fingerprint
		remember(account, '', await keyFingerprint(first.key), intentId);
		return { ok: false, error: { stage: 'key', category: 'keyNotFound' } };
	};
	return { ok: true, key: first.key, appHash: hash, intentId };
};

/**
 * A key this flow created but won't use and couldn't identify yet: looked up and released under its own
 * account; while that isn't possible the key waits in module memory for that account's next check (W6)
 */
const releaseUnknown = async (key: string, account: string, intentId?: string): Promise<void> => {
	const hash = await hashOf(key, account);

	if (hash) {
		await releaseKey(hash, account, intentId);
	} else {
		remember(account, '', await keyFingerprint(key), intentId);
	};
};

/**
 * Mints into `op.pending`, or keeps a pending key minted with the same values (another one is revoked
 * first). A key that arrives after the flow was cancelled stays pending: the release revokes it.
 */
const mintPending = async (op: Operation, app: { name: string; grant: LinkAppGrant; expireAt: number }): Promise<{ ok: true; held: HeldKey } | { ok: false; error: AiError }> => {
	if (op.pending && fits(op.pending, app)) {
		return { ok: true, held: op.pending };
	};

	await dropPending(op);

	// Closed or another account while the previous key was released: no new key (W6)
	if (!alive(op)) {
		return { ok: false, error: UNKNOWN };
	};

	const minted = await mintKey(app, op.accountId);

	if ('error' in minted) {
		return { ok: false, error: minted.error };
	};

	op.pending = { key: minted.key, appHash: minted.appHash, name: app.name, grant: app.grant, expireAt: app.expireAt, ...(minted.intentId ? { intentId: minted.intentId } : {}) };
	return { ok: true, held: op.pending };
};

/** A connection's live key: `ok: false` when the lookup failed (not the same as a key that is gone) */
const lookupKey = async (connection: AiConnection): Promise<{ ok: boolean; key: string }> => {
	const res = await listApps();
	const row = res.ok ? res.list.find(it => it.hash == connection?.appHash) : null;

	return { ok: res.ok, key: (row && !isExpired(row) && row.apiKey) ? row.apiKey : '' };
};

/** The live key of a connection (its record holds only the hash), or null; for one call, never kept */
const keyFor = async (connection: AiConnection): Promise<string | null> => {
	if (!connection?.appHash) {
		return null;
	};
	return (await lookupKey(connection)).key || null;
};

/**
 * The only way a key, or a snippet with it, reaches the clipboard (§3.4): main writes the text and removes it
 * after 5 minutes. `template` holds KEY_PLACEHOLDER where the key goes (KEY_PLACEHOLDER alone: the key). The key
 * is this flow's undelivered one, else heart's by `appHash`, read into this call and dropped. `connectionId`
 * binds the copy to a record (main clears it once that record is "Connected"), else it is bound to the key.
 */
export const copySecret = async (p: { template: string; appHash: string; connectionId?: string }): Promise<boolean> => {
	const account = accountId();

	if (!account || !isDesktop() || !p.appHash) {
		return false;
	};

	const pending = operation?.pending;
	const own = (pending && (pending.appHash == p.appHash) && (operation.accountId == account)) ? pending : null;
	let key = own?.key || '';

	if (!key) {
		key = (await keyFor({ appHash: p.appHash } as AiConnection)) || '';
	};
	if (!key || (accountId() != account)) {
		return false;
	};

	const text = String(p.template || KEY_PLACEHOLDER).split(KEY_PLACEHOLDER).join(key);
	const param = p.connectionId ? { accountId: account, connectionId: p.connectionId, text } : { accountId: account, appHash: p.appHash, text };

	key = '';
	// Handed over: the undelivered key keeps only its hash and access here (D1S-11); "I've updated" reads it back by hash
	if (own) {
		own.key = '';
	};
	return !!(await ipc<AiCopySecretResult>('aiConnectCopySecret', param))?.ok;
};

/**
 * Takes this owner's copy off the clipboard (a manual sheet's Cancel or close, D1S-11). Main clears it only while
 * it is still the latest copy and still on the clipboard (§3.4)
 */
export const clearCopied = async (p: { appHash?: string; connectionId?: string }): Promise<void> => {
	const account = accountId();

	if (!account || !isDesktop() || (!p.appHash && !p.connectionId)) {
		return;
	};

	const param = p.connectionId ? { accountId: account, connectionId: p.connectionId, clear: true } : { accountId: account, appHash: p.appHash, clear: true };

	await ipc<AiCopySecretResult>('aiConnectCopySecret', param);
};

export interface LiveAccess { ok: boolean; present: boolean; grant: LinkAppGrant; expireAt: number };

/** The grant and expiry heart has for a connection's key now; `present: false` when it is gone or expired */
export const liveAccess = async (connection: AiConnection): Promise<LiveAccess> => {
	const res = await listApps();
	const row = res.ok ? res.list.find(it => it.hash == connection.appHash) : null;
	const present = !!row && !isExpired(row);

	return {
		ok: res.ok,
		present,
		grant: (present && row.grant) ? row.grant : connection.grant,
		expireAt: present ? (Number(row.expireAt) || 0) : connection.expireAt,
	};
};

/**
 * The hashes of a record the renderer may revoke: its pending revokes, except candidates whose CLI may
 * still be writing them (main settles those, V10). A removed record (disconnect) gives up all of them.
 */
export const revocable = (c: AiConnection): string[] => {
	const running = (c?.unconfirmed || []).filter(it => it.running).map(it => it.appHash);
	return (c?.revokePending || []).filter(h => c.removed || !running.includes(h));
};

/** Revokes every hash a record waits to see gone, each under `account` only; true when none is left */
const revokeOutstanding = async (connection: AiConnection, account: string): Promise<boolean> => {
	let all = true;

	for (const hash of revocable(connection)) {
		if (accountId() != account) {
			return false;
		};

		const res = await revokeApp(hash);

		if (res == 'failed') {
			all = false;
			continue;
		};
		if (accountId() != account) {
			return false;
		};

		const done = await ipc<AiRevokedResult>('aiConnectRevoked', { accountId: account, connectionId: connection.id, hash });

		if (!done?.ok) {
			all = false;
		};
	};
	return all;
};

/**
 * A record whose CLI may still be writing an earlier key (a running candidate): no manual rotation now, its
 * revoke would break the key that CLI is about to install (W5). The store's copy is the latest known one.
 */
export const stillSaving = (connection: AiConnection | null): boolean => {
	const latest = (connection && S.AiConnect.getById(connection.id)) || connection;
	return !!latest && !latest.removed && !!(latest.unconfirmed || []).some(it => it.running);
};

// ---------------------- list and check ---------------------- //

/** Every hash Anytype manages for this account: the records' keys, pending revokes, unconfirmed deliveries and orphans */
export const managedHashes = (connections: AiConnection[], orphanHashes: string[]): string[] => {
	const set = new Set<string>();

	for (const c of connections || []) {
		[ c.appHash, ...(c.revokePending || []), ...(c.unconfirmed || []).map(it => it.appHash) ].filter(it => it).forEach(it => set.add(it));
	};
	(orphanHashes || []).forEach(it => set.add(it));
	return [ ...set ];
};

/** Detections and connections into the store; a failure is kept visible, the earlier data stays (V21) */
export const load = async (refresh = false): Promise<boolean> => {
	const account = accountId();

	if (!account || !isDesktop()) {
		return false;
	};

	// Another account's data is never shown, not even while this one loads or after its load failed (W20)
	S.AiConnect.ensureAccount(account);
	S.AiConnect.setLoading(true);

	const res = await ipc<AiListResult>('aiConnectList', refresh ? { accountId: account, refresh: true } : { accountId: account });

	S.AiConnect.setLoading(false);
	if (accountId() != account) {
		return false;
	};
	if (!res?.ok) {
		S.AiConnect.setLoadFailed(true);
		return false;
	};

	S.AiConnect.set(res, account);
	S.AiConnect.setLoadFailed(false);
	return true;
};

/** `unsaved`: main still waits to save a committed record; `stale`: the account changed during the pass */
export type CheckStatus = 'ok' | 'failed' | 'unsaved' | 'stale' | 'skipped';

const checkOnce = async (): Promise<CheckStatus> => {
	const account = accountId();

	if (!account || !isDesktop()) {
		return 'skipped';
	};

	// Every await below ends the pass when another account signed in meanwhile, and every account RPC is
	// preceded by that check (V11, W6)
	const moved = () => accountId() != account;

	S.AiConnect.ensureAccount(account);

	const listed = await ipc<AiListResult>('aiConnectList', { accountId: account });

	if (moved()) {
		return 'stale';
	};
	if (!listed?.ok) {
		S.AiConnect.setLoadFailed(true);
		return 'failed';
	};
	S.AiConnect.set(listed, account);

	// Cleanup that couldn't run before, for this account only; a key kept without its hash is looked up first
	for (const it of leftovers.filter(l => l.accountId == account)) {
		if (!it.hash) {
			const res = await listApps();

			if (moved()) {
				return 'stale';
			};
			if (!res.ok) {
				it.attempts++;
				continue;
			};

			const fps = await Promise.all(res.list.map(r => keyFingerprint(r.apiKey)));
			const row = res.list.find((r, i) => !!r.apiKey && (fps[i] == it.fp));

			if (moved()) {
				return 'stale';
			};
			// Not listed (yet): heart can show a new key late, so it is kept with the hint (X6); only after
			// MAX_MISSES successful lists without it is it taken as revoked elsewhere
			if (!row?.hash) {
				if (++it.misses >= MAX_MISSES) {
					leftovers.splice(leftovers.indexOf(it), 1);
					console.warn('[aiConnect] An unidentified key was missing from 5 key lists of its account: dropped from cleanup');
				};
				continue;
			};
			it.hash = row.hash;
			it.fp = '';
		};
		// A delivery whose answer was lost (D1C-03): a record (or main's orphan list) that has the key now means main
		// committed it, and it isn't this list's to revoke; only a successful list with no owner makes it an orphan
		if (it.ifUnowned && managedHashes(listed.connections, listed.orphanHashes).includes(it.hash)) {
			leftovers.splice(leftovers.indexOf(it), 1);
			continue;
		};

		let done = (await revokeApp(it.hash)) != 'failed';

		if (!done && !moved()) {
			done = !!(await ipc<AiOrphanResult>('aiConnectOrphan', { accountId: account, hash: it.hash }))?.ok;
		};
		if (moved()) {
			return 'stale';
		};
		if (done) {
			leftovers.splice(leftovers.indexOf(it), 1);
			await clearIntent(account, it.intentId);
		} else {
			it.attempts++;
		};
	};
	S.AiConnect.setCleanupFailed(cleanupFailed());

	if (moved()) {
		return 'stale';
	};

	const apps = await listApps();

	if (moved()) {
		return 'stale';
	};

	// Keys an earlier run of Anytype was about to create and never accounted for (it died between CreateApp and
	// the delivery): the one key of that name, access and expiry created within `intentWindowSec` of the intent
	// (CreateApp runs right after it is saved) is queued as an orphan and revoked below — only when nothing manages
	// it and no managed key shares that window. Only a successful list can say. Two such keys, one heart can't
	// identify, or one beside a managed key are ambiguous: nothing is revoked and the intent waits; managed keys alone
	// account for it (D1C-06, D1C-21). An intent with no such key is kept until it is `intentKeepSec` old (heart skips
	// a grant file it can't read for a moment, so the key may show later), then dropped. A key made outside its
	// window is never matched: it stays (when in doubt, a key is kept)
	const orphanHashes = [ ...(listed.orphanHashes || []) ];

	for (const intent of (apps.ok ? (listed.mintIntents || []) : [])) {
		const known = new Set(managedHashes(listed.connections, orphanHashes));
		const created = (row: AppRow): number => Number(row.createdAt) || 0;
		// A key made with another access or expiry is not this intent's (an intent from before D1R2 names neither)
		const made = (row: AppRow): boolean => ((intent.grant === undefined) || sameGrant(row.grant, intent.grant)) && ((intent.expireAt === undefined) || ((Number(row.expireAt) || 0) == intent.expireAt));
		const inWindow = apps.list.filter(it => (it.name === intent.name) && made(it) && (created(it) >= (intent.time - INTENT_SKEW)) && (created(it) <= (intent.time + flowConfig.intentWindowSec)));
		const found = inWindow.filter(it => !!it.hash && !known.has(it.hash));
		const owned = inWindow.some(it => !!it.hash && known.has(it.hash));
		const unidentified = inWindow.some(it => !it.hash);
		const expired = (nowSec() - intent.time) >= flowConfig.intentKeepSec;
		let queued = false;

		// Only the one key of the window, unowned, is the intent's: beside a key a record owns it may be another app's
		// key of the same name (the committed delivery's intent went with its record, D1C-21), and it is kept
		if ((found.length == 1) && !unidentified && !owned) {
			const row = found[0];

			if (moved()) {
				return 'stale';
			};
			// `intentId`: main checks the hash again against its records, candidates and this run's mints (S3). The
			// record list above is several calls old; a refused hash keeps the intent for the next check
			// `key`: main also looks for it in every record's own target (T2) — a delivery that died after writing a
			// settings file is promoted there, never revoked
			if ((await ipc<AiOrphanResult>('aiConnectOrphan', { accountId: account, hash: row.hash, intentId: intent.id, key: row.apiKey }))?.ok) {
				orphanHashes.push(row.hash);
				queued = true;
			};
		} else
		if (!found.length && !unidentified) {
			// A key it made that a record now has (its delivery committed) accounts for it too
			queued = (inWindow.length > 0) || expired;
		} else {
			// Ambiguous: revokes nothing; dropped once old, so main's intent list never fills up with it
			queued = expired;
		};
		if (moved()) {
			return 'stale';
		};
		if (queued) {
			await clearIntent(account, intent.id);
		};
	};
	if (moved()) {
		return 'stale';
	};

	const managed = managedHashes(listed.connections, orphanHashes);
	const rows = new Map(apps.list.map(it => [ it.hash, it ]));
	const present = (hash: string): boolean => {
		const row = rows.get(hash);
		return !!row && !isExpired(row);
	};
	const gone = new Set<string>();
	/** Every hash this pass tried (or found gone): the pass after the check revokes only what the check added (W9) */
	const tried = new Set<string>();

	// Every outstanding hash, on every check: each record's pending revokes (not a running candidate's),
	// then the orphans. RevokeApp is called for each whatever the list says: a list that lacks the hash proves
	// nothing (heart skips grant files it can't read), and only its answer — success or "not found" — drops
	// the revocation from the queue (anytype-mcp-plan §2.9)
	for (const c of listed.connections) {
		for (const hash of revocable(c)) {
			tried.add(hash);
			if (moved()) {
				return 'stale';
			};
			if ((await revokeApp(hash)) == 'failed') {
				continue;
			};
			if (moved()) {
				return 'stale';
			};
			gone.add(hash);
			await ipc<AiRevokedResult>('aiConnectRevoked', { accountId: account, connectionId: c.id, hash });
		};
	};
	for (const hash of orphanHashes) {
		tried.add(hash);
		if (moved()) {
			return 'stale';
		};
		if ((await revokeApp(hash)) == 'failed') {
			continue;
		};
		if (moved()) {
			return 'stale';
		};
		gone.add(hash);
		await ipc<AiOrphanResult>('aiConnectOrphan', { accountId: account, hash, done: true });
	};
	if (moved()) {
		return 'stale';
	};

	// Managed hashes only (other keys and legacy rows are not Anytype's business); a failed list is not an empty one
	const keys = apps.ok ? managed.map(hash => {
		const row = rows.get(hash);
		const has = !gone.has(hash) && present(hash);
		const key: { hash: string; present: boolean; grant?: LinkAppGrant; expireAt?: number; active?: boolean } = { hash, present: has };

		if (has && row.grant) {
			key.grant = row.grant;
		};
		if (has) {
			key.expireAt = Number(row.expireAt) || 0;
			// heart's AppInfo.isActive: Claude's extension used the key in heart's current run ("Connected", §3.3)
			key.active = !!row.isActive;
		};
		return key;
	}) : null;

	const port = getPort();
	const param = port ? { accountId: account, apiListening: true, port, keys } : { accountId: account, apiListening: false, keys };
	const checked = await ipc<AiCheckResult>('aiConnectCheck', param);

	if (moved()) {
		return 'stale';
	};
	// A failed check is visible like a failed list (the rows stay, with Scan again, W15)
	if (!checked || ('error' in checked)) {
		S.AiConnect.setLoadFailed(true);
		return (checked && ('error' in checked) && (checked.error.category == 'unsaved')) ? 'unsaved' : 'failed';
	};

	S.AiConnect.setConnections(checked.connections);
	// Main's serialized check names each entry it found gone once (also across windows and restarts, Z12)
	for (const id of checked.removed || []) {
		const c = checked.connections.find(it => it.id == id);

		if (c) {
			track.removed(c.appId, 'selfheal');
		};
	};

	// A check that settled a delivery retires the key it replaced: revoked in this pass, once (W9)
	for (const c of checked.connections) {
		for (const hash of revocable(c)) {
			if (tried.has(hash)) {
				continue;
			};
			tried.add(hash);
			if (moved()) {
				return 'stale';
			};
			if ((await revokeApp(hash)) == 'failed') {
				continue;
			};
			if (moved()) {
				return 'stale';
			};

			const done = await ipc<AiRevokedResult>('aiConnectRevoked', { accountId: account, connectionId: c.id, hash });

			if (moved()) {
				return 'stale';
			};
			if (done?.ok && done.connection) {
				S.AiConnect.upsert(done.connection);
			} else
			if (done?.ok) {
				S.AiConnect.remove(c.id);
			};
		};
	};

	S.AiConnect.setChecked(true);
	S.AiConnect.setLoadFailed(false);
	return 'ok';
};

let checking: Promise<CheckStatus> | null = null;
let checkAgain = false;

/**
 * Reconciles keys and statuses (§4.3). Single-flight: a call while one runs joins it and asks for one more
 * pass after it, so every caller sees a pass that started after its request. Works with the HTTP API off
 * (account RPCs only; main then rewrites nothing). Resolves with the last pass's status.
 */
export const check = (reason?: string): Promise<CheckStatus> => {
	if (checking) {
		checkAgain = true;
		return checking;
	};

	checking = (async () => {
		let status: CheckStatus = 'skipped';

		do {
			checkAgain = false;
			try {
				status = await checkOnce();
			} catch (e) {
				status = 'failed';
			};
		} while (checkAgain);
		return status;
	})().finally(() => {
		checking = null;
	});

	return checking;
};

/** A committed record waiting for its save: any state-changing call retries it; a check says whether it worked */
export const retrySave = async (): Promise<boolean> => (await check('save')) == 'ok';

// ---------------------- connect ---------------------- //

/** `package`: Claude's extension; `config`: an app's settings-file route; `command`: Other app's stdio setup (manual) */
export type AiSetupMethod = 'package' | 'config' | 'command';

/** Other app's Command setup, and Claude Desktop set up by hand with the command entry: manual records with `setup: 'command'` */
export const isCommand = (c: AiConnection | null | undefined): boolean => (c?.method == 'manual') && (c.setup == 'command');

/**
 * The method a record's plan and reconnect are asked with: Claude Desktop's extension and config route, its
 * manual setup (the config route's entry) and Other app's Command keep theirs
 */
export const planMethodOf = (c: AiConnection | null | undefined): AiSetupMethod | undefined => {
	if (!c) {
		return undefined;
	};
	if ((c.appId == 'other') && isCommand(c)) {
		return 'command';
	};
	if (c.appId != 'claude-desktop') {
		return undefined;
	};
	if (c.method == 'package') {
		return 'package';
	};
	return ((c.method == 'config') || isCommand(c)) ? 'config' : undefined;
};

export interface ConnectInput {
	appId: AiAppId;
	route: AiRoute;
	tier: AiTier;
	recommendedTier: AiTier;
	grant: LinkAppGrant;
	name: string;
	/** Absolute seconds, resolved once when the user submitted (V15) */
	expireAt: number;
	/** `package`: Claude's extension (always the Full tool set); `config`: an app's settings-file route */
	method?: 'package' | 'config';
	/** The record this delivery replaces (its hash is `expectedHash`; a different new hash is a rotation) */
	existing?: AiConnection | null;
	/** The plan the user saw: a delivery whose target moved since then needs a new preview */
	shown?: AiPlan | null;
	/** Consent to replace exactly the foreign entry the user saw (R3-6, V3) */
	replace?: AiReplace;
	/** Anytype may quit the app (`quitApp`) */
	allowQuit?: boolean;
	/** The user says they quit the app (`quitAppSelf`) */
	quitConfirmed?: boolean;
	/** Deliver the key already delivered to `existing` again (the file route after a deeplink or a package) */
	sameKey?: boolean;
	/** Reconnect: heart's grant and expiry of the old key must still be these, before minting and before delivering (R3-8, V2) */
	reread?: { hash: string; grant: LinkAppGrant; expireAt: number };
};

export interface Prefill {
	grant: LinkAppGrant;
	tier: AiTier;
	route: AiRoute;
	name: string;
	/** Absolute and still in the future; undefined: the form offers the expiry choice */
	expireAt?: number;
};

export type ConnectResult =
	/** Nothing minted (or the pending key kept): show the plan again (manual only, can't apply, a replace to agree to, a moved target or port) */
	| { kind: 'plan'; reason: 'manual' | 'cantApply' | 'needsReplace' | 'changed' | 'moved'; plan: AiPlan }
	/** The app must be closed first; nothing minted (or the pending key kept for the next attempt) */
	| { kind: 'needsQuit'; preflight: 'quitApp' | 'quitAppSelf'; plan: AiPlan }
	/** Reconnect: the old key's access changed since the sheet showed it; nothing minted, an undelivered replacement released */
	| { kind: 'grantChanged'; grant: LinkAppGrant; expireAt: number; plan: AiPlan | null }
	/** Reconnect: the old key is gone; the form opens prefilled */
	| { kind: 'needsForm'; prefill: Prefill }
	/**
	 * Claude's extension (§3.3): main saved the record `waiting` (the commit) and put the key on the clipboard
	 * (`copyFailed`: it couldn't), then opened the bundle (`openFailed`: it couldn't) or not (`configure`: the
	 * installed extension takes the key in its Configure). No probe: "Connected" comes from heart's isActive
	 */
	| { kind: 'bundle'; connection: AiConnection; plan: AiPlan; copyFailed: boolean; openFailed: boolean; configure: boolean; recordSaved: boolean }
	/** Main keeps the new key as unconfirmed: it is never released here, and the old one stays */
	| { kind: 'unconfirmed'; connection: AiConnection; plan: AiPlan }
	/** Not delivered; `hasKey`: the new key is still pending (manual setup can use it) */
	| { kind: 'error'; error: AiError; plan: AiPlan | null; hasKey: boolean }
	/** `recordSaved: false`: committed, but main couldn't save its list yet */
	/** `steps`: what the user still does by hand (Other app's Command: the setup text with the connection's id, no key in it) */
	| { kind: 'ok'; connection: AiConnection; plan: AiPlan; probe: AiProbeResult; openFailed: boolean; recordSaved: boolean; steps?: AiStep[] }
	| { kind: 'cancelled' }
	| { kind: 'busy' };

const CANCELLED: ConnectResult = { kind: 'cancelled' };

/**
 * The plan for a card as it would be delivered now (reads only; the configured port while the API is off).
 * `port`: the port it was requested with, which its key-bearing steps contain (W13).
 */
export const plan = async (p: { appId: AiAppId; route: AiRoute; tier: AiTier; method?: AiSetupMethod; connectionId?: string; fresh?: boolean }): Promise<{ ok: true; plan: AiPlan; port: number } | { ok: false; error: AiError }> => {
	const account = accountId();

	if (!account || !isDesktop()) {
		return { ok: false, error: UNKNOWN };
	};

	const port = previewPort();
	// Claude's extension is planned with the Full tool set only (main refuses any other, §3.3)
	const param: any = { accountId: account, appId: p.appId, route: p.route, tier: (p.method == 'package') ? 'full' : p.tier, port };

	if (p.method) {
		param.method = p.method;
	};
	if (p.connectionId) {
		param.connectionId = p.connectionId;
	};
	// Right before a mint: main resolves the config homes now, not from its cache (Y6)
	if (p.fresh) {
		param.fresh = true;
	};

	const res = await ipc<AiPlanResult>('aiConnectPlan', param);

	if (!res) {
		return { ok: false, error: UNKNOWN };
	};
	// A plan that can't be applied carries `error` too (its reason): only `ok: false` is a failed request
	return (res.ok === false) ? { ok: false, error: (res as { error: AiError }).error } : { ok: true, plan: planOf(res), port };
};

export const prefillOf = (connection: AiConnection): Prefill => ({
	grant: connection.grant,
	tier: connection.tier,
	route: connection.route,
	name: connection.name,
	expireAt: (connection.expireAt && (connection.expireAt > nowSec())) ? connection.expireAt : undefined,
});

/**
 * Probes a delivered key with its record (main stores the result as `lastProbe`); only while its account is
 * the signed-in one, so the key never goes to another account's port (W6)
 */
const probeDelivered = async (connection: AiConnection, key: string, account: string): Promise<AiProbeResult> => {
	if (accountId() != account) {
		return { ok: false, category: 'unknown' };
	};

	const port = getPort();

	if (!port) {
		return { ok: false, category: 'apiOff' };
	};

	const res = await ipc<AiProbeResult>('aiConnectProbe', { port, tier: connection.tier, route: connection.route, key, accountId: account, connectionId: connection.id });
	return res || { ok: false, category: 'unknown' };
};

/**
 * Whether main saved a record with this key (by its hash), for a delivery whose reply was lost: `present` (it
 * committed), `absent` (main's list has no such record) or `unknown` (no list now: it failed, or another account
 * signed in), which decides nothing (D1C-03)
 */
const savedWith = async (appHash: string, account: string): Promise<{ state: 'present'; connection: AiConnection } | { state: 'absent' | 'unknown' }> => {
	if (accountId() != account) {
		return { state: 'unknown' };
	};

	const res = await ipc<AiListResult>('aiConnectList', { accountId: account });

	if (!res?.ok || (accountId() != account)) {
		return { state: 'unknown' };
	};

	const connection = res.connections.find(c => (c.appHash == appHash) && !c.removed);

	return connection ? { state: 'present', connection } : { state: 'absent' };
};

/**
 * Claude's extension: the old key goes first (§3.3). Main moves the record's hash to `revokePending`, keeps the
 * access the new key is minted with (`grant`, `expireAt`: what the user just confirmed, D1C-05) and saves the
 * record `disconnected`; RevokeApp follows (a failure leaves it queued, "Revocation pending", and doesn't stop the
 * flow). `expectedHash`: the key the user saw; another one there now is `stale`
 */
const retireBundle = async (op: Operation, record: AiConnection, access: { grant: LinkAppGrant; expireAt: number }): Promise<{ ok: true; connection: AiConnection } | { ok: false; error: AiError }> => {
	const account = op.accountId;

	if (accountId() != account) {
		return { ok: false, error: UNKNOWN };
	};

	const res = await ipc<AiRetireResult>('aiConnectRetire', { accountId: account, connectionId: record.id, expectedHash: record.appHash, grant: access.grant, expireAt: access.expireAt });

	if (!res) {
		return { ok: false, error: UNKNOWN };
	};
	if ('error' in res) {
		if (res.error.category == 'stale') {
			await load();
		};
		return { ok: false, error: res.error };
	};
	if (accountId() == account) {
		S.AiConnect.upsert(res.connection);
	};
	// The old key, revoked now; one that can't be is left queued and every check tries again
	await revokeOutstanding(res.connection, account);
	return { ok: true, connection: ((accountId() == account) && S.AiConnect.getById(res.connection.id)) || res.connection };
};

/**
 * plan → consents → key (pending, or a fresh mint) → deliver → revoke the old key → probe (§4.3), inside
 * the operation `op`. Nothing is minted before the plan says it can be applied and every consent is given;
 * every step that changes something first checks that the operation may go on.
 */
const connectIn = async (op: Operation, input: ConnectInput): Promise<ConnectResult> => {
	const account = op.accountId;

	if (!alive(op) || !isDesktop() || !getPort()) {
		return op.cancelRequested ? CANCELLED : { kind: 'error', error: API_OFF, plan: null, hasKey: !!op.pending };
	};

	// 1. The plan, fresh, and the port it was requested with (W13)
	const planned = await plan({ appId: input.appId, route: input.route, tier: input.tier, method: input.method, fresh: true });

	if (!alive(op)) {
		return CANCELLED;
	};
	if ('error' in planned) {
		return { kind: 'error', error: planned.error, plan: null, hasKey: !!op.pending };
	};

	const current = planned.plan;
	const planPort = planned.port;

	if (!current.canApply) {
		return { kind: 'plan', reason: current.steps.length ? 'manual' : 'cantApply', plan: current };
	};
	// Claude's extension and its settings file are separate routes: the one the user saw is the one delivered
	if (input.shown && (input.shown.method != current.method) && ((input.shown.method == 'package') || (current.method == 'package'))) {
		return { kind: 'plan', reason: 'changed', plan: current };
	};
	// A record's file that moved under the same target id (an LM Studio or Copilot home): a delivery goes
	// there only once the user saw that place (X3); checked before any other change, so it is named (Y6)
	if (movedFile(input.existing, current) && (input.shown?.targetPath != current.targetPath)) {
		return { kind: 'plan', reason: 'moved', plan: current };
	};
	if (input.shown && ((input.shown.targetPath || '') != (current.targetPath || ''))) {
		return { kind: 'plan', reason: 'changed', plan: current };
	};

	// 2. Consents, bound to what the user saw: another entry, another place, or none any more → a new preview
	let replace: AiReplace | undefined;

	if (current.existing == 'foreign') {
		const agreed = input.replace;

		if (!agreed || !current.replace || (agreed.targetPath != current.replace.targetPath) || (agreed.foreignDigest != current.replace.foreignDigest)) {
			return { kind: 'plan', reason: 'needsReplace', plan: current };
		};
		replace = { targetPath: agreed.targetPath, foreignDigest: agreed.foreignDigest };
	} else
	if (input.replace) {
		return { kind: 'plan', reason: 'changed', plan: current };
	};
	if (((current.preflight == 'quitApp') && !input.allowQuit) || ((current.preflight == 'quitAppSelf') && !input.quitConfirmed)) {
		return { kind: 'needsQuit', preflight: current.preflight, plan: current };
	};

	// 3. A reconnect re-reads the old key right before it mints, and again before it delivers a replacement minted earlier
	if (input.reread && !input.sameKey) {
		const res = await listApps();
		const row = res.ok ? res.list.find(it => it.hash == input.reread.hash) : null;

		if (!alive(op)) {
			return CANCELLED;
		};
		if (!res.ok) {
			return { kind: 'error', error: { stage: 'key', category: 'unknown' }, plan: current, hasKey: !!op.pending };
		};
		if (!row || isExpired(row)) {
			await dropPending(op);
			return { kind: 'needsForm', prefill: prefillOf(input.existing) };
		};
		if (!sameGrant(row.grant, input.reread.grant) || ((Number(row.expireAt) || 0) != input.reread.expireAt)) {
			await dropPending(op);
			return { kind: 'grantChanged', grant: row.grant || input.reread.grant, expireAt: Number(row.expireAt) || 0, plan: current };
		};
	};

	// Claude's extension: main takes its new key only over a record without a live one, so every rotation (a
	// Reconnect, the form it went back to, a Replace) retires the old key here: after the plan, the consents and
	// the re-read, before a key is minted (§3.3, D1C-04)
	let existing = input.existing || null;

	if ((current.method == 'package') && existing?.appHash && !input.sameKey) {
		const retired = await retireBundle(op, existing, { grant: input.grant, expireAt: input.expireAt });

		if (!alive(op)) {
			return CANCELLED;
		};
		if ('error' in retired) {
			return { kind: 'error', error: retired.error, plan: current, hasKey: !!op.pending };
		};
		existing = retired.connection;
	};

	// 4. The key: the one delivered before (same-key fallback), this flow's pending one, or a new one
	let key: { key: string; appHash: string; intentId?: string } | null = null;
	let grant = input.grant;
	let expireAt = input.expireAt;

	if (input.sameKey && input.existing && !op.pending) {
		// Only its hash is kept once delivered: the key comes from heart's list, for this delivery only
		const again = await keyFor(input.existing);

		if (!alive(op)) {
			return CANCELLED;
		};
		if (!again) {
			return { kind: 'error', error: { stage: 'key', category: 'unauthorized' }, plan: current, hasKey: false };
		};
		key = { key: again, appHash: input.existing.appHash };
	} else {
		const minted = await mintPending(op, { name: input.name, grant, expireAt });

		if (!alive(op)) {
			return CANCELLED;
		};
		if ('error' in minted) {
			return { kind: 'error', error: minted.error, plan: current, hasKey: false };
		};
		key = minted.held;
		grant = minted.held.grant;
		expireAt = minted.held.expireAt;

		// A pending key a Copy handed over keeps only its hash here (D1S-11): read back by it, for this delivery only
		if (!key.key) {
			const again = await keyFor({ appHash: key.appHash } as AiConnection);

			if (!alive(op)) {
				return CANCELLED;
			};
			if (!again) {
				return { kind: 'error', error: { stage: 'key', category: 'unauthorized' }, plan: current, hasKey: !!op.pending };
			};
			key = { ...key, key: again };
		};
	};

	// 5. The port again, right before the key goes out: stopped or moved → a new preview, the key kept (V9)
	const port = getPort();

	if (!port || (port != planPort)) {
		return { kind: 'plan', reason: 'changed', plan: current };
	};

	// Claude's extension always gets the Full tool set (main refuses any other tier, §3.3)
	const bundle = (current.method == 'package');
	// A retired bundle record has no key (appHash ''): nothing to replace, as for a new connection
	const param: any = {
		accountId: account, appId: input.appId, route: current.route, tier: bundle ? 'full' : input.tier, recommendedTier: input.recommendedTier, port,
		key: key.key, appHash: key.appHash, name: input.name, grant, expireAt, expectedHash: existing?.appHash || null,
	};

	if (current.targetPath) {
		param.previewTarget = current.targetPath;
	};
	if (bundle) {
		param.method = 'package';
	} else
	if (input.method == 'config') {
		param.method = 'config';
	};
	// Main clears the mint intent of this key when the delivery commits
	if (key.intentId) {
		param.intentId = key.intentId;
	};
	if (input.allowQuit) {
		param.allowQuit = true;
	};
	if (input.quitConfirmed) {
		param.quitConfirmed = true;
	};
	if (replace) {
		param.replace = replace;
	};

	if (accountId() != account) {
		return CANCELLED;
	};

	// Main has the key from here on: the flow keeps only its hash and intent (a retry reads it back by hash), and the
	// probe below uses this call's own copy (D1S-19)
	const plain = key.key;

	if (op.pending) {
		op.pending.key = '';
	};

	const res = await ipc<AiApplyResult>('aiConnectApply', param);
	// A reply after another account signed in: main's commit stands (the key is kept), but nothing of it
	// reaches this account's store, probe or popup; the old key waits for its own account's next check (W6)
	const here = () => (accountId() == account);

	if (!res) {
		// Claude's extension: main's record save is the commit, and the reply may be what got lost. The record is
		// looked for by the key's hash before anything is released (§3.3, step 4); with no list to say, the key is
		// never released here and its hash waits for one (D1C-03)
		const saved = bundle ? await savedWith(key.appHash, account) : { state: 'absent' as const };

		if (saved.state == 'present') {
			commit(op);
			if (!here()) {
				return CANCELLED;
			};
			S.AiConnect.upsert(saved.connection);
			return { kind: 'bundle', connection: saved.connection, plan: current, copyFailed: true, openFailed: false, configure: !!current.configure, recordSaved: true };
		};
		if (saved.state == 'unknown') {
			undecided(op);
			return { kind: 'error', error: UNKNOWN, plan: current, hasKey: false };
		};
		return { kind: 'error', error: UNKNOWN, plan: current, hasKey: !!op.pending };
	};
	if ('needs' in res) {
		return { kind: 'needsQuit', preflight: res.needs, plan: current };
	};
	if ('unconfirmed' in res) {
		// Main holds it now: the next check keeps or retires it
		commit(op);
		if (!here()) {
			return CANCELLED;
		};
		S.AiConnect.upsert(res.connection);
		return { kind: 'unconfirmed', connection: res.connection, plan: current };
	};
	if ('error' in res) {
		if (res.error.category == 'stale') {
			await dropPending(op);
			await load();
		};
		return { kind: 'error', error: res.error, plan: current, hasKey: !!op.pending };
	};

	// 6. Committed (also with `recordSaved: false`): the old key goes, then the new one is checked
	commit(op);
	if (!here()) {
		return CANCELLED;
	};
	S.AiConnect.upsert(res.connection);
	await revokeOutstanding(res.connection, account);

	// Claude's extension: no bearer probe, at apply or on Retry (§3.3, step 5); the Finish view follows isActive
	if (bundle) {
		if (!here()) {
			return CANCELLED;
		};
		await load();

		// The Finish sheet stands for the key main just committed, never one another window put there during the
		// reload: then the sheet sees the change and Manage shows the record (D1C-18)
		const stored = S.AiConnect.getById(res.connection.id);

		return {
			kind: 'bundle', connection: (stored && (stored.appHash == res.connection.appHash)) ? stored : res.connection, plan: current,
			copyFailed: !!res.copyFailed, openFailed: !!res.openFailed, configure: !!res.configure, recordSaved: (res.recordSaved !== false),
		};
	};

	const probe = await probeDelivered(res.connection, plain, account);

	if (!here()) {
		return CANCELLED;
	};
	await load();
	return {
		kind: 'ok', connection: S.AiConnect.getById(res.connection.id) || res.connection, plan: current, probe, openFailed: !!res.openFailed,
		recordSaved: (res.recordSaved !== false), ...(res.steps?.length ? { steps: res.steps } : {}),
	};
};

// ---------------------- delivery analytics (Z13) ---------------------- //

/** A committed delivery and its probe */
const trackSettled = (appId: AiAppId, connection: AiConnection, probe: AiProbeResult): void => {
	track.delivered(appId, connection.method);
	if (probe.ok) {
		track.probeOk(appId);
	} else {
		track.failed(appId, { stage: 'probe', category: ('category' in probe) ? probe.category : 'unknown' });
	};
};

/**
 * AiConnectDelivered / ProbeOk / Failed where an operation settles, for the account that started it, whether
 * or not its sheet is still open. A stale preview is not a failure.
 */
const trackDelivery = <T>(op: Operation, appId: AiAppId, res: T): T => {
	const r: any = res;

	if (!r || (accountId() != op.accountId)) {
		return res;
	};
	if (r.connection && r.probe && ((r.kind == 'ok') || (r.ok === true))) {
		trackSettled(appId, r.connection, r.probe);
	} else
	if (r.connection && (r.kind == 'bundle')) {
		// Claude's extension: committed with the record; whether Claude uses the key shows later ("Connected")
		track.delivered(appId, r.connection.method);
	} else
	if (r.error && ((r.kind == 'error') || ((r.ok === false) && !r.reason)) && (r.error.category != 'stale')) {
		track.failed(appId, r.error);
	};
	return res;
};

export const connect = (input: ConnectInput): Promise<ConnectResult> => inOperation<ConnectResult>(async op => trackDelivery(op, input.appId, await connectIn(op, input)), { kind: 'busy' });

/** The old key's access a manual view started from, or what it is now */
export interface AccessNow { present: boolean; grant: LinkAppGrant; expireAt: number };

export type ReconnectResult = ConnectResult
	/** A manual record: the new key is pending, minted for the fresh usable plan shown with it (W4) */
	| { kind: 'manual'; connection: AiConnection; plan: AiPlan; port: number; access: { grant: LinkAppGrant; expireAt: number } }
	/** A CLI of this record may still be writing an earlier key: no manual rotation now (W5) */
	| { kind: 'stillSaving' };

export interface ReconnectOptions {
	tier?: AiTier;
	/** The access the sheet showed for the old key */
	shown?: { grant: LinkAppGrant; expireAt: number };
	/** Consent to replace the foreign entry shown in the preview */
	replace?: AiReplace;
	allowQuit?: boolean;
	quitConfirmed?: boolean;
	method?: AiSetupMethod;
	/** The plan the user saw */
	plan?: AiPlan | null;
};

/**
 * A new key for an existing connection (R2-27, R3-8), in one operation from its first lookup (V1). The old
 * key still there: its current grant and the same absolute expiry, no form. The key gone: the form,
 * prefilled. A manual record: the new key is minted and shown in the manual view first; only "I've updated"
 * records it.
 */
export const reconnect = (connection: AiConnection, opts: ReconnectOptions = {}): Promise<ReconnectResult> => inOperation<ReconnectResult>(async op => trackDelivery(op, connection.appId, await reconnectIn(op, connection, opts)), { kind: 'busy' });

const reconnectIn = async (op: Operation, shownRecord: AiConnection, opts: ReconnectOptions): Promise<ReconnectResult> => {
	const latest = ((shownRecord.method == 'package') && shownRecord.appHash) ? S.AiConnect.getById(shownRecord.id) : null;
	// Claude's extension whose shown key this Reconnect already retired (a retry after a failed plan or mint): it goes
	// on from the retired record, which has no live key left to break
	const connection = (latest && !latest.removed && (latest.method == 'package') && !latest.appHash) ? latest : shownRecord;
	let access = op.pending ? { grant: op.pending.grant, expireAt: op.pending.expireAt } : null;

	if (!alive(op)) {
		return CANCELLED;
	};
	// A bundle record whose key was retired (a Reconnect that didn't finish): the record's own access, unless it expired
	if (!access && (connection.method == 'package') && !connection.appHash) {
		if (connection.expireAt && (connection.expireAt <= nowSec())) {
			return { kind: 'needsForm', prefill: prefillOf(connection) };
		};
		access = { grant: connection.grant, expireAt: connection.expireAt };
	};
	if (!access) {
		const live = await liveAccess(connection);

		if (!alive(op)) {
			return CANCELLED;
		};
		if (!live.ok) {
			return { kind: 'error', error: { stage: 'key', category: 'unknown' }, plan: null, hasKey: false };
		};
		if (!live.present) {
			return { kind: 'needsForm', prefill: prefillOf(connection) };
		};
		if (opts.shown && (!sameGrant(opts.shown.grant, live.grant) || (opts.shown.expireAt != live.expireAt))) {
			return { kind: 'grantChanged', grant: live.grant, expireAt: live.expireAt, plan: opts.plan || null };
		};
		access = { grant: live.grant, expireAt: live.expireAt };
	};

	if (connection.method == 'manual') {
		return reconnectManual(op, connection, access, opts);
	};
	if (connection.method == 'package') {
		return reconnectBundle(op, connection, access, opts);
	};

	const method = opts.method || planMethodOf(connection);

	return connectIn(op, {
		appId: connection.appId, route: connection.route, tier: opts.tier || connection.tier, recommendedTier: connection.recommendedTier,
		grant: access.grant, name: op.pending?.name || connection.name, expireAt: access.expireAt, method: (method == 'command') ? undefined : method, existing: connection,
		shown: opts.plan || null, replace: opts.replace, allowQuit: opts.allowQuit, quitConfirmed: opts.quitConfirmed,
		reread: { hash: connection.appHash, grant: opts.shown?.grant || access.grant, expireAt: opts.shown ? opts.shown.expireAt : access.expireAt },
	});
};

/**
 * Reconnect on Claude's extension route (§3.3): the old key goes first. The user confirmed (Claude stops
 * working until the new key is pasted); Connect on the same record re-reads the old key and retires it
 * (aiConnectRetire, then RevokeApp) before it mints. A failed mint, or a crash anywhere after the retire, leaves
 * the row "Disconnected · Reconnect" with the old key queued or revoked. A retired record mints with the access it
 * stored, the one last confirmed (D1C-05).
 */
const reconnectBundle = async (op: Operation, connection: AiConnection, access: { grant: LinkAppGrant; expireAt: number }, opts: ReconnectOptions): Promise<ReconnectResult> => {
	if (!alive(op)) {
		return CANCELLED;
	};

	let existing = connection;

	// Confirmed, and the shown key's access was just read live: that key is queued (durably) and revoked before
	// anything else, the plan included. A plan that fails afterwards leaves "Disconnected · Reconnect" (D1C-19)
	if (connection.appHash && !op.pending) {
		const retired = await retireBundle(op, connection, access);

		if (!alive(op)) {
			return CANCELLED;
		};
		if ('error' in retired) {
			return { kind: 'error', error: retired.error, plan: opts.plan || null, hasKey: false };
		};
		existing = retired.connection;
	};

	return connectIn(op, {
		appId: connection.appId, route: connection.route, tier: 'full', recommendedTier: connection.recommendedTier, grant: access.grant, name: op.pending?.name || connection.name,
		expireAt: access.expireAt, method: 'package', existing, shown: opts.plan || null,
		...(existing.appHash ? { reread: { hash: existing.appHash, grant: opts.shown?.grant || access.grant, expireAt: opts.shown ? opts.shown.expireAt : access.expireAt } } : {}),
	});
};

/**
 * A manual record's new key (W4): minted only with a fresh plan that can deliver it (a key-bearing step) to
 * the place shown, and never while a CLI of the record may still be writing an earlier key (W5). Otherwise
 * the plan goes back to the view (its prerequisite or reason, Check again), nothing minted.
 */
const reconnectManual = async (op: Operation, connection: AiConnection, access: { grant: LinkAppGrant; expireAt: number }, opts: ReconnectOptions): Promise<ReconnectResult> => {
	if (stillSaving(connection)) {
		return { kind: 'stillSaving' };
	};

	const planned = await plan({ appId: connection.appId, route: connection.route, tier: opts.tier || connection.tier, method: planMethodOf(connection), connectionId: connection.id, fresh: true });

	if (!alive(op)) {
		return CANCELLED;
	};
	if ('error' in planned) {
		return { kind: 'error', error: planned.error, plan: null, hasKey: !!op.pending };
	};

	const fresh = planned.plan;

	if (!manualUsable(fresh) || (opts.plan && ((opts.plan.targetPath || '') != (fresh.targetPath || '')))) {
		return { kind: 'plan', reason: 'manual', plan: fresh };
	};

	// The old key again, after the plan and right before the mint: another access → shown, nothing minted (X2)
	const now = await oldAccess({ hash: connection.appHash, grant: access.grant, expireAt: access.expireAt });

	if (!alive(op)) {
		return CANCELLED;
	};
	if (!now.ok) {
		return { kind: 'error', error: { stage: 'key', category: 'unknown' }, plan: fresh, hasKey: !!op.pending };
	};
	if (now.changed) {
		await dropPending(op);
		return now.changed.present ? { kind: 'grantChanged', grant: now.changed.grant, expireAt: now.changed.expireAt, plan: fresh } : { kind: 'needsForm', prefill: prefillOf(connection) };
	};

	const minted = await mintPending(op, { name: connection.name, grant: access.grant, expireAt: access.expireAt });

	if (!alive(op)) {
		return CANCELLED;
	};
	if ('error' in minted) {
		return { kind: 'error', error: minted.error, plan: fresh, hasKey: false };
	};
	return { kind: 'manual', connection, plan: fresh, port: planned.port, access };
};

// ---------------------- manual setup ---------------------- //

export interface ManualInput {
	appId: AiAppId;
	route: AiRoute;
	tier: AiTier;
	recommendedTier: AiTier;
	grant: LinkAppGrant;
	name: string;
	expireAt: number;
	method?: AiSetupMethod;
	/** `command`: the app starts Anytype's connector with the key in its `env` (Other app's Command, Claude Desktop by hand) */
	setup?: AiSetup;
	/** The record the manual delivery replaces (its old key is revoked only after "I've updated") */
	existing?: AiConnection | null;
	/** The record a reconnect updates: every record keeps its identity (W10) */
	connectionId?: string;
	/** The previewed canonical file ('' when there is none: main then changes no file's mode, V7) */
	previewTarget?: string;
	/** The manual plan the user sees */
	shown?: AiPlan | null;
	/** The port the instructions on screen were made for: a key is minted and recorded only for it (W13) */
	port?: number;
	/** Reconnect: the old key's access when the view opened, re-read before minting and before recording (W4) */
	reread?: { hash: string; grant: LinkAppGrant; expireAt: number };
};

export type ManualResult =
	| { ok: true; connection: AiConnection; fileMode?: 'tightened' | 'loose'; recordSaved: boolean; probe: AiProbeResult }
	/**
	 * reason — stillSaving: a CLI may still write an earlier key (W5); changed: the API's port moved since the
	 * instructions were made (W13); grantChanged: the old key's access changed, the new key was released (W4);
	 * cancelled: closed, or another account signed in (nothing to show)
	 */
	| { ok: false; error: AiError; reason?: 'stillSaving' | 'changed' | 'grantChanged' | 'cancelled'; access?: AccessNow };

const PORT_CHANGED: AiError = { stage: 'write', category: 'changed' };

/** The old key's access now, against the values a manual view started from (`changed: null` = unchanged) */
const oldAccess = async (reread: { hash: string; grant: LinkAppGrant; expireAt: number }): Promise<{ ok: false } | { ok: true; changed: AccessNow | null }> => {
	const res = await listApps();

	if (!res.ok) {
		return { ok: false };
	};

	const row = res.list.find(it => it.hash == reread.hash);

	if (!row || isExpired(row)) {
		return { ok: true, changed: { present: false, grant: reread.grant, expireAt: reread.expireAt } };
	};

	const expireAt = Number(row.expireAt) || 0;

	if (!sameGrant(row.grant, reread.grant) || (expireAt != reread.expireAt)) {
		return { ok: true, changed: { present: true, grant: row.grant || reread.grant, expireAt } };
	};
	return { ok: true, changed: null };
};

/** The manual delivery of the operation's pending key (the commit), then the old key is revoked */
const confirmManualIn = async (op: Operation, input: ManualInput): Promise<ManualResult> => {
	const account = op.accountId;
	const key = op.pending;

	if (!alive(op) || !key) {
		return { ok: false, error: UNKNOWN, reason: op.cancelRequested ? 'cancelled' : undefined };
	};
	if (input.existing && stillSaving(input.existing)) {
		return { ok: false, error: UNKNOWN, reason: 'stillSaving' };
	};
	// The instructions the user copied name a port: recorded only while the API is still there (W13)
	if (input.port ? !liveFor(input.port) : !getPort()) {
		return { ok: false, error: PORT_CHANGED, reason: 'changed' };
	};
	// Reconnect: the old key is re-read right before the new one replaces it; another access → the new key goes (W4)
	if (input.reread) {
		const now = await oldAccess(input.reread);

		if (!alive(op)) {
			return { ok: false, error: UNKNOWN, reason: 'cancelled' };
		};
		if (!now.ok) {
			return { ok: false, error: { stage: 'key', category: 'unknown' } };
		};
		if (now.changed) {
			await dropPending(op);
			return { ok: false, error: UNKNOWN, reason: 'grantChanged', access: now.changed };
		};
	};

	// The record gets the access the key was minted with, and the port its instructions name
	const param: any = {
		accountId: account, appId: input.appId, route: input.route, tier: input.tier, recommendedTier: input.recommendedTier, port: input.port || previewPort(),
		appHash: key.appHash, name: key.name, grant: key.grant, expireAt: key.expireAt, expectedHash: input.existing?.appHash ?? null,
	};

	if (input.connectionId) {
		param.connectionId = input.connectionId;
	};
	if (input.setup == 'command') {
		param.setup = 'command';
		param.route = 'stdio';
	};
	if (input.previewTarget !== undefined) {
		param.previewTarget = input.previewTarget;
	};
	if (key.intentId) {
		param.intentId = key.intentId;
	};
	if (accountId() != account) {
		return { ok: false, error: UNKNOWN, reason: 'cancelled' };
	};
	// The listener again, right before the commit (the re-read above awaited): the replacement stays pending (Y4)
	if (input.port ? !liveFor(input.port) : !getPort()) {
		return { ok: false, error: PORT_CHANGED, reason: 'changed' };
	};

	const res = await ipc<AiRecordManualResult>('aiConnectRecordManual', param);
	const here = () => (accountId() == account);

	if (!res) {
		return { ok: false, error: UNKNOWN };
	};
	if ('error' in res) {
		if (res.error.category == 'stale') {
			await dropPending(op);
			await load();
		};
		// The previewed place changed (main's strict check): fresh instructions, the pending key kept (J5)
		return (res.error.category == 'changed') ? { ok: false, error: res.error, reason: 'changed' } : { ok: false, error: res.error };
	};

	// Committed: kept whatever happens next; another account's store, probe and popup are left alone (W6)
	commit(op);
	if (!here()) {
		return { ok: false, error: UNKNOWN, reason: 'cancelled' };
	};
	S.AiConnect.upsert(res.connection);
	await revokeOutstanding(res.connection, account);

	// A key a Copy handed over is read back by its hash for the probe, for this call only (D1S-11)
	const plain = key.key || (await keyFor({ appHash: key.appHash } as AiConnection)) || '';
	const probe: AiProbeResult = plain ? await probeDelivered(res.connection, plain, account) : { ok: false, category: 'unknown' };

	if (!here()) {
		return { ok: false, error: UNKNOWN, reason: 'cancelled' };
	};
	await load();

	return {
		ok: true, connection: S.AiConnect.getById(res.connection.id) || res.connection, fileMode: res.fileMode, recordSaved: (res.recordSaved !== false), probe,
	};
};

/**
 * "I've updated <App>": records the manual delivery of this flow's pending key, then revokes the old key.
 * Closing before it releases the new key and leaves the old one working (R3-2).
 */
export const confirmManual = (input: ManualInput): Promise<ManualResult> => inOperation<ManualResult>(async op => trackDelivery(op, input.appId, await confirmManualIn(op, input)), { ok: false, error: UNKNOWN });

export type CreateManualResult =
	/** The key is pending: the view shows it with "I've updated", which records it (V7) */
	| { kind: 'pending'; plan: AiPlan; port: number }
	/** Nothing minted: the fresh plan has no key to deliver, or it differs from the one shown (place, port) (V8, W13) */
	| { kind: 'plan'; plan: AiPlan; port: number }
	/** Recorded (Other app, with the fresh plan's steps) */
	| { kind: 'ok'; connection: AiConnection; fileMode?: 'tightened' | 'loose'; recordSaved: boolean; probe: AiProbeResult; plan: AiPlan; port: number }
	/** Reconnect: the old key's access changed since the view opened; nothing minted (W4) */
	| ({ kind: 'grantChanged' } & AccessNow)
	/** A CLI of the record may still be writing an earlier key: nothing minted (W5) */
	| { kind: 'stillSaving' }
	| { kind: 'error'; error: AiError }
	| { kind: 'cancelled' }
	| { kind: 'busy' };

/** A manual plan can deliver a key: main says its steps need one (`needsKey`; they hold KEY_PLACEHOLDER) */
export const manualUsable = (p: AiPlan | null): boolean => !!p?.needsKey;

/** Other app's Command setup: the app starts Anytype's connector, the key in the entry's `env` */
export const commandPlan = (p: AiPlan | null): boolean => !!p && (p.appId == 'other') && !!p.setups?.includes('command') && !!p.needsKey && p.steps.some(s => s.textKey == 'aiConnectManualCommandEntry');

/**
 * "Create key" in the manual view, in one operation from its plan (V1): plan → mint → (Other app: record;
 * any other app: the key waits for "I've updated"). Mints only with a fresh plan that can deliver the key to
 * the place and port shown (V8, W13), after a reconnect's re-read of the old key (W4).
 */
export const createManual = (input: ManualInput): Promise<CreateManualResult> => inOperation<CreateManualResult>(async op => trackDelivery(op, input.appId, await createManualIn(op, input)), { kind: 'busy' });

const createManualIn = async (op: Operation, input: ManualInput): Promise<CreateManualResult> => {
	if (!alive(op)) {
		return { kind: 'cancelled' };
	};
	if (input.existing && stillSaving(input.existing)) {
		return { kind: 'stillSaving' };
	};

	const planned = await plan({ appId: input.appId, route: input.route, tier: input.tier, method: input.method, connectionId: input.connectionId, fresh: true });

	if (!alive(op)) {
		return { kind: 'cancelled' };
	};
	if ('error' in planned) {
		return { kind: 'error', error: planned.error };
	};

	const fresh = planned.plan;
	const port = planned.port;

	if (!manualUsable(fresh) || (input.shown && ((input.shown.targetPath || '') != (fresh.targetPath || ''))) || (input.port && (input.port != port))) {
		return { kind: 'plan', plan: fresh, port };
	};
	if (input.reread) {
		const now = await oldAccess(input.reread);

		if (!alive(op)) {
			return { kind: 'cancelled' };
		};
		if (!now.ok) {
			return { kind: 'error', error: { stage: 'key', category: 'unknown' } };
		};
		if (now.changed) {
			await dropPending(op);
			return { kind: 'grantChanged', ...now.changed };
		};
	};

	const minted = await mintPending(op, { name: input.name, grant: input.grant, expireAt: input.expireAt });

	if (!alive(op)) {
		return { kind: 'cancelled' };
	};
	if ('error' in minted) {
		return { kind: 'error', error: minted.error };
	};

	// A key that goes into a named file is recorded after the user saved it (its mode is checked then)
	if ((input.appId != 'other') || input.existing) {
		return { kind: 'pending', plan: fresh, port };
	};

	const res = await confirmManualIn(op, { ...input, port, reread: undefined });

	if (res.ok === false) {
		if (res.reason == 'cancelled') {
			return { kind: 'cancelled' };
		};
		return (res.reason == 'stillSaving') ? { kind: 'stillSaving' } : { kind: 'error', error: res.error };
	};
	return { kind: 'ok', connection: res.connection, fileMode: res.fileMode, recordSaved: res.recordSaved, probe: res.probe, plan: fresh, port };
};

// ---------------------- manage ---------------------- //

/**
 * Retry check (R2-21, V20): a probe of this record only. A failed lookup is reported as such (not as a key
 * that is gone); nothing is reconciled, healed or revoked.
 */
export type RetryProbeResult = AiProbeResult | { ok: false; category: AiErrorCategory; lookupFailed: true };

export const retryProbe = async (connection: AiConnection): Promise<RetryProbeResult> => {
	if (!isDesktop() || (apiState() != 'listening')) {
		return { ok: false, category: 'apiOff' };
	};
	// Claude's extension is never probed with its key (§3.3): heart's isActive says whether Claude uses it
	if (connection?.method == 'package') {
		return { ok: false, category: 'unknown' };
	};

	const account = accountId();
	// The record's key from the list: only its hash is kept once delivered
	const found = await lookupKey(connection);

	if (accountId() != account) {
		return { ok: false, category: 'unknown' };
	};
	if (!found.ok) {
		return { ok: false, category: 'unknown', lookupFailed: true };
	};
	if (!found.key) {
		return { ok: false, category: 'unauthorized' };
	};

	const res = await probeDelivered(connection, found.key, account);

	await load();
	return res;
};

/** Access change on the same key; check stores the new grant */
export const updateAccess = async (connection: AiConnection, grant: LinkAppGrant): Promise<boolean> => {
	if (!isDesktop()) {
		return false;
	};

	const ok = await updateApp(connection.appHash, grant);

	if (ok) {
		await check('access');
	};
	return ok;
};

export type TierResult = { ok: true; connection: AiConnection } | { ok: false; reconnect: boolean; error: AiError };

/** Tool set change in place; one that can't be done in place (`reconnect`) is a reconnect with the new tier */
export const updateTier = async (connection: AiConnection, tier: AiTier): Promise<TierResult> => {
	const port = getPort();

	if (!port) {
		return { ok: false, reconnect: false, error: API_OFF };
	};

	const account = accountId();
	const res = await ipc<AiUpdateResult>('aiConnectUpdate', { accountId: account, connectionId: connection.id, expectedHash: connection.appHash, port, tier });

	if (!res) {
		return { ok: false, reconnect: false, error: UNKNOWN };
	};
	if ('error' in res) {
		return { ok: false, reconnect: (res.error.category == 'unsupportedForm'), error: res.error };
	};
	if (accountId() == account) {
		S.AiConnect.upsert(res.connection);
	};
	return { ok: true, connection: res.connection };
};

export type DisconnectResult =
	| { ok: true; revoked: boolean; left?: 'extension' | 'entry' | 'envKey'; connection: AiConnection }
	/** stale: the record isn't the one the confirm showed any more (W21) */
	| { ok: false; conflict: boolean; stale?: boolean; error: AiError };

/**
 * Cleanup, then the revoke of every hash the record waits for (§4.3). A conflict touches nothing (Forget
 * instead). A failed revoke keeps the row as `revokeFailed` with Retry.
 */
export const disconnect = async (connection: AiConnection, forgetOnly = false): Promise<DisconnectResult> => {
	const account = accountId();
	// A bundle record retired for a Reconnect has no key (appHash ''): no record hash expected
	const param: any = { accountId: account, connectionId: connection.id, expectedHash: connection.appHash || null };

	if (forgetOnly) {
		param.forget = true;
	};

	const res = await ipc<AiRemoveResult>('aiConnectRemove', param);

	if (!res) {
		return { ok: false, conflict: false, error: UNKNOWN };
	};
	if ('error' in res) {
		return { ok: false, conflict: (res.error.category == 'conflict'), stale: (res.error.category == 'stale'), error: res.error };
	};
	// Removed in main; its revokes wait for its own account's next check when another one signed in (W6)
	if (accountId() != account) {
		return { ok: true, revoked: false, left: res.connection.left, connection: res.connection };
	};
	// Once per removal: a second Disconnect of a record already removed (its revoke waiting) reports nothing (A16)
	if (res.removedNow) {
		track.removed(res.connection.appId, 'user');
	};

	S.AiConnect.upsert(res.connection);

	const revoked = await revokeOutstanding(res.connection, account);

	await load();
	return { ok: true, revoked, left: res.connection.left, connection: res.connection };
};

/** Forget: nothing is cleaned up in the app; the key is revoked */
export const forget = (connection: AiConnection): Promise<DisconnectResult> => disconnect(connection, true);

/** The revoke Retry: every outstanding hash of every record and every orphan; works with the HTTP API off */
export const retryRevoke = async (): Promise<void> => {
	await check('retry');
};

export const stepDone = async (connection: AiConnection): Promise<boolean> => {
	const account = accountId();
	const res = await ipc<AiStepDoneResult>('aiConnectStepDone', { accountId: account, connectionId: connection.id });

	if (res && !('error' in res)) {
		if (accountId() == account) {
			S.AiConnect.upsert(res.connection);
		};
		return true;
	};
	return false;
};

export const restartApp = async (appId: AiAppId): Promise<boolean> => !!(await ipc<AiRestartResult>('aiConnectRestartApp', { appId }))?.ok;

export const openApp = async (appId: AiAppId): Promise<boolean> => !!(await ipc<AiOpenAppResult>('aiConnectOpenApp', { appId }))?.ok;

/** Claude's "Open again": main opens the bundle copy in Claude (no key involved); an installed extension is updated, not re-keyed */
export const openBundle = async (): Promise<boolean> => !!(await ipc<AiOpenAppResult>('aiConnectOpenApp', { appId: 'claude-desktop', bundle: true }))?.ok;

/** A record's target, or a card's bundle / target before any record exists */
export const reveal = async (p: { connectionId: string } | { appId: AiAppId; what: 'bundle' | 'target' }): Promise<boolean> => {
	const param = ('connectionId' in p) ? { accountId: accountId(), connectionId: p.connectionId } : { appId: p.appId, what: p.what };
	return !!(await ipc<AiRevealResult>('aiConnectReveal', param))?.ok;
};

/**
 * The discovery nudge's one claim per profile (§5.9): true for exactly one caller ever, false once claimed.
 * null when main gave no answer (not desktop, a background tab or an unfocused window): try again later.
 */
export const claimNudge = async (): Promise<boolean | null> => {
	const account = accountId();
	const res = account ? await ipc<AiClaimNudgeResult>('aiConnectClaimNudge', { accountId: account }) : null;

	return res ? (res.claimed === true) : null;
};

export const bundleInfo = async (): Promise<AiBundleInfoResult> => (await ipc<{ signed: boolean }>('aiConnectBundleInfo', {})) || null;

/** Repeats `test` every interval until it is true, the timeout passes, or `cancelled()` (the popup closed) */
export const pollUntil = async (test: () => Promise<boolean>, cancelled: () => boolean, opts: { interval?: number; timeout?: number } = {}): Promise<'done' | 'timeout' | 'cancelled'> => {
	const interval = opts.interval ?? flowConfig.pollInterval;
	const deadline = Date.now() + (opts.timeout ?? flowConfig.pollTimeout);

	while (Date.now() < deadline) {
		await wait(interval);
		if (cancelled()) {
			return 'cancelled';
		};
		if (await test()) {
			return 'done';
		};
	};
	return cancelled() ? 'cancelled' : 'timeout';
};

/** Test support: forget the module state */
export const resetFlowForTests = (): void => {
	operation = null;
	checking = null;
	checkAgain = false;
	leftovers.length = 0;
	releasing.clear();
};
