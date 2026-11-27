/**
 * `anytype-mcp`, the Go stdio forwarder from heart (plan anytype-mcp-plan.md §4): where it is, whether this
 * build may use it, and the stable copy other apps start.
 *
 * - In-app: `<appRoot>/dist/anytype-mcp[.exe]` (asar-unpacked). Main pipes keys only to this one, and only
 *   after its sha256 was compared with the build's metadata (electron/json/aiConnect.build.json, read from
 *   inside app.asar).
 * - Stable copy: `~/.anytype/bin/anytype-mcp[.exe]` (`bin-dev` for a build whose metadata says
 *   `signed: false`), the only path Anytype writes into another app's settings. `.rev` beside it is written
 *   BEFORE the binary. macOS and Windows never downgrade a copy with a higher revision and our signature;
 *   on Linux the running Anytype always installs its own (C2 of caller-binding-plan.md).
 * - Not supported: Snap, Flatpak and an AppImage in portable-home mode. Those keep the URL routes.
 *
 * Nothing here starts Electron in Node mode, and nothing here reads or writes the forwarder's items.
 */
import crypto from 'crypto';
import type { AiError, Env } from './types';
import { MODE_DIR, canonicalPath, pathOf } from './fsSafe';
import { UTF8_OUTPUT } from './restart';
import { powershellPath, systemRoot } from './detect';

export const FORWARDER = 'anytype-mcp';
/** The code-signing identifier of the forwarder on macOS; never changes (§5) */
export const FORWARDER_IDENTIFIER = 'com.anytype.mcp';
const MAX_BINARY_BYTES = 64 * 1024 * 1024;
const LOCK_STALE_MS = 60 * 1000;
const LOCK_WAIT_MS = 10 * 1000;
const LOCK_RETRY_MS = 200;

export type Namespace = 'release' | 'dev';

export interface BuildMeta {
	/** A release build: the forwarder is the release-namespace one, code-signed where the OS has signatures */
	signed: boolean;
	forwarder: {
		rev: number;
		namespace: Namespace;
		/** Per platform key (`darwin`, `win32-x64`, `linux-x64`, `linux-arm64`); only this build's are present */
		sha256: Record<string, string>;
		/** macOS: the Team ID the forwarder was signed with */
		teamId?: string;
	} | null;
	mcpb: { sha256: string; signerFingerprint?: string; version: string } | null;
};

export interface ServeCommand {
	command: string;
	args: string[];
};

const isSha = (v: any): boolean => (typeof v == 'string') && /^[0-9a-f]{64}$/.test(v);

export const sha256 = (data: Buffer | string): string => crypto.createHash('sha256').update(data).digest('hex');

/** The build's metadata; null when it is missing or not in the expected shape (the stdio routes are then refused) */
export const buildMeta = (env: Env): BuildMeta | null => {
	let data: any = null;

	try {
		data = JSON.parse(env.buildMeta() || '');
	} catch (e) {
		return null;
	};

	if (!data || (typeof data != 'object') || (typeof data.signed != 'boolean')) {
		return null;
	};

	const ret: BuildMeta = { signed: data.signed, forwarder: null, mcpb: null };
	const f = data.forwarder;
	const m = data.mcpb;

	if (f && Number.isSafeInteger(f.rev) && (f.rev > 0) && [ 'release', 'dev' ].includes(f.namespace) && f.sha256 && (typeof f.sha256 == 'object')
		&& Object.keys(f.sha256).every(k => isSha(f.sha256[k]))) {
		ret.forwarder = { rev: f.rev, namespace: f.namespace, sha256: { ...f.sha256 } };
		if ((typeof f.teamId == 'string') && /^[A-Z0-9]{1,32}$/.test(f.teamId)) {
			ret.forwarder.teamId = f.teamId;
		};
	};
	if (m && isSha(m.sha256) && (typeof m.version == 'string') && (!data.signed || isSha(m.signerFingerprint))) {
		ret.mcpb = { sha256: m.sha256, version: m.version };
		if (isSha(m.signerFingerprint)) {
			ret.mcpb.signerFingerprint = m.signerFingerprint;
		};
	};
	return ret;
};

/** The metadata key of this machine's forwarder */
export const platformKey = (env: Env): string => {
	if (env.platform == 'darwin') {
		return 'darwin';
	};
	if (env.platform == 'win32') {
		return 'win32-x64';
	};
	return `${env.platform}-${env.arch}`;
};

const exeName = (env: Env): string => (env.platform == 'win32') ? `${FORWARDER}.exe` : FORWARDER;

/** Other apps can start the forwarder: not from a Snap, a Flatpak, or an AppImage in portable-home mode */
export const stdioSupported = (env: Env): boolean => {
	if (env.platform != 'linux') {
		return true;
	};
	if (env.vars.SNAP || env.vars.FLATPAK_ID) {
		return false;
	};
	// Portable-home mode: a `<AppImage>.home` folder next to the image becomes $HOME, so `~/.anytype` would move with it
	return !(env.vars.APPIMAGE && env.exists(`${env.vars.APPIMAGE}.home`));
};

/** The forwarder inside the app */
export const bundled = (env: Env): string => pathOf(env).join(env.appRoot, 'dist', exeName(env));

const anytypeDir = (env: Env): string => pathOf(env).join(env.home, '.anytype');

/** `bin` for a release build, `bin-dev` for every other one (never the production copy) */
export const stableDir = (env: Env): string => pathOf(env).join(anytypeDir(env), buildMeta(env)?.signed ? 'bin' : 'bin-dev');

/** The stable copy: the only forwarder path Anytype writes into another app's settings */
export const stable = (env: Env): string => pathOf(env).join(stableDir(env), exeName(env));

/** One command shape for preview, install, digest and heal; no `env` field */
export const serveCommand = (env: Env, id: string): ServeCommand => ({ command: stable(env), args: [ 'serve', '--connection', id ] });

/**
 * Where the forwarder keeps a connection's item. A label only (previews, the record's target, Replace):
 * anytype-ts never reads or writes anything in `items` or `items-dev`.
 */
export const itemLabel = (env: Env, id: string): string => {
	const ns = buildMeta(env)?.forwarder?.namespace;
	const raw = pathOf(env).join(anytypeDir(env), 'ai-connect', (ns == 'release') ? 'items' : 'items-dev', `${id}.item`);

	return canonicalPath(env, raw) || raw;
};

const fail = (stage: AiError['stage'], category: AiError['category'], path?: string): { ok: false; error: AiError } => ({ ok: false, error: { stage, category, ...(path ? { path } : {}) } });

export type Usable = { ok: true; path: string; sha256: string; meta: BuildMeta; data: Buffer } | { ok: false; error: AiError };

/**
 * The in-app forwarder may be used now: a supported package, metadata that names it, a namespace that
 * agrees with `signed`, and bytes whose sha256 equals the metadata. Checked before a key is piped to it
 * and before it is copied.
 */
export const usable = (env: Env): Usable => {
	if (!stdioSupported(env)) {
		return fail('detect', 'unsupportedPackage');
	};

	const meta = buildMeta(env);
	const expected = meta?.forwarder?.sha256[platformKey(env)];

	if (!meta || !meta.forwarder || !expected || (meta.signed != (meta.forwarder.namespace == 'release'))) {
		return fail('verify', 'notFound');
	};

	const file = bundled(env);
	const res = env.readFile(file, MAX_BINARY_BYTES);

	if (!('data' in res)) {
		return fail('verify', 'notFound', file);
	};

	const actual = sha256(res.data);
	return (actual == expected) ? { ok: true, path: file, sha256: actual, meta, data: res.data } : fail('verify', 'notFound', file);
};

/**
 * The file carries our code signature (asked only before a higher-revision copy is left alone, and before
 * a Windows copy that can't be replaced is kept). A build without signatures (`signed: false`, Linux) has
 * nothing to check.
 */
export const signedByUs = async (env: Env, file: string, meta: BuildMeta): Promise<boolean> => {
	if (!meta.signed || (env.platform == 'linux')) {
		return true;
	};
	if (env.platform == 'darwin') {
		if (!meta.forwarder?.teamId) {
			return false;
		};

		const requirement = `identifier "${FORWARDER_IDENTIFIER}" and anchor apple generic and certificate leaf[subject.OU] = "${meta.forwarder.teamId}"`;
		return (await env.run('/usr/bin/codesign', [ '--verify', '--strict', `-R=${requirement}`, file ], { timeout: 15000 })).code == 0;
	};

	// Windows: both signatures valid, and the copy's signer is the in-app forwarder's signer
	const script = `${UTF8_OUTPUT} $a = Get-AuthenticodeSignature -LiteralPath $env:ANYTYPE_MCP_OURS; $b = Get-AuthenticodeSignature -LiteralPath $env:ANYTYPE_MCP_COPY; `
		+ `if (($a.Status -eq 'Valid') -and ($b.Status -eq 'Valid') -and ($a.SignerCertificate.Subject -ceq $b.SignerCertificate.Subject)) { 'same-signer' } else { 'other' }`;
	const res = await env.run(powershellPath(env), [ '-NoProfile', '-NonInteractive', '-Command', script ], {
		timeout: 20000, env: { ANYTYPE_MCP_OURS: bundled(env), ANYTYPE_MCP_COPY: file },
	});

	return (res.code == 0) && (res.stdout.trim() == 'same-signer');
};

/**
 * Windows: a folder Anytype just created on the store path (`.anytype`, `ai-connect`) gets heart's protected
 * list at once — the user, SYSTEM and Administrators, inheritance off — or a home that Users may read would
 * make every later key verb `denied` (heart N9, Q17). Existing folders are never changed. False: the list
 * could not be set (the caller removes the empty folder).
 */
export const protectNewDir = async (env: Env, dir: string): Promise<boolean> => {
	if (env.platform != 'win32') {
		return true;
	};

	const who = await env.run(powershellPath(env), [ '-NoProfile', '-NonInteractive', '-Command', `${UTF8_OUTPUT} [Security.Principal.WindowsIdentity]::GetCurrent().User.Value` ], { timeout: 15000 });
	const sid = String(who.stdout || '').trim();

	if ((who.code != 0) || !/^S-1-[0-9-]{3,180}$/.test(sid)) {
		return false;
	};

	const icacls = pathOf(env).join(systemRoot(env), 'System32', 'icacls.exe');
	const res = await env.run(icacls, [ dir, '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F', '*S-1-5-32-544:(OI)(CI)F' ], { timeout: 15000 });

	return res.code == 0;
};

/**
 * A real directory of ours (created 0700 when missing; never a link); false otherwise. `shared`: `.anytype`,
 * which heart uses too — never chmod-ed, and refused when group or others may write it (they could swap
 * `bin` for a folder of theirs, Q18). `!shared`: our own `bin`, tightened to 0700. Windows: a folder created
 * here gets the protected list (`protectNewDir`); an existing one is judged by `privateOnWindows`.
 */
const ownDir = async (env: Env, dir: string, shared: boolean): Promise<boolean> => {
	let st = env.lstat(dir);

	if (!st) {
		try {
			env.mkdir(dir, MODE_DIR);
		} catch (e) {
			return false;
		};
		// Windows: `bin` too (S5) — the copy written into it inherits the list, so no other account can replace it
		if (!(await protectNewDir(env, dir))) {
			try {
				env.rmdir(dir);
			} catch (e) { /* not empty any more: left */ };
			return false;
		};
		st = env.lstat(dir);
	};
	if (!st || st.isSymlink || !st.isDir) {
		return false;
	};
	if ((env.platform == 'win32') || (env.uid === null)) {
		return true;
	};
	if (st.uid != env.uid) {
		return false;
	};
	if (shared) {
		return !(st.mode & 0o022);
	};
	if ((st.mode & 0o777) != MODE_DIR) {
		try {
			env.chmod(dir, MODE_DIR);
		} catch (e) {
			return false;
		};
	};
	return true;
};

const WIN_SYSTEM = 'S-1-5-18';
const WIN_ADMINS = 'S-1-5-32-544';
const SID_RE = /^S-1-[0-9-]{3,180}$/;

/** Stable copies whose folder and file passed `privateOnWindows` in this run */
const passedAcl = new WeakMap<Env, Set<string>>();

/**
 * Windows (S5): no other account can replace the stable copy — the owner and every allow entry of `bin` and
 * of the exe are the user, SYSTEM or Administrators (heart's own rule for its store). A restored or foreign
 * folder that grants anyone else anything is refused; nothing is repaired. A passing answer is kept for the
 * run: only an account that may already change the list could widen it, and such an account never passes.
 */
export const privateOnWindows = async (env: Env, dir: string, file: string): Promise<boolean> => {
	if (env.platform != 'win32') {
		return true;
	};

	const id = `${dir}|${file}`;

	if (passedAcl.get(env)?.has(id)) {
		return true;
	};

	// The paths go through the environment, never into the script text
	const script = `${UTF8_OUTPUT} $ErrorActionPreference = 'Stop'; $t = [Security.Principal.SecurityIdentifier]; `
		+ `'user|' + [Security.Principal.WindowsIdentity]::GetCurrent().User.Value; `
		+ `foreach ($p in @($env:ANYTYPE_MCP_ACL_DIR, $env:ANYTYPE_MCP_ACL_FILE)) { $a = Get-Acl -LiteralPath $p; `
		+ `$s = @($a.GetOwner($t).Value) + @($a.GetAccessRules($true, $true, $t) | Where-Object { $_.AccessControlType -eq 'Allow' } | ForEach-Object { $_.IdentityReference.Value }); `
		+ `'path|' + ($s -join ',') }; 'end|'`;
	const res = await env.run(powershellPath(env), [ '-NoProfile', '-NonInteractive', '-Command', script ], {
		timeout: 20000, env: { ANYTYPE_MCP_ACL_DIR: dir, ANYTYPE_MCP_ACL_FILE: file },
	});
	const lines = String(res.stdout || '').split(/\r?\n/).map(it => it.trim()).filter(Boolean);

	// Exactly: the user, one line per path, the end mark. Anything else is no answer
	if ((res.code != 0) || (lines.length != 4) || !lines[0].startsWith('user|') || (lines[3] != 'end|')) {
		return false;
	};

	const user = lines[0].slice(5);
	const allowed = new Set([ user, WIN_SYSTEM, WIN_ADMINS ]);

	if (!SID_RE.test(user)) {
		return false;
	};
	for (const line of lines.slice(1, 3)) {
		const sids = line.startsWith('path|') ? line.slice(5).split(',') : [];

		if (!sids.length || sids.some(sid => !SID_RE.test(sid) || !allowed.has(sid))) {
			return false;
		};
	};

	passedAcl.set(env, (passedAcl.get(env) || new Set()).add(id));
	return true;
};

const tempName = (env: Env, name: string): string => `.${name}.${env.now()}-${crypto.randomBytes(4).toString('hex')}.tmp`;

const tryUnlink = (env: Env, p: string): void => {
	try {
		env.unlink(p);
	} catch (e) { /* not there */ };
};

/**
 * Exclusive `.lock` in the folder (shared by all channels). Never spins (Q7): only "it exists" is contention —
 * any other failure to create it ends at once; a lock is stale by its modification time (over a minute), never
 * by its content, and only a plain file is ever removed; every retry sleeps and checks the deadline. null: not
 * acquired.
 */
export const withLock = async <T>(env: Env, dir: string, fn: () => Promise<T>, name = '.lock'): Promise<T | null> => {
	const lock = pathOf(env).join(dir, name);
	const until = env.now() + LOCK_WAIT_MS;

	for (;;) {
		try {
			env.writeFile(lock, String(env.now()), 0o600).close();
			break;
		} catch (e) {
			if ((e as any)?.code != 'EEXIST') {
				return null;
			};

			const st = env.lstat(lock);

			if (st && st.isFile && !st.isSymlink && (st.mtimeMs !== undefined) && ((env.now() - st.mtimeMs) > LOCK_STALE_MS)) {
				// Left by a dead installer; a removal that fails is contention like any other
				tryUnlink(env, lock);
			};
			if (env.now() >= until) {
				return null;
			};
			await env.sleep(LOCK_RETRY_MS);
		};
	};

	try {
		return await fn();
	} finally {
		tryUnlink(env, lock);
	};
};

/** Writes `name` in `dir` through an exclusive temp file and a rename */
const replaceFile = (env: Env, dir: string, name: string, data: Buffer | string, mode: number): void => {
	const P = pathOf(env);
	const temp = P.join(dir, tempName(env, name));
	const file = env.writeFile(temp, data, mode);

	try {
		env.chmod(temp, mode);
		env.rename(temp, P.join(dir, name));
	} catch (e) {
		file.wipe();
		tryUnlink(env, temp);
		throw e;
	} finally {
		file.close();
	};
};

export type InstallResult = { ok: true; path: string; installed: boolean } | { ok: false; error: AiError };

/**
 * Makes the stable copy usable (§4.2, §4.3) and returns its path:
 * - its sha256 equals the in-app forwarder's → used as it is;
 * - macOS / Windows: `.rev` names a higher revision and the copy carries our signature → left alone;
 * - anything else (Linux always) → `.rev` first, then the binary, each through a temp file and a rename.
 * Windows: the current exe is renamed aside first; when that is refused (a client holds it), a copy with
 * our signature stays in use, otherwise the stdio routes are unavailable until the next try.
 */
export const ensureInstalled = async (env: Env): Promise<InstallResult> => {
	const res = await install(env);

	// S5: handed out only when no other OS user can replace it — on every path that returns it
	if (res.ok && !(await privateOnWindows(env, stableDir(env), res.path))) {
		return fail('write', 'installFailed', res.path);
	};
	return res;
};

const install = async (env: Env): Promise<InstallResult> => {
	const own = usable(env);

	if (!('path' in own)) {
		return { ok: false, error: own.error };
	};

	const P = pathOf(env);
	const dir = stableDir(env);
	const name = exeName(env);
	const file = P.join(dir, name);
	const rev = own.meta.forwarder.rev;

	if (!(await ownDir(env, anytypeDir(env), true)) || !(await ownDir(env, dir, false))) {
		return fail('write', 'installFailed', dir);
	};

	const current = (): Buffer | null => {
		const st = env.lstat(file);

		if (!st || st.isSymlink || !st.isFile) {
			return null;
		};

		const res = env.readFile(file, MAX_BINARY_BYTES, { noFollow: true });
		return ('data' in res) ? res.data : null;
	};
	const same = (): boolean => {
		const data = current();
		return !!data && (sha256(data) == own.sha256);
	};

	/**
	 * POSIX: a copy a client can start and nobody else owns — ours, mode exactly 0755 (Q18), and the kernel
	 * agrees to run it (S5: a home mounted `noexec` passes the mode check and fails every client)
	 */
	const startable = (): boolean => {
		const st = env.lstat(file);

		if ((env.platform == 'win32') || (env.uid === null)) {
			return !!st;
		};
		return !!st && (st.uid == env.uid) && ((st.mode & 0o777) == 0o755) && env.canExecute(file);
	};
	/** Repairs the mode of a copy that is otherwise the right one; false when it can't be made startable */
	const makeStartable = (): boolean => {
		if (startable()) {
			return true;
		};
		try {
			env.chmod(file, 0o755);
		} catch (e) {
			return false;
		};
		return startable();
	};

	if (same() && startable()) {
		return { ok: true, path: file, installed: false };
	};

	const done = await withLock(env, dir, async (): Promise<InstallResult> => {
		// Another Anytype may have finished the same job while this one waited; right bytes with a wrong mode are repaired
		if (same()) {
			return makeStartable() ? { ok: true, path: file, installed: false } : fail('write', 'installFailed', file);
		};

		const st = env.lstat(file);
		const theirs = Number(String(env.readText(P.join(dir, `${name}.rev`)) || '').trim());

		// Something that isn't a regular file sits at the path: never written through, never removed
		if (st && (st.isSymlink || !st.isFile)) {
			return fail('write', 'installFailed', file);
		};
		if (st && (env.platform != 'linux') && Number.isSafeInteger(theirs) && (theirs > rev) && (await signedByUs(env, file, own.meta))) {
			return makeStartable() ? { ok: true, path: file, installed: false } : fail('write', 'installFailed', file);
		};

		try {
			replaceFile(env, dir, `${name}.rev`, `${rev}\n`, 0o644);

			if ((env.platform == 'win32') && st) {
				const aside = P.join(dir, `${name}.old-${crypto.randomBytes(4).toString('hex')}`);
				const temp = P.join(dir, tempName(env, name));
				const staged = env.writeFile(temp, own.data, 0o755);

				staged.close();
				try {
					env.rename(file, aside);
				} catch (e) {
					tryUnlink(env, temp);
					// A running client holds the exe: it stays only when it is one of ours
					return (await signedByUs(env, file, own.meta)) ? { ok: true, path: file, installed: false } : fail('write', 'installFailed', file);
				};
				try {
					env.rename(temp, file);
				} catch (e) {
					// Put the previous one back; the next start installs afresh
					try {
						env.rename(aside, file);
					} catch (e2) { /* left aside */ };
					tryUnlink(env, temp);
					return fail('write', 'installFailed', file);
				};
				tryUnlink(env, aside);
			} else {
				replaceFile(env, dir, name, own.data, 0o755);
			};
		} catch (e) {
			return fail('write', 'installFailed', file);
		};

		return (same() && startable()) ? { ok: true, path: file, installed: true } : fail('write', 'installFailed', file);
	});

	if (done && (env.platform == 'win32')) {
		// Set-aside copies of earlier updates that were still in use then
		for (const it of env.readDir(dir) || []) {
			if (it.startsWith(`${name}.old-`)) {
				tryUnlink(env, P.join(dir, it));
			};
		};
	};
	return done || fail('write', 'installFailed', dir);
};
