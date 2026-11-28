/**
 * The connection registry: `<userData>/aiConnect.json`, 0600, atomic writes, no secrets (only key
 * fingerprints and hashes). Records are per account. `status` is computed by check, never stored.
 *
 * It must never lose a record: it holds the only copy of the hashes Anytype still has to revoke.
 * - Only a missing file (ENOENT) in a profile directory that exists and can be listed is a fresh
 *   registry. A missing or unlistable profile directory, and any other read failure (ENOTDIR, a
 *   directory or FIFO at the path, a file above MAX_BYTES, I/O), throws and leaves nothing cached, so
 *   the next call retries; the file is never moved or written over.
 * - A registry that started from "no file" checks again before its first save (and right before that
 *   save's rename): a file that appeared meanwhile (another instance, a restore) is loaded and the
 *   mutation applied to it, never overwritten.
 * - Content that was read but is corrupt, wrong-version or wrong-shape (one bad row is enough) is moved
 *   to `.broken` first; if that move fails the operation throws and the original stays.
 * - Every mutation is computed on a copy, saved, and becomes the cached state only after the rename.
 *   A candidate above MAX_BYTES is never saved (the next start could not read it back).
 * - Hashes (appHash, revokePending, orphanHashes) follow the IPC hash rule, so every stored hash is one
 *   reconciliation accepts.
 * - A save that queues a record's hash for revocation (Disconnect, retire, a rotation) first writes its undo,
 *   `aiConnect.json.txn`: those records as they were, each with the digest of the version this save writes. It
 *   goes once the save is durable. While it is there and the file still holds exactly that version, loading puts
 *   the earlier record back: a save reported as failed never revokes a key after a restart (D1C-20, D1S-22).
 */
import crypto from 'crypto';
import type { AiRecord, Env } from './types';
import { MODE_SECRET, dirIdentity, discardTemp, keepTemp, pathOf, sameDir, stageTemp, type DirIdentity, type StagedTemp } from './fsSafe';
import { isHash } from './validate';
import { CATALOG, TIERS, isValidPort } from '../../../../src/ts/lib/aiConnect/catalog';
import { isValidLinkGrant } from '../../../../src/ts/lib/linkApprovalGrant';

const VERSION = 1;
/** Far above any real registry; reading or writing more than this is an error, never "empty" */
export const MAX_BYTES = 64 * 1024 * 1024;

export interface Orphan {
	accountId: string;
	hash: string;
};

/** A key that is about to be created: saved before CreateApp, cleared when the key is delivered or released (§2.9) */
export interface MintIntent {
	id: string;
	accountId: string;
	/** The key's name */
	name: string;
	/** Seconds; a key of that name created at or after it that no record manages is this one */
	time: number;
	/** The access and expiry the key is made with: only a key with exactly these is this one (D1S-18) */
	grant?: any;
	expireAt?: number;
};

interface RegistryFile {
	version: number;
	nudgeClaimed: boolean;
	connections: AiRecord[];
	/** Keys whose release (revoke after a cancelled flow) failed; retried by the renderer */
	orphanHashes: Orphan[];
	/** Absent while there is none */
	mintIntents?: MintIntent[];
};

/** More intents than any real use leaves behind: a further one is refused (no key is minted) */
const MAX_INTENTS = 64;

const empty = (): RegistryFile => ({ version: VERSION, nudgeClaimed: false, connections: [], orphanHashes: [] });

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const isStr = (v: any): boolean => (typeof v == 'string');
const isBool = (v: any): boolean => (typeof v == 'boolean');
const isNum = (v: any): boolean => Number.isSafeInteger(v) && (v >= 0);
const isStrArray = (v: any): boolean => Array.isArray(v) && v.every(isStr);
const oneOf = (list: readonly string[]) => (v: any): boolean => list.includes(v);

const APP_IDS = CATALOG.map(it => it.id);
const ROUTES = [ 'http', 'stdio', 'skill' ];
const METHODS = [ 'cli', 'package', 'config', 'deeplink', 'manual' ];
const NEXT_STEPS = [ 'none', 'confirmInApp', 'restart', 'newSession', 'reloadServer', 'toggle' ];

const isFp = (v: any): boolean => isStr(v) && /^[0-9a-f]{16}$/.test(v);

const isDigest = (v: any): boolean => isStr(v) && /^[0-9a-f]{64}$/.test(v);

/** One unconfirmed delivery (AiCandidate) */
const isCandidate = (v: any): boolean => !!v && (typeof v == 'object') && isHash(v.appHash) && isFp(v.keyFp) && oneOf(ROUTES)(v.route)
	&& oneOf(METHODS)(v.method) && isStr(v.targetPath) && oneOf(TIERS)(v.tier) && oneOf(TIERS)(v.recommendedTier) && isValidPort(v.port)
	&& oneOf(NEXT_STEPS)(v.nextStep) && isStr(v.name) && isValidLinkGrant(v.grant) && isNum(v.expireAt) && isBool(v.created) && isBool(v.running)
	&& ((v.until === undefined) || isNum(v.until))
	&& ((v.entryDigest === undefined) || isDigest(v.entryDigest)) && ((v.configPath === undefined) || isStr(v.configPath));

/** A latch of the extension route: the key's hash and Claude's install identity */
const isInstallLatch = (v: any): boolean => !!v && (typeof v == 'object') && isStr(v.appHash) && isStr(v.version) && isStr(v.installedAt);

/** Every field a record must carry, and its type */
const RECORD_FIELDS: Record<string, (v: any) => boolean> = {
	id: v => isStr(v) && /^[a-z0-9-]{1,64}$/.test(v),
	appId: oneOf(APP_IDS),
	accountId: v => isStr(v) && !!v,
	// '' only on a bundle record whose key was retired for a Reconnect (aiConnectRetire)
	appHash: v => isHash(v) || (v === ''),
	keyFp: isStr,
	name: isStr,
	route: oneOf(ROUTES),
	tier: oneOf(TIERS),
	recommendedTier: oneOf(TIERS),
	method: oneOf(METHODS),
	targetPath: isStr,
	port: v => isValidPort(v) || (v === 0),
	createdAt: isNum,
	grant: v => isValidLinkGrant(v),
	expireAt: isNum,
	nextStep: oneOf(NEXT_STEPS),
	observedInstalled: isBool,
	lastProbe: isStr,
	revokePending: v => Array.isArray(v) && v.every(isHash),
	removed: isBool,
	createdDirs: isStrArray,
};

const OPTIONAL_FIELDS: Record<string, (v: any) => boolean> = {
	left: oneOf([ 'extension', 'entry', 'envKey' ]),
	entryDigest: v => isStr(v) && /^[0-9a-f]{64}$/.test(v),
	configPath: isStr,
	unconfirmed: v => Array.isArray(v) && v.every(isCandidate),
	prior: v => !!v && (typeof v == 'object') && oneOf(ROUTES)(v.route) && isStr(v.targetPath) && isFp(v.keyFp),
	removedReported: isBool,
	ns: oneOf([ 'release', 'dev' ]),
	setup: oneOf([ 'url', 'command' ]),
	confirmed: isInstallLatch,
	armed: isInstallLatch,
	reconfirm: isBool,
	// Claude's extension between its first save and its last settings-file check (R1): the record as it was, and the intent that save took
	staged: v => !!v && (typeof v == 'object') && ((v.before === null) || (isValidRecord(v.before) && (v.before.staged === undefined)))
		&& ((v.intent === undefined) || isValidIntent(v.intent)),
};

export const isValidRecord = (v: any): v is AiRecord => {
	if (!v || (typeof v != 'object') || Array.isArray(v)) {
		return false;
	};

	return Object.keys(RECORD_FIELDS).every(k => Object.prototype.hasOwnProperty.call(v, k) && RECORD_FIELDS[k](v[k]))
		&& Object.keys(OPTIONAL_FIELDS).every(k => (v[k] === undefined) || OPTIONAL_FIELDS[k](v[k]))
		&& ((v.appHash !== '') || (v.method == 'package'));
};

const isValidOrphan = (v: any): v is Orphan => !!v && isStr(v.accountId) && !!v.accountId && isHash(v.hash);

const isValidIntent = (v: any): v is MintIntent => !!v && isStr(v.id) && /^[0-9a-f]{16}$/.test(v.id) && isStr(v.accountId) && !!v.accountId
	&& isStr(v.name) && !!v.name && (v.name.length <= 512) && isNum(v.time)
	&& ((v.grant === undefined) || isValidLinkGrant(v.grant)) && ((v.expireAt === undefined) || isNum(v.expireAt));

/** One record of a destructive save's undo */
interface Undo {
	accountId: string;
	id: string;
	/** sha256 of the record as that save wrote it */
	digest: string;
	prior: AiRecord;
};

const digestOf = (rec: AiRecord): string => crypto.createHash('sha256').update(JSON.stringify(rec)).digest('hex');

const isValidUndo = (v: any): v is { v: 1; records: Undo[] } => !!v && (v.v === 1) && Array.isArray(v.records)
	&& v.records.every((it: any) => !!it && isStr(it.accountId) && isStr(it.id) && isDigest(it.digest) && isValidRecord(it.prior) && (it.prior.accountId == it.accountId) && (it.prior.id == it.id));

/** The records of `next` whose revokePending gained a hash over `before`, as `before` had them */
const undoOf = (before: RegistryFile | null, next: RegistryFile): Undo[] => {
	const ret: Undo[] = [];

	for (const rec of next.connections) {
		const prior = before?.connections.find(it => (it.accountId == rec.accountId) && (it.id == rec.id));

		if (prior && rec.revokePending.some(h => !prior.revokePending.includes(h))) {
			ret.push({ accountId: rec.accountId, id: rec.id, digest: digestOf(rec), prior: copy(prior) });
		};
	};
	return ret;
};

const isValidFile = (v: any): boolean => !!v && (typeof v == 'object') && (v.version === VERSION) && isBool(v.nudgeClaimed)
	&& Array.isArray(v.connections) && v.connections.every(isValidRecord)
	&& ((v.orphanHashes === undefined) || (Array.isArray(v.orphanHashes) && v.orphanHashes.every(isValidOrphan)))
	&& ((v.mintIntents === undefined) || (Array.isArray(v.mintIntents) && v.mintIntents.every(isValidIntent)));

export class Registry {

	private data: RegistryFile | null = null;
	/** The cached state was started because there was no file (fresh, or the broken one moved aside) */
	private absent = false;

	/** `maxBytes` is MAX_BYTES; tests pass a small one */
	constructor (private env: Env, private file: string, private maxBytes: number = MAX_BYTES) {};

	/** The cached state, loading it first. Throws when the file can't be read or quarantined. */
	private get state (): RegistryFile {
		if (!this.data) {
			this.data = this.read();
		};
		return this.data;
	};

	private read (): RegistryFile {
		const res = this.env.readFile(this.file, this.maxBytes);

		if ('error' in res) {
			if ((res.error == 'missing') && this.profileUsable()) {
				this.absent = true;
				return empty();
			};
			// Nothing was read, so nothing is known to be broken: keep the file, cache nothing, retry next time
			throw Object.assign(new Error('registry unreadable'), { code: (res.error == 'tooLarge') ? 'EREGISTRYSIZE' : 'EREGISTRYREAD' });
		};

		let parsed: any = null;
		try {
			parsed = JSON.parse(res.data.toString('utf8'));
		} catch (e) { /* broken */ };

		if (isValidFile(parsed)) {
			this.absent = false;
			return this.undone({ ...parsed, orphanHashes: parsed.orphanHashes || [] } as RegistryFile);
		};

		this.quarantine();
		this.absent = true;
		return empty();
	};

	private get undoFile (): string {
		return `${this.file}.txn`;
	};

	/**
	 * A destructive save whose undo is still there and whose version is still on disk was not confirmed: its records
	 * are what they were before it. Nothing is written here; the next save writes this state (and drops the undo)
	 */
	private undone (state: RegistryFile): RegistryFile {
		const res = this.env.readFile(this.undoFile, this.maxBytes, { noFollow: true });
		let undo: any = null;

		if (!('data' in res)) {
			return state;
		};
		try {
			undo = JSON.parse(res.data.toString('utf8'));
		} catch (e) { /* not one */ };
		if (!isValidUndo(undo)) {
			return state;
		};

		for (const it of undo.records) {
			const index = state.connections.findIndex(rec => (rec.accountId == it.accountId) && (rec.id == it.id));

			if ((index >= 0) && (digestOf(state.connections[index]) == it.digest)) {
				state.connections[index] = it.prior;
			};
		};
		return state;
	};

	/** Writes the undo of a destructive save (temp, rename, folder fsync); throws when it isn't durable */
	private writeUndo (dir: DirIdentity, records: Undo[]): void {
		const P = pathOf(this.env);
		const staged = stageTemp(this.env, dir, null, `.${P.basename(this.undoFile)}.${this.env.now()}-${Math.random().toString(16).slice(2, 10)}.tmp`, JSON.stringify({ v: 1, records }) + '\n', MODE_SECRET);

		if (staged == 'changed') {
			throw Object.assign(new Error('registry directory changed'), { code: 'EREGISTRYDIR' });
		};
		try {
			this.env.rename(staged.path, P.join(dir.path, P.basename(this.undoFile)));
			keepTemp(staged);
		} catch (e) {
			discardTemp(this.env, staged);
			throw e;
		};
		this.env.fsyncDir(dir.path);
	};

	/** The undo goes once the state it guards against is no longer what the file holds; false: it is still there */
	private dropUndo (dir: string): boolean {
		try {
			this.env.unlink(this.undoFile);
		} catch (e) {
			return ((e as any)?.code == 'ENOENT');
		};
		try {
			this.env.fsyncDir(dir);
		} catch (e) {
			return false;
		};
		return true;
	};

	/** The profile directory exists and can be listed: only then does "no file" mean "no registry yet" */
	private profileUsable (): boolean {
		const dir = pathOf(this.env).dirname(this.file);
		const st = this.env.stat(dir);

		return !!st && st.isDir && (this.env.readDir(dir) !== null);
	};

	/** A registry that started from "no file" finds one now */
	private appeared (): boolean {
		return this.absent && !!this.env.lstat(this.file);
	};

	/** Moves the file aside; throws (keeping the original) when it can't */
	private quarantine (): void {
		try {
			this.env.rename(this.file, this.file + '.broken');
		} catch (e) {
			throw Object.assign(new Error('registry quarantine failed'), { code: 'EREGISTRYQUARANTINE' });
		};
	};

	/** Saves `next` (staged next to the file under the fsSafe identity contract), and only then makes it the cached state */
	private commit (next: RegistryFile, restoring = false): void {
		const P = pathOf(this.env);
		const before = this.data;
		const wasAbsent = this.absent;
		const text = JSON.stringify(next, null, 2) + '\n';

		if (Buffer.byteLength(text, 'utf8') > this.maxBytes) {
			throw Object.assign(new Error('registry too large'), { code: 'EREGISTRYSIZE' });
		};

		const real = this.env.realpath(P.dirname(this.file));
		const dir = real ? dirIdentity(this.env, real, null) : null;

		if (!dir) {
			throw Object.assign(new Error('registry directory unusable'), { code: 'EREGISTRYDIR' });
		};

		let temp: StagedTemp | null = null;
		const undo = restoring ? [] : undoOf(before, next);

		// Durable before the file changes: a failure here changes nothing
		if (undo.length) {
			this.writeUndo(dir, undo);
		};

		try {
			const staged = stageTemp(this.env, dir, null, `.${P.basename(this.file)}.${this.env.now()}-${Math.random().toString(16).slice(2, 10)}.tmp`, text, MODE_SECRET);

			if (staged == 'changed') {
				throw Object.assign(new Error('registry directory changed'), { code: 'EREGISTRYDIR' });
			};

			temp = staged;
			this.env.chmod(temp.path, MODE_SECRET);

			if (!sameDir(this.env, dir, null)) {
				throw Object.assign(new Error('registry directory changed'), { code: 'EREGISTRYDIR' });
			};
			if (this.appeared()) {
				throw Object.assign(new Error('registry appeared'), { code: 'EREGISTRYAPPEARED' });
			};

			this.env.rename(temp.path, P.join(dir.path, P.basename(this.file)));
			keepTemp(temp);
			temp = null;
			this.absent = false;
			// The rename itself must be durable before anything outside Anytype changes: a failure is "not saved".
			// The new text is visible already, so the previous state is put back first (best effort): a restart must
			// not act on a save this call reports as failed (a queued revocation of a Disconnect that didn't happen)
			try {
				this.env.fsyncDir(dir.path);
			} catch (e) {
				if (!restoring) {
					try {
						if (before) {
							this.commit(before, true);
						} else
						if (wasAbsent) {
							this.env.unlink(this.file);
							this.absent = true;
						};
					} catch (e2) { /* indeterminate: the next save retries */ };
				};
				throw Object.assign(new Error('registry not durable'), { code: 'EREGISTRYSYNC' });
			};
		} catch (e) {
			if (temp) {
				discardTemp(this.env, temp);
			};
			throw e;
		};

		// Durable: the undo of this save (or one an earlier failed save left) has done its job. One that can't go
		// makes this save "not saved", as the next start would put those records back
		if (!this.dropUndo(dir.path) && undo.length) {
			throw Object.assign(new Error('registry undo left'), { code: 'EREGISTRYSYNC' });
		};

		this.data = next;
	};

	/**
	 * Applies `fn` to a copy of the state and commits it. A file that appeared since the state was started
	 * from "no file" is loaded first (also when it appears during the save: then the save is redone once).
	 */
	private mutate<T> (fn: (draft: RegistryFile) => T): T {
		for (let attempt = 0; ; attempt++) {
			if (this.data && this.appeared()) {
				this.data = null;
			};

			const draft = copy(this.state);
			const ret = fn(draft);

			try {
				this.commit(draft);
				return ret;
			} catch (e) {
				if (((e as any)?.code != 'EREGISTRYAPPEARED') || attempt) {
					throw e;
				};
				this.data = null;
			};
		};
	};

	list (accountId: string): AiRecord[] {
		return copy(this.state.connections.filter(it => it.accountId == accountId));
	};

	get (accountId: string, id: string): AiRecord | null {
		const rec = this.state.connections.find(it => (it.accountId == accountId) && (it.id == id));
		return rec ? copy(rec) : null;
	};

	/** `intentId`: the mint intent of the record's key goes in the same save (a delivery that committed, D1C-21) */
	upsert (record: AiRecord, intentId?: string): AiRecord {
		if (!isValidRecord(record)) {
			throw Object.assign(new Error('invalid record'), { code: 'EREGISTRYRECORD' });
		};

		return this.mutate(draft => {
			const index = draft.connections.findIndex(it => (it.accountId == record.accountId) && (it.id == record.id));
			const rec = copy(record);

			if (index >= 0) {
				draft.connections[index] = rec;
			} else {
				draft.connections.push(rec);
			};
			if (intentId && draft.mintIntents) {
				draft.mintIntents = draft.mintIntents.filter(it => !((it.accountId == record.accountId) && (it.id == intentId)));
				if (!draft.mintIntents.length) {
					delete draft.mintIntents;
				};
			};
			return copy(rec);
		});
	};

	/**
	 * Undoes a commit whose delivery couldn't go on (Claude's extension: the last check of its settings file refused,
	 * or that delivery never finished), in one save: the record as it was before (`prior`; null: there was none) and
	 * the mint intent of the key that commit took (null: none), so that key is the renderer's undelivered one again;
	 * or, when nothing holds that key any more, its hash as an orphan (`orphan`), so it is revoked
	 */
	revert (accountId: string, id: string, prior: AiRecord | null, intent: MintIntent | null, orphan = ''): void {
		if ((prior && (!isValidRecord(prior) || (prior.accountId != accountId) || (prior.id != id))) || (intent && !isValidIntent(intent)) || (orphan && !isHash(orphan))) {
			throw Object.assign(new Error('invalid record'), { code: 'EREGISTRYRECORD' });
		};

		this.mutate(draft => {
			const index = draft.connections.findIndex(it => (it.accountId == accountId) && (it.id == id));

			if (prior && (index >= 0)) {
				draft.connections[index] = copy(prior);
			} else
			if (prior) {
				draft.connections.push(copy(prior));
			} else
			if (index >= 0) {
				draft.connections.splice(index, 1);
			};
			if (intent) {
				draft.mintIntents = [ ...(draft.mintIntents || []).filter(it => it.id != intent.id), copy(intent) ];
			};
			if (orphan && !draft.orphanHashes.some(it => (it.accountId == accountId) && (it.hash == orphan))) {
				draft.orphanHashes.push({ accountId, hash: orphan });
			};
		});
	};

	patch (accountId: string, id: string, partial: Partial<AiRecord>): AiRecord | null {
		if (!this.get(accountId, id)) {
			return null;
		};

		const { id: _id, accountId: _accountId, ...rest } = partial;

		return this.mutate(draft => {
			const rec = draft.connections.find(it => (it.accountId == accountId) && (it.id == id));
			const next = { ...rec, ...copy(rest) };

			if (!isValidRecord(next)) {
				throw Object.assign(new Error('invalid record'), { code: 'EREGISTRYRECORD' });
			};

			Object.assign(rec, next);
			return copy(rec);
		});
	};

	remove (accountId: string, id: string): boolean {
		if (!this.get(accountId, id)) {
			return false;
		};

		return this.mutate(draft => {
			draft.connections = draft.connections.filter(it => !((it.accountId == accountId) && (it.id == id)));
			return true;
		});
	};

	/** True exactly once per profile */
	claimNudge (): boolean {
		if (this.state.nudgeClaimed) {
			return false;
		};

		return this.mutate(draft => {
			draft.nudgeClaimed = true;
			return true;
		});
	};

	listOrphans (accountId: string): string[] {
		return this.state.orphanHashes.filter(it => it.accountId == accountId).map(it => it.hash);
	};

	/** A set per account: adding a hash twice keeps one. A hash reconciliation would reject is refused */
	addOrphan (accountId: string, hash: string): void {
		if (!isValidOrphan({ accountId, hash })) {
			throw Object.assign(new Error('invalid orphan'), { code: 'EREGISTRYRECORD' });
		};
		if (this.listOrphans(accountId).includes(hash)) {
			return;
		};

		this.mutate(draft => {
			draft.orphanHashes.push({ accountId, hash });
		});
	};

	removeOrphan (accountId: string, hash: string): void {
		if (!this.listOrphans(accountId).includes(hash)) {
			return;
		};

		this.mutate(draft => {
			draft.orphanHashes = draft.orphanHashes.filter(it => !((it.accountId == accountId) && (it.hash == hash)));
		});
	};

	listIntents (accountId: string): MintIntent[] {
		return copy((this.state.mintIntents || []).filter(it => it.accountId == accountId));
	};

	addIntent (intent: MintIntent): void {
		if (!isValidIntent(intent)) {
			throw Object.assign(new Error('invalid intent'), { code: 'EREGISTRYRECORD' });
		};

		// Never evicted: an unresolved intent is the only trace of a key that may exist (Q6)
		if ((this.state.mintIntents || []).filter(it => it.id != intent.id).length >= MAX_INTENTS) {
			throw Object.assign(new Error('too many mint intents'), { code: 'EREGISTRYINTENTS' });
		};

		this.mutate(draft => {
			draft.mintIntents = [ ...(draft.mintIntents || []).filter(it => it.id != intent.id), copy(intent) ];
		});
	};

	removeIntent (accountId: string, id: string): void {
		if (!(this.state.mintIntents || []).some(it => (it.accountId == accountId) && (it.id == id))) {
			return;
		};

		this.mutate(draft => {
			draft.mintIntents = (draft.mintIntents || []).filter(it => !((it.accountId == accountId) && (it.id == id)));
			if (!draft.mintIntents.length) {
				delete draft.mintIntents;
			};
		});
	};

	/** Every account's records; for detection (createdDirs are not install evidence) */
	all (): AiRecord[] {
		return copy(this.state.connections);
	};

};
