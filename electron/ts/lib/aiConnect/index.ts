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
 * - Connections whose key is in the forwarder's item (Claude Desktop, Other app's Command; anytype-mcp-plan §2.9):
 *   every item change is saved first. `key set`: the new key as a candidate (`unconfirmed`) before the verb, so
 *   a lost receipt is settled by `key check` (the item's fingerprint decides which key lives). `key retarget`:
 *   the intended port, tier and revision; nothing is ever revoked for it. `key delete`: the record is marked
 *   removed with every hash in `revokePending` before the verb runs.
 * - A queued revocation leaves `revokePending` (or the orphans) only through `aiConnectRevoked` /
 *   `aiConnectOrphan { done }`, which the renderer calls after RevokeApp answered success or "not found". A key
 *   list that lacks the hash proves nothing and prunes nothing.
 * - A mint intent (account, key name, time) is saved before the renderer calls CreateApp and cleared when the
 *   key is delivered or released. One left by an earlier run is handed to the renderer (`mintIntents`), which
 *   finds that key and queues it as an orphan — through `aiConnectOrphan { intentId }`, which main refuses for a
 *   hash a record or candidate owns, or while a mint of this run for the same name is unresolved (S3).
 * - `method: 'command'` records (Other app) are routed by their own id, before any app detection.
 * - Apply and update resolve the config homes afresh; apply refuses (`changed`) when the previewed target
 *   (`previewTarget`, or the Replace's file) is no longer one of the card's targets, update when the
 *   record's target no longer is (Disconnect still works on a stored old location).
 */
import { app, shell } from 'electron';
import { fixPathForAsarUnpack } from 'electron-util';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type {
	AiApplyResult, AiBundleInfoResult, AiCheckResult, AiClaimNudgeResult, AiConnection, AiFail, AiListResult, AiMintIntentResult, AiOpenAppResult, AiOrphanResult,
	AiCandidate, AiPlanResult, AiProbeResult, AiRecord, AiRecordManualResult, AiRemoveResult, AiRestartResult, AiRevealResult, AiRevokedResult, AiStatus,
	AiStepDoneResult, AiTargetId, AiUpdateResult, Adapter, CheckOutcome, Ctx, Detected, Env, Homes,
} from './types';
import { liveApiListening, validateParam, VALIDATION_ERROR } from './validate';
import { getSafeStorage } from '../../safeStorage';
import { Registry } from './registry';
import { detectAll, resolveHomes, targetFor, toDetection } from './detect';
import { probe } from './probe';
import { BUNDLE_NAME, bundleDir, bundleInfo, bundlePath } from './bundle';
import { createNodeEnv } from './exec';
import { isLocalAbsolute, pathOf, resolveTarget } from './fsSafe';
import { keyFingerprint } from './digest';
import { deleteItem } from './item';
import { keyStoreConfig } from './keyStore';
import { buildMeta } from './forwarder';
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
const MUTATING = [ 'aiConnectApply', 'aiConnectRecordManual', 'aiConnectUpdate', 'aiConnectRemove', 'aiConnectRevoked', 'aiConnectCheck', 'aiConnectStepDone', 'aiConnectOrphan', 'aiConnectMintIntent' ];

/** Other app's Command setup: a managed connection with its own id and no detected app */
const isCommand = (rec: AiRecord | null): boolean => rec?.method == 'command';

/** For a call that concerns no detected app (a Command connection): no CLI, no config home */
const NO_HOMES = { shellOk: true, cli: {}, cliShim: {}, path: '', overrides: {}, rejected: [], codexHome: '', copilotHome: '', claudeHome: '', claudeConfigDir: '' } as unknown as Homes;

/** The record's key is in the forwarder's item (connection id = record id) */
const holdsItem = (rec: AiRecord): boolean => isCommand(rec) || ((rec.appId == 'claude-desktop') && (rec.method != 'manual'));

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
	private unsaved = new Map<string, { rec: AiRecord; file: string }>();
	/** Mint intents saved by this run: their flows may still be going on, so they are never reported as left over */
	private liveIntents = new Set<string>();

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
		});
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
		for (const [ k, { rec, file } ] of [ ...this.unsaved ]) {
			try {
				(file == this.setup.registryFile) ? this.reg.upsert(rec) : new Registry(this.setup.env, file).upsert(rec);
				this.unsaved.delete(k);
			} catch (e) {
				this.log('aiConnectSave', e);
			};
		};
	};

	/**
	 * Saves the record of a delivery that already committed: retried once, else kept in memory (listed, and
	 * saved again before every later call). False when it isn't on disk yet.
	 */
	private saveCommitted (rec: AiRecord): boolean {
		const file = this.setup.registryFile;
		const k = this.unsavedKey(file, rec.accountId, rec.id);

		for (let attempt = 0; attempt < 2; attempt++) {
			try {
				this.reg.upsert(rec);
				this.unsaved.delete(k);
				return true;
			} catch (e) {
				this.log('aiConnectSave', e);
			};
		};
		this.unsaved.set(k, { rec, file });
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
		return (rec.method == 'manual') ? 'ok' : 'pending';
	};

	private setStatus (rec: AiRecord, status: AiStatus): void {
		this.statuses.set(this.statusKey(rec.accountId, rec.id), status);
	};

	private view (rec: AiRecord): AiConnection {
		return {
			...rec,
			status: this.statuses.get(this.statusKey(rec.accountId, rec.id)) || this.defaultStatus(rec),
			displayTarget: displayPath(this.env, rec.targetPath),
		};
	};

	private async rescan (force: boolean): Promise<{ scanOk: boolean; items: Detected[] }> {
		const createdDirs = this.reg.all().flatMap(it => it.createdDirs || []);
		const res = await detectAll(this.env, { createdDirs, force });
		const items = res.items.map(det => ({ ...det, canRestart: !!adapterFor(det.appId)?.canRestart(this.env, det) }));

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
				mintIntents: this.reg.listIntents(p.accountId).filter(it => !this.liveIntents.has(it.id)).map(it => ({ id: it.id, name: it.name, time: it.time })),
			};
		});
	};

	/** Saved before the renderer calls CreateApp (`name`, `time`); `id` + `done` clears it (the key was released) */
	mintIntent (param: any): Promise<AiMintIntentResult> {
		return this.call<AiMintIntentResult>('aiConnectMintIntent', param, FAIL, p => {
			if (p.done) {
				this.dropIntent(p.accountId, p.id);
				return { ok: true, id: p.id };
			};

			const id = crypto.randomBytes(8).toString('hex');

			this.reg.addIntent({ id, accountId: p.accountId, name: p.name, time: p.time });
			this.liveIntents.add(id);
			return { ok: true, id };
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

	/** The namespace of the forwarder this build ships (`items` or `items-dev`); null: the build has none */
	private namespace (): AiRecord['ns'] | null {
		return buildMeta(this.env)?.forwarder?.namespace || null;
	};

	/**
	 * T3: the record's key is in the item store of the other build flavour (release `items` vs development
	 * `items-dev`), which this build's forwarder can't read. Nothing of it is judged, settled, retired or
	 * rewritten here: "no item" in this build's store says nothing about it
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

			const ctx = isCommand(rec)
				? this.itemCtx(rec, rec.port)
				: this.ctx(homes, items, { appId: rec.appId, accountId: rec.accountId, port: rec.port, tier: rec.tier, route: rec.route }, { targetId: rec.id });
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

	/** A context for a record that needs no detected app (Other app's Command) */
	private itemCtx (rec: AiRecord, port: number, extra: Partial<Ctx> = {}): Ctx {
		return this.ctx(NO_HOMES, [], { appId: rec.appId, accountId: rec.accountId, port, tier: rec.tier, route: rec.route }, { targetId: rec.id, ...extra });
	};

	/** Saves the intent of a `key retarget` on the record before the verb runs (§2.9) */
	private retargetJournal (rec: AiRecord): Ctx['journal'] {
		return {
			set: () => false,
			retarget: intent => {
				try {
					// S6: the writer may commit until its deadline, whatever happened to Anytype meanwhile
					this.reg.patch(rec.accountId, rec.id, { retarget: { ...intent, until: this.env.now() + keyStoreConfig.timeout + 5000 } });
					return true;
				} catch (e) {
					this.log('aiConnectSave', e);
					return false;
				};
			},
		};
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
			if ((p.method == 'command') && ((p.appId != 'other') || (rec && !isCommand(rec)))) {
				return FAIL;
			};

			const ctx = this.ctx(homes, items, p, { targetId: det.targetId || rec?.id, method: p.method });
			const plan = await adapter.plan(ctx, det, (rec && !rec.removed) ? rec : null);

			return { ok: true, ...plan };
		});
	};

	apply (param: any): Promise<AiApplyResult> {
		return this.call<AiApplyResult>('aiConnectApply', param, FAIL, async p => {
			// Other app's Command: its own id (allocated once, here), no detected target, so no app is looked for
			const command = (p.method == 'command');
			const scan = command ? null : await this.scanned();
			// Fresh, never the cached answer: the key goes exactly where the card points now
			const homes = command ? NO_HOMES : await resolveHomes(this.env, { force: true });
			const items = command ? [] : this.retarget(scan.items, homes);
			const det = this.detectionOf(items, p.appId);
			const adapter = adapterFor(p.appId);

			if (!adapter || (command ? (p.appId != 'other') : (!det.targetId || !!p.connectionId))) {
				return FAIL;
			};

			const rec = command ? (p.connectionId ? this.record(p.accountId, p.connectionId) : null) : this.recordFor(p.accountId, det);

			if (command && p.connectionId && !isCommand(rec)) {
				return FAIL;
			};

			const targetId: AiTargetId = command ? (rec?.id || `other-${crypto.randomBytes(4).toString('hex')}`) : det.targetId;

			// The location the user saw (or agreed to replace) moved since the preview: a fresh preview first
			if (!command && (((p.previewTarget !== undefined) && !this.isTarget(det, p.previewTarget)) || (p.replace && !this.isTarget(det, p.replace.targetPath)))) {
				return CHANGED;
			};
			if (!this.previewIsWritten(adapter, det, p)) {
				return CHANGED;
			};
			if (((rec?.appHash ?? null) !== p.expectedHash) || rec?.removed) {
				return STALE;
			};
			// T3: its key lives in the other build flavour's item store — nothing is delivered over it from here
			if (this.otherBuild(rec)) {
				return { ok: false, error: { stage: 'validate', category: 'conflict' } };
			};

			const fp = keyFingerprint(p.key);
			/** The candidate a delivery of this key leaves while its outcome isn't known */
			type Delivered = {
				method: AiRecord['method']; route?: AiRecord['route']; targetPath: string; nextStep: AiRecord['nextStep'];
				configEntry?: AiRecord['configEntry']; entryDigest?: string; configPath?: string;
			};
			/** `until`: a key verb has ended by then whatever happened to Anytype meanwhile (heart bounds every verb, Q3) */
			const candidateOf = (it: Delivered, running: boolean, until?: number): AiCandidate => ({
				appHash: p.appHash, keyFp: fp, route: it.route || p.route, method: it.method, targetPath: it.targetPath, tier: p.tier, recommendedTier: p.recommendedTier,
				port: p.port, nextStep: it.nextStep, name: p.name, grant: p.grant, expireAt: p.expireAt, created: !rec, running,
				...((running && until) ? { until } : {}),
				// Q15: a config-route delivery carries the entry it wrote
				...(it.configEntry ? { configEntry: it.configEntry } : {}), ...(it.entryDigest ? { entryDigest: it.entryDigest } : {}), ...(it.configPath ? { configPath: it.configPath } : {}),
			});
			/** What `journal.set` saved for this delivery, before the verb ran */
			let journaledIntent: Delivered | null = null;
			const withCandidate = (given: Delivered, running: boolean, until?: number): AiRecord => {
				// S7: the candidate keeps the config entry it journaled, whatever the verb's outcome carries — a lost
				// receipt must not cost the record its ownership of the entry
				const it: Delivered = {
					...given,
					...((!given.configEntry && journaledIntent?.configEntry) ? { configEntry: journaledIntent.configEntry } : {}),
					...((!given.entryDigest && journaledIntent?.entryDigest) ? { entryDigest: journaledIntent.entryDigest } : {}),
					...((!given.configPath && journaledIntent?.configPath) ? { configPath: journaledIntent.configPath } : {}),
				};
				const { configEntry: _e, entryDigest: _d, configPath: _p, ...plain } = it;
				const base: AiRecord = rec || { ...this.freshRecord(targetId, p, { ok: true, observedInstalled: false, createdDirs: [], ...plain }, fp, null), observedInstalled: false };
				return { ...base, unconfirmed: [ ...(base.unconfirmed || []).filter(c => c.appHash != p.appHash), candidateOf(it, running, until) ] };
			};
			const verbDeadline = (): number => this.env.now() + keyStoreConfig.timeout + 5000;
			// §2.9: the new key is saved as a candidate before `key set` runs
			let journaled = false;
			const journal: Ctx['journal'] = {
				set: intent => {
					try {
						// Q3: in flight until the verb's deadline — a restarted Anytype must not retire it while the helper may still write
						this.reg.upsert(withCandidate(intent, true, verbDeadline()));
						journaled = true;
						journaledIntent = intent;
						return true;
					} catch (e) {
						this.log('aiConnectSave', e);
						return false;
					};
				},
				retarget: () => false,
			};
			const ctx = this.ctx(homes, items, p, {
				targetId, key: p.key, method: p.method, manual: !!p.manual, allowQuit: !!p.allowQuit, quitConfirmed: !!p.quitConfirmed, replace: p.replace,
				previewTarget: p.previewTarget, journal,
			});
			const out = await adapter.apply(ctx, det, rec);

			if (('needs' in out) || ('error' in out)) {
				// Nothing was written to the item: the candidate goes (a save that fails leaves it for the next check, which retires it)
				if (journaled) {
					try {
						rec ? this.reg.upsert(rec) : this.reg.remove(p.accountId, targetId);
					} catch (e) {
						this.log('aiConnectSave', e);
					};
				};
			};
			if ('needs' in out) {
				return out.openFailed ? { ok: false, needs: out.needs, openFailed: true } : { ok: false, needs: out.needs };
			};
			if ('error' in out) {
				return { ok: false, error: out.error };
			};


			if (out.unconfirmed) {
				// Maybe delivered: the record stays as it is (or a pending one is created) with one more candidate; the next check decides
				// A key verb that was stopped without a confirmed end may still write until its deadline (Q2, Q3)
				const kept = withCandidate(out, !!out.running, (journaled && out.running) ? verbDeadline() : undefined);

				// Q6: the intent goes only once the record that holds the key is on disk
				if (this.saveCommitted(kept)) {
					this.dropIntent(p.accountId, p.intentId);
				};
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

			const saved = this.saveCommitted(fresh);

			if (saved) {
				this.dropIntent(p.accountId, p.intentId);
			};
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

		// A keyless config entry stays known after a switch to another method (disconnect still removes it)
		const configEntry = out.configEntry || rec?.configEntry;
		const entryDigest = out.entryDigest || rec?.entryDigest;

		const configPath = out.configPath || rec?.configPath;
		// T1: the record has a confirmed key of its own from here on — a candidate carried over is no longer the
		// reason it exists, so its expiry retires only its own hash, never the record
		const running = (rec?.unconfirmed || []).filter(c => this.stillRunning(c) && (c.appHash != p.appHash)).map(c => ({ ...c, created: false }));

		if (configEntry) {
			fresh.configEntry = configEntry;
		};
		if (configPath) {
			fresh.configPath = configPath;
		};
		if (running.length) {
			fresh.unconfirmed = running;
		};
		if (entryDigest) {
			fresh.entryDigest = entryDigest;
		};
		if (out.itemRev) {
			fresh.itemRev = out.itemRev;
		};
		if (rec?.prior && !((rec.prior.route == fresh.route) && (rec.prior.targetPath == fresh.targetPath))) {
			fresh.prior = rec.prior;
		};
		// T3: an item-backed record names the store (build flavour) its key is in
		if (holdsItem(fresh) && this.namespace()) {
			fresh.ns = this.namespace();
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

			// A Command connection is reconnected as one (aiConnectApply): its item would be left behind here
			if (p.connectionId && (!rec || isCommand(rec))) {
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
			};

			// The user already put this key into the app ("I've updated"): committed even when the save fails
			const saved = this.saveCommitted(next);

			if (saved) {
				this.dropIntent(p.accountId, p.intentId);
			};
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

			let ctx: Ctx;

			if (isCommand(rec)) {
				// By its own id: no app, no file of another app
				ctx = this.itemCtx({ ...rec, tier: p.tier || rec.tier }, p.port, { journal: this.retargetJournal(rec) });
			} else {
				const scan = await this.scanned();
				const homes = await resolveHomes(this.env, { force: true });
				const items = this.retarget(scan.items, homes);

				// Only where an app reads it now (a moved home: reconnect; Disconnect still cleans the stored place)
				if (!items.some(d => (d.targetId == rec.id) && this.isTarget(d, rec.targetPath))) {
					return CHANGED;
				};
				ctx = this.ctx(homes, items, { appId: rec.appId, accountId: rec.accountId, port: p.port, tier: p.tier || rec.tier, route: rec.route }, { targetId: rec.id, journal: this.retargetJournal(rec) });
			};

			const res = await adapter.update(ctx, rec, { tier: p.tier, port: p.port });
			// As saved by the journal (a `retarget` intent), or unchanged
			const now = this.reg.get(p.accountId, p.connectionId) || rec;

			if (!res.ok) {
				// Nothing was written: the intent goes. A lost receipt keeps it, and the next check takes what the item holds
				if (now.retarget && !res.unconfirmed) {
					const back = { ...now };

					delete back.retarget;
					this.reg.upsert(back);
				};
				return { ok: false, error: res.error || { stage: 'write', category: 'unknown' } };
			};

			const next: AiRecord = { ...now, port: p.port, tier: p.tier || rec.tier, nextStep: res.nextStep || rec.nextStep };

			if (now.retarget) {
				next.itemRev = now.retarget.rev;
				delete next.retarget;
			};
			return { ok: true, connection: this.view(this.reg.upsert(next)) };
		});
	};

	/**
	 * Cleanup (skipped with `forget`), then the record becomes `removed` with its hash (and an unconfirmed
	 * one) added to `revokePending`. An entry that isn't ours → `conflict`, nothing changes (Forget instead).
	 */
	remove (param: any): Promise<AiRemoveResult> {
		return this.call<AiRemoveResult>('aiConnectRemove', param, FAIL, async p => {
			const rec = this.reg.get(p.accountId, p.connectionId);

			if (!rec) {
				return FAIL;
			};
			if (rec.appHash !== p.expectedHash) {
				return STALE;
			};
			if (rec.removed) {
				return { ok: true, connection: this.view(rec), removedNow: false };
			};
			// T3: this build can't clean up the other flavour's item (Forget still revokes the key and drops the record)
			if (this.otherBuild(rec) && !p.forget) {
				return { ok: false, error: { stage: 'validate', category: 'conflict' } };
			};

			let left: AiRecord['left'];

			let priorLeft = false;
			let itemLeft = false;
			/** `withItem`: the item may still be there — the record keeps every fingerprint it may hold, so a retry recognises it (Q4) */
			const cleanup = !p.forget && (rec.method != 'manual');
			/**
			 * S6: a `key set` of this record may still be waiting for the item's lock (its journaled deadline hasn't
			 * passed). Until then an absent item proves nothing: the record keeps `itemDelete`, so a key the helper
			 * writes after this disconnect is deleted by a later check
			 */
			const writerUntil = cleanup ? Math.max(0, ...(rec.unconfirmed || []).filter(c => this.stillRunning(c)).map(c => c.until || 0)) : 0;
			const removedRecord = (withItem: boolean): AiRecord => {
				const next: AiRecord = { ...rec, removed: true, revokePending: union(rec.revokePending, [ rec.appHash, ...candidateHashes(rec) ]) };

				if (withItem || writerUntil) {
					next.itemDelete = true;
					next.itemFps = union([ rec.keyFp ], (rec.unconfirmed || []).map(c => c.keyFp));
				};
				if (writerUntil) {
					next.itemUntil = writerUntil;
				};
				delete next.unconfirmed;
				delete next.retarget;
				delete next.left;
				return next;
			};

			// §2.9: before `key delete`, every hash of the record is queued for revocation and the record marked removed
			if (cleanup && holdsItem(rec)) {
				this.reg.upsert({ ...removedRecord(true), ...(rec.prior ? { prior: rec.prior } : {}) });
			};

			if (cleanup) {
				const adapter = adapterFor(rec.appId);
				let ctx: Ctx;

				if (isCommand(rec)) {
					ctx = this.itemCtx(rec, rec.port);
				} else {
					const scan = await this.scanned();
					const homes = await resolveHomes(this.env);

					ctx = this.ctx(homes, this.retarget(scan.items, homes), { appId: rec.appId, accountId: rec.accountId, port: rec.port, tier: rec.tier, route: rec.route }, { targetId: rec.id });
				};

				const res: Awaited<ReturnType<Adapter['remove']>> = adapter ? await adapter.remove(ctx, rec) : { ok: true };

				itemLeft = !!res.itemLeft;

				if (!res.ok && (res.error?.category == 'conflict')) {
					return { ok: false, error: res.error };
				};
				left = res.left || (res.ok ? undefined : 'entry');

				// What the previous route or profile left (its own key decides; another owner's is not touched)
				if (adapter && rec.prior) {
					priorLeft = !!(await this.removePrevious(adapter, ctx, { ...rec, ...rec.prior }));
					left = left || (priorLeft ? 'entry' : undefined);
				};
			};

			const next = removedRecord(itemLeft);

			if (!priorLeft) {
				delete next.prior;
			};
			if (left) {
				next.left = left;
			};

			this.reg.upsert(next);
			this.setStatus(next, 'removed');
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

			if (next.removed && !next.revokePending.length && !next.itemDelete) {
				this.reg.remove(p.accountId, p.connectionId);
				this.statuses.delete(this.statusKey(p.accountId, p.connectionId));
				return { ok: true, connection: null };
			};

			this.reg.upsert(next);
			return { ok: true, connection: this.view(next) };
		});
	};

	/** Reconciles keys (only after a successful ListApps), then checks each record (heals only while the API listens) */
	check (param: any): Promise<AiCheckResult> {
		return this.call<AiCheckResult>('aiConnectCheck', param, FAIL, async p => {
			const keys: { hash: string; present: boolean; grant?: any; expireAt?: number }[] | null = p.keys;
			const byHash = new Map((keys || []).map(k => [ k.hash, k ]));
			const absent = (h: string): boolean => (keys !== null) && byHash.has(h) && !byHash.get(h).present;
			const healed: string[] = [];
			/** Records this check found removed in their app for the first time (reported once, Z12) */
			const removed: string[] = [];

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

				// A disconnect that couldn't confirm its `key delete`: once more (only this record's own item is ever removed)
				if (rec.removed && rec.itemDelete) {
					const gone = await deleteItem(this.env, rec.id, rec);

					// S6: "no item" is final only once a writer that outlived the disconnect can no longer commit
					if ((gone.done === true) && ((gone.owner != 'none') || !rec.itemUntil || (this.env.now() >= rec.itemUntil))) {
						delete rec.itemDelete;
						delete rec.itemFps;
						delete rec.itemUntil;
					};
				};

				// Q4: gone only when every revoke was confirmed AND the item is confirmed gone (or not ours)
				if (rec.removed && !rec.revokePending.length && !rec.itemDelete) {
					this.reg.remove(rec.accountId, rec.id);
					this.statuses.delete(this.statusKey(rec.accountId, rec.id));
					continue;
				};

				let status: AiStatus;
				let waiting = false;
				const adapter = adapterFor(rec.appId);
				const command = isCommand(rec);
				const live = { stillLive: () => this.liveApi(p.port), journal: this.retargetJournal(rec) };
				// A Command record is checked by its own id, whatever the app scan says (and without one)
				const ctx = command
					? this.itemCtx(rec, p.apiListening ? p.port : 0, live)
					: ((p.apiListening && scan) ? this.ctx(homes, items, { appId: rec.appId, accountId: rec.accountId, port: p.port, tier: rec.tier, route: rec.route }, { targetId: rec.id, ...live }) : null);
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
					if (res.configEntry && res.entryDigest) {
						rec.configEntry = res.configEntry;
						rec.entryDigest = res.entryDigest;
					};
					// The item was read with the record's own key in it: the record takes its port, tier and revision,
					// which also settles a retarget whose receipt was lost (nothing is revoked for it)
					if (res.item) {
						// Q19: a tier change recovered from a lost receipt: the running `serve` is pinned to the old tier
						if (rec.retarget && (res.item.tier != rec.tier)) {
							rec.nextStep = 'restart';
						};
						rec.itemRev = res.item.rev;
						rec.port = res.item.port;
						rec.tier = res.item.tier;
						// S6: an item still at the revision before the intent, with the writer's deadline not passed, settles
						// nothing — the helper may yet commit, and clearing the intent now would heal its change back later
						if (!rec.retarget || (res.item.rev >= rec.retarget.rev) || !rec.retarget.until || (this.env.now() >= rec.retarget.until)) {
							delete rec.retarget;
						};
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

				if (rec.removed) {
					// Only the item is left to delete: nothing for the user to do, the row stays hidden
					status = rec.revokePending.length ? 'revokeFailed' : 'removed';
				} else
				if (waiting) {
					status = 'pending';
				} else
				if (rec.method == 'manual') {
					// A failed lookup proves nothing: the last status stands
					status = absent(rec.appHash) ? 'accessEnded' : ((keys === null) ? (last || 'ok') : 'ok');
				} else
				if (absent(rec.appHash) && !rec.unconfirmed?.length) {
					status = 'accessEnded';
				} else
				if ((keys === null) && (last == 'accessEnded')) {
					// Known revoked, and the lookup failed: still ended, and nothing is healed with that key
					status = 'accessEnded';
				} else
				if (command) {
					// No app to find: the item itself is the connection
					const res = await adapter.check(ctx, rec);

					status = res.status;
					take(res);
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
			const fp = await adapter.installedFp(ctx, { ...rec, route: c.route, targetPath: c.targetPath });

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
		if (winner.configEntry && winner.entryDigest) {
			next.configEntry = winner.configEntry;
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

		return this.call<AiProbeResult>('aiConnectProbe', param, invalid, async p => {
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

			const result = await probe({ port: p.port, tier: p.tier, route: p.route, key: p.key }, { version: this.setup?.version });

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
			const P = pathOf(this.env);
			let file = '';

			if (p.connectionId) {
				file = this.revealable(this.record(p.accountId, p.connectionId)?.targetPath || '');
			} else
			if (p.what == 'bundle') {
				const copy = P.join(bundleDir(this.env), BUNDLE_NAME);
				const own = bundlePath(this.env);

				// The copy in Anytype's folder; before there is one, the app's own bundle (its location comes from the app, never from stored data)
				file = this.env.exists(copy) ? this.revealable(copy) : ((isLocalAbsolute(this.env, own) && this.env.exists(own)) ? own : '');
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
		return this.call<AiBundleInfoResult>('aiConnectBundleInfo', param, null, () => {
			const info = bundleInfo(this.env);
			return info ? { signed: info.signed } : null;
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
	registryFile: path.join(app.getPath('userData'), 'aiConnect.json'),
	version: app.getVersion(),
	icon: async appPath => {
		const image = await app.getFileIcon(appPath, { size: 'normal' });
		return image.isEmpty() ? null : image.toDataURL();
	},
}));
