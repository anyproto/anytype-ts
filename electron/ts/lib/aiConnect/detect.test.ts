import fs from 'fs';
import path from 'path';
import { describe, expect, test, vi } from 'vitest';
import { BUNDLE_IDS, FISH_SCRIPT, SHELL_SCRIPT, appPathsScript, codexHomeId, detectAll, expandWindowsVars, lmstudioHome, parseShellOutput, resolveHomes, shellFor, targetFor } from './detect';
import { fakeEnv, nodeEnv, tempDir, type FakeSpec, type RunCall } from './testEnv';
import { Registry } from './registry';
import type { AiAppId, AiRecord, Detected, RunResult } from './types';

const MAC_HOME = '/Users/me';
const WIN_HOME = 'C:\\Users\\me';
const LINUX_HOME = '/home/me';
const POWERSHELL = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';

/** Answers the login-shell script with these labelled values (plus profile noise) */
const shellReply = (values: Record<string, string>, noise = true): RunResult => ({
	code: 0,
	stdout: [
		...(noise ? [ 'Welcome to zsh!', 'claude=/should/not/win', 'random text = with spaces', 'nvm: using node 22' ] : []),
		...Object.entries(values).map(([ k, v ]) => `${k}=${v}`),
		...(noise ? [ 'ignored=1' ] : []),
	].join('\n') + '\n',
});

const macRunner = (opt: { shell?: Record<string, string>; bundleIds?: Record<string, string>; mdfind?: Record<string, string>; mdfindCode?: number } = {}) => (call: RunCall): RunResult => {
	if ((call.file == '/bin/zsh') && (call.args[0] == '-lc')) {
		expect(call.args[1]).toBe(SHELL_SCRIPT);
		return shellReply(opt.shell || {});
	};
	if (call.file == '/usr/bin/plutil') {
		const app = call.args[call.args.length - 1].replace(/\/Contents\/Info\.plist$/, '');
		const id = (opt.bundleIds || {})[app];
		return id ? { code: 0, stdout: id + '\n' } : { code: 1, stdout: '' };
	};
	if (call.file == '/usr/bin/mdfind') {
		const id = /'(.+)'/.exec(call.args[0])[1];
		return { code: opt.mdfindCode ?? 0, stdout: (opt.mdfind || {})[id] || '' };
	};
	return { code: 1, stdout: '' };
};

const byId = (items: Detected[]): Record<string, Detected> => items.reduce((acc, it) => ({ ...acc, [it.appId]: it }), {});
const installed = (items: Detected[]): AiAppId[] => items.filter(it => it.installed).map(it => it.appId);

describe('parseShellOutput', () => {
	test('only known labels; the last line per label wins; junk is ignored', () => {
		expect(parseShellOutput('hello\nclaude=/a\nfoo=bar\nclaude=/b\nPATH=/usr/bin:/bin\n=x\nCODEX_HOME=\n')).toEqual({ claude: '/b', PATH: '/usr/bin:/bin', CODEX_HOME: '' });
	});

	test('the script prints labelled lines and guards every command', () => {
		const lines = SHELL_SCRIPT.split('\n');

		expect(lines).toHaveLength(16);
		expect(lines.every(l => l.startsWith('printf \'') && l.endsWith('|| true'))).toBe(true);
		expect(SHELL_SCRIPT).toContain('"$(command -v claude 2>/dev/null || true)"');
		expect(SHELL_SCRIPT).toContain('"${CODEX_HOME:-}"');
	});

	test('the fish script prints the same labels in fish syntax', () => {
		const lines = FISH_SCRIPT.split('\n');

		expect(lines).toHaveLength(16);
		expect(lines.every(l => l.startsWith('printf \'') && !l.includes('$('))).toBe(true);
		expect(FISH_SCRIPT).toContain('printf \'claude=%s\\n\' (command -s claude 2>/dev/null)');
		expect(FISH_SCRIPT).toContain('printf \'PATH=%s\\n\' (string join : -- $PATH)');
		expect(FISH_SCRIPT).toContain('printf \'CODEX_HOME=%s\\n\' "$CODEX_HOME"');
	});
});

describe('resolveHomes', () => {
	test('macOS: CLIs from the login shell must be absolute and exist; misses fall back to known dirs', async () => {
		const env = fakeEnv({
			platform: 'darwin',
			home: MAC_HOME,
			vars: { SHELL: '/bin/zsh' },
			files: { '/bin/zsh': '', '/opt/homebrew/bin/codex': '', [`${MAC_HOME}/.local/bin/claude`]: '' },
			run: macRunner({ shell: { claude: '', codex: '/opt/homebrew/bin/codex', cursor: 'alias cursor=open', lms: '/missing/lms', PATH: '/opt/homebrew/bin:/usr/bin', CODEX_HOME: '/Users/me/work/codex' } }),
		});
		const homes = await resolveHomes(env);

		expect(homes.shellOk).toBe(true);
		expect(homes.cli.codex).toBe('/opt/homebrew/bin/codex');
		// A shell miss followed by a hit in ~/.local/bin
		expect(homes.cli.claude).toBe(`${MAC_HOME}/.local/bin/claude`);
		expect(homes.cli.cursor).toBeNull();
		expect(homes.cli.lms).toBeNull();
		expect(homes.path).toBe('/opt/homebrew/bin:/usr/bin');
		expect(homes.codexHome).toBe('/Users/me/work/codex');
		expect(homes.copilotHome).toBe(`${MAC_HOME}/.copilot`);
		expect(homes.claudeHome).toBe(`${MAC_HOME}/.claude`);
		expect(homes.claudeConfigDir).toBe('');
		// One shell call, cached
		await resolveHomes(env);
		expect(env.calls.filter(c => c.file == '/bin/zsh')).toHaveLength(1);
	});

	test('a label the shell printed wins over the inherited environment, even when empty', async () => {
		const env = fakeEnv({
			platform: 'darwin',
			home: MAC_HOME,
			vars: { SHELL: '/bin/zsh', CODEX_HOME: '/Users/me/old', COPILOT_HOME: '/Users/me/old-cop', CLAUDE_CONFIG_DIR: '/Users/me/old-cc' },
			files: { '/bin/zsh': '' },
			run: macRunner({ shell: { CODEX_HOME: '', COPILOT_HOME: '', CLAUDE_CONFIG_DIR: '' } }),
		});
		const homes = await resolveHomes(env);

		expect(homes.codexHome).toBe(`${MAC_HOME}/.codex`);
		expect(homes.copilotHome).toBe(`${MAC_HOME}/.copilot`);
		expect(homes.claudeConfigDir).toBe('');
	});

	test('the inherited environment counts when the label is absent', async () => {
		const env = fakeEnv({
			platform: 'darwin',
			home: MAC_HOME,
			vars: { SHELL: '/bin/zsh', CODEX_HOME: '/Users/me/inherited' },
			files: { '/bin/zsh': '' },
			run: () => ({ code: 0, stdout: 'claude=\n' }),
		});

		expect((await resolveHomes(env)).codexHome).toBe('/Users/me/inherited');
	});

	test('a failed shell call falls back to the process environment', async () => {
		const env = fakeEnv({
			platform: 'linux',
			home: LINUX_HOME,
			vars: { CLAUDE_CONFIG_DIR: '/home/me/cc', PATH: '/usr/bin', COPILOT_HOME: 'relative/rejected' },
			run: () => ({ code: -1, stdout: '', timedOut: true }),
		});
		const homes = await resolveHomes(env);

		expect(homes.shellOk).toBe(false);
		expect(env.calls[0].file).toBe('/bin/sh');
		expect(env.calls[0].opts.timeout).toBe(4000);
		expect(homes.claudeConfigDir).toBe('/home/me/cc');
		expect(homes.claudeHome).toBe('/home/me/cc');
		expect(homes.overrides).toEqual({ CODEX_HOME: '', COPILOT_HOME: '', CLAUDE_CONFIG_DIR: '/home/me/cc' });
		// A set but unusable override: no default location instead
		expect(homes.rejected).toEqual([ 'COPILOT_HOME' ]);
		expect(homes.copilotHome).toBe('');
		expect(homes.path).toBe('/usr/bin');
	});

	test.each([
		[ 'darwin', '/usr/local/bin/fish', '/usr/local/bin/fish', [ '-l', '-c', FISH_SCRIPT ] ],
		[ 'linux', '/usr/bin/fish', '/usr/bin/fish', [ '-l', '-c', FISH_SCRIPT ] ],
		[ 'darwin', '/bin/tcsh', '/bin/zsh', [ '-lc', SHELL_SCRIPT ] ],
		[ 'linux', '/bin/csh', '/bin/sh', [ '-lc', SHELL_SCRIPT ] ],
		[ 'darwin', '/bin/bash', '/bin/bash', [ '-lc', SHELL_SCRIPT ] ],
		[ 'linux', '/usr/bin/zsh', '/usr/bin/zsh', [ '-lc', SHELL_SCRIPT ] ],
		[ 'darwin', '/missing/zsh', '/bin/zsh', [ '-lc', SHELL_SCRIPT ] ],
		[ 'darwin', '/missing/fish', '/bin/zsh', [ '-lc', SHELL_SCRIPT ] ],
	])('%s with SHELL=%s runs in %s', (platform, shell, file, args) => {
		const files = shell.startsWith('/missing') ? {} : { [shell]: '' };
		const env = fakeEnv({ platform: platform as NodeJS.Platform, home: '/home/me', vars: { SHELL: shell }, files });

		expect(shellFor(env)).toEqual({ file, args });
	});

	test('fish: a CLI and a CODEX_HOME set only in fish config are found; ChatGPT keeps ~/.codex', async () => {
		const env = fakeEnv({
			platform: 'darwin',
			home: MAC_HOME,
			vars: { SHELL: '/opt/homebrew/bin/fish', CODEX_HOME: '' },
			files: { '/opt/homebrew/bin/fish': '', '/Users/me/.npm-global/bin/codex': '' },
			dirs: [ '/Users/me/work/codex' ],
			run: call => (call.file == '/opt/homebrew/bin/fish')
				? shellReply({ codex: '/Users/me/.npm-global/bin/codex', PATH: '/Users/me/.npm-global/bin:/usr/bin', CODEX_HOME: '/Users/me/work/codex' })
				: macRunner()(call),
		});
		const homes = await resolveHomes(env);

		expect(env.calls[0]).toMatchObject({ file: '/opt/homebrew/bin/fish', args: [ '-l', '-c', FISH_SCRIPT ] });
		expect(homes.shellOk).toBe(true);
		expect(homes.cli.codex).toBe('/Users/me/.npm-global/bin/codex');
		expect(homes.path).toBe('/Users/me/.npm-global/bin:/usr/bin');
		expect(homes.codexHome).toBe('/Users/me/work/codex');
		expect(targetFor(env, homes, 'codex')).toEqual({ targetId: codexHomeId(env, '/Users/me/work/codex/config.toml'), targetPaths: [ '/Users/me/work/codex/config.toml' ] });
		expect(targetFor(env, homes, 'chatgpt')).toEqual({ targetId: 'codex', targetPaths: [ '/Users/me/.codex/config.toml' ] });
	});

	const fish = [ '/opt/homebrew/bin/fish', '/usr/local/bin/fish', '/usr/bin/fish' ].find(p => fs.existsSync(p));

	test.skipIf(!fish)('fish (real): the script runs and its labels parse', async () => {
		const home = tempDir('aic-fish-');

		try {
			fs.mkdirSync(path.join(home, '.config', 'fish'), { recursive: true });
			fs.writeFileSync(path.join(home, '.config', 'fish', 'config.fish'), `set -gx CODEX_HOME ${home}/fish-codex\n`);

			const env = nodeEnv(home, { vars: { SHELL: fish, HOME: home } });
			const real = env.run;
			const homes = await resolveHomes({ ...env, run: (file, args, opts) => real(file, args, { ...opts, env: { HOME: home, XDG_CONFIG_HOME: path.join(home, '.config') } }) });

			expect(homes.shellOk).toBe(true);
			expect(homes.codexHome).toBe(`${home}/fish-codex`);
			expect(homes.path).toContain('/');
		} finally {
			fs.rmSync(home, { recursive: true, force: true });
		};
	});

	test('Windows: PATH + PATHEXT in-process, no where.exe; first match decides; a .cmd shim is never runnable', async () => {
		const env = fakeEnv({
			platform: 'win32',
			home: WIN_HOME,
			vars: { SystemRoot: 'C:\\Windows', Path: 'C:\\npm;.;relative\\bin;\\\\server\\share\\bin;"C:\\Program Files\\Codex";%LOCALAPPDATA%\\Tools', PATHEXT: '.COM;.EXE;.BAT;.CMD', LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local', CODEX_HOME: 'C:\\Users\\me\\work\\codex' },
			files: {
				'C:\\npm\\claude.cmd': '',
				'C:\\Users\\me\\claude.exe': '',
				'C:\\Program Files\\Codex\\codex.exe': '',
				'C:\\Users\\me\\AppData\\Local\\Tools\\copilot.exe': '',
				'C:\\Users\\me\\.local\\bin\\lms.exe': '',
				'C:\\Tools\\cursor.exe': '',
			},
			run: call => (call.file == POWERSHELL) ? { code: 0, stdout: 'HKLM:cursor=C:\\Tools\\cursor.exe\r\n' } : { code: 1, stdout: '' },
		});
		const lstat = vi.spyOn(env, 'stat');
		const homes = await resolveHomes(env);

		expect(homes.shellOk).toBe(true);
		// claude.cmd comes first on PATH: a shim, never run; the claude.exe in the profile root is not on PATH
		expect(homes.cli.claude).toBeNull();
		expect(homes.cliShim.claude).toBe(true);
		expect(homes.cli.codex).toBe('C:\\Program Files\\Codex\\codex.exe');
		expect(homes.cli.copilot).toBe('C:\\Users\\me\\AppData\\Local\\Tools\\copilot.exe');
		expect(homes.cli.lms).toBe('C:\\Users\\me\\.local\\bin\\lms.exe');
		expect(homes.cli.cursor).toBe('C:\\Tools\\cursor.exe');
		expect(homes.codexHome).toBe('C:\\Users\\me\\work\\codex');
		expect(env.calls.some(c => /where\.exe$/i.test(c.file))).toBe(false);
		// One App Paths lookup for the CLIs PATH and the known dirs did not find
		expect(env.calls).toHaveLength(1);
		expect(env.calls[0]).toMatchObject({ file: POWERSHELL, args: [ '-NoProfile', '-NonInteractive', '-Command', appPathsScript([ 'code', 'agent', 'cursor', 'chatgpt', 'gemini', 'agy', 'opencode', 'hermes' ]) ], opts: { timeout: 5000 } });
		// Relative and UNC PATH entries are never looked at
		expect(lstat.mock.calls.some(([ p ]) => p.startsWith('\\\\') || !/^[A-Z]:\\/i.test(p))).toBe(false);
	});

	test('Windows: App Paths are read as UTF-8 (a non-ASCII profile name), HKCU before HKLM; a %VAR% left is expanded', async () => {
		const exe = 'C:\\Users\\Jürgen Müller\\AppData\\Local\\Programs\\claude\\claude.exe';
		const env = fakeEnv({
			platform: 'win32',
			home: 'C:\\Users\\Jürgen Müller',
			vars: { SystemRoot: 'C:\\Windows', localappdata: 'C:\\Users\\Jürgen Müller\\AppData\\Local' },
			files: { [exe]: '', 'C:\\Users\\Jürgen Müller\\AppData\\Local\\lms\\lms.exe': '' },
			run: call => (call.file == POWERSHELL)
				? { code: 0, stdout: `\uFEFFHKLM:claude=C:\\elsewhere\\claude.exe\r\nHKCU:claude="${exe}"\r\nHKCU:lms=%LocalAppData%\\lms\\lms.exe\r\nnoise\r\n` }
				: { code: 1, stdout: '' },
		});
		const homes = await resolveHomes(env);

		expect(homes.cli.claude).toBe(exe);
		expect(homes.cli.lms).toBe('C:\\Users\\Jürgen Müller\\AppData\\Local\\lms\\lms.exe');
		// The script forces UTF-8 output whatever the console code page is, and only reads
		const script = env.calls[0].args[3];
		expect(script.startsWith('[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false;')).toBe(true);
		expect(script).toContain('Get-ItemProperty -LiteralPath');
		expect(script).not.toMatch(/Set-|New-Item|Remove-/);
		expect(expandWindowsVars(env, '%LOCALAPPDATA%\\x;%NOPE%')).toBe('C:\\Users\\Jürgen Müller\\AppData\\Local\\x;%NOPE%');
	});

	test('Windows: a failed App Paths lookup leaves the CLI undetected (nothing else breaks)', async () => {
		const env = fakeEnv({ platform: 'win32', home: WIN_HOME, vars: { SystemRoot: 'C:\\Windows' }, run: () => ({ code: -1, stdout: '', timedOut: true }) });
		const homes = await resolveHomes(env);

		expect(homes.shellOk).toBe(true);
		expect(homes.cli.claude).toBeNull();
	});

	test('Windows: UNC, device and outside-home overrides are rejected: no default target, never passed on', async () => {
		const env = fakeEnv({ platform: 'win32', home: WIN_HOME, vars: { CODEX_HOME: '\\\\server\\share\\codex', COPILOT_HOME: '\\\\?\\C:\\cop', CLAUDE_CONFIG_DIR: 'D:\\cc' } });
		const lstat = vi.spyOn(env, 'lstat');
		const homes = await resolveHomes(env);

		expect(homes.rejected.sort()).toEqual([ 'CLAUDE_CONFIG_DIR', 'CODEX_HOME', 'COPILOT_HOME' ]);
		expect(homes.overrides).toEqual({ CODEX_HOME: '', COPILOT_HOME: '', CLAUDE_CONFIG_DIR: '' });
		expect([ homes.codexHome, homes.copilotHome, homes.claudeHome, homes.claudeConfigDir ]).toEqual([ '', '', '', '' ]);
		expect(lstat.mock.calls.some(([ p ]) => p.startsWith('\\\\'))).toBe(false);

		const items = byId((await detectAll(env)).items);

		// Codex reads the UNC home: no automatic target (the old fallback pointed it at ChatGPT's file)
		expect(items.codex).toMatchObject({ targetPaths: [] });
		expect(items.codex.targetId).toBeUndefined();
		expect(items.chatgpt).toMatchObject({ targetId: 'codex', targetPaths: [ 'C:\\Users\\me\\.codex\\config.toml' ] });
		expect(items.vscode.targetId).toBeUndefined();
		expect(items['claude-code'].targetId).toBeUndefined();
	});
});

describe('detectAll', () => {
	test('macOS: ChatGPT and ChatGPT Classic are told apart by bundle id', async () => {
		const env = fakeEnv({
			platform: 'darwin',
			home: MAC_HOME,
			dirs: [ '/Applications/ChatGPT.app', '/Applications/ChatGPT Classic.app', '/Applications/Claude.app' ],
			run: macRunner({ bundleIds: {
				'/Applications/ChatGPT.app': 'com.openai.codex',
				'/Applications/ChatGPT Classic.app': 'com.openai.chat',
				'/Applications/Claude.app': 'com.anthropic.claudefordesktop',
			} }),
		});
		const res = await detectAll(env);
		const items = byId(res.items);

		expect(res.scanOk).toBe(true);
		expect(installed(res.items).sort()).toEqual([ 'chatgpt', 'chatgpt-classic', 'claude-desktop' ]);
		expect(items.chatgpt.appPath).toBe('/Applications/ChatGPT.app');
		expect(items['chatgpt-classic'].appPath).toBe('/Applications/ChatGPT Classic.app');
		expect(items['claude-desktop'].appPath).toBe('/Applications/Claude.app');
		expect(res.items.map(it => it.appId)).toHaveLength(16);
	});

	test('macOS: a Classic-only machine has no ChatGPT', async () => {
		const env = fakeEnv({
			platform: 'darwin',
			home: MAC_HOME,
			dirs: [ '/Applications/ChatGPT.app' ],
			run: macRunner({ bundleIds: { '/Applications/ChatGPT.app': 'com.openai.chat' } }),
		});
		const res = await detectAll(env);

		expect(installed(res.items)).toEqual([ 'chatgpt-classic' ]);
		expect(byId(res.items)['chatgpt-classic'].appPath).toBe('/Applications/ChatGPT.app');
		expect(env.calls.some(c => (c.file == '/usr/bin/mdfind') && c.args[0].includes('com.openai.codex'))).toBe(true);
	});

	test('macOS: Spotlight finds an app outside /Applications, confirmed by its bundle id', async () => {
		const env = fakeEnv({
			platform: 'darwin',
			home: MAC_HOME,
			dirs: [ '/Volumes/Apps/Claude.app', '/Volumes/Apps/Fake.app' ],
			run: macRunner({
				bundleIds: { '/Volumes/Apps/Claude.app': 'com.anthropic.claudefordesktop', '/Volumes/Apps/Fake.app': 'com.evil' },
				mdfind: { 'com.anthropic.claudefordesktop': '/Volumes/Apps/Fake.app\n/Volumes/Apps/Claude.app\n' },
			}),
		});
		const items = byId((await detectAll(env)).items);

		expect(items['claude-desktop']).toMatchObject({ installed: true, appPath: '/Volumes/Apps/Claude.app' });
	});

	test.each([
		[ 'cursor', 'Cursor' ],
		[ 'vscode', 'Visual Studio Code' ],
		[ 'lmstudio', 'LM Studio' ],
	])('macOS: %s is found relocated by its bundle id; a same-named bundle with another id is not it', async (appId, name) => {
		const id = BUNDLE_IDS[appId as AiAppId];
		const relocated = fakeEnv({
			platform: 'darwin',
			home: MAC_HOME,
			dirs: [ `/Volumes/Tools/${name}.app` ],
			run: macRunner({ bundleIds: { [`/Volumes/Tools/${name}.app`]: id }, mdfind: { [id]: `/Volumes/Tools/${name}.app\n` } }),
		});
		const impostor = fakeEnv({
			platform: 'darwin',
			home: MAC_HOME,
			dirs: [ `/Applications/${name}.app` ],
			run: macRunner({ bundleIds: { [`/Applications/${name}.app`]: 'com.example.impostor' } }),
		});

		expect(id).toMatch(/^[a-zA-Z0-9.]+$/);
		expect(byId((await detectAll(relocated)).items)[appId]).toMatchObject({ installed: true, appPath: `/Volumes/Tools/${name}.app` });
		expect(byId((await detectAll(impostor)).items)[appId].installed).toBe(false);
	});

	test('CLIs and config dirs count; cursor / agent CLI → Cursor; a createdDirs directory is not evidence', async () => {
		const env = fakeEnv({
			platform: 'darwin',
			home: MAC_HOME,
			files: { '/usr/local/bin/agent': '', [`${MAC_HOME}/.claude.json`]: '{}' },
			dirs: [ `${MAC_HOME}/.codex`, `${MAC_HOME}/.copilot`, `${MAC_HOME}/.lmstudio` ],
			run: macRunner({ shell: { agent: '/usr/local/bin/agent' } }),
		});

		expect(installed((await detectAll(env)).items).sort()).toEqual([ 'claude-code', 'codex', 'cursor', 'lmstudio', 'vscode' ]);
		expect(installed((await detectAll(env, { createdDirs: [ `${MAC_HOME}/.codex`, `${MAC_HOME}/.copilot` ] })).items).sort()).toEqual([ 'claude-code', 'cursor', 'lmstudio' ]);
	});

	test('a .cmd shim is detected but not runnable', async () => {
		const env = fakeEnv({
			platform: 'win32',
			home: WIN_HOME,
			vars: { SystemRoot: 'C:\\Windows', PATH: 'C:\\npm' },
			files: { 'C:\\npm\\cursor.cmd': '' },
		});
		const res = await detectAll(env);

		expect(installed(res.items)).toEqual([ 'cursor' ]);
		expect(res.homes.cli.cursor).toBeNull();
		expect(res.homes.cliShim.cursor).toBe(true);
	});

	test('Windows: the OpenAI.Codex package means ChatGPT; ~/.codex alone does not', async () => {
		const spec = (pkg: string): FakeSpec => ({
			platform: 'win32',
			home: WIN_HOME,
			vars: { SystemRoot: 'C:\\Windows', LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local' },
			dirs: [ 'C:\\Users\\me\\.codex' ],
			run: call => {
				if (call.file == POWERSHELL) {
					expect(call.args).toEqual([ '-NoProfile', '-NonInteractive', '-Command', 'Get-AppxPackage -Name OpenAI.Codex | Select-Object -ExpandProperty InstallLocation' ]);
					expect(call.opts.timeout).toBe(5000);
					return { code: 0, stdout: pkg };
				};
				return { code: 1, stdout: '' };
			},
		});

		const withPackage = byId((await detectAll(fakeEnv(spec('C:\\Program Files\\WindowsApps\\OpenAI.Codex_1.0_x64__abc\r\n')))).items);
		expect(withPackage.chatgpt).toMatchObject({ installed: true, appPath: 'C:\\Program Files\\WindowsApps\\OpenAI.Codex_1.0_x64__abc' });
		expect(withPackage.codex.installed).toBe(true);

		const without = byId((await detectAll(fakeEnv(spec('')))).items);
		expect(without.chatgpt.installed).toBe(false);
		expect(without.codex.installed).toBe(true);
	});

	test('Windows: Claude Desktop by package family or the classic install; Cursor and VS Code by exe', async () => {
		const local = 'C:\\Users\\me\\AppData\\Local';
		const run = () => ({ code: 1, stdout: '' });
		const pkg = byId((await detectAll(fakeEnv({ platform: 'win32', home: WIN_HOME, vars: { LOCALAPPDATA: local }, dirs: [ `${local}\\Packages\\AnthropicPBC.Claude_abc` ], run }))).items);
		const classic = byId((await detectAll(fakeEnv({ platform: 'win32', home: WIN_HOME, vars: { LOCALAPPDATA: local }, files: {
			[`${local}\\AnthropicClaude\\Claude.exe`]: '',
			[`${local}\\Programs\\cursor\\Cursor.exe`]: '',
			[`${local}\\Programs\\Microsoft VS Code\\Code.exe`]: '',
		}, run }))).items);

		expect(pkg['claude-desktop']).toMatchObject({ installed: true, appPath: `${local}\\Packages\\AnthropicPBC.Claude_abc` });
		expect(classic['claude-desktop']).toMatchObject({ installed: true, exePath: `${local}\\AnthropicClaude\\Claude.exe` });
		expect(classic.cursor).toMatchObject({ installed: true, exePath: `${local}\\Programs\\cursor\\Cursor.exe` });
		expect(classic.vscode).toMatchObject({ installed: true, exePath: `${local}\\Programs\\Microsoft VS Code\\Code.exe` });
		expect(classic['chatgpt-classic'].installed).toBe(false);
	});

	test('Linux: the chatgpt executable or its desktop entry', async () => {
		const exe = await detectAll(fakeEnv({
			platform: 'linux',
			home: LINUX_HOME,
			files: { '/usr/bin/chatgpt': '', '/bin/sh': '' },
			run: call => (call.file == '/bin/sh') ? shellReply({ chatgpt: '/usr/bin/chatgpt' }) : { code: 1, stdout: '' },
		}));
		const entry = await detectAll(fakeEnv({ platform: 'linux', home: LINUX_HOME, files: { '/home/me/.local/share/applications/chatgpt-desktop.desktop': '' } }));
		const none = await detectAll(fakeEnv({ platform: 'linux', home: LINUX_HOME, dirs: [ '/home/me/.codex' ] }));

		expect(byId(exe.items).chatgpt.installed).toBe(true);
		expect(byId(entry.items).chatgpt.installed).toBe(true);
		expect(byId(none.items).chatgpt.installed).toBe(false);
		expect(byId(none.items).codex.installed).toBe(true);
		expect(byId(none.items)['claude-desktop'].installed).toBe(false);
	});

	test('CODEX_HOME makes Codex and ChatGPT resolve to different targets', async () => {
		const run = macRunner({ shell: { CODEX_HOME: '/Users/me/work/codex' } });
		const moved = byId((await detectAll(fakeEnv({ platform: 'darwin', home: MAC_HOME, dirs: [ '/Users/me/work/codex' ], run }))).items);
		const same = byId((await detectAll(fakeEnv({ platform: 'darwin', home: MAC_HOME, run: macRunner() }))).items);

		expect(moved.chatgpt).toMatchObject({ targetId: 'codex', targetPaths: [ '/Users/me/.codex/config.toml' ] });
		expect(moved.codex).toMatchObject({ targetId: codexHomeId(fakeEnv({ platform: 'darwin', home: MAC_HOME }), '/Users/me/work/codex/config.toml'), targetPaths: [ '/Users/me/work/codex/config.toml' ] });
		expect(moved.codex.targetId).toMatch(/^codex-home-[0-9a-f]{8}$/);
		expect(same.codex).toMatchObject({ targetId: 'codex', targetPaths: [ '/Users/me/.codex/config.toml' ] });
	});

	test('two custom CODEX_HOME locations get two ids, and both records are kept', async () => {
		const detect = async (home: string) => byId((await detectAll(fakeEnv({ platform: 'darwin', home: MAC_HOME, dirs: [ home ], run: macRunner({ shell: { CODEX_HOME: home } }) }))).items).codex;
		const a = await detect('/Users/me/codex-a');
		const b = await detect('/Users/me/codex-b');

		expect(a.targetId).not.toBe(b.targetId);
		expect(await detect('/Users/me/codex-a')).toMatchObject({ targetId: a.targetId });

		const dir = tempDir('aic-codex-');

		try {
			const reg = new Registry(nodeEnv(dir), path.join(dir, 'aiConnect.json'));
			const rec = (id: string, targetPath: string): AiRecord => ({
				id: id as any, appId: 'codex', accountId: 'acc', appHash: `h-${id}`, keyFp: '0123456789abcdef', name: 'Codex', route: 'http', tier: 'large',
				recommendedTier: 'large', method: 'config', targetPath, port: 31009, createdAt: 1, grant: { spaceIds: [], allSpaces: true, perm: 1 },
				expireAt: 0, nextStep: 'none', observedInstalled: true, lastProbe: 'none', revokePending: [], removed: false, createdDirs: [],
			});

			reg.upsert(rec(a.targetId, a.targetPaths[0]));
			reg.upsert(rec(b.targetId, b.targetPaths[0]));
			expect(reg.get('acc', a.targetId).targetPath).toBe('/Users/me/codex-a/config.toml');
			expect(reg.get('acc', b.targetId).targetPath).toBe('/Users/me/codex-b/config.toml');
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		};
	});

	test('a CODEX_HOME that is a link to ~/.codex is the same target', async () => {
		const run = macRunner({ shell: { CODEX_HOME: '/Users/me/codex-link' } });
		const items = byId((await detectAll(fakeEnv({ platform: 'darwin', home: MAC_HOME, dirs: [ '/Users/me/.codex' ], links: { '/Users/me/codex-link': '/Users/me/.codex' }, run }))).items);

		expect(items.codex).toMatchObject({ targetId: 'codex', targetPaths: [ '/Users/me/.codex/config.toml' ] });
	});

	test('targets of the other cards', async () => {
		const items = byId((await detectAll(fakeEnv({ platform: 'darwin', home: MAC_HOME, run: macRunner({ shell: { CLAUDE_CONFIG_DIR: '/Users/me/cc', COPILOT_HOME: '/Users/me/cop' } }) }))).items);

		expect(items.cursor).toMatchObject({ targetId: 'cursor', targetPaths: [ '/Users/me/.cursor/mcp.json' ] });
		expect(items.vscode).toMatchObject({ targetId: 'copilot', targetPaths: [ '/Users/me/cop/mcp-config.json' ] });
		expect(items['claude-code']).toMatchObject({ targetId: 'claude-code', targetPaths: [ '/Users/me/cc/settings.json', '/Users/me/cc/.claude.json' ] });
		expect(items['claude-desktop']).toMatchObject({ targetId: 'claude-desktop', targetPaths: [ '/Users/me/Library/Application Support/Claude/claude_desktop_config.json', '/Users/me/.anytype/ai-connect/items-dev/claude-desktop.item' ] });
		expect(items.lmstudio).toMatchObject({ targetId: 'lmstudio', targetPaths: [ '/Users/me/.lmstudio/mcp.json' ] });
		expect(items.other).toEqual({ appId: 'other', installed: false, targetPaths: [], canRestart: false });
	});
});

describe('scanOk', () => {
	test('an accessible empty machine: scanOk, nothing installed', async () => {
		const res = await detectAll(fakeEnv({ platform: 'darwin', home: MAC_HOME, run: macRunner() }));

		expect(res.scanOk).toBe(true);
		expect(installed(res.items)).toEqual([]);
	});

	test('the shell failed and the home can not be listed: scanOk is false', async () => {
		const res = await detectAll(fakeEnv({ platform: 'linux', home: LINUX_HOME, unreadable: [ LINUX_HOME ], run: () => ({ code: -1, stdout: '' }) }));

		expect(res.homes.shellOk).toBe(false);
		expect(res.scanOk).toBe(false);
	});

	test('the shell failed and Spotlight / plutil could not run: scanOk is false', async () => {
		const res = await detectAll(fakeEnv({ platform: 'darwin', home: MAC_HOME, run: () => ({ code: -1, stdout: '' }) }));

		expect(res.scanOk).toBe(false);
	});

	test('a failed Spotlight lookup keeps the CLI and directory evidence, and the scan is not ok', async () => {
		const env = fakeEnv({
			platform: 'darwin',
			home: MAC_HOME,
			files: { '/opt/homebrew/bin/cursor': '' },
			dirs: [ `${MAC_HOME}/.lmstudio` ],
			run: call => (call.file == '/bin/zsh') ? shellReply({ cursor: '/opt/homebrew/bin/cursor' }) : (call.file == '/usr/bin/mdfind') ? { code: -1, stdout: '', timedOut: true } : { code: 1, stdout: '' },
		});
		const res = await detectAll(env);

		expect(res.scanOk).toBe(false);
		expect(installed(res.items).sort()).toEqual([ 'cursor', 'lmstudio' ]);
	});

	test('a Spotlight that exits non-zero is a failed lookup, not an empty result', async () => {
		const shellFailed = await detectAll(fakeEnv({ platform: 'darwin', home: MAC_HOME, run: macRunner({ mdfindCode: 1 }) }));
		const bothFailed = await detectAll(fakeEnv({ platform: 'darwin', home: MAC_HOME, run: () => ({ code: 1, stdout: '' }) }));

		expect(shellFailed.scanOk).toBe(false);
		expect(bothFailed.homes.shellOk).toBe(false);
		expect(bothFailed.scanOk).toBe(false);
	});

	test('a failed login shell alone does not fail the scan', async () => {
		const res = await detectAll(fakeEnv({ platform: 'darwin', home: MAC_HOME, run: call => (call.file == '/bin/zsh') ? { code: 1, stdout: '' } : macRunner()(call) }));

		expect(res.homes.shellOk).toBe(false);
		expect(res.scanOk).toBe(true);
	});

	test.skipIf((process.platform == 'win32') || (process.getuid?.() === 0))('production-shaped: an unreadable real home with a failing shell', async () => {
		const home = tempDir('aic-scan-');

		try {
			fs.chmodSync(home, 0o000);

			const env = nodeEnv(home, { platform: 'linux', run: async () => ({ code: -1, stdout: '' }) });
			const res = await detectAll(env);

			expect(res.scanOk).toBe(false);
		} finally {
			fs.chmodSync(home, 0o700);
			fs.rmSync(home, { recursive: true, force: true });
		};
	});
});

describe('lmstudioHome', () => {
	const base: FakeSpec = { platform: 'darwin', home: MAC_HOME, dirs: [ '/Users/me/models/lm', '/Users/me/.cache/lm-studio' ] };

	test('a valid pointer wins; only its first line counts, anything after it is ignored', () => {
		expect(lmstudioHome(fakeEnv({ ...base, files: { '/Users/me/.lmstudio-home-pointer': '/Users/me/models/lm\n' } }))).toBe('/Users/me/models/lm');
		expect(lmstudioHome(fakeEnv({ ...base, files: { '/Users/me/.lmstudio-home-pointer': '  /Users/me/models/lm  \r\n# moved here in May\n/etc\n' } }))).toBe('/Users/me/models/lm');
	});

	test('a linked pointer is never opened or followed, and is no install evidence', async () => {
		const env = fakeEnv({ ...base, files: { '/Users/me/notes/pointer.txt': '/Users/me/models/lm\n' }, links: { '/Users/me/.lmstudio-home-pointer': '/Users/me/notes/pointer.txt' } });
		const readFile = vi.spyOn(env, 'readFile');
		const stat = vi.spyOn(env, 'stat');

		expect(lmstudioHome(env)).toBe('/Users/me/.cache/lm-studio');
		expect(readFile.mock.calls.some(([ p ]) => p.includes('pointer'))).toBe(false);
		expect(stat.mock.calls.some(([ p ]) => p.includes('pointer'))).toBe(false);

		const bare = fakeEnv({ platform: 'darwin', home: MAC_HOME, files: { '/Users/me/notes/pointer.txt': '/Users/me/models/lm\n' }, links: { '/Users/me/.lmstudio-home-pointer': '/Users/me/notes/pointer.txt' }, run: macRunner() });
		expect(byId((await detectAll(bare)).items).lmstudio.installed).toBe(false);
	});

	test.each([
		[ 'an empty first line', '\n/Users/me/models/lm\n' ],
		[ 'a relative path', 'models/lm\n' ],
		[ 'a path outside home', '/opt/lm\n' ],
		[ 'a missing directory', '/Users/me/nope\n' ],
		[ 'more than 4 KiB', '/Users/me/models/lm\n' + ' '.repeat(5000) ],
	])('a pointer with %s is ignored', (_, text) => {
		expect(lmstudioHome(fakeEnv({ ...base, dirs: [ ...(base.dirs || []), '/opt/lm' ], files: { '/Users/me/.lmstudio-home-pointer': text } }))).toBe('/Users/me/.cache/lm-studio');
	});

	test('a FIFO pointer is never read', () => {
		const env = fakeEnv({ ...base, fifos: [ '/Users/me/.lmstudio-home-pointer' ] });

		expect(lmstudioHome(env)).toBe('/Users/me/.cache/lm-studio');
	});

	test('a UNC pointer on Windows is refused before any lookup', () => {
		const env = fakeEnv({ platform: 'win32', home: WIN_HOME, files: { 'C:\\Users\\me\\.lmstudio-home-pointer': '\\\\attacker\\share\\lm\r\n' } });
		const lstat = vi.spyOn(env, 'lstat');
		const realpath = vi.spyOn(env, 'realpath');

		expect(lmstudioHome(env)).toBe('C:\\Users\\me\\.lmstudio');
		expect(lstat.mock.calls.some(([ p ]) => p.startsWith('\\\\'))).toBe(false);
		expect(realpath.mock.calls.some(([ p ]) => p.startsWith('\\\\'))).toBe(false);
	});

	test('~/.lmstudio, else ~/.cache/lm-studio, else ~/.lmstudio', () => {
		expect(lmstudioHome(fakeEnv({ platform: 'darwin', home: MAC_HOME, dirs: [ '/Users/me/.lmstudio', '/Users/me/.cache/lm-studio' ] }))).toBe('/Users/me/.lmstudio');
		expect(lmstudioHome(fakeEnv({ platform: 'darwin', home: MAC_HOME }))).toBe('/Users/me/.lmstudio');
	});
});
