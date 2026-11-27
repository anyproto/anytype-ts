import { describe, expect, test } from 'vitest';
import { QUIT_WAIT_MS, POLL_MS, buildCommands, launch, listProcesses, parseCim, parsePs, quit, restart, runningState } from './restart';
import { detectAll } from './detect';
import { fakeEnv, type FakeEnv } from './testEnv';
import type { Detected, ProcessInfo } from './types';

const MAC_APP = '/Applications/Cursor.app';
const MAC_EXE = `${MAC_APP}/Contents/MacOS/Cursor`;
const WIN_EXE = 'C:\\Users\\me\\AppData\\Local\\AnthropicClaude\\Claude.exe';

const macDet: Detected = { appId: 'cursor', installed: true, appPath: MAC_APP, targetPaths: [], canRestart: true };
const winDet: Detected = { appId: 'claude-desktop', installed: true, exePath: WIN_EXE, targetPaths: [], canRestart: true };

/** A fake machine whose process list is `procs()`; signals and launches recorded */
const machine = (platform: NodeJS.Platform, procs: () => ProcessInfo[] | null, opt: { refuse?: boolean; launches?: boolean } = {}) => {
	const signals: { pid: number; signal: string }[] = [];
	let list = procs;
	const env: FakeEnv = fakeEnv({
		platform,
		home: (platform == 'win32') ? 'C:\\Users\\me' : '/Users/me',
		run: call => {
			if (call.file == '/usr/bin/plutil') {
				return { code: 0, stdout: 'Cursor\n' };
			};
			if (/taskkill\.exe$/i.test(call.file)) {
				signals.push({ pid: Number(call.args[1]), signal: call.args.join(' ') });
				if (!opt.refuse) {
					list = () => [];
				};
				return { code: 0, stdout: '' };
			};
			return { code: 0, stdout: '' };
		},
	});
	let slept = 0;

	env.listProcesses = async () => list();
	env.kill = (pid, signal) => {
		signals.push({ pid, signal });
		if (!opt.refuse) {
			list = () => [];
		};
		return true;
	};
	env.sleep = async ms => {
		slept += ms;
	};
	env.launch = async () => opt.launches ?? true;
	return { env, signals, slept: () => slept };
};

describe('restart: commands', () => {
	test('built without side effects, by full path; Windows quit without /F', () => {
		const mac = buildCommands(fakeEnv({ platform: 'darwin', home: '/Users/me' }));
		const win = buildCommands(fakeEnv({ platform: 'win32', home: 'C:\\Users\\me', vars: { SystemRoot: 'C:\\Windows' } }));

		expect(mac.list).toEqual({ file: '/bin/ps', args: [ '-axo', 'pid=,ppid=,comm=' ] });
		expect(mac.quit(7)).toBeNull();
		expect(mac.launch(macDet)).toEqual({ file: '/usr/bin/open', args: [ '-a', MAC_APP ], detached: false });
		expect(win.list.file).toBe('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
		expect(win.list.args[3]).toContain('Get-CimInstance Win32_Process');
		expect(win.quit(7)).toEqual({ file: 'C:\\Windows\\System32\\taskkill.exe', args: [ '/PID', '7' ] });
		expect(win.launch(winDet)).toEqual({ file: WIN_EXE, args: [], detached: true });
	});

	test('ps and CIM output parsing', () => {
		expect(parsePs('  42     1 /Applications/Visual Studio Code.app/Contents/MacOS/Electron\n junk\n')).toEqual([ { pid: 42, ppid: 1, exe: '/Applications/Visual Studio Code.app/Contents/MacOS/Electron', cmd: '' } ]);
		expect(parseCim('{"ProcessId":5,"ParentProcessId":1,"ExecutablePath":"C:\\\\a.exe","CommandLine":"a --type=gpu"}')).toEqual([ { pid: 5, ppid: 1, exe: 'C:\\a.exe', cmd: 'a --type=gpu' } ]);
		expect(parseCim('not json')).toBeNull();
	});
});

describe('restart: running state', () => {
	test('macOS: by the bundle executable\'s full path only', async () => {
		const { env } = machine('darwin', () => [ { pid: 9, ppid: 1, exe: '/Users/me/Downloads/Cursor.app/Contents/MacOS/Cursor', cmd: '' }, { pid: 10, ppid: 1, exe: MAC_EXE, cmd: '' } ]);

		expect(await runningState(env, macDet)).toEqual({ state: 'running', pid: 10 });
	});

	test('Windows: another claude.exe elsewhere and helpers with --type= are ignored; two main processes → running, no pid to signal (U16)', async () => {
		const procs = [
			{ pid: 1, ppid: 0, exe: 'C:\\Users\\me\\.local\\bin\\claude.exe', cmd: 'claude.exe mcp' },
			{ pid: 2, ppid: 0, exe: WIN_EXE, cmd: `"${WIN_EXE}"` },
			{ pid: 3, ppid: 2, exe: WIN_EXE, cmd: `"${WIN_EXE}" --type=renderer` },
		];

		expect(await runningState(machine('win32', () => procs).env, winDet)).toEqual({ state: 'running', pid: 2 });
		expect(await runningState(machine('win32', () => [ ...procs, { pid: 4, ppid: 0, exe: WIN_EXE.toUpperCase(), cmd: '' } ]).env, winDet)).toEqual({ state: 'running', pid: null });
		expect(await runningState(machine('win32', () => []).env, winDet)).toEqual({ state: 'stopped' });
	});

	test('a process list that can not be read → unknown', async () => {
		expect(await runningState(machine('darwin', () => null).env, macDet)).toEqual({ state: 'unknown' });
	});

	test('Linux, with what production detection supplies (no executable): unknown, the process list is not even read (T7)', async () => {
		const env = fakeEnv({ platform: 'linux', home: '/home/me', dirs: [ '/home/me/.config/Claude' ], files: { '/usr/bin/claude-desktop': '#!/bin/sh\n' } });
		const det = (await detectAll(env)).items.find(d => d.appId == 'claude-desktop');
		let listed = 0;

		expect(det).toMatchObject({ installed: true });
		expect(det.exePath).toBeUndefined();
		env.listProcesses = async () => {
			listed++;
			return [ { pid: 5, ppid: 1, exe: '/usr/lib/claude-desktop/electron', cmd: '' } ];
		};
		expect(await runningState(env, det)).toEqual({ state: 'unknown' });
		expect(listed).toBe(0);
	});

	test('Windows reads the process list as UTF-8; output that does not decode is unknown, never "stopped" (T7)', async () => {
		const win = fakeEnv({ platform: 'win32', home: 'C:\\Users\\me', vars: { SystemRoot: 'C:\\Windows' }, run: () => ({ code: 0, stdout: '[{"ProcessId":2,"ExecutablePath":"C:\\\\Users\\\\J\uFFFDrg\\\\Claude.exe","CommandLine":""}]' }) });

		expect(buildCommands(win).list.args[3]).toMatch(/^\[Console\]::OutputEncoding = New-Object System\.Text\.UTF8Encoding \$false; Get-CimInstance/);
		expect(await listProcesses(win)).toBeNull();
	});
});

describe('restart: quit and launch', () => {
	test('macOS: one SIGTERM, never SIGKILL; then open -a', async () => {
		const { env, signals } = machine('darwin', () => [ { pid: 10, ppid: 1, exe: MAC_EXE, cmd: '' } ]);

		expect(await restart(env, macDet, new Set())).toEqual({ ok: true });
		expect(signals).toEqual([ { pid: 10, signal: 'SIGTERM' } ]);
		expect(env.calls.filter(c => c.file == '/usr/bin/open').map(c => c.args)).toEqual([ [ '-a', MAC_APP ] ]);
	});

	test('a refused quit (unsaved work) → timeout after 10 s, not forced; a second call sends no second signal', async () => {
		const { env, signals, slept } = machine('darwin', () => [ { pid: 10, ppid: 1, exe: MAC_EXE, cmd: '' } ], { refuse: true });
		const signalled = new Set<number>();

		expect(await quit(env, macDet, signalled)).toEqual({ ok: false, error: { stage: 'restart', category: 'timeout' } });
		expect(slept()).toBe(QUIT_WAIT_MS);
		expect(await quit(env, macDet, signalled)).toMatchObject({ ok: false });
		expect(signals).toEqual([ { pid: 10, signal: 'SIGTERM' } ]);
		expect(POLL_MS).toBe(250);
	});

	test('Windows: taskkill /PID without /F; unknown → no signal at all', async () => {
		const win = machine('win32', () => [ { pid: 2, ppid: 0, exe: WIN_EXE, cmd: '' } ]);

		expect(await quit(win.env, winDet, new Set())).toEqual({ ok: true });
		expect(win.signals.map(s => s.signal)).toEqual([ '/PID 2' ]);

		const unknown = machine('win32', () => null);

		expect(await quit(unknown.env, winDet, new Set())).toEqual({ ok: false, error: { stage: 'restart', category: 'unknown' } });
		expect(unknown.signals).toEqual([]);
	});

	test('a launch that fails (spawn error) is reported; Linux never quits or launches', async () => {
		expect(await launch(machine('win32', () => [], { launches: false }).env, winDet)).toEqual({ ok: false, error: { stage: 'restart', category: 'unknown' } });

		const linux = machine('linux', () => [ { pid: 5, ppid: 1, exe: '/usr/lib/claude-desktop/electron', cmd: '' } ]);
		const det: Detected = { appId: 'claude-desktop', installed: true, targetPaths: [], canRestart: false };

		expect(await quit(linux.env, det, new Set())).toEqual({ ok: false, error: { stage: 'restart', category: 'unsupportedPackage' } });
		expect(await launch(linux.env, det)).toEqual({ ok: false, error: { stage: 'restart', category: 'unsupportedPackage' } });
		expect(linux.signals).toEqual([]);
	});

	test('the 10 s deadline is elapsed time: slow process lookups count (fake clock) (T17)', async () => {
		const { env, signals } = machine('darwin', () => [ { pid: 10, ppid: 1, exe: MAC_EXE, cmd: '' } ], { refuse: true });
		let clock = 0;
		let lookups = 0;
		const list = env.listProcesses;

		env.now = () => clock;
		env.sleep = async ms => {
			clock += ms;
		};
		env.listProcesses = async () => {
			lookups++;
			clock += 1000;
			return list();
		};

		expect(await quit(env, macDet, new Set())).toEqual({ ok: false, error: { stage: 'restart', category: 'timeout' } });
		// The first lookup, then polls until 10 s have passed (each 1.25 s): far from the 40 polls a sleep count allows
		expect(clock).toBeLessThanOrEqual(QUIT_WAIT_MS + 1250 + 1000);
		expect(lookups).toBeLessThanOrEqual(10);
		expect(signals).toEqual([ { pid: 10, signal: 'SIGTERM' } ]);
	});

	test('quit succeeds only when no matching process is left: a new instance → `changed`, left alone; restart counts it as restarted (T17)', async () => {
		let pid = 10;
		const { env, signals } = machine('darwin', () => [ { pid, ppid: 1, exe: MAC_EXE, cmd: '' } ], { refuse: true });

		env.kill = (p, signal) => {
			signals.push({ pid: p, signal });
			pid = 11;
			return true;
		};
		expect(await quit(env, macDet, new Set())).toEqual({ ok: false, error: { stage: 'restart', category: 'changed' } });
		expect(signals).toEqual([ { pid: 10, signal: 'SIGTERM' } ]);

		pid = 10;
		expect(await restart(env, macDet, new Set())).toEqual({ ok: true });
		expect(env.calls.filter(c => c.file == '/usr/bin/open')).toEqual([]);
	});

	test('U16: a lookup that answers "stopped" only after the deadline is a timeout, not a success', async () => {
		let running = true;
		const { env } = machine('darwin', () => (running ? [ { pid: 10, ppid: 1, exe: MAC_EXE, cmd: '' } ] : []), { refuse: true });
		let clock = 0;
		const list = env.listProcesses;

		env.now = () => clock;
		env.sleep = async ms => {
			clock += ms;
		};
		// Each lookup takes 4.5 s; the app is gone by the time the third one answers (13.75 s after the signal)
		env.listProcesses = async () => {
			clock += 4500;
			if (clock > 12000) {
				running = false;
			};
			return list();
		};

		expect(await quit(env, macDet, new Set())).toEqual({ ok: false, error: { stage: 'restart', category: 'timeout' } });
		expect(clock).toBeGreaterThan(QUIT_WAIT_MS);
	});
});
