/**
 * Quitting and relaunching another app, only after the user clicked "Restart <App>".
 *
 * - Identity by full executable path, never by image name (`claude.exe` is also Claude Code's CLI).
 *   Windows: the main process is the one without `--type=` (Electron helpers carry it); more than one
 *   candidate → unknown. A process list that couldn't be read → unknown: no quit, no config write.
 * - One graceful signal per process, ever (macOS SIGTERM, Windows `taskkill /PID` without /F); never
 *   escalated. Quit succeeds only when no matching process is left (a process list re-read after the
 *   signal); another instance that started meanwhile → `changed`. A refused quit (unsaved work) →
 *   `timeout`: one 10 s deadline from the first lookup, checked again after every lookup, so a late
 *   answer is a timeout, never a success. Several matching main processes = running, not unknown.
 * - Windows: the process list is read as UTF-8 (a non-ASCII profile path must not decode into another
 *   path); output that doesn't decode → unknown.
 * - Linux: running check only (for Claude's config fallback); no automatic quit or restart. Detection
 *   supplies no executable there (the `claude-desktop` launcher is a script, its process is Electron), so
 *   the state is `unknown` and the user confirms they quit Claude.
 */
import fs from 'fs';
import type { AiError, Detected, Env, ProcessInfo } from './types';
import { pathOf } from './fsSafe';
import { systemRoot, powershellPath } from './detect';

/** `running` with `pid: null`: several main processes match (none can be picked to signal, but it certainly runs) */
export type RunningState = { state: 'running'; pid: number | null } | { state: 'stopped' } | { state: 'unknown' };

export const POLL_MS = 250;
export const QUIT_WAIT_MS = 10000;

/** PowerShell: write the console output as UTF-8 without a BOM, whatever the code page */
export const UTF8_OUTPUT = '[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false;';

/** The commands used here, built without side effects (tested) */
export const buildCommands = (env: Env) => {
	const P = pathOf(env);
	const win = env.platform == 'win32';

	return {
		list: win
			? { file: powershellPath(env), args: [ '-NoProfile', '-NonInteractive', '-Command', `${UTF8_OUTPUT} Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, ExecutablePath, CommandLine | ConvertTo-Json -Compress` ] }
			: { file: '/bin/ps', args: [ '-axo', 'pid=,ppid=,comm=' ] },
		quit: (pid: number) => win
			? { file: P.join(systemRoot(env), 'System32', 'taskkill.exe'), args: [ '/PID', String(pid) ] }
			: null,
		launch: (det: Detected) => win
			? (det.exePath ? { file: det.exePath, args: [] as string[], detached: true } : null)
			: (det.appPath ? { file: '/usr/bin/open', args: [ '-a', det.appPath ], detached: false } : null),
	};
};

/** `ps -axo pid=,ppid=,comm=` output */
export const parsePs = (text: string): ProcessInfo[] => String(text || '').split(/\r?\n/).map(line => {
	const m = /^\s*(\d+)\s+(\d+)\s+(.+?)\s*$/.exec(line);
	return m ? { pid: Number(m[1]), ppid: Number(m[2]), exe: m[3], cmd: '' } : null;
}).filter(Boolean);

/** PowerShell `ConvertTo-Json` of Win32_Process rows (one object or an array) */
export const parseCim = (text: string): ProcessInfo[] | null => {
	let data: any = null;

	try {
		data = JSON.parse(String(text || '').replace(/^﻿/, ''));
	} catch (e) {
		return null;
	};

	const rows = Array.isArray(data) ? data : (data ? [ data ] : []);

	return rows.filter(r => r && Number.isInteger(r.ProcessId)).map(r => ({
		pid: r.ProcessId,
		ppid: Number.isInteger(r.ParentProcessId) ? r.ParentProcessId : 0,
		exe: (typeof r.ExecutablePath == 'string') ? r.ExecutablePath : '',
		cmd: (typeof r.CommandLine == 'string') ? r.CommandLine : '',
	}));
};

/** Linux: every readable /proc/<pid>/exe link; null when /proc can't be read */
export const listLinuxProcesses = (): ProcessInfo[] | null => {
	let names: string[] = [];

	try {
		names = fs.readdirSync('/proc');
	} catch (e) {
		return null;
	};

	const ret: ProcessInfo[] = [];

	for (const name of names.filter(n => /^\d+$/.test(n))) {
		try {
			ret.push({ pid: Number(name), ppid: 0, exe: fs.readlinkSync(`/proc/${name}/exe`), cmd: '' });
		} catch (e) { /* not ours, or gone */ };
	};
	return ret;
};

/** The real Env.listProcesses (macOS ps, Windows CIM, Linux /proc); null when the list can't be read */
export const listProcesses = async (env: Env): Promise<ProcessInfo[] | null> => {
	if (env.platform == 'linux') {
		return listLinuxProcesses();
	};

	const cmd = buildCommands(env).list;
	const res = await env.run(cmd.file, cmd.args, { timeout: 5000 });

	// A replacement character: bytes that weren't UTF-8, so a path could have decoded into another one
	if ((res.code != 0) || res.timedOut || res.stdout.includes('\uFFFD')) {
		return null;
	};
	return (env.platform == 'win32') ? parseCim(res.stdout) : parsePs(res.stdout);
};

/** macOS: `<app>/Contents/MacOS/<CFBundleExecutable>`, from the bundle's own Info.plist */
export const macExecutable = async (env: Env, appPath: string): Promise<string | null> => {
	const P = pathOf(env);
	const res = await env.run('/usr/bin/plutil', [ '-extract', 'CFBundleExecutable', 'raw', '-o', '-', P.join(appPath, 'Contents', 'Info.plist') ], { timeout: 3000 });
	const name = (res.code == 0) ? res.stdout.trim() : '';

	return (name && !/[\\/]/.test(name)) ? P.join(appPath, 'Contents', 'MacOS', name) : null;
};

/** The main executable Anytype matches processes against, or null */
export const mainExecutable = async (env: Env, det: Detected): Promise<string | null> => {
	if (env.platform == 'darwin') {
		return det.appPath ? macExecutable(env, det.appPath) : null;
	};
	return det.exePath || null;
};

const samePath = (env: Env, a: string, b: string): boolean => (env.platform == 'win32') ? (a.toLowerCase() == b.toLowerCase()) : (a == b);

/** Running / stopped / unknown, by full executable path */
export const runningState = async (env: Env, det: Detected): Promise<RunningState> => {
	const exe = await mainExecutable(env, det);

	if (!exe) {
		return { state: 'unknown' };
	};

	const list = await env.listProcesses();

	if (!list) {
		return { state: 'unknown' };
	};

	const matches = list.filter(p => p.exe && samePath(env, p.exe, exe) && !((env.platform == 'win32') && p.cmd.includes('--type=')));

	if (!matches.length) {
		return { state: 'stopped' };
	};
	return { state: 'running', pid: (matches.length == 1) ? matches[0].pid : null };
};

/** Pids that got their one quit signal (per service instance) */
export type Signalled = Set<number>;

const restartError = (category: AiError['category']): { ok: false; error: AiError } => ({ ok: false, error: { stage: 'restart', category } });

/**
 * Asks the app to quit, once per pid, and waits up to 10 s (elapsed). Ok only when no matching process is
 * left; another instance appearing → `changed` (it is left alone). Already stopped → ok. A second call
 * for a pid that was already signalled only waits again.
 */
export const quit = async (env: Env, det: Detected, signalled: Signalled): Promise<{ ok: true } | { ok: false; error: AiError }> => {
	if (env.platform == 'linux') {
		return restartError('unsupportedPackage');
	};

	const deadline = env.now() + QUIT_WAIT_MS;
	const first = await runningState(env, det);

	if (first.state == 'stopped') {
		return { ok: true };
	};
	// Unknown, or several main processes: nothing can be picked to signal
	if ((first.state == 'unknown') || !first.pid) {
		return restartError('unknown');
	};

	if (!signalled.has(first.pid)) {
		signalled.add(first.pid);

		const cmd = buildCommands(env).quit(first.pid);

		if (cmd) {
			await env.run(cmd.file, cmd.args, { timeout: 5000 });
		} else
		if (!env.kill(first.pid, 'SIGTERM')) {
			return restartError('unknown');
		};
	};

	// Bounded by the deadline (slow lookups count, a late answer doesn't) and by the number of polls (a clock that doesn't move)
	for (let i = 0; (i < (QUIT_WAIT_MS / POLL_MS)) && (env.now() < deadline); i++) {
		await env.sleep(Math.min(POLL_MS, Math.max(0, deadline - env.now())));

		const now = await runningState(env, det);

		if (env.now() > deadline) {
			break;
		};
		if (now.state == 'stopped') {
			return { ok: true };
		};
		if ((now.state == 'running') && (now.pid != first.pid)) {
			return restartError('changed');
		};
	};

	// The app refused (an unsaved-work dialog, for example): never forced
	return restartError('timeout');
};

/** Starts the app again: macOS `open -a <app>`, Windows the exe (resolves on spawn) */
export const launch = async (env: Env, det: Detected): Promise<{ ok: true } | { ok: false; error: AiError }> => {
	const cmd = buildCommands(env).launch(det);

	if (!cmd || (env.platform == 'linux')) {
		return restartError('unsupportedPackage');
	};

	if (cmd.detached) {
		return (await env.launch(cmd.file, cmd.args)) ? { ok: true } : restartError('unknown');
	};

	const res = await env.run(cmd.file, cmd.args, { timeout: 10000 });
	return (res.code == 0) ? { ok: true } : restartError('unknown');
};

/** Quit, then launch. Another instance that started meanwhile already is the restarted app */
export const restart = async (env: Env, det: Detected, signalled: Signalled): Promise<{ ok: true } | { ok: false; error: AiError }> => {
	const res = await quit(env, det, signalled);

	if ('error' in res) {
		return (res.error.category == 'changed') ? { ok: true } : res;
	};
	return launch(env, det);
};
