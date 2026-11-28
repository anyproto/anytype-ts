/**
 * Test helpers (imported by *.test.ts only): a real Env on a temp home, and an in-memory Env with a
 * fake file system (POSIX or Windows paths) that keeps the same contracts as the real one:
 * exclusive creates that hand back a held temp (wipe / close), regular-file reads with a size cap and
 * no-follow, rmdir only when empty, owners, ENOENT-only "missing".
 */
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import type { AddressInfo } from 'net';
import os from 'os';
import path from 'path';
import { test } from 'vitest';
import type { Env, ReadError, RunOptions, RunResult } from './types';
import { createNodeEnv } from './exec';

/** A fresh temp dir with links resolved (macOS: /var → /private/var) */
export const tempDir = (prefix = 'aic-'): string => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));

/**
 * Real symbolic links can be created here. Windows without Developer Mode or the privilege refuses
 * them with EPERM: tests that need a real link are skipped there (the fake file system still covers
 * the refusal logic); any other failure is not hidden.
 */
export const symlinksWork = ((): boolean => {
	if (process.platform != 'win32') {
		return true;
	};

	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aic-link-'));

	try {
		fs.writeFileSync(path.join(dir, 'target'), '');
		fs.symlinkSync(path.join(dir, 'target'), path.join(dir, 'link'));
		return true;
	} catch (e) {
		return (e as any)?.code != 'EPERM';
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	};
})();

/** `test` for a test that creates real symbolic links; skipped where they can't be created (see symlinksWork) */
export const testLink = symlinksWork ? test : test.skip;

/**
 * A Node that honours NODE_USE_ENV_PROXY (24+), for the tests that prove a bearer never goes through an
 * environment proxy: this test runner's own Node, or null when it is older. Nothing in the feature starts
 * Electron in Node mode any more.
 */
export const proxyAwareNode = ((): string | null => (Number(process.versions.node.split('.')[0]) >= 24) ? process.execPath : null)();

/** The environment that would send Node's HTTP clients through `proxyPort` */
export const envProxyVars = (proxyPort: number): Record<string, string> => ({
	NODE_USE_ENV_PROXY: '1',
	HTTP_PROXY: `http://127.0.0.1:${proxyPort}`,
	http_proxy: `http://127.0.0.1:${proxyPort}`,
	HTTPS_PROXY: `http://127.0.0.1:${proxyPort}`,
	https_proxy: `http://127.0.0.1:${proxyPort}`,
	NO_PROXY: '',
	no_proxy: '',
});

/** A local HTTP proxy that records every request and CONNECT it receives (and answers 502) */
export const recordingProxy = async (): Promise<{ port: number; seen: string[]; close: () => Promise<void> }> => {
	const seen: string[] = [];
	const server = http.createServer((req, res) => {
		seen.push(`${req.method} ${req.url} auth=${req.headers.authorization || ''}`);
		res.writeHead(502).end();
	});

	server.on('connect', (req, socket) => {
		seen.push(`CONNECT ${req.url}`);
		socket.end('HTTP/1.1 502 Bad Gateway\r\n\r\n');
	});
	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
	return {
		port: (server.address() as AddressInfo).port,
		seen,
		close: () => new Promise<void>(resolve => server.close(() => resolve())),
	};
};

/** Runs `file` with `args` in the given runtime; stdin closed; killed after `timeoutMs` */
export const runChild = (runtime: string, args: string[], env: Record<string, string>, opt: { cwd?: string; stdin?: string; timeoutMs?: number } = {}): Promise<{ code: number; stdout: string; stderr: string }> => new Promise(resolve => {
	const child = spawn(runtime, args, { cwd: opt.cwd, env: { PATH: process.env.PATH, ...env }, stdio: [ 'pipe', 'pipe', 'pipe' ] });
	let stdout = '';
	let stderr = '';
	const timer = setTimeout(() => child.kill('SIGKILL'), opt.timeoutMs || 15000);

	child.stdout.on('data', d => stdout += d);
	child.stderr.on('data', d => stderr += d);
	child.on('close', code => {
		clearTimeout(timer);
		resolve({ code, stdout, stderr });
	});
	child.stdin.end(opt.stdin || '');
});

/** The real Env with `home` as the user's home and an empty environment */
export const nodeEnv = (home: string, extra: Partial<Env> = {}): Env => ({
	...createNodeEnv({ home, appRoot: home, vars: {} }),
	...extra,
});

export const modeOf = (p: string): number => fs.statSync(p).mode & 0o777;

export const FAKE_UID = 501;

export interface RunCall {
	file: string;
	args: string[];
	opts: RunOptions;
};

export interface FakeSpec {
	platform: NodeJS.Platform;
	home: string;
	vars?: Record<string, string>;
	/** path → content */
	files?: Record<string, string>;
	dirs?: string[];
	/** path → target */
	links?: Record<string, string>;
	/** Special files (FIFOs, devices): exist, but are not regular files */
	fifos?: string[];
	/** Directories that exist but can't be listed, and files that can't be read */
	unreadable?: string[];
	/** Paths owned by another user */
	foreign?: string[];
	/** path → mode */
	modes?: Record<string, number>;
	run?: (call: RunCall) => RunResult | Promise<RunResult>;
	arch?: string;
	/** Folders on a `noexec` mount: nothing under them can be executed, whatever its mode */
	noexec?: string[];
	/**
	 * Windows: path → SIDs its owner / allow entries name besides the user, SYSTEM and Administrators. The fake
	 * answers forwarder.ts's ACL query (`privateOnWindows`) from this; `null` makes the query fail
	 */
	acl?: Record<string, string[]> | null;
	/**
	 * The build's metadata text (Env.buildMeta). Default: computed from the forwarder and the bundle among
	 * `files` (an unsigned development build; `signed: true` makes it a release build). null: no metadata.
	 */
	meta?: string | null;
	signed?: boolean;
	/** Answers a forwarder call before the built-in fake does (return null to fall through) */
	forwarder?: (call: RunCall, state: ForwarderState) => RunResult | null;
};

// ---------------------- a fake `anytype-mcp` (the Rev 6 contract, in memory) ---------------------- //

export interface ForwarderState {
	/**
	 * What `anytype-mcp endpoint` answers. null (default): the endpoint file of this flavour as the fake file
	 * system holds it — `{"ok":true,"port":N}` when it is there and valid, else `missing`
	 */
	verdict: { ok: true; port: number } | { ok: false; reason: string; path?: string; rule?: string } | null;
	/** What `version --json` reports, per file (default: FAKE_REV and the build's namespace) */
	versions: Map<string, { rev: number; namespace: string }>;
	calls: RunCall[];
};

export const FAKE_SID = 'S-1-5-21-1111-2222-3333-1001';
export const FAKE_REV = 6;
export const FAKE_SIGNER = 'ab'.repeat(32);
export const FAKE_TEAM = 'TEAM123456';

const line = (code: number, value: any): RunResult => ({ code, stdout: JSON.stringify(value) + '\n' });

/**
 * One verb of the fake forwarder (`file` is the binary it was started as); null when the call isn't one it
 * answers (e.g. `serve`). `readEndpoint` gives the endpoint file's text, or null.
 */
export const fakeForwarderRun = (state: ForwarderState, call: RunCall, namespace = 'dev', readEndpoint: () => string | null = () => null): RunResult | null => {
	const [ verb, ...rest ] = call.args;

	if ((verb == 'version') && (rest[0] == '--json')) {
		const v = state.versions.get(call.file) || { rev: FAKE_REV, namespace };
		return line(0, { version: 'dev', commit: 'fake', rev: v.rev, namespace: v.namespace, impl: 'go' });
	};
	if (verb != 'endpoint') {
		return null;
	};
	if (state.verdict) {
		return line(state.verdict.ok ? 0 : 1, state.verdict);
	};

	let data: any = null;

	try {
		data = JSON.parse(readEndpoint() || '');
	} catch (e) { /* missing or invalid */ };

	if (!data) {
		return line(1, { ok: false, reason: 'missing' });
	};
	return ((data.v === 1) && Number.isInteger(data.port)) ? line(0, { ok: true, port: data.port }) : line(1, { ok: false, reason: 'invalid' });
};

type Entry = ({ type: 'file'; text: string } | { type: 'dir' } | { type: 'link'; target: string } | { type: 'fifo' }) & { mode: number; ino: number; uid: number; mtime?: number };

const fsError = (code: string, p: string): Error => Object.assign(new Error(`${code}: ${p}`), { code });

export interface FakeClipboard {
	text: string;
	/** Every text written, in order */
	writes: string[];
	/** Pending Env.setTimer callbacks (tests fire them with `fireTimers`) */
	timers: { fn: () => void; at: number }[];
};

export type FakeEnv = Env & {
	calls: RunCall[];
	clip: FakeClipboard;
	/** Runs every timer due at env.now() */
	fireTimers: () => void;
	/** The fake forwarder's store and the calls it got */
	forwarder: ForwarderState;
	files: () => Record<string, string>;
	dirs: () => string[];
	modeOf: (p: string) => number;
};

export const fakeEnv = (spec: FakeSpec): FakeEnv => {
	const P = (spec.platform == 'win32') ? path.win32 : path.posix;
	const key = (p: string) => {
		const n = P.normalize(p).replace(/[\\/]+$/, '') || P.sep;
		return (spec.platform == 'win32') ? n.toLowerCase() : n;
	};
	const uid = (spec.platform == 'win32') ? null : FAKE_UID;
	const ownerOf = (p: string) => (spec.foreign || []).some(f => key(f) == key(p)) ? 0 : (uid ?? -1);
	const entries = new Map<string, Entry>();
	const names = new Map<string, string>();
	const unreadable = new Set((spec.unreadable || []).map(key));
	let ino = 1;

	const put = (p: string, e: Entry) => {
		entries.set(key(p), e);
		names.set(key(p), P.normalize(p));
	};
	const drop = (p: string) => {
		entries.delete(key(p));
		names.delete(key(p));
	};
	const make = (p: string, e: any, mode: number): Entry => ({ ...e, mode: spec.modes?.[p] ?? mode, ino: ino++, uid: ownerOf(p) });
	const add = (p: string, e: Entry) => {
		put(p, e);

		for (let d = P.dirname(p); ; d = P.dirname(d)) {
			if (!entries.has(key(d))) {
				put(d, make(d, { type: 'dir' }, 0o755));
			};
			if (P.dirname(d) == d) {
				break;
			};
		};
	};

	add(spec.home, make(spec.home, { type: 'dir' }, 0o755));
	(spec.dirs || []).forEach(d => add(d, make(d, { type: 'dir' }, 0o755)));
	Object.entries(spec.files || {}).forEach(([ p, text ]) => add(p, make(p, { type: 'file', text }, 0o644)));
	Object.entries(spec.links || {}).forEach(([ p, target ]) => add(p, make(p, { type: 'link', target }, 0o777)));
	(spec.fifos || []).forEach(p => add(p, make(p, { type: 'fifo' }, 0o644)));

	/** Resolves links component by component; null when something on the way is missing */
	const resolve = (p: string): string | null => {
		const abs = P.resolve(p);
		const root = P.parse(abs).root;
		const parts = abs.slice(root.length).split(/[\\/]+/).filter(Boolean);
		let cur = root;

		for (let i = 0; i < parts.length; i++) {
			cur = P.join(cur, parts[i]);

			const e = entries.get(key(cur));
			if (!e) {
				return null;
			};
			if (e.type == 'link') {
				const next = resolve(P.resolve(P.dirname(cur), e.target));
				if (!next) {
					return null;
				};
				cur = next;
			};
		};
		return names.get(key(cur)) || cur;
	};

	/** The path of the entry itself: its parent resolved, the last component not followed */
	const locate = (p: string): string => {
		const parent = resolve(P.dirname(P.resolve(p)));
		return parent ? P.join(parent, P.basename(p)) : P.resolve(p);
	};

	const parentDir = (p: string): Entry | undefined => {
		const real = resolve(P.dirname(P.resolve(p)));
		const e = real ? entries.get(key(real)) : undefined;
		return (e && (e.type == 'dir')) ? e : undefined;
	};

	const readFile = (p: string, maxBytes: number, opt: { noFollow?: boolean } = {}): { data: Buffer } | { error: ReadError } => {
		if (opt.noFollow && (entries.get(key(locate(p)))?.type == 'link')) {
			return { error: 'notFile' };
		};

		const real = resolve(p);
		const e = real ? entries.get(key(real)) : null;

		if (!e) {
			return { error: 'missing' };
		};
		if (unreadable.has(key(real))) {
			return { error: 'io' };
		};
		if (e.type != 'file') {
			return { error: 'notFile' };
		};

		const data = Buffer.from(e.text, 'utf8');
		return (data.length > maxBytes) ? { error: 'tooLarge' } : { data };
	};

	const calls: RunCall[] = [];
	const appRoot = (spec.platform == 'win32') ? 'C:\\Program Files\\Anytype\\resources\\app.asar.unpacked' : '/Applications/Anytype.app/Contents/Resources/app.asar.unpacked';
	const arch = spec.arch || ((spec.platform == 'darwin') ? 'arm64' : 'x64');
	const forwarderPath = P.join(appRoot, 'dist', (spec.platform == 'win32') ? 'anytype-mcp.exe' : 'anytype-mcp');
	const forwarder: ForwarderState = { verdict: null, versions: new Map(), calls: [] };
	const sha = (text: string): string => crypto.createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
	const initial = (p: string): string | undefined => Object.entries(spec.files || {}).find(([ k ]) => key(k) == key(p))?.[1];
	/** What scripts/build-mcp.js would have written for the files this machine started with */
	const defaultMeta = (): string | null => {
		const binary = initial(forwarderPath);
		const bundle = initial(P.join(appRoot, 'dist', 'mcp', 'Anytype.mcpb'));
		const platformKey = (spec.platform == 'darwin') ? 'darwin' : ((spec.platform == 'win32') ? 'win32-x64' : `linux-${arch}`);

		if ((binary === undefined) && (bundle === undefined)) {
			return null;
		};
		return JSON.stringify({
			signed: !!spec.signed,
			forwarder: (binary === undefined) ? null : { rev: FAKE_REV, namespace: spec.signed ? 'release' : 'dev', ...(spec.signed ? { teamId: FAKE_TEAM } : {}), sha256: { [platformKey]: sha(binary) } },
			mcpb: (bundle === undefined) ? null : { sha256: sha(bundle), version: `2.${FAKE_REV}.0`, ...(spec.signed ? { signerFingerprint: FAKE_SIGNER } : {}) },
		});
	};

	const clip: FakeClipboard = { text: '', writes: [], timers: [] };
	const env: FakeEnv = {
		calls,
		forwarder,
		clip,
		fireTimers: () => {
			const due = clip.timers.filter(t => t.at <= env.now());

			clip.timers = clip.timers.filter(t => t.at > env.now());
			due.forEach(t => t.fn());
		},
		arch,
		buildMeta: () => (spec.meta !== undefined) ? spec.meta : defaultMeta(),
		files: () => {
			const ret: Record<string, string> = {};
			entries.forEach((e, k) => {
				if (e.type == 'file') {
					ret[names.get(k)] = e.text;
				};
			});
			return ret;
		},
		dirs: () => {
			const ret: string[] = [];
			entries.forEach((e, k) => {
				if (e.type == 'dir') {
					ret.push(names.get(k));
				};
			});
			return ret;
		},
		modeOf: p => entries.get(key(locate(p)))?.mode ?? -1,
		platform: spec.platform,
		home: spec.home,
		uid,
		vars: spec.vars || {},
		execPath: (spec.platform == 'win32') ? 'C:\\Program Files\\Anytype\\Anytype.exe' : '/Applications/Anytype.app/Contents/MacOS/Anytype',
		appRoot,
		exists: p => !!resolve(p),
		lstat: p => {
			const e = entries.get(key(locate(p)));
			return e ? { isSymlink: e.type == 'link', isDir: e.type == 'dir', isFile: e.type == 'file', mode: e.mode, uid: e.uid, mtimeMs: e.mtime ?? 0 } : null;
		},
		stat: p => {
			const real = resolve(p);
			const e = real ? entries.get(key(real)) : null;
			return e ? { dev: 1, ino: e.ino, mode: e.mode, isDir: e.type == 'dir', isFile: e.type == 'file' } : null;
		},
		realpath: p => resolve(p),
		readFile,
		readText: p => {
			const res = readFile(p, 8 * 1024 * 1024);
			return ('data' in res) ? res.data.toString('utf8') : null;
		},
		readDir: p => {
			const real = resolve(p);
			if (!real) {
				return [];
			};
			if (unreadable.has(key(real))) {
				return null;
			};

			const k = key(real);
			const ret: string[] = [];

			names.forEach((name, nk) => {
				if ((nk != k) && (key(P.dirname(name)) == k)) {
					ret.push(P.basename(name));
				};
			});
			return ret;
		},
		writeFile: (p, data, mode) => {
			const at = locate(p);

			if (entries.has(key(at))) {
				throw fsError('EEXIST', p);
			};
			if (!parentDir(p)) {
				throw fsError('ENOENT', p);
			};

			const entry: Entry = { type: 'file', text: String(data), mode, ino: ino++, uid: uid ?? -1, mtime: env.now() };
			let open = true;

			put(at, entry);
			return {
				dev: 1,
				ino: entry.ino,
				// Through the "descriptor": the entry itself, wherever it has been moved since
				wipe: () => {
					if (open && (entry.type == 'file')) {
						entry.text = '';
					};
				},
				close: () => {
					open = false;
				},
			};
		},
		fsyncDir: () => {},
		rename: (from, to) => {
			const src = locate(from);
			const dst = locate(to);
			const e = entries.get(key(src));

			if (!e) {
				throw fsError('ENOENT', from);
			};
			if (!parentDir(to) || (entries.get(key(dst))?.type == 'dir')) {
				throw fsError('ENOENT', to);
			};
			drop(src);
			put(dst, e);
		},
		canExecute: p => {
			const real = resolve(p);
			const e = real ? entries.get(key(real)) : null;

			return !!e && (e.type == 'file') && !!(e.mode & 0o100) && !(spec.noexec || []).some(d => key(real).startsWith(key(d) + P.sep));
		},
		chmod: (p, mode) => {
			const real = resolve(p);
			const e = real ? entries.get(key(real)) : null;

			if (!e) {
				throw fsError('ENOENT', p);
			};
			e.mode = mode;
		},
		mkdir: (p, mode) => {
			const at = locate(p);

			if (entries.has(key(at))) {
				throw fsError('EEXIST', p);
			};
			if (!parentDir(p)) {
				throw fsError('ENOENT', p);
			};
			put(at, { type: 'dir', mode, ino: ino++, uid: uid ?? -1, mtime: env.now() });
		},
		rmdir: p => {
			const at = locate(p);
			const e = entries.get(key(at));

			if (!e || (e.type != 'dir')) {
				throw fsError('ENOTDIR', p);
			};

			const k = key(at);
			const busy = [ ...names.values() ].some(n => (key(n) != k) && (key(P.dirname(n)) == k));

			if (busy) {
				throw fsError('ENOTEMPTY', p);
			};
			drop(at);
		},
		unlink: p => {
			const at = locate(p);
			const e = entries.get(key(at));

			if (!e || (e.type == 'dir')) {
				throw fsError('ENOENT', p);
			};
			drop(at);
		},
		run: async (file, args, opts) => {
			const call = { file, args, opts };

			calls.push(call);

			// The in-app forwarder or a stable copy: a test's own answer first, then the in-memory fake
			if ((key(file) == key(forwarderPath)) || (/^anytype-mcp(\.exe)?$/.test(P.basename(file)) && [ 'bin', 'bin-dev' ].includes(P.basename(P.dirname(file))))) {
				forwarder.calls.push(call);

				const endpointFile = P.join(spec.home, '.anytype', 'ai-connect', spec.signed ? 'endpoint.json' : 'endpoint-dev.json');
				const readEndpoint = (): string | null => {
					const e = entries.get(key(endpointFile));
					return (e?.type == 'file') ? e.text : null;
				};
				const res = spec.forwarder?.(call, forwarder) || fakeForwarderRun(forwarder, call, spec.signed ? 'release' : 'dev', readEndpoint);

				if (res) {
					return res;
				};
			};
			// forwarder.ts's "who may replace the stable copy" query (S5): the user, SYSTEM and Administrators, plus `spec.acl`
			if (opts.env?.ANYTYPE_MCP_ACL_PATHS) {
				if (spec.acl === null) {
					return { code: 1, stdout: '' };
				};

				const foreign = (p: string): string[] => Object.entries(spec.acl || {}).find(([ k ]) => key(k) == key(p))?.[1] || [];
				const sids = (p: string) => [ FAKE_SID, 'S-1-5-18', 'S-1-5-32-544', ...foreign(p) ].join(',');
				// The home: its owner, and Full control for each SID (a foreign one may replace its children)
				const home = [ `${FAKE_SID}:-1`, ...[ FAKE_SID, 'S-1-5-18', 'S-1-5-32-544', ...foreign(opts.env.ANYTYPE_MCP_ACL_HOME) ].map(sid => `${sid}:2032127`) ].join(',');
				const paths = opts.env.ANYTYPE_MCP_ACL_PATHS.split('|');

				return { code: 0, stdout: [ `user|${FAKE_SID}`, `home|${home}`, ...paths.map(p => `path|${sids(p)}`), 'end|', '' ].join('\r\n') };
			};
			return spec.run ? spec.run(call) : { code: 1, stdout: '' };
		},
		launch: async () => false,
		listProcesses: async () => null,
		kill: () => false,
		openExternal: async () => false,
		protocolHandler: async () => null,
		showItemInFolder: () => {},
		clipboardRead: () => clip.text,
		clipboardWrite: text => {
			clip.text = text;
			clip.writes.push(text);
		},
		setTimer: (fn, ms) => {
			const t = { fn, at: env.now() + ms };

			clip.timers.push(t);
			return () => {
				clip.timers = clip.timers.filter(it => it !== t);
			};
		},
		now: () => 1000,
		sleep: async () => {},
	};

	return env;
};
