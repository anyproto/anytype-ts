/**
 * The config-writing contract: resolve a target under the user's home, snapshot it, and replace it
 * atomically with a backup, a recheck right before every rename and conservative modes.
 *
 * Every temp file (config, backup, key file, registry, bundle copy) is created by `stageTemp` in a
 * directory whose identity (canonical path, not a link, dev + ino, inside its root) is checked right
 * before the temp is created and again right before the rename. A temp whose directory changed is
 * discarded where it really is (`discardTemp`: emptied through its descriptor, unlinked while its path
 * still reaches it) and the write reports `changed`.
 * Everything goes through `Env`, so tests run against temp dirs and fake file systems.
 */
import path from 'path';
import type { AiError, Env, StatInfo, TempFile } from './types';

export const BACKUP_SUFFIX = '.anytype-backup';
export const MODE_SECRET = 0o600;
export const MODE_DIR = 0o700;

const RENAME_RETRIES = 3;
const RENAME_RETRY_MS = 100;
export const MAX_NEW_DIRS = 2;
/** Config files Anytype edits are small; anything bigger is not edited */
export const MAX_CONFIG_BYTES = 4 * 1024 * 1024;

export const pathOf = (env: Env): path.PlatformPath => (env.platform == 'win32') ? path.win32 : path.posix;

const err = (stage: AiError['stage'], category: AiError['category'], p?: string): { error: AiError } => ({ error: { stage, category, ...(p ? { path: p } : {}) } });

/** `child` is `parent` or inside it (case-insensitive on Windows) */
export const isInside = (env: Env, parent: string, child: string): boolean => {
	const P = pathOf(env);
	const norm = (s: string) => (env.platform == 'win32') ? P.resolve(s).toLowerCase() : P.resolve(s);
	const a = norm(parent);
	const b = norm(child);

	return (a == b) || b.startsWith(a.endsWith(P.sep) ? a : a + P.sep);
};

/** The real home, links resolved */
export const realHome = (env: Env): string => env.realpath(env.home) || env.home;

/**
 * An absolute local path. UNC (`\\server\share`, `//server/share`) and device paths (`\\?\`, `\\.\`)
 * are refused before any file-system call: touching one can start an SMB exchange with a remote host.
 */
export const isLocalAbsolute = (env: Env, p: string): boolean => {
	const s = String(p || '');

	if (/^[\\/]{2}/.test(s)) {
		return false;
	};
	return pathOf(env).isAbsolute(s);
};

/**
 * The canonical form of `file`: links resolved; for a missing file, the nearest existing parent
 * is resolved and the rest appended. null when a link dangles or nothing on the way exists.
 */
export const canonicalPath = (env: Env, file: string): string | null => {
	const P = pathOf(env);

	if (!isLocalAbsolute(env, file)) {
		return null;
	};

	const abs = P.resolve(file);

	if (env.lstat(abs)) {
		return env.realpath(abs);
	};

	const rest: string[] = [];
	let dir = abs;

	while (true) {
		const parent = P.dirname(dir);

		rest.unshift(P.basename(dir));

		if (parent == dir) {
			return null;
		};

		dir = parent;

		if (env.lstat(dir)) {
			const real = env.realpath(dir);
			return real ? P.join(real, ...rest) : null;
		};
	};
};

/**
 * Resolves `file` to the path every later step uses. The result must be inside the real home;
 * this covers CODEX_HOME, COPILOT_HOME, CLAUDE_CONFIG_DIR and LM Studio's pointer.
 */
export const resolveTarget = (env: Env, file: string): { real: string; exists: boolean } | { error: AiError } => {
	const real = canonicalPath(env, file);

	if (!real) {
		return err('read', 'notFound', file);
	};

	if (!isInside(env, realHome(env), real)) {
		return err('read', 'outsideHome', file);
	};

	return { real, exists: !!env.lstat(real) };
};

export interface Snapshot {
	text: string | null;
	mode: number | null;
	id: { dev: number; ino: number } | null;
};

/** The bytes are valid UTF-8: decoding and encoding them again gives the same bytes (a BOM survives) */
export const isUtf8 = (data: Buffer): boolean => Buffer.from(data.toString('utf8'), 'utf8').equals(data);

/**
 * What is there now: a regular file of at most MAX_CONFIG_BYTES, or nothing. An existing file that
 * can't be read is an error, never "missing"; a FIFO, device, directory or huge file is not edited.
 * Bytes that aren't valid UTF-8 are `unparseable`: decoding would replace them, and the edit (and the
 * backup) would silently change text nobody asked to change.
 */
export const readSnapshot = (env: Env, real: string): Snapshot | { error: AiError } => {
	const res = env.readFile(real, MAX_CONFIG_BYTES);

	if ('error' in res) {
		switch (res.error) {
			case 'missing': {
				return { text: null, mode: null, id: null };
			};
			case 'io': {
				return err('read', 'permission', real);
			};
			default: {
				return err('read', 'unsupportedForm', real);
			};
		};
	};

	const st: StatInfo | null = env.stat(real);

	if (!st || !st.isFile) {
		return err('read', 'permission', real);
	};

	if (!isUtf8(res.data)) {
		return err('parse', 'unparseable', real);
	};

	return { text: res.data.toString('utf8'), mode: st.mode & 0o777, id: { dev: st.dev, ino: st.ino } };
};

const sameSnapshot = (a: Snapshot, b: Snapshot): boolean => {
	if ((a.text !== b.text) || (a.mode !== b.mode)) {
		return false;
	};
	if (!a.id || !b.id) {
		return !a.id && !b.id;
	};
	return (a.id.dev == b.id.dev) && (a.id.ino == b.id.ino);
};

/** Compares a fresh snapshot with an expected one; an unreadable target counts as changed */
export const unchangedSince = (env: Env, real: string, expected: Snapshot): boolean => {
	const now = readSnapshot(env, real);
	return !('error' in now) && sameSnapshot(now, expected);
};

/** A sibling temp name for `real` (in the same directory) */
export const tempName = (env: Env, real: string, tag: string): string => {
	const P = pathOf(env);
	const rand = Math.random().toString(16).slice(2, 10);

	return P.join(P.dirname(real), `.${P.basename(real)}.${tag}-${env.now()}-${rand}.tmp`);
};

/** A temp file is left for the sweep only once it is this old (a writer still at work is younger) */
export const SWEEP_AGE_MS = 60 * 1000;

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Deletes what a killed writer left beside `real`: siblings named exactly as `tempName` names them for that
 * basename, regular files owned by the user, older than SWEEP_AGE_MS. No journal of temp names is kept, so
 * this is the only cleanup (before every secret write, and once at start for every record's target).
 * Returns the milliseconds until the youngest one left for its age may be deleted (0: none was left for that).
 */
export const sweepTemps = (env: Env, real: string): number => {
	if (!real || !isLocalAbsolute(env, real)) {
		return 0;
	};

	const P = pathOf(env);
	const dir = P.dirname(real);
	const re = new RegExp(`^\\.${escapeRe(P.basename(real))}\\.[a-z]+-[0-9]+-[0-9a-f]{1,8}\\.tmp$`);
	let wait = 0;

	for (const name of env.readDir(dir) || []) {
		if (!re.test(name)) {
			continue;
		};

		const file = P.join(dir, name);
		const st = env.lstat(file);

		if (!st || st.isSymlink || !st.isFile || ((env.uid !== null) && (st.uid != env.uid))) {
			continue;
		};

		const age = env.now() - (st.mtimeMs || env.now());

		// Maybe a live writer's: left, and the caller looks again once it is old enough
		if (age < SWEEP_AGE_MS) {
			wait = Math.max(wait, SWEEP_AGE_MS - age + 1000);
			continue;
		};
		tryUnlink(env, file);
	};
	return wait;
};

export const tryUnlink = (env: Env, p: string): void => {
	try {
		env.unlink(p);
	} catch (e) { /* already gone */ };
};

/** Removes directories this attempt created, innermost first; a directory someone has filled stays */
export const removeCreatedDirs = (env: Env, created: string[]): void => {
	for (const d of created.slice().reverse()) {
		try {
			env.rmdir(d);
		} catch (e) { /* not empty, or gone */ };
	};
};

const samePath = (env: Env, a: string, b: string): boolean => (env.platform == 'win32') ? (a.toLowerCase() == b.toLowerCase()) : (a == b);

/** A directory as it was when a write started: its canonical path and its identity */
export interface DirIdentity {
	path: string;
	dev: number;
	ino: number;
};

/**
 * `dir` now: a real directory (not a link) whose canonical path is itself and, when `root` is given,
 * inside `root`. null otherwise.
 */
export const dirIdentity = (env: Env, dir: string, root: string | null): DirIdentity | null => {
	const st = env.lstat(dir);
	const real = env.realpath(dir);
	const id = env.stat(dir);

	if (!st || st.isSymlink || !st.isDir || !real || !id || !id.isDir || !samePath(env, real, dir)) {
		return null;
	};
	if (root && !isInside(env, root, real)) {
		return null;
	};
	return { path: dir, dev: id.dev, ino: id.ino };
};

/** The directory still is the one the write started in (same path, same dev + ino, not a link, inside `root`) */
export const sameDir = (env: Env, expected: DirIdentity, root: string | null): boolean => {
	const now = dirIdentity(env, expected.path, root);
	return !!now && (now.dev == expected.dev) && (now.ino == expected.ino);
};

/** The directory still is the one planned; used by callers that check before acting (no identity kept) */
export const parentUnchanged = (env: Env, dir: string): boolean => !!dirIdentity(env, dir, realHome(env));

export interface StagedTemp {
	path: string;
	file: TempFile;
};

/**
 * Creates `name` in `dir` holding `data`: the directory's identity is checked right before the create.
 * `changed` (nothing created) when the directory is no longer the one the write started in.
 */
export const stageTemp = (env: Env, dir: DirIdentity, root: string | null, name: string, data: string | Buffer, mode: number): StagedTemp | 'changed' => {
	if (!sameDir(env, dir, root)) {
		return 'changed';
	};

	const p = pathOf(env).join(dir.path, name);

	return { path: p, file: env.writeFile(p, data, mode) };
};

/**
 * Discards a temp this process created, wherever it is now: its content is wiped through the open
 * descriptor first (if its directory was moved, the path no longer reaches it and an empty file is all
 * that can stay behind), then it is unlinked while its path still is that same file.
 */
export const discardTemp = (env: Env, temp: StagedTemp): void => {
	try {
		temp.file.wipe();
	} catch (e) { /* best effort */ };

	const link = env.lstat(temp.path);
	const st = env.stat(temp.path);

	if (link && !link.isSymlink && st && st.isFile && (st.dev == temp.file.dev) && (st.ino == temp.file.ino)) {
		tryUnlink(env, temp.path);
	};

	temp.file.close();
};

/** Done with a temp that was renamed into place: only the descriptor is released */
export const keepTemp = (temp: StagedTemp): void => temp.file.close();

/**
 * Creates at most two missing parent levels with 0700. Returns the created dirs, outermost first.
 * The nearest existing ancestor must be a real, canonical directory inside `root` before anything is
 * created (`changed` otherwise). A failure part-way removes what this call created.
 */
export const ensureDirs = (env: Env, dir: string, root: string | null = realHome(env)): { created: string[] } | { changed: true } | { error: AiError } => {
	const P = pathOf(env);
	const missing: string[] = [];
	let cur = dir;

	while (!env.lstat(cur)) {
		missing.unshift(cur);

		const parent = P.dirname(cur);
		if (parent == cur) {
			break;
		};
		cur = parent;
	};

	if (missing.length > MAX_NEW_DIRS) {
		return err('write', 'notFound', dir);
	};

	if (missing.length && !dirIdentity(env, cur, root)) {
		return { changed: true };
	};

	const created: string[] = [];

	try {
		for (const d of missing) {
			env.mkdir(d, MODE_DIR);
			created.push(d);
		};
	} catch (e) {
		removeCreatedDirs(env, created);
		return err('write', 'permission', dir);
	};

	return { created };
};

/**
 * Read-only: what the directory step of writeFileSafe would say for `real` (a path from resolveTarget),
 * so a preflight never approves a write the writer will refuse. null = it can proceed: at most two
 * parent levels are missing and the nearest existing one is a real, canonical directory inside `root`.
 */
export const dirsWritable = (env: Env, real: string, root: string | null = realHome(env)): AiError | null => {
	const P = pathOf(env);
	const dir = P.dirname(real);
	let cur = dir;
	let missing = 0;

	while (!env.lstat(cur)) {
		missing++;

		const parent = P.dirname(cur);

		if (parent == cur) {
			break;
		};
		cur = parent;
	};

	if (missing > MAX_NEW_DIRS) {
		return { stage: 'write', category: 'notFound', path: dir };
	};
	return dirIdentity(env, cur, root) ? null : { stage: 'write', category: 'permission', path: cur };
};

const isBusy = (e: any): boolean => [ 'EBUSY', 'EPERM' ].includes(e?.code);

export type WriteResult = { ok: true; createdDirs: string[] } | { ok: false; changed: true } | { ok: false; error: AiError };

/**
 * Replaces `real` (a path from resolveTarget) with `text`.
 *
 * 1. Missing parents (at most two levels) are created 0700 under a verified ancestor; any failure or
 *    `changed` removes them again.
 * 2. The parent's identity is taken once; every temp is created only after it is rechecked, and every
 *    rename happens only after it is rechecked again.
 * 3. Existing file: the snapshot text goes to `<real>.anytype-backup` (0600, never through a link), unless
 *    the write is `secret` (it puts a key into the file): then no copy of the file is ever left behind.
 * 4. The new text goes to a sibling temp file; a secret write's temp is created 0600, and older temps of a
 *    killed writer are swept first (`sweepTemps`).
 * 5. Right before every rename attempt the parent and the target are compared with the plan and the
 *    snapshot; on Windows a busy target is retried (recheck included) up to three times. The target is
 *    never unlinked first.
 * 6. A parent or target that changed → `changed`, the temp discarded where it really is; the caller re-plans once.
 * 7. New files 0600; an existing file keeps its mode, except a file gaining a secret loses group/other bits.
 */
export const writeFileSafe = async (env: Env, real: string, text: string, opt: { snapshot: Snapshot; secret: boolean }): Promise<WriteResult> => {
	const P = pathOf(env);
	const { snapshot, secret } = opt;
	const root = realHome(env);

	if (secret) {
		sweepTemps(env, real);
	};

	const parent = P.dirname(real);
	const dirs = ensureDirs(env, parent, root);

	if ('error' in dirs) {
		return { ok: false, error: dirs.error };
	};
	if ('changed' in dirs) {
		return { ok: false, changed: true };
	};

	const created = dirs.created;
	const changed = (): WriteResult => {
		removeCreatedDirs(env, created);
		return { ok: false, changed: true };
	};

	const dir = dirIdentity(env, parent, root);

	if (!dir) {
		return changed();
	};

	let mode = MODE_SECRET;
	if (snapshot.mode !== null) {
		mode = (secret && (snapshot.mode & 0o077)) ? MODE_SECRET : snapshot.mode;
	};

	let temp: StagedTemp | null = null;

	/** The staged temp is discarded where it really is; the write reports `changed` */
	const abandon = (): WriteResult => {
		discardTemp(env, temp);
		temp = null;
		return changed();
	};

	try {
		if ((snapshot.text !== null) && !secret) {
			const backup = real + BACKUP_SUFFIX;
			const existing = env.lstat(backup);

			if (existing && (existing.isSymlink || existing.isDir)) {
				return { ok: false, error: { stage: 'write', category: 'permission', path: backup } };
			};

			const staged = stageTemp(env, dir, root, P.basename(tempName(env, real, 'backup')), snapshot.text, MODE_SECRET);

			if (staged == 'changed') {
				return changed();
			};

			temp = staged;
			env.chmod(temp.path, MODE_SECRET);

			if (!sameDir(env, dir, root)) {
				return abandon();
			};

			env.rename(temp.path, backup);
			keepTemp(temp);
			temp = null;
		};

		const staged = stageTemp(env, dir, root, P.basename(tempName(env, real, 'new')), text, secret ? MODE_SECRET : mode);

		if (staged == 'changed') {
			return changed();
		};

		temp = staged;
		env.chmod(temp.path, mode);

		for (let attempt = 0; ; attempt++) {
			if (!sameDir(env, dir, root) || !unchangedSince(env, real, snapshot)) {
				return abandon();
			};

			try {
				env.rename(temp.path, real);
				keepTemp(temp);
				temp = null;
				break;
			} catch (e) {
				if ((env.platform != 'win32') || !isBusy(e) || (attempt >= RENAME_RETRIES)) {
					throw e;
				};
				await env.sleep(RENAME_RETRY_MS);
			};
		};
	} catch (e) {
		if (temp) {
			discardTemp(env, temp);
		};
		removeCreatedDirs(env, created);
		return { ok: false, error: { stage: 'write', category: ((e as any)?.code == 'EACCES') ? 'permission' : 'unknown', path: real } };
	};

	return { ok: true, createdDirs: created };
};
