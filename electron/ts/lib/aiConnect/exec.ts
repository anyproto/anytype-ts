/**
 * Child processes: execFile / spawn with argument arrays, an explicit cwd, a deadline and stdin for
 * secrets. Never a shell string, and `shell` is always false. Output is returned, never logged.
 *
 * Also the real Env on node's fs: regular-file reads with a size cap, exclusive creates with a full
 * write + fsync, exclusive copies.
 */
import { execFile, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { CliName, Env, HomeVar, Homes, LstatInfo, ReadError, RunOptions, RunResult, TempFile } from './types';
import { pathOf } from './fsSafe';
import { listProcesses } from './restart';

const MAX_BUFFER = 4 * 1024 * 1024;
export const READ_TEXT_MAX = 8 * 1024 * 1024;
/** After the deadline: SIGTERM, then SIGKILL once this grace has passed */
export const KILL_GRACE_MS = 1000;

/**
 * The child's environment: the inherited one with `overlay` applied. A null value removes the variable.
 * On Windows names are case-insensitive, so every spelling of an overlaid name is replaced.
 */
export const childEnvironment = (base: NodeJS.ProcessEnv, overlay: Record<string, string | null> = {}, platform: NodeJS.Platform = process.platform): Record<string, string> => {
	const ret: Record<string, string> = {};

	for (const [ k, v ] of Object.entries(base)) {
		if (v !== undefined) {
			ret[k] = v;
		};
	};

	for (const [ k, v ] of Object.entries(overlay)) {
		for (const existing of Object.keys(ret)) {
			if ((platform == 'win32') ? (existing.toUpperCase() == k.toUpperCase()) : (existing == k)) {
				delete ret[existing];
			};
		};
		if (v !== null) {
			ret[k] = v;
		};
	};

	return ret;
};

const POLL_MS = 25;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/** A POSIX process group still has members (EPERM: it exists but belongs to someone else) */
const groupAlive = (pgid: number): boolean => {
	try {
		process.kill(-pgid, 0);
		return true;
	} catch (e) {
		return (e as any)?.code == 'EPERM';
	};
};

/** Waits until `gone()` holds or `ms` passed; true when it holds */
const waitFor = async (gone: () => boolean, ms: number): Promise<boolean> => {
	const end = Date.now() + ms;

	while (!gone()) {
		if (Date.now() >= end) {
			return false;
		};
		await sleep(POLL_MS);
	};
	return true;
};

/**
 * Windows: ends the child and everything it started (`taskkill /PID <pid> /T /F`, by full path).
 * Confirmed only when taskkill reports success.
 */
export const windowsTreeKill = async (pid: number, systemRoot: string, run: (file: string, args: string[]) => Promise<number>): Promise<boolean> => {
	const taskkill = path.win32.join(systemRoot || 'C:\\Windows', 'System32', 'taskkill.exe');
	return (await run(taskkill, [ '/PID', String(pid), '/T', '/F' ])) == 0;
};

const runTaskkill = (file: string, args: string[]): Promise<number> => new Promise(resolve => {
	try {
		execFile(file, args, { windowsHide: true, shell: false, timeout: 5000 }, (error: any) => resolve(error ? ((typeof error.code == 'number') ? error.code : -1) : 0));
	} catch (e) {
		resolve(-1);
	};
});

/**
 * The real `Env.run`. The deadline is ours, not execFile's. When it fires the result is `timedOut: true`
 * whatever the child does next, and the child is asked to stop (SIGTERM), then forced (SIGKILL) after a
 * short grace. The promise resolves only once what was stopped is gone, so whatever it wrote before
 * dying is on disk when the caller re-reads its work.
 *
 * `tree` (CLI calls that may write a key): the whole process tree counts, not just the launcher a CLI
 * shim may be. POSIX: the child leads its own process group (`detached`); a run is over only when the
 * group is empty, also after a normal exit (a worker the launcher left behind must finish within the
 * deadline); on timeout the group gets SIGTERM, then SIGKILL. Windows: `taskkill /T /F` on timeout.
 * When the end of the tree can't be confirmed the result is `indeterminate` (keep any pending key and
 * reconcile later). A process that leaves the group itself (setsid, a daemon) is not followed.
 */
export const runFile = (file: string, args: string[], opts: RunOptions & { cwd: string }): Promise<RunResult> => new Promise(resolve => {
	const win = process.platform == 'win32';
	const group = !!opts.tree && !win;
	let child: ReturnType<typeof execFile> | null = null;
	let settled = false;
	let deadlineFired = false;
	let deadline: ReturnType<typeof setTimeout> | null = null;

	const settle = (result: RunResult) => {
		if (!settled) {
			settled = true;
			if (deadline) {
				clearTimeout(deadline);
			};
			resolve(result);
		};
	};

	const exited = (): boolean => !!child && ((child.exitCode !== null) || (child.signalCode !== null));
	const pid = (): number => child?.pid || 0;

	const kill = (signal: NodeJS.Signals) => {
		try {
			if (group) {
				process.kill(-pid(), signal);
			} else {
				child.kill(signal);
			};
		} catch (e) { /* gone */ };
	};

	/** Asks, then forces; true once everything that was signalled is confirmed gone */
	const terminate = async (): Promise<boolean> => {
		if (!pid()) {
			return true;
		};

		const gone = group ? () => !groupAlive(pid()) : exited;

		if (win && opts.tree) {
			const killed = await windowsTreeKill(pid(), process.env.SystemRoot || '', runTaskkill);
			return (await waitFor(exited, KILL_GRACE_MS)) && killed;
		};

		kill('SIGTERM');
		if (await waitFor(gone, KILL_GRACE_MS)) {
			return true;
		};

		kill('SIGKILL');
		return waitFor(gone, KILL_GRACE_MS);
	};

	/** The child closed (exit + pipes): its result, once what the launcher left in its group is gone too */
	const closed = async (result: RunResult) => {
		if (group && pid()) {
			await waitFor(() => deadlineFired || !groupAlive(pid()), Number.MAX_SAFE_INTEGER);
		};
		if (!deadlineFired) {
			settle(result);
		};
	};

	try {
		// spawn, not execFile: execFile drops `detached`
		child = spawn(file, args, {
			cwd: opts.cwd,
			env: childEnvironment(process.env, opts.env),
			windowsHide: true,
			shell: false,
			detached: group,
			stdio: [ 'pipe', 'pipe', 'ignore' ],
		});
	} catch (e) {
		settle({ code: -1, stdout: '', notStarted: true });
		return;
	};

	const chunks: Buffer[] = [];
	let size = 0;
	let failed = false;
	// Q2: only a process that never started did nothing; one killed after it spawned may have done its work
	let spawned = false;

	child.once('spawn', () => {
		spawned = true;
	});

	child.stdout?.on('data', (chunk: Buffer) => {
		size += chunk.length;
		if (size > MAX_BUFFER) {
			// Output nobody asked for: stop it like a timeout would, report a failure
			failed = true;
			child.stdout.destroy();
			kill('SIGKILL');
			return;
		};
		chunks.push(chunk);
	});
	child.once('error', () => closed(spawned ? { code: -1, stdout: '' } : { code: -1, stdout: '', notStarted: true }));
	child.once('close', (code: number | null) => {
		const stdout = Buffer.concat(chunks).toString('utf8');
		closed({ code: (failed || (typeof code != 'number')) ? -1 : code, stdout });
	});

	deadline = setTimeout(async () => {
		deadlineFired = true;

		const confirmed = (exited() && !group) ? true : await terminate();

		settle(confirmed ? { code: -1, stdout: '', timedOut: true } : { code: -1, stdout: '', timedOut: true, indeterminate: true });
	}, opts.timeout);

	child.stdin?.on('error', () => {});

	if (opts.stdin !== undefined) {
		child.stdin?.end(opts.stdin);
	} else {
		child.stdin?.end();
	};
});

/** The real `Env.launch`: detached, resolves true on 'spawn' and false on 'error' */
export const launchDetached = (file: string, args: string[], cwd: string): Promise<boolean> => new Promise(resolve => {
	try {
		const child = spawn(file, args, { cwd, detached: true, stdio: 'ignore', shell: false });

		child.once('spawn', () => {
			child.unref();
			resolve(true);
		});
		child.once('error', () => resolve(false));
	} catch (e) {
		resolve(false);
	};
});

/** A CLI path that may be executed: absolute, and on Windows an .exe (a .cmd / .bat shim never runs) */
export const isRunnableCli = (env: Env, file: string | null): boolean => {
	if (!file || !pathOf(env).isAbsolute(file)) {
		return false;
	};

	return (env.platform != 'win32') || /\.exe$/i.test(file);
};

/** The override each CLI reads: a rejected one means the CLI is never run */
const CLI_HOME_VAR: Partial<Record<CliName, HomeVar>> = { claude: 'CLAUDE_CONFIG_DIR', codex: 'CODEX_HOME', copilot: 'COPILOT_HOME' };
const HOME_VARS: HomeVar[] = [ 'CODEX_HOME', 'COPILOT_HOME', 'CLAUDE_CONFIG_DIR' ];

/**
 * Runs a CLI discovery found, with exactly the environment discovery resolved: its PATH, each
 * config-home override as resolved (an override discovery found unset or cleared is removed, never
 * inherited from Anytype's own environment) and, on POSIX, HOME = env.home, so the CLI's default
 * profile is the one Anytype checked (an inherited alternate HOME can't redirect it). Secrets go on
 * stdin only. `extraEnv` can't change PATH, HOME or an override. The whole process tree is waited for
 * (`tree`). Refused (code -1, nothing run) for a shim, an unknown CLI, or a CLI whose override was rejected.
 */
export const runCli = async (env: Env, homes: Homes, name: CliName, args: string[], opts: { stdin?: string; timeout?: number; extraEnv?: Record<string, string> } = {}): Promise<RunResult> => {
	const file = homes.cli[name] || null;
	const homeVar = CLI_HOME_VAR[name];

	if (!isRunnableCli(env, file) || (homeVar && homes.rejected.includes(homeVar))) {
		return { code: -1, stdout: '' };
	};

	const childEnv: Record<string, string | null> = { ...(opts.extraEnv || {}), PATH: homes.path };

	for (const v of HOME_VARS) {
		childEnv[v] = homes.overrides[v] || null;
	};

	if (env.platform != 'win32') {
		childEnv.HOME = env.home;
	};

	return env.run(file, args, { timeout: opts.timeout || 15000, stdin: opts.stdin, env: childEnv, tree: true });
};

/** Only ENOENT is "missing": ENOTDIR (a file where a directory should be) and the rest are read errors */
const readError = (e: any): ReadError => {
	if (e?.code == 'ENOENT') {
		return 'missing';
	};
	return [ 'EISDIR', 'ELOOP' ].includes(e?.code) ? 'notFile' : 'io';
};

/**
 * A regular file, at most `maxBytes`, opened non-blocking so a FIFO can't stall the main process.
 * `noFollow`: O_NOFOLLOW where the platform has it (a link at the last component fails with ELOOP).
 */
export const readRegularFile = (p: string, maxBytes: number, opt: { noFollow?: boolean } = {}): { data: Buffer } | { error: ReadError } => {
	let fd = -1;

	try {
		fd = fs.openSync(p, fs.constants.O_RDONLY | (fs.constants.O_NONBLOCK || 0) | ((opt.noFollow && fs.constants.O_NOFOLLOW) || 0));

		const st = fs.fstatSync(fd);

		if (!st.isFile()) {
			return { error: 'notFile' };
		};
		if (st.size > maxBytes) {
			return { error: 'tooLarge' };
		};

		const chunks: Buffer[] = [];
		let total = 0;

		while (true) {
			const chunk = Buffer.alloc(64 * 1024);
			const n = fs.readSync(fd, chunk, 0, chunk.length, null);

			if (!n) {
				break;
			};

			total += n;
			if (total > maxBytes) {
				return { error: 'tooLarge' };
			};
			chunks.push(chunk.subarray(0, n));
		};

		return { data: Buffer.concat(chunks) };
	} catch (e) {
		return { error: readError(e) };
	} finally {
		if (fd >= 0) {
			try {
				fs.closeSync(fd);
			} catch (e) { /* closed */ };
		};
	};
};

const lstatInfo = (p: string): LstatInfo | null => {
	try {
		const st = fs.lstatSync(p);
		return { isSymlink: st.isSymbolicLink(), isDir: st.isDirectory(), isFile: st.isFile(), mode: st.mode & 0o777, uid: (process.platform == 'win32') ? -1 : st.uid, mtimeMs: st.mtimeMs };
	} catch (e) {
		return null;
	};
};

/**
 * The real Env.writeFile: an exclusive create ('wx' also refuses a link at `p`), a complete write and an
 * fsync; the descriptor stays open so the caller can still empty a temp its directory carried away.
 * A failure part-way empties the file through the descriptor and unlinks it while `p` still is that file.
 */
export const writeTempFile = (p: string, data: string | Buffer, mode: number): TempFile => {
	const fd = fs.openSync(p, 'wx', mode);
	const st = fs.fstatSync(fd);
	let open = true;

	const file: TempFile = {
		dev: st.dev,
		ino: st.ino,
		wipe: () => {
			if (open) {
				fs.ftruncateSync(fd, 0);
				fs.fsyncSync(fd);
			};
		},
		close: () => {
			if (open) {
				open = false;
				fs.closeSync(fd);
			};
		},
	};

	try {
		// writeFileSync on a descriptor loops until every byte is written
		fs.writeFileSync(fd, data);
		fs.fsyncSync(fd);
	} catch (e) {
		try {
			file.wipe();
		} catch (e2) { /* best effort */ };

		try {
			const now = fs.lstatSync(p);

			if (!now.isSymbolicLink() && (now.dev == st.dev) && (now.ino == st.ino)) {
				fs.unlinkSync(p);
			};
		} catch (e2) { /* gone */ };

		file.close();
		throw e;
	};

	return file;
};

/**
 * The real Env on top of node's fs and child_process. The Electron-only pieces (opening links,
 * protocol handlers, Finder / Explorer) are passed in by index.ts; tests use this with a temp home.
 */
export const createNodeEnv = (param: {
	home: string;
	appRoot: string;
	execPath?: string;
	vars?: Record<string, string>;
	openExternal?: Env['openExternal'];
	protocolHandler?: Env['protocolHandler'];
	showItemInFolder?: Env['showItemInFolder'];
	listProcesses?: Env['listProcesses'];
	buildMeta?: Env['buildMeta'];
	clipboardRead?: Env['clipboardRead'];
	clipboardWrite?: Env['clipboardWrite'];
}): Env => {
	const { home } = param;

	const env: Env = {
		platform: process.platform,
		arch: process.arch,
		home,
		uid: (typeof process.getuid == 'function') ? process.getuid() : null,
		vars: param.vars || ({ ...process.env } as Record<string, string>),
		execPath: param.execPath || process.execPath,
		appRoot: param.appRoot,
		buildMeta: param.buildMeta || (() => null),
		exists: p => fs.existsSync(p),
		lstat: lstatInfo,
		stat: p => {
			try {
				const st = fs.statSync(p);
				return { dev: st.dev, ino: st.ino, mode: st.mode & 0o777, isDir: st.isDirectory(), isFile: st.isFile() };
			} catch (e) {
				return null;
			};
		},
		realpath: p => {
			try {
				return fs.realpathSync.native(p);
			} catch (e) {
				return null;
			};
		},
		readFile: readRegularFile,
		readText: p => {
			const res = readRegularFile(p, READ_TEXT_MAX);
			return ('data' in res) ? res.data.toString('utf8') : null;
		},
		readDir: p => {
			try {
				return fs.readdirSync(p);
			} catch (e) {
				// A missing directory, or a file where one was expected: nothing to list
				return [ 'ENOENT', 'ENOTDIR' ].includes((e as any)?.code) ? [] : null;
			};
		},
		writeFile: writeTempFile,
		rename: (from, to) => fs.renameSync(from, to),
		fsyncDir: p => {
			if (process.platform == 'win32') {
				return;
			};

			const fd = fs.openSync(p, 'r');

			try {
				fs.fsyncSync(fd);
			} finally {
				fs.closeSync(fd);
			};
		},
		chmod: (p, mode) => fs.chmodSync(p, mode),
		canExecute: p => {
			try {
				fs.accessSync(p, fs.constants.X_OK);
				return true;
			} catch (e) {
				return false;
			};
		},
		mkdir: (p, mode) => fs.mkdirSync(p, { mode }),
		rmdir: p => fs.rmdirSync(p),
		unlink: p => fs.unlinkSync(p),
		run: (file, args, opts) => runFile(file, args, { ...opts, cwd: home }),
		launch: (file, args) => launchDetached(file, args, home),
		// Replaced below: restart.ts reads the list through this Env (ps / CIM / /proc)
		listProcesses: async () => null,
		kill: (pid, signal) => {
			try {
				process.kill(pid, signal);
				return true;
			} catch (e) {
				return false;
			};
		},
		openExternal: param.openExternal || (async () => false),
		protocolHandler: param.protocolHandler || (async () => null),
		showItemInFolder: param.showItemInFolder || (() => {}),
		clipboardRead: param.clipboardRead || (() => ''),
		clipboardWrite: param.clipboardWrite || (() => {}),
		setTimer: (fn, ms) => {
			const t = setTimeout(fn, ms);

			t.unref?.();
			return () => clearTimeout(t);
		},
		now: () => Date.now(),
		sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
	};

	env.listProcesses = param.listProcesses || (() => listProcesses(env));
	return env;
};
