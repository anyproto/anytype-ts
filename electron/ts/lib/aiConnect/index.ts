/**
 * Connect to AI apps: the main-process service behind the aiConnect* IPC methods.
 *
 * Holds the real `Env`, the registry and a single promise queue; every operation that reads or
 * changes state runs through the queue (the probe's network part excepted). With api.ts, the only
 * module here that touches Electron. Never logs a parameter, a key, a file's content or a child's
 * output: method names and error codes only.
 *
 * Bookkeeping rules (plan §3.11):
 * - apply / recordManual / update / remove compare `expectedHash` with the record's appHash (null = no
 *   record expected) → `stale`; apply and recordManual on a `removed` record → `stale`.
 * - `revokePending` is a set; a rotation adds the previous hash only when it differs; remove adds the
 *   current one. A record is deleted only when it is `removed` and nothing is pending.
 * - check reconciles keys only against a successful ListApps (`keys !== null`); without a listening API
 *   it heals nothing and statuses not derived from keys keep their last value. A failed lookup (ListApps,
 *   or an incomplete app scan) never improves a status: `accessEnded` stays, nothing becomes notInstalled.
 * - Manual records never reach an adapter's check / update / remove.
 * - A delivery that committed is never reported as failed: when its record can't be saved, the record is
 *   kept in memory, every later call retries the save first, and apply says `recordSaved: false`. While
 *   one is unsaved it is the only version anything reads, and every call that would change state returns
 *   `{ stage: 'write', category: 'unsaved' }` (nothing acts on the stale record on disk; no hash is lost).
 * - Unconfirmed CLI deliveries are a list of candidates, each with its own target and access data; a check
 *   reads each candidate's own target first (whatever resolves today) and keeps the installed one. A
 *   candidate whose CLI may still be running is never retired by an absent entry; the record waits.
 * - Anytype keeps no copy of a key (tokens-plan §3). Claude's config route saves the new key as a candidate
 *   (entry digest and fingerprint) before the entry is written; Claude's extension saves the record `waiting`
 *   twice: first `staged` (the earlier record kept, none of its keys queued), then, once Claude's settings file passed
 *   its last check (`settleEntry`: an entry the user agreed to replace goes), the commit; only after it is the key
 *   copied and the bundle opened. A refusal undoes the first save; a staged record any later call finds (a crash, an
 *   undo that couldn't be saved) is put back, its never-delivered key kept for this run's flow or orphaned (R1, R2).
 *   Disconnect of the extension and
 *   of manual records queues every hash first; the config route queues once the entry is known to be ours,
 *   before it is deleted; HTTP adapters as before (a refused Disconnect queues nothing).
 * - The endpoint file (endpoint.ts) is kept in step with the Local API by `syncEndpoint`, the only writer.
 * - Keys reach the clipboard only through `copySecret` (clipboard.ts).
 * - A queued revocation leaves `revokePending` (or the orphans) only through `aiConnectRevoked` /
 *   `aiConnectOrphan { done }`, which the renderer calls after RevokeApp answered success or "not found". A key
 *   list that lacks the hash proves nothing and prunes nothing.
 * - A mint intent (account, key name, time) is saved before the renderer calls CreateApp and cleared when the
 *   key is delivered or released. One left by an earlier run is handed to the renderer (`mintIntents`), which
 *   finds that key and queues it as an orphan — through `aiConnectOrphan { intentId }`, which main refuses for a
 *   hash a record or candidate owns, or while a mint of this run for the same name is unresolved (S3).
 * - Other app's Command setup is a manual record (`setup: 'command'`): never checked, healed or rewritten.
 * - Apply and update resolve the config homes afresh; apply refuses (`changed`) when the previewed target
 *   (`previewTarget`, or the Replace's file) is no longer one of the card's targets, update when the
 *   record's target no longer is (Disconnect still works on a stored old location).
 */
import { app, clipboard, shell } from 'electron';
import { fixPathForAsarUnpack } from 'electron-util';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type {
	AiApplyResult, AiBundleInfoResult, AiCheckResult, AiClaimNudgeResult, AiConnection, AiFail, AiListResult, AiMintIntentResult, AiOpenAppResult, AiOrphanResult,
	AiCandidate, AiPlanResult, AiProbeResult, AiRecord, AiRecordManualResult, AiRemoveResult, AiRestartResult, AiRevealResult, AiRevokedResult, AiStatus,
	AiStepDoneResult, AiTargetId, AiUpdateResult, Adapter, CheckOutcome, Ctx, Detected, Env, Homes, AiBundleState, AiRetireResult, AiCopySecretResult,
} from './types';
import { KEY_PLACEHOLDER } from '../../../../src/ts/lib/aiConnect/catalog';
import { liveApiListening, validateParam, VALIDATION_ERROR } from './validate';
import { getSafeStorage } from '../../safeStorage';
import { Registry } from './registry';
import { detectAll, resolveHomes, targetFor, toDetection } from './detect';
import { probe } from './probe';
import { bundleInfo, bundlePath, bundleUsable, copyPath } from './bundle';
import { createNodeEnv } from './exec';
import { isLocalAbsolute, pathOf, resolveTarget, sweepTemps } from './fsSafe';
import { keyFingerprint } from './digest';
import { buildMeta } from './forwarder';
import { SecretClipboard, type SecretOwner } from './clipboard';
import { clearEndpoint, publishablePort, syncEndpoint, withdrawEndpoint, type ApiState } from './endpoint';
import { claudeRoutes, openBundleAgain } from './adapters/claudeDesktop';
import { restart } from './restart';
import { hermesEnvFile } from './adapters/hermes';
import { adapterFor } from './adapters';
import { displayPath, protectedTarget } from './adapters/common';

export { displayPath };

const FAIL: AiFail = { ok: false, error: VALIDATION_ERROR };

const STALE: AiFail = { ok: false, error: { stage: 'validate', category: 'stale' } };

const union = (...lists: string[][]): string[] => [ ...new Set(lists.flat().filter(Boolean)) ];

const UNSAVED: AiFail = { ok: false, error: { stage: 'write', category: 'unsaved' } };

const CHANGED: AiFail = { ok: false, error: { stage: 'write', category: 'changed' } };

/** Calls that change state: refused while a committed record waits for its save */
/** heart stamps a key with this machine's clock in whole seconds: an intent's time lies this much before CreateApp */
const INTENT_SKEW = 2;

const MUTATING = [ 'aiConnectApply', 'aiConnectRecordManual', 'aiConnectUpdate', 'aiConnectRemove', 'aiConnectRevoked', 'aiConnectCheck', 'aiConnectStepDone', 'aiConnectOrphan', 'aiConnectMintIntent', 'aiConnectRetire' ];

/** Claude Desktop's own records (extension and config route) carry the build flavour that made them (T3) */
const flavoured = (rec: AiRecord): boolean => (rec.appId == 'claude-desktop') && (rec.method != 'manual');

/** Claude's extension route */
const isBundle = (rec: AiRecord | null): boolean => (rec?.appId == 'claude-desktop') && (rec.method == 'package');

/** Cards whose manual setup puts the key into a settings file Anytype knows (checked for its mode afterwards) */
const MANUAL_FILE_CARDS = [ 'cursor', 'vscode', 'lmstudio', 'chatgpt', 'codex', 'gemini-cli', 'antigravity', 'opencode' ];

/** The hashes of a record's unconfirmed deliveries */
const candidateHashes = (rec: AiRecord | null): string[] => (rec?.unconfirmed || []).map(c => c.appHash);

interface Setup {
	env: Env;
	registryFile: string;
	version?: string;
	log?: (method: string, code: string) => void;
	/** PNG data URL of an app's icon (Electron's app.getFileIcon); tests leave it out */
	icon?: (appPath: string) => Promise<string | null>;
	/** The Local API listens on this port right now (production: `storedLiveApi`); tests may leave it out */
	liveApi?: (port: number) => boolean;
	/** The renderer's shared Local API settings (production: the safe storage); the endpoint file follows them */
	apiState?: () => { localApi: any; bind: any };
};

export class AiConnectService {

	private setup: Setup | null = null;
	private registry: Registry | null = null;
	private queue: Promise<unknown> = Promise.resolve();
	private scan: { scanOk: boolean; items: Detected[] } | null = null;
	/** Statuses from the last check, per account and record */
	private statuses = new Map<string, AiStatus>();
	/** Pids that already got their one quit signal */
	private signalled = new Set<number>();
	private icons = new Map<string, string | null>();
	/**
	 * Records whose delivery committed but whose save failed, with the registry they belong to (kept across a
	 * profile switch, retried against that same registry before every later call until it takes them)
	 */
	private unsaved = new Map<string, { rec: AiRecord; file: string; intentId?: string }>();
	/** Mint intents saved by this run: their flows may still be going on, so they are never reported as left over */
	private liveIntents = new Set<string>();
	/** Claude extension records staged by this run (account and record): this run's flow may still hold their new key (R1) */
	private stagedHere = new Set<string>();
	/** Claude's extension rows that aren't "Connected" yet: which step is missing (per account and record) */
	private bundleStates = new Map<string, AiBundleState>();
	/** Claude rows in `conflict` because both of Claude's routes are there */
	private bothRoutes = new Set<string>();
	/** The one guarded copy (§3.4) */
	private clipboard = new SecretClipboard();
	/** The port this instance last wrote into the endpoint file (null: none) */
	private published: number | null = null;
	/** An account is open (false from logout until heart reports its next bind) */
	private accountOpen = true;
	/** The app is quitting: nothing is published or copied any more */
	private closing = false;
	/**
	 * The account session: bumped synchronously by logout and quit. A probe, a clipboard copy or an endpoint write
	 * that started under an earlier one sends, copies and renames nothing (D1S-20, D1C-24)
	 */
	private session = 0;
	/** Probes on the network now: aborted when the session ends */
	private probes = new Set<AbortController>();
	/** Every card's target was swept for leftover temps in this run */
	private sweptTargets = false;

	constructor (private factory: () => Setup) {};

	/** Tests only: replaces the outside world and forgets everything cached, the queue included */
	configure (setup: Setup): void {
		this.setup = setup;
		this.protect();
		this.registry = new Registry(setup.env, setup.registryFile);
		this.scan = null;
		this.statuses.clear();
		this.signalled.clear();
		this.icons.clear();
		this.unsaved.clear();
		this.liveIntents.clear();
		this.stagedHere.clear();
		this.bundleStates.clear();
		this.bothRoutes.clear();
		this.sweptTargets = false;
		this.closing = false;
		this.clipboard = new SecretClipboard();
		this.published = null;
		this.accountOpen = true;
		this.session++;
		this.probes.clear();
		this.queue = Promise.resolve();
	};

	/** Production start-up: builds the outside world once and never touches the queue */
	private ensureSetup (): void {
		if (!this.setup) {
			const setup = this.factory();

			this.setup = setup;
			this.protect();
			this.registry = new Registry(setup.env, setup.registryFile);
		};
	};

	/** Anytype's profile folder (registry, logs, data) is never another app's target */
	private protect (): void {
		this.setup.env.protectedDirs = [ pathOf(this.setup.env).dirname(this.setup.registryFile) ];
	};

	/**
	 * The key may be sent to `port` now: the API listens there (`liveApi`) and heart's bind is one 127.0.0.1 reaches —
	 * the endpoint file's own rule (a `[::1]` bind may share its port number with another program on 127.0.0.1)
	 */
	private sendable (port: number): boolean {
		return this.liveApi(port) && (!this.setup?.apiState || (publishablePort(this.apiNow()) == port));
	};

	/** May a check heal entries for `port` now (tests without `liveApi`: as the caller says) */
	private liveApi (port: number): boolean {
		return !this.setup?.liveApi || this.setup.liveApi(port);
	};

	private get env (): Env {
		this.ensureSetup();
		return this.setup.env;
	};

	private get reg (): Registry {
		this.ensureSetup();
		return this.registry;
	};

	/**
	 * The profile folder moved (Api.setUserDataPath): later operations use the registry there.
	 * Serialised with everything already queued; per-profile caches are dropped.
	 */
	setUserData (dir: string): Promise<void> {
		return this.enqueue(() => {
			if (!this.setup) {
				return;
			};

			const registryFile = pathOf(this.setup.env).join(dir, 'aiConnect.json');

			// The old profile's unsaved records stay keyed by its registry and keep being retried there
			this.flushUnsaved();
			this.setup = { ...this.setup, registryFile };
			this.protect();
			this.registry = new Registry(this.setup.env, registryFile);
			this.scan = null;
			this.statuses.clear();
			this.bundleStates.clear();
			this.stagedHere.clear();
			this.clipboard.clear(this.setup.env);
		});
	};

	// ---------------------- the endpoint file and the clipboard (app lifecycle) ---------------------- //

	/** The state the endpoint file should describe now */
	private apiNow (): ApiState {
		this.ensureSetup();

		const state = this.setup.apiState?.() || { localApi: null, bind: null };
		return { localApi: state.localApi, bind: state.bind, account: this.accountOpen && !this.closing };
	};

	/**
	 * Makes the endpoint file match the Local API (inside the queue). A write lands only while its session is the
	 * current one and the API still publishes that port, checked right before every rename (D1C-24); after a logout
	 * or quit, the withdrawal that ran then owns `published`
	 */
	private async endpointNow (): Promise<void> {
		const session = this.session;
		const live = (port: number): boolean => (session == this.session) && !this.closing && (publishablePort(this.apiNow()) == port);
		const published = await syncEndpoint(this.env, this.apiNow(), this.published, code => this.log('aiConnectEndpoint', { code }), live);

		if (session == this.session) {
			this.published = published;
		};
	};

	/** Synchronously: the session ends, its probes stop, the endpoint file this instance wrote goes (logout, quit) */
	private endSession (): void {
		this.session++;
		this.accountOpen = false;
		for (const probe of this.probes) {
			probe.abort();
		};
		this.probes.clear();
		this.clipboard.clear(this.env);
		this.published = withdrawEndpoint(this.env, this.published, code => this.log('aiConnectEndpoint', { code }));
	};

	/**
	 * App start, once the profile folder is known (`dir`, after a custom userDataPath was applied) and before any
	 * account is selected: the service is bound to that profile's registry, the endpoint file is deleted whatever it
	 * says, and every record's settings file loses the temps a killed writer left (older than a minute)
	 */
	startup (dir: string): Promise<void> {
		return this.enqueue(async () => {
			try {
				this.ensureSetup();

				const registryFile = pathOf(this.setup.env).join(dir, 'aiConnect.json');

				if (registryFile != this.setup.registryFile) {
					this.setup = { ...this.setup, registryFile };
					this.protect();
					this.registry = new Registry(this.setup.env, registryFile);
					this.scan = null;
					this.statuses.clear();
					this.bundleStates.clear();
				};
				// A file that couldn't be removed stays ours: every later lifecycle call finishes the withdrawal (D1C-25)
				const left = await clearEndpoint(this.env);

				if (left !== null) {
					this.published = left;
					this.log('aiConnectStartup', { code: 'EENDPOINT' });
				};
				this.sweep(this.reg.all().flatMap(rec => this.secretFiles(rec)));
			} catch (e) {
				this.log('aiConnectStartup', e);
			};
		});
	};

	/** Every file a record's adapter puts a key into: its target and config file, and Hermes' .env beside them */
	private secretFiles (rec: AiRecord): string[] {
		return union([ rec.configPath, rec.targetPath, ...(rec.unconfirmed || []).map(c => c.configPath || c.targetPath), ...((rec.appId == 'hermes') ? [ hermesEnvFile(this.env) ] : []) ]);
	};

	/**
	 * Deletes the leftover temps of `files` (fsSafe.sweepTemps). One too young to be a dead writer's is looked at
	 * again once it is old enough (a quick restart, D1S-25), through the queue and the same identity checks
	 */
	private sweep (files: string[]): void {
		let wait = 0;

		for (const file of files) {
			wait = Math.max(wait, sweepTemps(this.env, file));
		};
		if (wait > 0) {
			this.env.setTimer(() => {
				this.enqueue(() => {
					if (!this.closing) {
						this.sweep(files);
					};
				});
			}, wait);
		};
	};

	/** `localApi` or `localApiBind` changed (main.ts storeSet): a new bind means an account is open */
	apiChanged (key: string): Promise<void> {
		// A bind reported before a logout that is still queued behind it opens nothing for the next session
		const session = this.session;

		return this.enqueue(async () => {
			if ((key == 'localApiBind') && (session == this.session) && (this.apiNow().bind?.success === true) && !this.closing) {
				this.accountOpen = true;
			};
			await this.endpointNow();
		});
	};

	/** The account stopped (logout, account switch): nothing is published, the clipboard is cleared */
	accountStopped (): Promise<void> {
		// At once, not behind adapter work in the queue (D1S-20)
		try {
			this.endSession();
		} catch (e) {
			this.log('aiConnectLogout', e);
		};
		return this.enqueue(() => this.endpointNow());
	};

	/**
	 * Quit (every path: Api.exit, will-quit): the endpoint file this instance wrote goes, and the clipboard is cleared
	 * (only while it still holds the copied key). Synchronous, best effort, idempotent; afterwards nothing queued
	 * publishes the endpoint or copies a key again
	 */
	shutdown (): void {
		this.closing = true;
		this.session++;
		if (!this.setup) {
			return;
		};
		try {
			this.endSession();
		} catch (e) {
			this.log('aiConnectShutdown', e);
		};
	};

	private log (method: string, e: any): void {
		const code = String(e?.code || e?.name || 'error');

		if (this.setup?.log) {
			this.setup.log(method, code);
		} else {
			console.error('[AiConnect]', method, 'failed:', code);
		};
	};

	/** Runs `fn` after everything queued before it, whatever their outcome */
	private enqueue<T> (fn: () => Promise<T> | T): Promise<T> {
		const next = this.queue.then(fn, fn);

		this.queue = next.catch(() => {});
		return next;
	};

	/** Validation, queueing and the error boundary for one IPC method */
	private async call<T> (method: string, param: any, onInvalid: T, fn: (p: any) => Promise<T> | T, queued = true): Promise<T> {
		const p = validateParam(method, param);

		if (!p) {
			this.log(method, { code: 'invalid' });
			return onInvalid;
		};

		try {
			return await (queued ? this.enqueue(() => {
				this.flushUnsaved();

				// R1: an extension delivery that never finished is put back before anything reads, judges or revokes
				if (!this.recoverStaged() && MUTATING.includes(method)) {
					return UNSAVED as any;
				};

				// Another account is signed in now: the previous one's copied key leaves the clipboard
				if (p.accountId && this.clipboard.owner() && (this.clipboard.owner().accountId != p.accountId)) {
					this.clipboard.clear(this.env);
				};

				// A committed record still waits for its save: nothing acts on the stale one on disk
				if (this.pendingSaves().length && MUTATING.includes(method)) {
					return UNSAVED as any;
				};
				return fn(p);
			}) : fn(p));
		} catch (e) {
			this.log(method, e);
			return onInvalid;
		};
	};

	private statusKey (accountId: string, id: string): string {
		return `${accountId}\n${id}`;
	};

	private unsavedKey (file: string, accountId: string, id: string): string {
		return `${file}\n${accountId}\n${id}`;
	};

	/** The unsaved records of the current registry */
	private pendingSaves (): AiRecord[] {
		return [ ...this.unsaved.values() ].filter(it => it.file == this.setup.registryFile).map(it => it.rec);
	};

	/** Saves the records kept in memory after a failed save, each into its own registry; a failure keeps them for the next call */
	private flushUnsaved (): void {
		for (const [ k, { rec, file, intentId } ] of [ ...this.unsaved ]) {
			try {
				(file == this.setup.registryFile) ? this.reg.upsert(rec, intentId) : new Registry(this.setup.env, file).upsert(rec, intentId);
				this.unsaved.delete(k);
				this.liveIntents.delete(intentId);
			} catch (e) {
				this.log('aiConnectSave', e);
			};
		};
	};

	/**
	 * R1: Claude extension records whose first save is on disk but whose delivery never finished (Anytype stopped in
	 * between, or the undo of a refused delivery couldn't be saved) are put back: the earlier record, nothing of it
	 * queued (its key may still be in Claude's settings file). The new key was never handed out. While this run's flow
	 * may still hold it (staged in this run) its mint intent comes back with it, and the flow releases or reuses it;
	 * otherwise its hash goes to the orphans and is revoked (R2: also after a save whose undo file stayed). False: one
	 * couldn't be put back
	 */
	private recoverStaged (): boolean {
		let list: AiRecord[] = [];
		let ok = true;

		try {
			list = this.reg.all().filter(rec => !!rec.staged);
		} catch (e) {
			// The registry can't be read now: every call that needs it fails on its own
			return true;
		};

		for (const rec of list) {
			const key = this.statusKey(rec.accountId, rec.id);
			const before = rec.staged.before;
			const here = this.stagedHere.has(key);
			const owned = !!before && ((before.appHash == rec.appHash) || candidateHashes(before).includes(rec.appHash));

			try {
				this.reg.revert(rec.accountId, rec.id, before, (here && rec.staged.intent) || null, (!here && rec.appHash && !owned) ? rec.appHash : '');
				this.stagedHere.delete(key);
			} catch (e) {
				this.log('aiConnectSave', e);
				ok = false;
			};
		};
		return ok;
	};

	/**
	 * Saves the record of a delivery that already committed: retried once, else kept in memory (listed, and
	 * saved again before every later call). False when it isn't on disk yet. `intentId`: the mint intent of its key
	 * goes in the same save, so a delivered key never comes back to name-and-time recovery (D1C-21)
	 */
	private saveCommitted (rec: AiRecord, intentId?: string): boolean {
		const file = this.setup.registryFile;
		const k = this.unsavedKey(file, rec.accountId, rec.id);

		for (let attempt = 0; attempt < 2; attempt++) {
			try {
				this.reg.upsert(rec, intentId);
				this.unsaved.delete(k);
				this.liveIntents.delete(intentId);
				return true;
			} catch (e) {
				this.log('aiConnectSave', e);
			};
		};
		this.unsaved.set(k, { rec, file, ...(intentId ? { intentId } : {}) });
		return false;
	};

	/** One record, the one kept in memory first */
	private record (accountId: string, id: string): AiRecord | null {
		return this.unsaved.get(this.unsavedKey(this.setup.registryFile, accountId, id))?.rec || this.reg.get(accountId, id);
	};

	/** The account's records, the ones kept in memory included */
	private records (accountId: string): AiRecord[] {
		const list = this.reg.list(accountId);

		for (const rec of this.pendingSaves()) {
			if (rec.accountId == accountId) {
				const i = list.findIndex(it => it.id == rec.id);

				if (i >= 0) {
					list[i] = rec;
				} else {
					list.push(rec);
				};
			};
		};
		return list;
	};

	/** Every card with its target taken from `homes`, the answer ctx.homes carries (a moved home is never written to) */
	private retarget (items: Detected[], homes: Homes): Detected[] {
		return items.map(det => {
			const target = targetFor(this.env, homes, det.appId);
			const next: Detected = { ...det, targetPaths: target.targetPaths };

			delete next.targetId;
			if (target.targetId) {
				next.targetId = target.targetId;
			};
			return next;
		});
	};

	private defaultStatus (rec: AiRecord): AiStatus {
		if (rec.removed) {
			return rec.revokePending.length ? 'revokeFailed' : 'removed';
		};
		if (isBundle(rec) && !rec.appHash) {
			return 'disconnected';
		};
		return (rec.method == 'manual') ? 'ok' : 'pending';
	};

	private setStatus (rec: AiRecord, status: AiStatus): void {
		this.statuses.set(this.statusKey(rec.accountId, rec.id), status);
	};

	private view (rec: AiRecord): AiConnection {
		const status = this.statuses.get(this.statusKey(rec.accountId, rec.id)) || this.defaultStatus(rec);
		const bundleState = (status == 'pending') ? this.bundleStates.get(this.statusKey(rec.accountId, rec.id)) : undefined;
		const view: AiConnection = { ...rec, status, displayTarget: displayPath(this.env, rec.targetPath) };

		// Internal bookkeeping of the latch stays in main
		delete view.armed;
		if (bundleState) {
			view.bundleState = bundleState;
		};
		if ((status == 'conflict') && this.bothRoutes.has(this.statusKey(rec.accountId, rec.id))) {
			view.bothRoutes = true;
		};
		delete view.staged;
		// The record's own key (not a snippet, not an earlier key) was copied and hasn't left the clipboard yet, as main
		// knows it: the clipboard itself isn't read (R7). With its deadline, for the sheet's own timer (R10)
		const until = this.clipboard.keyUntil(o => (o.accountId == rec.accountId) && ((o.connectionId == rec.id) || (!!rec.appHash && (o.appHash == rec.appHash))), rec.keyFp);

		if (until) {
			view.keyCopied = true;
			view.keyCopiedUntil = until;
		};
		return view;
	};

	private async rescan (force: boolean): Promise<{ scanOk: boolean; items: Detected[] }> {
		const createdDirs = this.reg.all().flatMap(it => it.createdDirs || []);
		const res = await detectAll(this.env, { createdDirs, force });
		const items = res.items.map(det => ({ ...det, canRestart: !!adapterFor(det.appId)?.canRestart(this.env, det) }));

		// Once per run: the temps a writer killed during a FIRST delivery left (no record names that file yet)
		if (!this.sweptTargets) {
			this.sweptTargets = true;
			this.sweep(union(items.flatMap(det => det.targetPaths), [ hermesEnvFile(this.env) ]));
		};

		this.scan = { scanOk: res.scanOk, items };
		return this.scan;
	};

	private async scanned (): Promise<{ scanOk: boolean; items: Detected[] }> {
		return this.scan || this.rescan(false);
	};

	private detectionOf (items: Detected[], appId: string): Detected {
		return items.find(it => it.appId == appId) || { appId: appId as any, installed: false, targetPaths: [], canRestart: false };
	};

	/** The record a card maps to: its target id (a moved Codex home has another id, so another record) */
	private recordFor (accountId: string, det: Detected): AiRecord | null {
		return det.targetId ? this.record(accountId, det.targetId) : null;
	};

	private ctx (homes: Homes, items: Detected[], p: any, extra: Partial<Ctx> = {}): Ctx {
		return {
			env: this.env,
			homes,
			detections: items,
			appId: p.appId,
			accountId: p.accountId || '',
			targetId: extra.targetId,
			port: p.port || 0,
			tier: p.tier,
			route: p.route,
			key: '',
			signalled: this.signalled,
			...extra,
		};
	};

	private async icon (det: Detected): Promise<string | undefined> {
		const file = det.appPath || det.exePath;

		if (!det.installed || !file || !this.setup?.icon) {
			return undefined;
		};
		if (!this.icons.has(file)) {
			let url: string | null = null;

			try {
				url = await this.setup.icon(file);
			} catch (e) { /* no icon */ };
			this.icons.set(file, url);
		};
		return this.icons.get(file) || undefined;
	};

	// ---------------------- IPC methods ---------------------- //

	list (param: any): Promise<AiListResult> {
		return this.call<AiListResult>('aiConnectList', param, FAIL, async p => {
			const scan = (p.refresh || !this.scan) ? await this.rescan(!!p.refresh) : this.scan;
			const items = this.retarget(scan.items, await resolveHomes(this.env));
			const detections = [];

			for (const it of items) {
				detections.push(toDetection(it, await this.icon(it), this.env.platform));
			};

			return {
				ok: true,
				scanOk: scan.scanOk,
				detections,
				connections: this.records(p.accountId).map(it => this.view(it)),
				orphanHashes: this.reg.listOrphans(p.accountId),
				// Left by an earlier run (this run's flows still hold theirs)
				mintIntents: this.reg.listIntents(p.accountId).filter(it => !this.liveIntents.has(it.id)).map(it => ({
					id: it.id, name: it.name, time: it.time, ...(it.grant ? { grant: it.grant } : {}), ...((it.expireAt !== undefined) ? { expireAt: it.expireAt } : {}),
				})),
			};
		});
	};

	/**
	 * Saved before the renderer calls CreateApp (`name`, `time`, and the `grant` and `expireAt` the key is made with);
	 * `id` + `done` clears it (the key was released). The time is main's when it saved it, if later than the
	 * renderer's: a wait in the queue never moves CreateApp out of the intent's window (D1C-22). The reply names it
	 */
	mintIntent (param: any): Promise<AiMintIntentResult> {
		return this.call<AiMintIntentResult>('aiConnectMintIntent', param, FAIL, p => {
			if (p.done) {
				this.dropIntent(p.accountId, p.id);
				return { ok: true, id: p.id };
			};

			const id = crypto.randomBytes(8).toString('hex');
			const time = Math.max(p.time, Math.floor(this.env.now() / 1000) - INTENT_SKEW);

			this.reg.addIntent({
				id, accountId: p.accountId, name: p.name, time, ...(p.grant ? { grant: p.grant } : {}), ...((p.expireAt !== undefined) ? { expireAt: p.expireAt } : {}),
			});
			this.liveIntents.add(id);
			return { ok: true, id, time };
		});
	};

	/** The key of this intent is accounted for (a record or the orphan list has it, or it was revoked) */
	private dropIntent (accountId: string, id?: string): void {
		if (!id) {
			return;
		};
		try {
			this.reg.removeIntent(accountId, id);
			this.liveIntents.delete(id);
		} catch (e) {
			// Stays: the next run looks for a key of that name, finds it managed (or gone) and clears the intent
			this.log('aiConnectMintIntent', e);
		};
	};

	/** The namespace (build flavour) of the forwarder this build ships; null: the build has none */
	private namespace (): AiRecord['ns'] | null {
		return buildMeta(this.env)?.forwarder?.namespace || null;
	};

	/**
	 * T3: the record was set up by the other build flavour (its extension id, its stable copy, its endpoint
	 * file). Nothing of it is judged, settled, retired or rewritten here
	 */
	private otherBuild (rec: AiRecord | null): boolean {
		return !!rec?.ns && (rec.ns != this.namespace());
	};

	/**
	 * T2: a key found by intent recovery may be the one a delivery already installed before Anytype died (a
	 * settings file is written first, the record saved afterwards). Every record's own target is read: the key
	 * there → it becomes that record's candidate and the normal settle path promotes it; a target that can't be
	 * read → unknown. Either way the hash is kept, never queued for revocation
	 */
	private async installedSomewhere (accountId: string, hash: string, key: string): Promise<boolean> {
		const fp = keyFingerprint(key);
		const scan = await this.scanned();
		const homes = await resolveHomes(this.env);
		const items = this.retarget(scan.items, homes);

		for (const rec of this.records(accountId)) {
			const adapter = adapterFor(rec.appId);

			if (rec.removed || (rec.method == 'manual') || this.otherBuild(rec) || !adapter?.installedFp) {
				continue;
			};

			const ctx = this.ctx(homes, items, { appId: rec.appId, accountId: rec.accountId, port: rec.port, tier: rec.tier, route: rec.route }, { targetId: rec.id });
			const found = await adapter.installedFp(ctx, rec);

			if (found === 'unreadable') {
				return true;
			};
			if (found && (found == fp)) {
				const candidate: AiCandidate = {
					appHash: hash, keyFp: fp, route: rec.route, method: rec.method, targetPath: rec.targetPath, tier: rec.tier, recommendedTier: rec.recommendedTier,
					port: rec.port, nextStep: rec.nextStep, name: rec.name, grant: rec.grant, expireAt: rec.expireAt, created: false, running: false,
				};

				try {
					this.reg.upsert({ ...rec, unconfirmed: [ ...(rec.unconfirmed || []).filter(c => c.appHash != hash), candidate ] });
				} catch (e) {
					this.log('aiConnectSave', e);
				};
				return true;
			};
		};
		return false;
	};

	/** The candidate's writer may still be at work (U2): flagged running, and its deadline (when it has one) not passed (Q3) */
	private stillRunning (c: AiCandidate): boolean {
		return c.running && (!c.until || (this.env.now() < c.until));
	};


	/** Reads, never writes; the renderer mints a key only after `canApply` (and any consent) */
	plan (param: any): Promise<AiPlanResult> {
		return this.call<AiPlanResult>('aiConnectPlan', param, FAIL, async p => {
			const scan = await this.scanned();
			// `fresh`: the plan right before a key is minted resolves the config homes now, as apply does (Y6)
			const homes = await resolveHomes(this.env, { force: !!p.fresh });
			const items = this.retarget(scan.items, homes);
			const det = this.detectionOf(items, p.appId);
			const adapter = adapterFor(p.appId);
			const rec = p.connectionId ? this.record(p.accountId, p.connectionId) : this.recordFor(p.accountId, det);

			if (!adapter || (p.connectionId && !rec)) {
				return FAIL;
			};

			// A Command plan is for a Command record (or for a new connection), never another kind of record
			if ((p.method == 'command') && ((p.appId != 'other') || (rec && (rec.setup != 'command')))) {
				return FAIL;
			};
			// T3: the other build flavour's record gets no snippet or plan from here (Forget only)
			if (rec && !rec.removed && this.otherBuild(rec)) {
				return { ok: false, error: { stage: 'validate', category: 'conflict' } };
			};

			const ctx = this.ctx(homes, items, p, { targetId: det.targetId || rec?.id, method: p.method, syncEndpoint: () => this.endpointNow() });
			const plan = await adapter.plan(ctx, det, (rec && !rec.removed) ? rec : null);
			// A plan whose steps hold the key's placeholder needs a key for its manual setup (the screen masks it)
			const needsKey = plan.needsKey ?? plan.steps.some(it => String(it.snippet || '').includes(KEY_PLACEHOLDER));

			return { ok: true, ...plan, needsKey };
		});
	};

	apply (param: any): Promise<AiApplyResult> {
		// The key is copied only in the session the request arrived in (D1S-20)
		const session = this.session;

		return this.call<AiApplyResult>('aiConnectApply', param, FAIL, async p => {
			const scan = await this.scanned();
			// Fresh, never the cached answer: the key goes exactly where the card points now
			const homes = await resolveHomes(this.env, { force: true });
			const items = this.retarget(scan.items, homes);
			const det = this.detectionOf(items, p.appId);
			const adapter = adapterFor(p.appId);

			if (!adapter || !det.targetId) {
				return FAIL;
			};

			const rec = this.recordFor(p.accountId, det);
			const targetId: AiTargetId = det.targetId;

			// The location the user saw (or agreed to replace) moved since the preview: a fresh preview first
			if (((p.previewTarget !== undefined) && !this.isTarget(det, p.previewTarget)) || (p.replace && !this.isTarget(det, p.replace.targetPath))) {
				return CHANGED;
			};
			if (!this.previewIsWritten(adapter, det, p)) {
				return CHANGED;
			};
			// A bundle record retired for its Reconnect has no key: the new one is expected over "none"
			if (((rec?.appHash || null) !== p.expectedHash) || rec?.removed) {
				return STALE;
			};
			// T3: set up by the other build flavour — nothing is delivered over it from here
			if (this.otherBuild(rec)) {
				return { ok: false, error: { stage: 'validate', category: 'conflict' } };
			};
			// Claude's extension: the old key goes first (aiConnectRetire); a new key over a live one is never delivered
			if (isBundle(rec) && rec.appHash && (rec.appHash != p.appHash) && (p.method != 'config')) {
				return STALE;
			};

			const fp = keyFingerprint(p.key);
			/** The candidate a delivery of this key leaves while its outcome isn't known */
			type Delivered = { method: AiRecord['method']; route?: AiRecord['route']; targetPath: string; nextStep: AiRecord['nextStep']; entryDigest?: string; configPath?: string };
			const candidateOf = (it: Delivered, running: boolean): AiCandidate => ({
				appHash: p.appHash, keyFp: fp, route: it.route || p.route, method: it.method, targetPath: it.targetPath, tier: p.tier, recommendedTier: p.recommendedTier,
				port: p.port, nextStep: it.nextStep, name: p.name, grant: p.grant, expireAt: p.expireAt, created: !rec, running,
				...(it.entryDigest ? { entryDigest: it.entryDigest } : {}), ...(it.configPath ? { configPath: it.configPath } : {}),
			});
			/** What `journal.set` saved for this delivery, before the key went into the file */
			let journaledIntent: Delivered | null = null;
			const withCandidate = (given: Delivered, running: boolean): AiRecord => {
				// S7: the candidate keeps the digest it journaled, whatever the outcome carries
				const it: Delivered = {
					...given,
					...((!given.entryDigest && journaledIntent?.entryDigest) ? { entryDigest: journaledIntent.entryDigest } : {}),
					...((!given.configPath && journaledIntent?.configPath) ? { configPath: journaledIntent.configPath } : {}),
				};
				const { entryDigest: _d, configPath: _p, ...plain } = it;
				const base: AiRecord = rec || { ...this.freshRecord(targetId, p, { ok: true, observedInstalled: false, createdDirs: [], ...plain }, fp, null), observedInstalled: false };
				return { ...base, unconfirmed: [ ...(base.unconfirmed || []).filter(c => c.appHash != p.appHash), candidateOf(it, running) ] };
			};
			// The new key is saved as a candidate before it goes into Claude's config
			let journaled = false;
			const journal: Ctx['journal'] = {
				set: intent => {
					try {
						this.reg.upsert(withCandidate(intent, false));
						journaled = true;
						journaledIntent = intent;
						return true;
					} catch (e) {
						this.log('aiConnectSave', e);
						return false;
					};
				},
			};
			const ctx = this.ctx(homes, items, p, {
				targetId, key: p.key, method: p.method, allowQuit: !!p.allowQuit, quitConfirmed: !!p.quitConfirmed, replace: p.replace,
				previewTarget: p.previewTarget, journal, syncEndpoint: () => this.endpointNow(),
			});
			const out = await adapter.apply(ctx, det, rec);

			if (('needs' in out) || ('error' in out)) {
				// Nothing was written: the candidate goes (a save that fails leaves it for the next check, which retires it)
				if (journaled) {
					try {
						rec ? this.reg.upsert(rec) : this.reg.remove(p.accountId, targetId);
					} catch (e) {
						this.log('aiConnectSave', e);
					};
				};
			};
			if ('needs' in out) {
				return { ok: false, needs: out.needs };
			};
			if ('error' in out) {
				return { ok: false, error: out.error };
			};

			if (out.unconfirmed) {
				// Maybe delivered: the record stays as it is (or a pending one is created) with one more candidate; the next check decides
				const kept = withCandidate(out, !!out.running);

				// Q6: the intent goes only with the record that holds the key, in the same save
				this.saveCommitted(kept, p.intentId);
				this.setStatus(kept, 'pending');
				return { ok: false, unconfirmed: true, error: { stage: 'cli', category: 'timeout' }, connection: this.view(kept) };
			};

			const fresh = this.freshRecord(targetId, p, out, fp, rec);

			// Another route or profile than before: the previous one's artefacts go now, or are kept as `prior` for disconnect (one slot).
			// A manual record has none (the user set it up)
			if (adapter.separateRoutes && rec && (rec.method != 'manual') && ((rec.route != fresh.route) || (rec.targetPath != fresh.targetPath))) {
				const prior = await this.removePrevious(adapter, { ...ctx, key: '' }, rec);

				if (prior) {
					fresh.prior = prior;
				};
			};

			// Claude's extension (§3.3): saved twice. First `staged` (the record `waiting`, the key's mint intent consumed, the
			// earlier record and nothing of it queued); then Claude's settings file passes its last check (an entry the user
			// agreed to replace goes); then the second save (the earlier key queued) is the commit, and only after it the key
			// is copied and the bundle opened. Any failure before the commit undoes the first save, and an undo that can't be
			// saved is put back by the next call (R1, R3)
			if (out.deliver) {
				// The extension's record names no settings-file entry, whatever the earlier record owned (R12)
				delete fresh.entryDigest;
				delete fresh.configPath;

				const key = this.statusKey(fresh.accountId, fresh.id);
				const intent = p.intentId ? (this.reg.listIntents(p.accountId).find(it => it.id == p.intentId) || null) : null;
				const staged: AiRecord = { ...fresh, revokePending: [ ...(rec?.revokePending || []) ], staged: { before: rec, ...(intent ? { intent } : {}) } };

				try {
					this.reg.upsert(staged, p.intentId);
					this.stagedHere.add(key);
				} catch (e) {
					this.log('aiConnectSave', e);
					return UNSAVED;
				};

				let refused: Awaited<ReturnType<NonNullable<typeof out.settleEntry>>> = null;

				try {
					refused = out.settleEntry ? await out.settleEntry() : null;
				} catch (e) {
					this.log('aiConnectApply', e);
					refused = { error: { stage: 'write', category: 'unknown' } };
				};
				if (refused) {
					// Nothing was delivered: the earlier record and the key's intent are back, the key is the renderer's undelivered one
					try {
						this.reg.revert(p.accountId, targetId, rec, intent);
						this.stagedHere.delete(key);
					} catch (e) {
						// Not undone: never reported as done either; the next call puts the earlier record back (R1)
						this.log('aiConnectSave', e);
						return UNSAVED;
					};
					return ('needs' in refused) ? { ok: false, needs: refused.needs } : { ok: false, error: refused.error };
				};

				// The commit: the entry is gone (or never was), so the earlier record's key may be revoked now (R1)
				try {
					this.reg.upsert(fresh);
					this.stagedHere.delete(key);
					this.liveIntents.delete(p.intentId);
				} catch (e) {
					// Not saved: nothing is copied or opened, the next call puts the earlier record back (the key never left Anytype)
					this.log('aiConnectSave', e);
					await out.abort?.();
					return UNSAVED;
				};

				const keyCopied = !this.closing && (session == this.session) && this.clipboard.copy(this.env, p.key, { accountId: p.accountId, connectionId: fresh.id });
				let opened = false;

				try {
					opened = await out.deliver();
				} catch (e) {
					this.log('aiConnectApply', e);
				};
				this.setStatus(fresh, 'pending');
				// A launch that failed stays actionable (Open again), whatever is installed
				this.bundleStates.set(key, (out.install && (out.configure || opened)) ? 'notConfirmed' : 'finish');

				// With Configure `openFailed` is a Claude that Anytype quit and couldn't start again (R11)
				return {
					ok: true, connection: this.view(fresh),
					...(keyCopied ? {} : { copyFailed: true }), ...(opened ? {} : { openFailed: true }), ...(out.configure ? { configure: true } : {}),
				};
			};

			const saved = this.saveCommitted(fresh, p.intentId);
			this.setStatus(fresh, fresh.observedInstalled ? 'ok' : 'pending');

			const ret: AiApplyResult = { ok: true, connection: this.view(fresh) };

			return {
				...ret,
				...(out.steps?.length ? { steps: out.steps } : {}),
				...(out.openFailed ? { openFailed: true } : {}),
				...(saved ? {} : { recordSaved: false as const }),
			};
		});
	};

	/** The record a committed delivery leaves (bookkeeping rules above); `rec` is the one it replaces */
	private freshRecord (id: AiTargetId, p: any, out: Extract<Awaited<ReturnType<Adapter['apply']>>, { method: any }>, fp: string, rec: AiRecord | null): AiRecord {
		const fresh: AiRecord = {
			id,
			appId: p.appId,
			accountId: p.accountId,
			appHash: p.appHash,
			keyFp: fp,
			name: p.name,
			route: out.route || p.route,
			tier: p.tier,
			recommendedTier: p.recommendedTier,
			method: out.method,
			targetPath: out.targetPath,
			port: p.port,
			createdAt: rec?.createdAt || this.env.now(),
			grant: p.grant,
			expireAt: p.expireAt,
			nextStep: out.nextStep,
			observedInstalled: out.observedInstalled,
			lastProbe: 'none',
			// A rotation retires the previous hash and every finished unconfirmed one (unless it is the same key); one whose CLI
			// may still be running stays unconfirmed with its key alive until its own target settles it
			revokePending: union(rec?.revokePending || [], [ rec?.appHash, ...(rec?.unconfirmed || []).filter(c => !this.stillRunning(c)).map(c => c.appHash) ].filter(h => h && (h != p.appHash))),
			removed: false,
			createdDirs: union(rec?.createdDirs || [], out.createdDirs),
		};

		// The config entry stays known after a switch to another method (disconnect still removes it)
		const entryDigest = out.entryDigest || rec?.entryDigest;

		const configPath = out.configPath || rec?.configPath;
		// T1: the record has a confirmed key of its own from here on — a candidate carried over is no longer the
		// reason it exists, so its expiry retires only its own hash, never the record
		const running = (rec?.unconfirmed || []).filter(c => this.stillRunning(c) && (c.appHash != p.appHash)).map(c => ({ ...c, created: false }));

		if (configPath) {
			fresh.configPath = configPath;
		};
		if (running.length) {
			fresh.unconfirmed = running;
		};
		if (entryDigest) {
			fresh.entryDigest = entryDigest;
		};
		if (rec?.prior && !((rec.prior.route == fresh.route) && (rec.prior.targetPath == fresh.targetPath))) {
			fresh.prior = rec.prior;
		};
		// T3: Claude's records name the build flavour that set them up
		if (flavoured(fresh) && this.namespace()) {
			fresh.ns = this.namespace();
		};
		// The extension: a new key was never used, so its first use under whatever install Claude has confirms it (§3.3)
		if (isBundle(fresh)) {
			fresh.armed = { appHash: fresh.appHash, version: out.install?.version || '', installedAt: out.install?.installedAt || '' };
		};
		return fresh;
	};

	/**
	 * Removes what a record installed on its previous route or profile (its own key fingerprint decides).
	 * Returns the `prior` to keep when that wasn't fully possible; null when nothing of it is left, or what
	 * is there isn't ours any more.
	 */
	private async removePrevious (adapter: Adapter, ctx: Ctx, rec: AiRecord): Promise<AiRecord['prior'] | null> {
		let res: { ok: boolean; left?: string; error?: { category: string } } = { ok: false };

		if ((rec.method == 'manual') || !rec.keyFp || !rec.targetPath) {
			return null;
		};

		try {
			res = await adapter.remove(ctx, rec);
		} catch (e) {
			this.log('aiConnectApply', e);
		};

		// Gone, or verified not ours at that place; anything left (reported) is still ours to clean up
		if (!res.left && (res.ok || (res.error?.category == 'conflict'))) {
			return null;
		};
		return { route: rec.route, targetPath: rec.targetPath, keyFp: rec.keyFp };
	};

	/** `file` is one of the card's targets now */
	/** A strict-preview card: the previewed file is the one its adapter writes now (not just one of its files, H10) */
	private previewIsWritten (adapter: Adapter, det: Detected, p: any): boolean {
		if (!adapter.strictPreview || (p.previewTarget === undefined)) {
			return true;
		};

		const now = adapter.target(this.env, det, p.appId)?.path || '';
		return !!now && ((this.env.platform == 'win32') ? (now.toLowerCase() == String(p.previewTarget).toLowerCase()) : (now == p.previewTarget));
	};

	private isTarget (det: Detected, file: string): boolean {
		const same = (a: string, b: string) => (this.env.platform == 'win32') ? (a.toLowerCase() == b.toLowerCase()) : (a == b);
		return !!file && det.targetPaths.some(t => same(t, file));
	};

	/** A manual delivery: no key, nothing written to other apps; a new id unless it reconnects one */
	recordManual (param: any): Promise<AiRecordManualResult> {
		return this.call<AiRecordManualResult>('aiConnectRecordManual', param, FAIL, async p => {
			let rec = p.connectionId ? this.reg.get(p.accountId, p.connectionId) : null;

			// Either setup is reconnected by its id (§3.2)
			if (p.connectionId && !rec) {
				return FAIL;
			};

			let id: string = rec?.id;
			const scan = await this.scanned();
			const det = this.detectionOf(this.retarget(scan.items, await resolveHomes(this.env)), p.appId);

			if (!id) {
				id = ((p.appId != 'other') && det.targetId) ? det.targetId : `other-${crypto.randomBytes(4).toString('hex')}`;
				rec = this.reg.get(p.accountId, id);
			};

			if (((rec?.appHash ?? null) !== p.expectedHash) || rec?.removed) {
				return STALE;
			};
			// T3: a manual stdio record names the forwarder (and endpoint file) of the build that set it up
			if (this.otherBuild(rec)) {
				return { ok: false, error: { stage: 'validate', category: 'conflict' } };
			};

			const manualAdapter = adapterFor(p.appId);

			if (manualAdapter && !this.previewIsWritten(manualAdapter, det, p)) {
				return CHANGED;
			};

			const next: AiRecord = {
				id: id as AiTargetId,
				appId: p.appId,
				accountId: p.accountId,
				appHash: p.appHash,
				keyFp: '',
				name: p.name,
				route: p.route,
				tier: p.tier,
				recommendedTier: p.recommendedTier,
				method: 'manual',
				targetPath: '',
				port: p.port,
				createdAt: rec?.createdAt || this.env.now(),
				grant: p.grant,
				expireAt: p.expireAt,
				nextStep: 'none',
				observedInstalled: false,
				lastProbe: 'none',
				revokePending: union(rec?.revokePending || [], [ rec?.appHash, ...candidateHashes(rec) ].filter(h => h && (h != p.appHash))),
				removed: false,
				createdDirs: rec?.createdDirs || [],
				setup: p.setup || 'url',
			};

			if ((next.route == 'stdio') && this.namespace()) {
				next.ns = this.namespace();
			};

			// The user already put this key into the app ("I've updated"): committed even when the save fails
			const saved = this.saveCommitted(next, p.intentId);
			const fileMode = this.tightenManualFile(det, p);
			const ret: AiRecordManualResult = { ok: true, connection: this.view(next) };

			this.setStatus(next, 'ok');
			return { ...ret, ...(saved ? {} : { recordSaved: false as const }), ...(fileMode ? { fileMode } : {}) };
		});
	};

	/**
	 * POSIX: the settings file the user just put the key into by hand (Cursor, Copilot, LM Studio, Codex,
	 * Claude Code's settings.json) is made private when group or other can read it and it is the user's;
	 * 'loose' when that isn't possible (warn), undefined when there is nothing to do.
	 */
	private tightenManualFile (det: Detected, p: any): 'tightened' | 'loose' | undefined {
		const card = MANUAL_FILE_CARDS.includes(p.appId) || ((p.appId == 'claude-code') && (p.route == 'skill'));
		// Hermes: the key went into the profile's .env; its config.yaml confirms the previewed profile (H8)
		const hermes = (p.appId == 'hermes');
		const file = hermes ? hermesEnvFile(this.env) : (card ? (det.targetPaths[0] || '') : '');

		if (!file || (this.env.platform == 'win32')) {
			return undefined;
		};

		// Only the previewed canonical file, inside home and outside Anytype's own folders; else nothing is chmod-ed
		const target = isLocalAbsolute(this.env, file) ? resolveTarget(this.env, file) : null;
		const previewed = hermes ? (det.targetPaths[0] ? resolveTarget(this.env, det.targetPaths[0]) : null) : target;
		const same = !!target && ('real' in target) && ((p.previewTarget === undefined) || (!!previewed && ('real' in previewed) && (previewed.real == p.previewTarget)));

		if (!same || protectedTarget(this.env, (target as any).real)) {
			return this.env.lstat(file) ? 'loose' : undefined;
		};

		const real = (target as { real: string }).real;
		const st = this.env.lstat(real);

		if (!st || st.isSymlink || !st.isFile || !(st.mode & 0o077)) {
			return undefined;
		};
		if ((this.env.uid !== null) && (st.uid != this.env.uid)) {
			return 'loose';
		};
		try {
			this.env.chmod(real, 0o600);
			return 'tightened';
		} catch (e) {
			return 'loose';
		};
	};

	/** A tier or port change, in place; unsupported → the renderer reconnects */
	update (param: any): Promise<AiUpdateResult> {
		return this.call<AiUpdateResult>('aiConnectUpdate', param, FAIL, async p => {
			const rec = this.reg.get(p.accountId, p.connectionId);

			if (!rec) {
				return FAIL;
			};
			if ((rec.appHash !== p.expectedHash) || rec.removed) {
				return STALE;
			};
			if (this.otherBuild(rec)) {
				return { ok: false, error: { stage: 'validate', category: 'conflict' } };
			};

			const adapter = adapterFor(rec.appId);

			if ((rec.method == 'manual') || !adapter) {
				return { ok: false, error: { stage: 'validate', category: 'unsupportedForm' } };
			};

			// Claude's extension is always Full (§3.3)
			if (isBundle(rec) && p.tier && (p.tier != 'full')) {
				return FAIL;
			};

			const scan = await this.scanned();
			const homes = await resolveHomes(this.env, { force: true });
			const items = this.retarget(scan.items, homes);

			// Only where an app reads it now (a moved home: reconnect; Disconnect still cleans the stored place)
			if (!isBundle(rec) && !items.some(d => (d.targetId == rec.id) && this.isTarget(d, rec.targetPath))) {
				return CHANGED;
			};

			const ctx = this.ctx(homes, items, { appId: rec.appId, accountId: rec.accountId, port: p.port, tier: p.tier || rec.tier, route: rec.route }, { targetId: rec.id });
			const res = await adapter.update(ctx, rec, { tier: p.tier, port: p.port });

			if (!res.ok) {
				return { ok: false, error: res.error || { stage: 'write', category: 'unknown' } };
			};

			const next: AiRecord = { ...rec, port: p.port, tier: p.tier || rec.tier, nextStep: res.nextStep || rec.nextStep };

			return { ok: true, connection: this.view(this.reg.upsert(next)) };
		});
	};

	/**
	 * Cleanup (skipped with `forget`), then the record becomes `removed` with its hash (and an unconfirmed
	 * one) added to `revokePending`. An entry that isn't ours → `conflict`, nothing changes (Forget instead).
	 * Order (§3.2): the extension and manual records queue first; Claude's config route queues once its entry is
	 * known to be ours, before deleting it (`ctx.queue`); HTTP adapters queue after their cleanup. A save that
	 * fails stops everything after it: nothing is deleted outside, and no revoke follows.
	 */
	remove (param: any): Promise<AiRemoveResult> {
		return this.call<AiRemoveResult>('aiConnectRemove', param, FAIL, async p => {
			const rec = this.reg.get(p.accountId, p.connectionId);

			if (!rec) {
				return FAIL;
			};
			if ((rec.appHash || null) !== p.expectedHash) {
				return STALE;
			};
			if (rec.removed) {
				return { ok: true, connection: this.view(rec), removedNow: false };
			};
			// T3: this build can't clean up what the other flavour set up (Forget still revokes the key and drops the record)
			if (this.otherBuild(rec) && !p.forget) {
				return { ok: false, error: { stage: 'validate', category: 'conflict' } };
			};

			// Cancel setup / Disconnect: a key this record copied leaves the clipboard
			this.clipboard.clear(this.env, o => (o.accountId == rec.accountId) && ((o.connectionId == rec.id) || (!!rec.appHash && (o.appHash == rec.appHash))));

			const removedRecord = (): AiRecord => {
				const next: AiRecord = { ...rec, removed: true, revokePending: union(rec.revokePending, [ rec.appHash, ...candidateHashes(rec) ]) };

				delete next.unconfirmed;
				delete next.left;
				return next;
			};
			const cleanup = !p.forget && (rec.method != 'manual');
			let queued = false;
			/** Saves the record removed with every hash queued; false: not saved, nothing outside may change */
			const queue = (): boolean => {
				try {
					this.reg.upsert(removedRecord());
					queued = true;
					return true;
				} catch (e) {
					this.log('aiConnectSave', e);
					return false;
				};
			};

			let left: AiRecord['left'];
			let priorLeft = false;

			if (cleanup) {
				const adapter = adapterFor(rec.appId);
				const scan = await this.scanned();
				const homes = await resolveHomes(this.env);
				const ctx = this.ctx(homes, this.retarget(scan.items, homes), { appId: rec.appId, accountId: rec.accountId, port: rec.port, tier: rec.tier, route: rec.route }, { targetId: rec.id, queue });
				const res: Awaited<ReturnType<Adapter['remove']>> = adapter ? await adapter.remove(ctx, rec) : { ok: true };

				// Not ours (nothing queued), not saved, or Claude's lock not taken: nothing was deleted
				const category = res.error?.category;

				if (!res.ok && ((category == 'conflict') || (category == 'unsaved') || ((category == 'changed') && (rec.appId == 'claude-desktop')))) {
					return { ok: false, error: res.error };
				};
				left = res.left || (res.ok ? undefined : 'entry');

				// What the previous route or profile left (its own key decides; another owner's is not touched)
				if (adapter && rec.prior) {
					priorLeft = !!(await this.removePrevious(adapter, ctx, { ...rec, ...rec.prior }));
					left = left || (priorLeft ? 'entry' : undefined);
				};
			} else
			if (!queue()) {
				return UNSAVED;
			};

			const next = removedRecord();

			if (!priorLeft) {
				delete next.prior;
			};
			if (left) {
				next.left = left;
			};

			try {
				this.reg.upsert(next);
			} catch (e) {
				this.log('aiConnectSave', e);
				// Queued before the cleanup: the hashes are on disk, the next check finishes the row
				if (!queued) {
					return UNSAVED;
				};
			};
			this.setStatus(next, 'removed');
			this.bundleStates.delete(this.statusKey(next.accountId, next.id));
			return { ok: true, connection: this.view(next), removedNow: true };
		});
	};

	/** heart confirmed a revoke: the hash leaves `revokePending`; a removed record with nothing pending is deleted */
	revoked (param: any): Promise<AiRevokedResult> {
		return this.call<AiRevokedResult>('aiConnectRevoked', param, FAIL, p => {
			const rec = this.reg.get(p.accountId, p.connectionId);

			if (!rec) {
				return FAIL;
			};

			const next: AiRecord = { ...rec, revokePending: rec.revokePending.filter(h => h != p.hash) };

			if (next.removed && !next.revokePending.length) {
				this.reg.remove(p.accountId, p.connectionId);
				this.statuses.delete(this.statusKey(p.accountId, p.connectionId));
				return { ok: true, connection: null };
			};

			this.reg.upsert(next);
			return { ok: true, connection: this.view(next) };
		});
	};

	/**
	 * Bundle Reconnect, before the new key is minted (§3.3): the old key goes first. Its hash (and candidates')
	 * move to `revokePending`, the key and the latch are cleared, the record is `disconnected` and saved; grant and
	 * expiry stay for the new key. The renderer revokes, then connects again on the same record.
	 */
	retire (param: any): Promise<AiRetireResult> {
		return this.call<AiRetireResult>('aiConnectRetire', param, FAIL, p => {
			const rec = this.reg.get(p.accountId, p.connectionId);

			if (!rec || !isBundle(rec)) {
				return FAIL;
			};
			if ((rec.appHash !== p.expectedHash) || rec.removed) {
				return STALE;
			};
			if (this.otherBuild(rec)) {
				return { ok: false, error: { stage: 'validate', category: 'conflict' } };
			};

			const next: AiRecord = { ...rec, appHash: '', keyFp: '', revokePending: union(rec.revokePending, [ rec.appHash, ...candidateHashes(rec) ]), lastProbe: 'none' };

			// The access the user just confirmed (read live): a Reconnect resumed after a crash mints exactly that
			if (p.grant) {
				next.grant = p.grant;
			};
			if (p.expireAt !== undefined) {
				next.expireAt = p.expireAt;
			};

			delete next.unconfirmed;
			delete next.confirmed;
			delete next.armed;
			delete next.reconfirm;

			this.clipboard.clear(this.env, o => (o.accountId == rec.accountId) && (o.connectionId == rec.id));
			this.reg.upsert(next);
			this.setStatus(next, 'disconnected');
			this.bundleStates.delete(this.statusKey(next.accountId, next.id));
			return { ok: true, connection: this.view(next) };
		});
	};

	/** The only way a key (or a snippet with one) reaches the clipboard (§3.4) */
	copySecret (param: any): Promise<AiCopySecretResult> {
		// A copy asked for before a logout never lands after it (D1S-20)
		const session = this.session;

		return this.call<AiCopySecretResult>('aiConnectCopySecret', param, { ok: false }, p => {
			const owner: SecretOwner = { accountId: p.accountId, ...(p.connectionId ? { connectionId: p.connectionId } : { appHash: p.appHash }) };

			// Cancel of a sheet: that owner's copy goes (if it is still the latest and still on the clipboard)
			if (p.clear) {
				this.clipboard.clear(this.env, o => (o.accountId == owner.accountId) && (o.connectionId == owner.connectionId) && (o.appHash == owner.appHash));
				return { ok: true };
			};
			return { ok: !this.closing && (session == this.session) && this.clipboard.copy(this.env, p.text, owner) };
		});
	};

	/** Reconciles keys (only after a successful ListApps), then checks each record (heals only while the API listens) */
	check (param: any): Promise<AiCheckResult> {
		return this.call<AiCheckResult>('aiConnectCheck', param, FAIL, async p => {
			const keys: { hash: string; present: boolean; grant?: any; expireAt?: number; active?: boolean }[] | null = p.keys;
			const byHash = new Map((keys || []).map(k => [ k.hash, k ]));
			const absent = (h: string): boolean => (keys !== null) && byHash.has(h) && !byHash.get(h).present;
			const healed: string[] = [];
			/** Records this check found removed in their app for the first time (reported once, Z12) */
			const removed: string[] = [];

			// Every check starts with the endpoint file in step with the Local API
			await this.endpointNow();

			// Orphans and pending revocations are never dropped here: a key list that lacks a hash proves nothing
			// (heart skips grant files it can't read). Only a RevokeApp answer clears them (aiConnectRevoked / aiConnectOrphan).

			const scan = p.apiListening ? await this.scanned() : this.scan;
			const homes = p.apiListening ? await resolveHomes(this.env) : null;
			const items = (scan && homes) ? this.retarget(scan.items, homes) : (scan?.items || []);

			/** The access data of the record's key, from a successful ListApps */
			const refresh = (rec: AiRecord): void => {
				const key = byHash.get(rec.appHash);

				if (key?.present) {
					if (key.grant) {
						rec.grant = key.grant;
					};
					if (key.expireAt !== undefined) {
						rec.expireAt = key.expireAt;
					};
				};
			};

			for (const original of this.reg.list(p.accountId)) {
				let rec: AiRecord = { ...original };
				const last = this.statuses.get(this.statusKey(rec.accountId, rec.id));

				// T3: set up by the other build flavour — its item is in a store this forwarder can't read, so nothing is
				// read, settled, healed, retired or rewritten. Only a record this build's Forget finished goes
				if (this.otherBuild(rec)) {
					if (rec.removed && !rec.revokePending.length) {
						this.reg.remove(rec.accountId, rec.id);
						this.statuses.delete(this.statusKey(rec.accountId, rec.id));
					} else {
						this.setStatus(rec, rec.removed ? this.defaultStatus(rec) : 'conflict');
					};
					continue;
				};

				if (keys !== null) {
					refresh(rec);

					// Q1: the key list never retires a candidate (heart skips grant files it can't read). Only
					// settleUnconfirmed does, after reading the candidate's own target
				};

				// Gone only when every revoke was confirmed
				if (rec.removed && !rec.revokePending.length) {
					this.reg.remove(rec.accountId, rec.id);
					this.statuses.delete(this.statusKey(rec.accountId, rec.id));
					continue;
				};

				let status: AiStatus;
				let waiting = false;
				const adapter = adapterFor(rec.appId);
				const live = { stillLive: () => this.liveApi(p.port) };
				const ctx = (p.apiListening && scan) ? this.ctx(homes, items, { appId: rec.appId, accountId: rec.accountId, port: p.port, tier: rec.tier, route: rec.route }, { targetId: rec.id, ...live }) : null;
				/** What a check of the record's own target says, written onto the record */
				const take = (res: CheckOutcome): void => {
					if ((status == 'removed') && !rec.removedReported) {
						rec.removedReported = true;
						removed.push(rec.id);
					} else
					if (((status == 'ok') || (status == 'pending')) && rec.removedReported) {
						delete rec.removedReported;
					};
					if (res.healed) {
						healed.push(rec.id);
						// The entry now points at this port
						rec.port = p.port;
					};
					if (res.nextStep) {
						rec.nextStep = res.nextStep;
					};
					if (res.observedInstalled) {
						rec.observedInstalled = true;
					};
					if (res.bothRoutes) {
						this.bothRoutes.add(this.statusKey(rec.accountId, rec.id));
					};
					// Claude's extension: "Connected" is heart's isActive for this key, latched to Claude's install identity
					if (isBundle(rec) && res.install && (status == 'pending')) {
						status = this.latch(rec, res.install, byHash.get(rec.appHash)?.active);
					};
				};

				// Unconfirmed deliveries first, each against its own target (whatever the record's mapping is today,
				// and before a manual record's status: a CLI delivery may have replaced it)
				if (ctx && adapter && !rec.removed && rec.unconfirmed?.length) {
					rec = await this.settleUnconfirmed(ctx, adapter, rec);
					if (keys !== null) {
						refresh(rec);
					};
					// A CLI may still be writing: nothing is judged (or healed) until it shows, unless the record's own key is in place
					waiting = !!rec.unconfirmed?.some(c => this.stillRunning(c)) && !rec.removed && ((await adapter.installedFp?.(ctx, rec)) !== rec.keyFp);
				};

				this.bundleStates.delete(this.statusKey(rec.accountId, rec.id));
				this.bothRoutes.delete(this.statusKey(rec.accountId, rec.id));

				if (rec.removed) {
					status = rec.revokePending.length ? 'revokeFailed' : 'removed';
				} else
				if (isBundle(rec) && !rec.appHash) {
					// Retired for a Reconnect that hasn't delivered its new key: nothing to check
					status = 'disconnected';
				} else
				if (waiting) {
					status = 'pending';
				} else
				if (rec.method == 'manual') {
					// A failed lookup proves nothing: the last status stands
					status = absent(rec.appHash) ? 'accessEnded' : ((keys === null) ? (last || 'ok') : 'ok');

					// Claude set up by hand is one of Claude's two routes: with the extension there as well, the user removes one
					if ((rec.appId == 'claude-desktop') && (status == 'ok')) {
						const routes = claudeRoutes(this.env);

						if (routes.config && routes.extension) {
							status = 'conflict';
							this.bothRoutes.add(this.statusKey(rec.accountId, rec.id));
						};
					};
				} else
				if (absent(rec.appHash) && !rec.unconfirmed?.length) {
					status = 'accessEnded';
				} else
				if ((keys === null) && (last == 'accessEnded')) {
					// Known revoked, and the lookup failed: still ended, and nothing is healed with that key
					status = 'accessEnded';
				} else
				// The API's state now, inside the queue and after every await above: another window may have
				// disabled it or moved its port meanwhile (A1)
				if (!p.apiListening || !scan || !this.liveApi(p.port)) {
					status = last || this.defaultStatus(rec);
				} else {
					const sameId = items.filter(d => d.targetId == rec.id);
					const mapped = sameId.filter(d => !rec.targetPath || d.targetPaths.includes(rec.targetPath));

					if (!adapter || (!sameId.some(d => d.installed) && scan.scanOk)) {
						status = 'notInstalled';
					} else
					if (scan.scanOk && !mapped.some(d => d.installed)) {
						// The app is there but reads another file now (its home moved): needs attention, nothing is written
						status = 'reconnect';
					} else {
						// An incomplete scan can't say "not installed": the target itself is checked
						const res = await adapter.check(ctx, rec);

						status = this.liveApi(p.port) ? res.status : (last || this.defaultStatus(rec));
						// One report per absence: the first check that finds the entry gone (kept across restarts on the
						// record), again only after our entry was seen back
						take(res);
					};
				};

				// Compared with the record as it is on disk now: a heal's journal may have saved its intent meanwhile
				if (JSON.stringify(rec) != JSON.stringify(this.reg.get(rec.accountId, rec.id) || original)) {
					this.reg.upsert(rec);
				};
				this.setStatus(rec, status);
			};

			return { ok: true, connections: this.records(p.accountId).map(it => this.view(it)), healed, removed };
		});
	};

	/**
	 * The confirmation latch of Claude's extension (§3.3), on `rec` in place; returns the row's status.
	 * - `confirmed` is dropped when the install identity (the extension's `version` + `installedAt`) or the key
	 *   changes; a dropped one leaves `reconfirm` ("Updated in Claude · key not reconfirmed").
	 * - `armed`: heart said "not active" for this key under this identity. A key that was never confirmed carries
	 *   it over to a new identity (a new key starts not active, so a fresh connect or Reconnect confirms on first use).
	 * - `isActive` true while armed → `confirmed`, and the key this record copied leaves the clipboard.
	 * `active` is undefined when the key lookup failed: nothing is learned.
	 */
	private latch (rec: AiRecord, install: { state: 'finish' | 'off' | 'on' | 'unknown'; version: string; installedAt: string }, active: boolean | undefined): AiStatus {
		const key = this.statusKey(rec.accountId, rec.id);

		if (install.state == 'finish') {
			this.bundleStates.set(key, 'finish');
			return 'pending';
		};
		// Claude's switch can't be read: nothing is learned or confirmed, the latch is kept, the row is not "Connected"
		if (install.state == 'unknown') {
			this.bundleStates.set(key, 'off');
			return 'pending';
		};

		const hash = rec.appHash;
		const same = (l?: { appHash: string; version: string; installedAt: string }): boolean => !!l && (l.appHash == hash) && (l.version == install.version) && (l.installedAt == install.installedAt);

		if (rec.confirmed && !same(rec.confirmed)) {
			if (rec.confirmed.appHash == hash) {
				rec.reconfirm = true;
			};
			delete rec.confirmed;
		};
		if (rec.armed && !same(rec.armed)) {
			const carried = (rec.armed.appHash == hash) && !rec.reconfirm;

			delete rec.armed;
			if (carried) {
				rec.armed = { appHash: hash, version: install.version, installedAt: install.installedAt };
			};
		};
		if (active === false) {
			rec.armed = { appHash: hash, version: install.version, installedAt: install.installedAt };
		} else
		if ((active === true) && same(rec.armed) && !same(rec.confirmed)) {
			rec.confirmed = { appHash: hash, version: install.version, installedAt: install.installedAt };
			delete rec.reconfirm;
			this.clipboard.clear(this.env, o => (o.accountId == rec.accountId) && ((o.connectionId == rec.id) || (o.appHash == hash)));
		};

		if (install.state == 'off') {
			this.bundleStates.set(key, 'off');
			return 'pending';
		};
		if (same(rec.confirmed)) {
			return 'ok';
		};
		this.bundleStates.set(key, rec.reconfirm ? 'updated' : 'notConfirmed');
		return 'pending';
	};

	/**
	 * Unconfirmed CLI deliveries: each candidate's own target is read (the route and file its CLI wrote,
	 * not the record's, whatever resolves today). The one installed becomes the record's key, with that
	 * target and its own access data (the record's old hash and every other candidate are retired; a
	 * previous route left behind becomes `prior`). Not installed: a candidate whose CLI may still be running
	 * stays (an absent entry proves nothing yet); a finished one is retired — but never the confirmed key a
	 * same-key redelivery carried. A record that existed only for its candidates is `removed` once none is
	 * left. Any target unreadable → decided later.
	 */
	private async settleUnconfirmed (ctx: Ctx, adapter: Adapter, rec: AiRecord): Promise<AiRecord> {
		const list = rec.unconfirmed || [];

		if (!list.length || !adapter.installedFp) {
			return rec;
		};

		const fps: (string | null)[] = [];

		for (const c of list) {
			const fp = await adapter.installedFp(ctx, { ...rec, route: c.route, method: c.method, targetPath: c.targetPath, ...(c.configPath ? { configPath: c.configPath } : {}) });

			if (fp === 'unreadable') {
				return rec;
			};
			fps.push(fp);
		};

		const winner = list.find((c, i) => fps[i] == c.keyFp) || null;
		// The record was created for these deliveries: no confirmed key of its own to keep
		const only = list.some(c => c.created);
		const retire = (c: AiCandidate): boolean => only || (c.appHash != rec.appHash);
		const next: AiRecord = { ...rec };

		delete next.unconfirmed;

		if (!winner) {
			const waiting = list.filter(c => this.stillRunning(c));

			next.revokePending = union(rec.revokePending, list.filter(c => !this.stillRunning(c) && retire(c)).map(c => c.appHash));
			if (waiting.length) {
				next.unconfirmed = waiting;
			} else
			if (only) {
				next.removed = true;
			};
			return next;
		};

		// A loser whose CLI may still be running isn't decided yet: it stays unconfirmed, its key alive, until its own target settles it
		// (T1: kept without `created` — the record is the winner's now)
		const still = list.filter(c => (c !== winner) && this.stillRunning(c)).map(c => ({ ...c, created: false }));

		next.revokePending = union(rec.revokePending, list.filter(c => (c !== winner) && !this.stillRunning(c) && retire(c)).map(c => c.appHash), [ rec.appHash ]).filter(h => (h != winner.appHash) && !still.some(c => c.appHash == h));
		if (still.length) {
			next.unconfirmed = still;
		};
		next.appHash = winner.appHash;
		next.keyFp = winner.keyFp;
		next.route = winner.route;
		next.method = winner.method;
		next.targetPath = winner.targetPath;
		next.tier = winner.tier;
		next.recommendedTier = winner.recommendedTier;
		next.port = winner.port;
		next.nextStep = winner.nextStep;
		next.name = winner.name;
		next.grant = winner.grant;
		next.expireAt = winner.expireAt;
		next.lastProbe = 'none';
		next.observedInstalled = true;
		// Q15: the config entry that delivery wrote is the record's now
		if (winner.entryDigest) {
			next.entryDigest = winner.entryDigest;
		};
		if (winner.configPath) {
			next.configPath = winner.configPath;
		};

		// A manual record left nothing of Anytype's behind: no `prior` for it
		if (!only && (rec.method != 'manual') && adapter.separateRoutes && ((rec.route != winner.route) || (rec.targetPath != winner.targetPath))) {
			next.prior = { route: rec.route, targetPath: rec.targetPath, keyFp: rec.keyFp };
		};
		return next;
	};

	/** Probes a key; see Phase 1 notes: record-bound, network outside the queue */
	async probe (param: any): Promise<AiProbeResult> {
		const invalid: AiProbeResult = { ok: false, category: 'unknown' };

		// Bound to the session it arrived in: a logout stops it before its next request and aborts the one in flight (D1S-20)
		const session = this.session;
		const sendable = (port: number): boolean => (session == this.session) && !this.closing && this.sendable(port);

		return this.call<AiProbeResult>('aiConnectProbe', param, invalid, async p => {
			// Nothing is sent unless main itself sees the API listening on that port now (§3.2), asked again before every request
			if (!sendable(p.port)) {
				return { ok: false, category: 'apiOff' };
			};

			const fp = keyFingerprint(p.key);
			let bound: { appHash: string; keyFp: string } | null = null;

			if (p.connectionId) {
				const rec = await this.enqueue(() => this.record(p.accountId, p.connectionId));

				if (!rec) {
					return invalid;
				};
				if ((rec.method != 'manual') && (rec.keyFp != fp)) {
					return { ok: false, category: 'stale' };
				};
				bound = { appHash: rec.appHash, keyFp: rec.keyFp };
			};

			if (!sendable(p.port)) {
				return { ok: false, category: 'apiOff' };
			};

			const abort = new AbortController();

			this.probes.add(abort);

			let result: AiProbeResult;

			try {
				result = await probe({ port: p.port, tier: p.tier, route: p.route, key: p.key }, { version: this.setup?.version, gate: () => sendable(p.port), signal: abort.signal });
			} finally {
				this.probes.delete(abort);
			};

			if (bound) {
				await this.enqueue(() => {
					const lastProbe = ('category' in result) ? result.category : 'ok';
					const k = this.unsavedKey(this.setup.registryFile, p.accountId, p.connectionId);
					const kept = this.unsaved.get(k);

					// Still waiting for its save: the result goes with it
					if (kept && (kept.rec.appHash == bound.appHash) && (kept.rec.keyFp == bound.keyFp)) {
						this.unsaved.set(k, { ...kept, rec: { ...kept.rec, lastProbe } });
						return;
					};

					const rec = this.reg.get(p.accountId, p.connectionId);

					if (rec && (rec.appHash == bound.appHash) && (rec.keyFp == bound.keyFp)) {
						this.reg.patch(p.accountId, p.connectionId, { lastProbe });
					};
				});
			};

			return result;
		}, false);
	};

	stepDone (param: any): Promise<AiStepDoneResult> {
		return this.call<AiStepDoneResult>('aiConnectStepDone', param, FAIL, p => {
			const next = this.reg.patch(p.accountId, p.connectionId, { nextStep: 'none' });
			return next ? { ok: true, connection: this.view(next) } : FAIL;
		});
	};

	/** Only after the user clicked; one graceful quit per process, never forced */
	restartApp (param: any): Promise<AiRestartResult> {
		return this.call<AiRestartResult>('aiConnectRestartApp', param, FAIL, async p => {
			const scan = await this.scanned();
			const det = this.detectionOf(scan.items, p.appId);

			if (!det.canRestart) {
				return { ok: false, error: { stage: 'restart', category: 'unsupportedPackage' } };
			};

			const res = await restart(this.env, det, this.signalled);
			return ('error' in res) ? { ok: false, error: res.error } : { ok: true };
		});
	};

	/**
	 * A path Reveal may show: local and absolute (never UNC or a device path, checked before any file-system
	 * call), canonical and inside home; its directory when the file itself is missing. '' otherwise.
	 */
	private revealable (file: string): string {
		if (!file || !isLocalAbsolute(this.env, file)) {
			return '';
		};

		const target = resolveTarget(this.env, file);

		if ('error' in target) {
			return '';
		};
		if (target.exists) {
			return target.real;
		};

		const dir = pathOf(this.env).dirname(target.real);
		return this.env.exists(dir) ? dir : '';
	};

	/** Shows a file in Finder / Explorer: a record's target, or a card's bundle / target before any record exists */
	reveal (param: any): Promise<AiRevealResult> {
		return this.call<AiRevealResult>('aiConnectReveal', param, { ok: false }, async p => {
			let file = '';

			if (p.connectionId) {
				file = this.revealable(this.record(p.accountId, p.connectionId)?.targetPath || '');
			} else
			if (p.what == 'bundle') {
				const copy = copyPath(this.env);
				const own = bundlePath(this.env);

				// The copy in Anytype's folder; before there is one, the app's own bundle (its location comes from the app, never from stored data)
				file = (copy && this.env.exists(copy)) ? this.revealable(copy) : ((isLocalAbsolute(this.env, own) && this.env.exists(own)) ? own : '');
			} else {
				file = this.revealable(this.detectionOf((await this.scanned()).items, p.appId).targetPaths[0] || '');
			};

			if (!file) {
				return { ok: false };
			};
			this.env.showItemInFolder(file);
			return { ok: true };
		});
	};

	/** Opens a detected app (macOS by its bundle, Windows by its exe) */
	openApp (param: any): Promise<AiOpenAppResult> {
		return this.call<AiOpenAppResult>('aiConnectOpenApp', param, { ok: false }, async p => {
			const det = this.detectionOf((await this.scanned()).items, p.appId);

			// Claude's "Open again": the bundle copy, opened in Claude (an update when the extension is outdated, never a new key)
			if (p.bundle) {
				return { ok: await openBundleAgain(this.env, det) };
			};

			if ((this.env.platform == 'darwin') && det.appPath) {
				return { ok: (await this.env.run('/usr/bin/open', [ '-a', det.appPath ], { timeout: 10000 })).code == 0 };
			};
			if ((this.env.platform == 'win32') && det.exePath) {
				return { ok: await this.env.launch(det.exePath, []) };
			};
			return { ok: false };
		});
	};

	/** A key whose release failed is remembered (`done` absent) until its revoke succeeds (`done: true`) */
	orphan (param: any): Promise<AiOrphanResult> {
		return this.call<AiOrphanResult>('aiConnectOrphan', param, FAIL, async p => {
			if (p.done) {
				this.reg.removeOrphan(p.accountId, p.hash);
			} else
			if (p.intentId && (!this.recoverable(p.accountId, p.hash, p.intentId) || !p.key || (await this.installedSomewhere(p.accountId, p.hash, p.key)))) {
				return { ok: false, error: { stage: 'validate', category: 'stale' } };
			} else {
				this.reg.addOrphan(p.accountId, p.hash);
			};
			return { ok: true };
		});
	};

	/**
	 * S3: intent recovery matched `hash` by name and time against a record list the renderer read several calls
	 * ago. Main decides again, here on its one queue, with what it knows now — never a key that a record or a
	 * candidate owns, and never while a mint of this run for the same name may still be in flight (heart may have
	 * made that key already, its CreateApp answer or its delivery still on the way). A refused intent is kept by
	 * the renderer, and the next check decides again
	 */
	private recoverable (accountId: string, hash: string, intentId: string): boolean {
		const intents = this.reg.listIntents(accountId);
		const intent = intents.find(it => it.id == intentId);

		if (!intent || this.liveIntents.has(intentId)) {
			return false;
		};
		if (intents.some(it => this.liveIntents.has(it.id) && (it.name === intent.name))) {
			return false;
		};
		return !this.records(accountId).some(rec => (rec.appHash == hash) || (rec.unconfirmed || []).some(c => c.appHash == hash));
	};

	claimNudge (param: any): Promise<AiClaimNudgeResult> {
		// An account with any connection (made in another window meanwhile) needs no nudge: refused, the claim kept (Z9)
		return this.call<AiClaimNudgeResult>('aiConnectClaimNudge', param, { claimed: false }, p => (this.records(p.accountId).length ? { claimed: false } : { claimed: this.reg.claimNudge() }));
	};

	bundleInfo (param: any): Promise<AiBundleInfoResult> {
		// null: no bundle Claude could install (none in this build, or damaged); Manage offers the extension only otherwise (R8)
		return this.call<AiBundleInfoResult>('aiConnectBundleInfo', param, null, () => {
			const info = bundleInfo(this.env);
			return bundleUsable(info) ? { signed: info.signed } : null;
		}, false);
	};

};

/** Outgoing links main may open: only LM Studio's key-bearing scheme (never https) */
export const externalAllowed = (url: any): boolean => /^lmstudio:\/\//i.test(String(url || ''));

/** The Electron-backed pieces of the real Env */
const createElectronEnv = (): Env => {
	const vars = { ...process.env } as Record<string, string>;

	return createNodeEnv({
		// The build's metadata lives inside app.asar (electron/json), next to electron.js; never in the unpacked folder
		buildMeta: () => {
			try {
				return fs.readFileSync(path.join(app.getAppPath(), 'electron', 'json', 'aiConnect.build.json'), 'utf8');
			} catch (e) {
				return null;
			};
		},
		home: (process.platform == 'darwin') ? os.userInfo().homedir : os.homedir(),
		appRoot: fixPathForAsarUnpack(__dirname),
		vars,
		openExternal: async url => {
			if (!externalAllowed(url)) {
				return false;
			};

			try {
				await shell.openExternal(url);
				return true;
			} catch (e) {
				return false;
			};
		},
		protocolHandler: async scheme => {
			try {
				const info = await app.getApplicationInfoForProtocol(`${scheme}://`);
				return info ? { name: info.name, path: info.path } : null;
			} catch (e) {
				return null;
			};
		},
		showItemInFolder: p => shell.showItemInFolder(p),
		clipboardRead: () => clipboard.readText(),
		clipboardWrite: text => clipboard.writeText(text),
	});
};

/** The Local API listens on `port` right now, as the renderer's shared settings say (read on every call) */
export const storedLiveApi = (port: number): boolean => {
	const store = getSafeStorage();

	return liveApiListening(port, store.get('localApi'), store.get('localApiBind'));
};

export const aiConnect = new AiConnectService(() => ({
	env: createElectronEnv(),
	liveApi: storedLiveApi,
	apiState: () => {
		const store = getSafeStorage();
		return { localApi: store.get('localApi'), bind: store.get('localApiBind') };
	},
	registryFile: path.join(app.getPath('userData'), 'aiConnect.json'),
	version: app.getVersion(),
	icon: async appPath => {
		const image = await app.getFileIcon(appPath, { size: 'normal' });
		return image.isEmpty() ? null : image.toDataURL();
	},
}));
