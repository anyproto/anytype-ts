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
 */
import type { AiRecord, Env } from './types';
import { MODE_SECRET, dirIdentity, discardTemp, keepTemp, pathOf, sameDir, stageTemp, type StagedTemp } from './fsSafe';
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
const isStrMap = (v: any): boolean => !!v && (typeof v == 'object') && !Array.isArray(v) && Object.keys(v).every(k => isStr(v[k]));
const oneOf = (list: readonly string[]) => (v: any): boolean => list.includes(v);

const APP_IDS = CATALOG.map(it => it.id);
const ROUTES = [ 'http', 'stdio', 'skill' ];
const METHODS = [ 'cli', 'package', 'keyfile', 'config', 'deeplink', 'manual', 'command' ];
const NEXT_STEPS = [ 'none', 'confirmInApp', 'restart', 'newSession', 'reloadServer', 'toggle' ];

const isFp = (v: any): boolean => isStr(v) && /^[0-9a-f]{16}$/.test(v);

const isConfigEntry = (v: any): boolean => !!v && isStr(v.command) && isStrArray(v.args) && ((v.env === undefined) || isStrMap(v.env));
const isDigest = (v: any): boolean => isStr(v) && /^[0-9a-f]{64}$/.test(v);

/** One unconfirmed delivery (AiCandidate) */
const isCandidate = (v: any): boolean => !!v && (typeof v == 'object') && isHash(v.appHash) && isFp(v.keyFp) && oneOf(ROUTES)(v.route)
	&& oneOf(METHODS)(v.method) && isStr(v.targetPath) && oneOf(TIERS)(v.tier) && oneOf(TIERS)(v.recommendedTier) && isValidPort(v.port)
	&& oneOf(NEXT_STEPS)(v.nextStep) && isStr(v.name) && isValidLinkGrant(v.grant) && isNum(v.expireAt) && isBool(v.created) && isBool(v.running)
	&& ((v.until === undefined) || isNum(v.until)) && ((v.configEntry === undefined) || isConfigEntry(v.configEntry))
	&& ((v.entryDigest === undefined) || isDigest(v.entryDigest)) && ((v.configPath === undefined) || isStr(v.configPath));

/** Every field a record must carry, and its type */
const RECORD_FIELDS: Record<string, (v: any) => boolean> = {
	id: v => isStr(v) && /^[a-z0-9-]{1,64}$/.test(v),
	appId: oneOf(APP_IDS),
	accountId: v => isStr(v) && !!v,
	appHash: isHash,
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
	configEntry: v => !!v && isStr(v.command) && isStrArray(v.args) && ((v.env === undefined) || isStrMap(v.env)),
	entryDigest: v => isStr(v) && /^[0-9a-f]{64}$/.test(v),
	configPath: isStr,
	unconfirmed: v => Array.isArray(v) && v.every(isCandidate),
	prior: v => !!v && (typeof v == 'object') && oneOf(ROUTES)(v.route) && isStr(v.targetPath) && isFp(v.keyFp),
	removedReported: isBool,
	itemRev: v => Number.isSafeInteger(v) && (v > 0),
	retarget: v => !!v && (typeof v == 'object') && isValidPort(v.port) && oneOf(TIERS)(v.tier) && Number.isSafeInteger(v.rev) && (v.rev > 0) && ((v.until === undefined) || isNum(v.until)),
	itemDelete: isBool,
	itemUntil: isNum,
	ns: oneOf([ 'release', 'dev' ]),
	itemFps: v => Array.isArray(v) && v.every(isFp),
};

export const isValidRecord = (v: any): v is AiRecord => {
	if (!v || (typeof v != 'object') || Array.isArray(v)) {
		return false;
	};

	return Object.keys(RECORD_FIELDS).every(k => Object.prototype.hasOwnProperty.call(v, k) && RECORD_FIELDS[k](v[k]))
		&& Object.keys(OPTIONAL_FIELDS).every(k => (v[k] === undefined) || OPTIONAL_FIELDS[k](v[k]));
};

const isValidOrphan = (v: any): v is Orphan => !!v && isStr(v.accountId) && !!v.accountId && isHash(v.hash);

const isValidIntent = (v: any): v is MintIntent => !!v && isStr(v.id) && /^[0-9a-f]{16}$/.test(v.id) && isStr(v.accountId) && !!v.accountId
	&& isStr(v.name) && !!v.name && (v.name.length <= 512) && isNum(v.time);

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
			return { ...parsed, orphanHashes: parsed.orphanHashes || [] };
		};

		this.quarantine();
		this.absent = true;
		return empty();
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
	private commit (next: RegistryFile): void {
		const P = pathOf(this.env);
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
		} catch (e) {
			if (temp) {
				discardTemp(this.env, temp);
			};
			throw e;
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

	upsert (record: AiRecord): AiRecord {
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
			return copy(rec);
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
