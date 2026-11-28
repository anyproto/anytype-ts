import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { KILL_GRACE_MS, childEnvironment, isRunnableCli, runCli, runFile, windowsTreeKill } from './exec';
import { claudeCodeProfile, resolveHomes, targetFor } from './detect';
import { fakeEnv, nodeEnv, tempDir } from './testEnv';
import type { Env, Homes } from './types';

const itPosix = (process.platform != 'win32') ? test : test.skip;

let home = '';

beforeEach(() => {
	home = tempDir('aic-exec-');
});

afterEach(() => {
	fs.rmSync(home, { recursive: true, force: true });
	vi.unstubAllEnvs();
});

const alive = (pid: number): boolean => {
	try {
		process.kill(pid, 0);
		return true;
	} catch (e) {
		return false;
	};
};

const homes = (part: Partial<Homes> = {}): Homes => ({
	shellOk: true,
	cli: { claude: null, codex: null, code: null, copilot: null, agent: null, cursor: null, lms: null, chatgpt: null, gemini: null, agy: null, opencode: null, hermes: null },
	cliShim: { claude: false, codex: false, code: false, copilot: false, agent: false, cursor: false, lms: false, chatgpt: false, gemini: false, agy: false, opencode: false, hermes: false },
	path: '',
	overrides: { CODEX_HOME: '', COPILOT_HOME: '', CLAUDE_CONFIG_DIR: '' },
	rejected: [],
	codexHome: '',
	copilotHome: '',
	claudeHome: '',
	claudeConfigDir: '',
	...part,
});

describe('exec', () => {
	itPosix('the real run uses cwd = home, an argument array and stdin', async () => {
		const env = nodeEnv(home);
		const res = await env.run(process.execPath, [ '-e', 'process.stdin.on("data", d => process.stdout.write(process.cwd() + "|" + process.argv[1] + "|" + d))', 'a b; rm -rf /' ], { timeout: 5000, stdin: 'secret-on-stdin' });

		expect(res).toEqual({ code: 0, stdout: `${home}|a b; rm -rf /|secret-on-stdin` });
	});

	itPosix('exit codes, missing files and timeouts', async () => {
		expect(await runFile(process.execPath, [ '-e', 'process.exit(3)' ], { cwd: home, timeout: 5000 })).toMatchObject({ code: 3 });
		expect(await runFile('/no/such/binary', [], { cwd: home, timeout: 5000 })).toMatchObject({ code: -1 });
		expect(await runFile(process.execPath, [ '-e', 'setTimeout(() => {}, 5000)' ], { cwd: home, timeout: 200 })).toMatchObject({ code: -1, timedOut: true });
	});

	itPosix('the deadline wins: a child that handles SIGTERM and exits 0 later is still timedOut', async () => {
		const started = Date.now();
		const res = await runFile(process.execPath, [ '-e', 'process.on("SIGTERM", () => setTimeout(() => process.exit(0), 300)); setInterval(() => {}, 1000)' ], { cwd: home, timeout: 200 });

		expect(res).toEqual({ code: -1, stdout: '', timedOut: true });
		expect(Date.now() - started).toBeLessThan(200 + KILL_GRACE_MS);
	});

	itPosix('after a timeout the caller sees what the child committed during its graceful shutdown', async () => {
		const config = path.join(home, 'config.json');
		const pidFile = path.join(home, 'pid');
		// Like a CLI that finishes its config write when asked to stop, 300 ms after the deadline
		const script = [
			`require("fs").writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));`,
			`process.on("SIGTERM", () => setTimeout(() => { require("fs").writeFileSync(${JSON.stringify(config)}, "committed"); process.exit(0); }, 300));`,
			'setInterval(() => {}, 1000);',
		].join(' ');

		const res = await runFile(process.execPath, [ '-e', script ], { cwd: home, timeout: 300 });

		// Returned only after the child exited: its write is already on disk, and the result stays a timeout
		expect(res).toEqual({ code: -1, stdout: '', timedOut: true });
		expect(fs.readFileSync(config, 'utf8')).toBe('committed');
		expect(alive(Number(fs.readFileSync(pidFile, 'utf8')))).toBe(false);
	});

	itPosix('a child that ignores SIGTERM is killed after the grace, and the call returns only once it is gone', async () => {
		const pidFile = path.join(home, 'pid');
		const started = Date.now();
		const res = await runFile(process.execPath, [ '-e', `require("fs").writeFileSync(${JSON.stringify(pidFile)}, String(process.pid)); process.on("SIGTERM", () => {}); setInterval(() => {}, 1000)` ], { cwd: home, timeout: 300 });

		expect(res).toEqual({ code: -1, stdout: '', timedOut: true });
		expect(Date.now() - started).toBeGreaterThanOrEqual(300 + KILL_GRACE_MS - 50);
		// No extra wait: dead when runFile resolves
		expect(alive(Number(fs.readFileSync(pidFile, 'utf8')))).toBe(false);
	});

	itPosix('a child without stdin input gets EOF and does not hang', async () => {
		const res = await runFile(process.execPath, [ '-e', 'process.stdin.resume(); process.stdin.on("end", () => process.stdout.write("eof"))' ], { cwd: home, timeout: 5000 });

		expect(res.stdout).toBe('eof');
	});

	test('a Windows .cmd / .bat shim is never runnable', () => {
		const win = fakeEnv({ platform: 'win32', home: 'C:\\Users\\me' });

		expect(isRunnableCli(win, 'C:\\Users\\me\\AppData\\Roaming\\npm\\claude.cmd')).toBe(false);
		expect(isRunnableCli(win, 'C:\\tools\\claude.bat')).toBe(false);
		expect(isRunnableCli(win, 'C:\\tools\\claude.exe')).toBe(true);
		expect(isRunnableCli(win, 'claude.exe')).toBe(false);
		expect(isRunnableCli(fakeEnv({ platform: 'darwin', home: '/Users/me' }), '/opt/homebrew/bin/claude')).toBe(true);
		expect(isRunnableCli(fakeEnv({ platform: 'darwin', home: '/Users/me' }), null)).toBe(false);
	});
});

describe('runFile: the whole process tree of a CLI', () => {
	/**
	 * A launcher (like a CLI shim) that starts the real writer and waits for it; stdio of the writer is
	 * detached from ours, so only the launcher holds our pipes. The writer finishes its config write
	 * `delay` ms after SIGTERM (or after start, with `onStart`), then exits.
	 */
	const launcher = (opt: { onStart?: boolean; delay?: number; exitAtOnce?: boolean } = {}): { args: string[]; config: string; workerPid: string } => {
		const config = path.join(home, 'config.json');
		const workerPid = path.join(home, 'worker.pid');
		const worker = path.join(home, 'worker.js');
		const main = path.join(home, 'launcher.js');
		const write = `setTimeout(() => { require("fs").writeFileSync(${JSON.stringify(config)}, "committed"); process.exit(0); }, ${opt.delay || 300})`;

		fs.writeFileSync(worker, [
			`require("fs").writeFileSync(${JSON.stringify(workerPid)}, String(process.pid));`,
			opt.onStart ? `${write};` : `process.on("SIGTERM", () => ${write});`,
			'setInterval(() => {}, 1000);',
		].join('\n'));
		fs.writeFileSync(main, [
			`const child = require("child_process").spawn(process.execPath, [ ${JSON.stringify(worker)} ], { stdio: "ignore" });`,
			opt.exitAtOnce ? 'setTimeout(() => process.exit(0), 50);' : 'child.on("exit", code => process.exit(code || 0));',
		].join('\n'));
		return { args: [ main ], config, workerPid };
	};

	itPosix('control: without `tree` the launcher\'s exit settles the call while its worker lives on', async () => {
		const { args, config, workerPid } = launcher();
		const res = await runFile(process.execPath, args, { cwd: home, timeout: 300 });
		const worker = Number(fs.readFileSync(workerPid, 'utf8'));

		try {
			expect(res).toMatchObject({ timedOut: true });
			// Only the launcher was stopped: the writer is still there and could commit at any time
			expect(alive(worker)).toBe(true);
			expect(fs.existsSync(config)).toBe(false);
		} finally {
			process.kill(worker, 'SIGKILL');
		};
	});

	itPosix('with `tree`: on timeout the whole group is stopped and the call returns after the worker committed', async () => {
		const { args, config, workerPid } = launcher();
		const res = await runFile(process.execPath, args, { cwd: home, timeout: 300, tree: true });

		expect(res).toEqual({ code: -1, stdout: '', timedOut: true });
		expect(fs.readFileSync(config, 'utf8')).toBe('committed');
		expect(alive(Number(fs.readFileSync(workerPid, 'utf8')))).toBe(false);
	});

	itPosix('with `tree`: a launcher that exits at once returns only after the worker it left behind finished', async () => {
		const { args, config, workerPid } = launcher({ onStart: true, exitAtOnce: true });
		const res = await runFile(process.execPath, args, { cwd: home, timeout: 5000, tree: true });

		expect(res).toEqual({ code: 0, stdout: '' });
		expect(fs.readFileSync(config, 'utf8')).toBe('committed');
		expect(alive(Number(fs.readFileSync(workerPid, 'utf8')))).toBe(false);
	});

	itPosix('with `tree`: a group whose end can not be confirmed is `indeterminate` (the pending key is kept)', async () => {
		const real = process.kill.bind(process);
		// The group never reports empty, as with a member stuck where signals can't reach it
		const spy = vi.spyOn(process, 'kill').mockImplementation(((pid: number, signal?: string | number) => {
			if ((pid < 0) && (signal === 0)) {
				return true;
			};
			return real(pid, signal);
		}) as any);

		try {
			const { args, workerPid } = launcher();
			const started = Date.now();
			const res = await runFile(process.execPath, args, { cwd: home, timeout: 200, tree: true });

			expect(res).toEqual({ code: -1, stdout: '', timedOut: true, indeterminate: true });
			expect(Date.now() - started).toBeGreaterThanOrEqual(200 + (2 * KILL_GRACE_MS) - 100);

			spy.mockRestore();
			// The real SIGKILL went out regardless
			await new Promise(r => setTimeout(r, 200));
			expect(alive(Number(fs.readFileSync(workerPid, 'utf8')))).toBe(false);
		} finally {
			spy.mockRestore();
		};
	});

	test('Windows: the tree is ended with taskkill /PID <pid> /T /F by full path; confirmed only on success', async () => {
		const calls: string[][] = [];
		const ok = await windowsTreeKill(4242, 'C:\\Windows', async (file, args) => {
			calls.push([ file, ...args ]);
			return 0;
		});
		const notFound = await windowsTreeKill(4242, 'C:\\Windows', async () => 128);

		expect(calls).toEqual([ [ 'C:\\Windows\\System32\\taskkill.exe', '/PID', '4242', '/T', '/F' ] ]);
		expect(ok).toBe(true);
		expect(notFound).toBe(false);
	});
});

describe('childEnvironment', () => {
	test('null removes a variable; Windows replaces every spelling of a name', () => {
		expect(childEnvironment({ A: '1', CLAUDE_CONFIG_DIR: '/old', PATH: '/bin' }, { CLAUDE_CONFIG_DIR: null, PATH: '' }, 'darwin')).toEqual({ A: '1', PATH: '' });
		expect(childEnvironment({ Path: 'C:\\old', claude_config_dir: 'X' }, { PATH: 'C:\\new', CLAUDE_CONFIG_DIR: null }, 'win32')).toEqual({ PATH: 'C:\\new' });
		// POSIX names are case-sensitive
		expect(childEnvironment({ path: 'x' }, { PATH: 'y' }, 'linux')).toEqual({ path: 'x', PATH: 'y' });
	});
});

describe('runCli', () => {
	test('the resolver PATH and overrides, the extra env and stdin; a cleared override is removed', async () => {
		const env = fakeEnv({ platform: 'darwin', home: '/Users/me', run: () => ({ code: 0, stdout: 'ok' }) });
		const h = homes({ cli: { ...homes().cli, claude: '/opt/homebrew/bin/claude' }, path: '/opt/homebrew/bin:/usr/bin', overrides: { CODEX_HOME: '', COPILOT_HOME: '', CLAUDE_CONFIG_DIR: '/Users/me/.cc' } });

		expect(await runCli(env, h, 'claude', [ 'mcp', 'add-json', '--scope', 'user', 'anytype', '-' ], { stdin: '{"k":1}', extraEnv: { FOO: '1', PATH: '/evil', CODEX_HOME: '/evil', HOME: '/evil' } })).toEqual({ code: 0, stdout: 'ok' });
		expect(env.calls).toEqual([ {
			file: '/opt/homebrew/bin/claude',
			args: [ 'mcp', 'add-json', '--scope', 'user', 'anytype', '-' ],
			opts: { timeout: 15000, stdin: '{"k":1}', env: { FOO: '1', PATH: '/opt/homebrew/bin:/usr/bin', CODEX_HOME: null, COPILOT_HOME: null, CLAUDE_CONFIG_DIR: '/Users/me/.cc', HOME: '/Users/me' }, tree: true },
		} ]);
	});

	test('refused: a shim, a CLI discovery did not find, a CLI whose override was rejected', async () => {
		const win = fakeEnv({ platform: 'win32', home: 'C:\\Users\\me' });

		expect(await runCli(win, homes({ cli: { ...homes().cli, claude: 'C:\\npm\\claude.cmd' } }), 'claude', [ '--version' ])).toEqual({ code: -1, stdout: '' });
		expect(await runCli(win, homes(), 'claude', [ '--version' ])).toEqual({ code: -1, stdout: '' });
		expect(await runCli(win, homes({ cli: { ...homes().cli, claude: 'C:\\tools\\claude.exe' }, rejected: [ 'CLAUDE_CONFIG_DIR' ] }), 'claude', [ '--version' ])).toEqual({ code: -1, stdout: '' });
		expect(win.calls).toEqual([]);
	});

	/** A real Env whose login shell is faked; everything else (the CLI child) runs for real */
	const withShell = (labels: Record<string, string>): Env => {
		const real = nodeEnv(home);

		return {
			...real,
			vars: { SHELL: '/bin/zsh' },
			run: (file, args, opts) => (file == '/bin/zsh')
				? Promise.resolve({ code: 0, stdout: Object.entries(labels).map(([ k, v ]) => `${k}=${v}`).join('\n') + '\n' })
				: real.run(file, args, opts),
		};
	};

	/** A stand-in `claude` that prints what it sees */
	const fakeClaude = (): string => {
		const file = path.join(home, 'bin', 'claude');

		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, '#!/bin/sh\nprintf "CLAUDE_CONFIG_DIR=%s|set=%s|PATH=%s|CODEX_HOME=%s|HOME=%s\\n" "$CLAUDE_CONFIG_DIR" "${CLAUDE_CONFIG_DIR+yes}" "$PATH" "${CODEX_HOME+yes}" "$HOME"\n', { mode: 0o755 });
		fs.chmodSync(file, 0o755);
		return file;
	};

	itPosix('from the resolver to the child: a CLAUDE_CONFIG_DIR the login shell cleared is not inherited from Anytype', async () => {
		vi.stubEnv('CLAUDE_CONFIG_DIR', '/example/inherited');
		vi.stubEnv('CODEX_HOME', '/example/inherited-codex');
		// An alternate HOME inherited by Anytype must not move the CLI's default profile either
		vi.stubEnv('HOME', '/private/tmp/alternate-profile');

		const claude = fakeClaude();
		const env = withShell({ claude, PATH: '', CLAUDE_CONFIG_DIR: '', CODEX_HOME: '' });
		const h = await resolveHomes(env);

		expect(h.claudeConfigDir).toBe('');
		expect(targetFor(env, h, 'claude-code').targetPaths).toContain(path.join(home, '.claude.json'));

		const res = await runCli(env, h, 'claude', []);

		// The ownership check and the CLI look at the same (default) profile; the empty PATH is honoured too
		expect(res).toEqual({ code: 0, stdout: `CLAUDE_CONFIG_DIR=|set=|PATH=|CODEX_HOME=|HOME=${home}\n` });
		// …and the file the CLI uses is the one Anytype checks
		expect(claudeCodeProfile(env, h)).toEqual({ file: path.join(home, '.claude.json'), exists: false });
	});

	itPosix('from the resolver to the child: a custom CLAUDE_CONFIG_DIR inside home is passed exactly', async () => {
		vi.stubEnv('CLAUDE_CONFIG_DIR', '/example/inherited');

		const claude = fakeClaude();
		const custom = path.join(home, 'cc');
		const env = withShell({ claude, PATH: '/usr/bin:/bin', CLAUDE_CONFIG_DIR: custom });
		const h = await resolveHomes(env);

		expect(await runCli(env, h, 'claude', [])).toEqual({ code: 0, stdout: `CLAUDE_CONFIG_DIR=${custom}|set=yes|PATH=/usr/bin:/bin|CODEX_HOME=|HOME=${home}\n` });
		expect(claudeCodeProfile(env, h)).toEqual({ file: path.join(custom, '.claude.json'), exists: false });
	});

	itPosix('Claude Code profile: a legacy .config.json without .claude.json → manual; once .claude.json exists it is the file', async () => {
		const claude = fakeClaude();
		const env = withShell({ claude });
		const h = await resolveHomes(env);

		fs.mkdirSync(path.join(home, '.claude'));
		fs.writeFileSync(path.join(home, '.claude', '.config.json'), '{"mcpServers":{}}');
		expect(claudeCodeProfile(env, h)).toEqual({ error: { stage: 'read', category: 'unsupportedForm', path: path.join(home, '.claude', '.config.json') } });

		fs.writeFileSync(path.join(home, '.claude.json'), '{}');
		expect(claudeCodeProfile(env, h)).toEqual({ file: path.join(home, '.claude.json'), exists: true });
	});

	itPosix('from the resolver to the child: a CLAUDE_CONFIG_DIR outside home is rejected, nothing runs, no default target', async () => {
		const claude = fakeClaude();
		const env = withShell({ claude, CLAUDE_CONFIG_DIR: '/example/elsewhere' });
		const h = await resolveHomes(env);
		const run = vi.spyOn(env, 'run');

		expect(h.rejected).toEqual([ 'CLAUDE_CONFIG_DIR' ]);
		expect(targetFor(env, h, 'claude-code')).toEqual({ targetPaths: [] });
		expect(claudeCodeProfile(env, h)).toEqual({ error: { stage: 'detect', category: 'outsideHome' } });
		expect(await runCli(env, h, 'claude', [])).toEqual({ code: -1, stdout: '' });
		expect(run).not.toHaveBeenCalled();
	});
});
