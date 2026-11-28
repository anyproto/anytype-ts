import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() }, clipboard: { readText: vi.fn(), writeText: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { FORWARDER_BIN, FORWARDER_FILES, KEY_A, KEY_B, MCP_DIR, REGISTRY, STABLE_BIN, STABLE_BIN_RELEASE, applyParam, mac, planParam, service } from '../testKit';
import { CLAUDE_PACKAGES, CLAUDE_PACKAGE_QUERY, EXTENSION_ID, EXTENSION_ID_DEV, extensionState, windowsClaudeExe } from './claudeDesktop';
import { bundleInfo } from '../bundle';
import { canonicalDigest } from '../digest';
import { FAKE_REV, FAKE_SIGNER, fakeEnv, type FakeEnv, type FakeSpec } from '../testEnv';
import type { AiRecord } from '../types';

const DIR = '/Users/me/Library/Application Support/Claude';
const CONFIG = `${DIR}/claude_desktop_config.json`;
const COPY_DIR = '/Users/me/.anytype/ai-connect';
const APP = '/Applications/Claude.app';
const EXE = `${APP}/Contents/MacOS/Claude`;
const ARCHIVE = 'mcpb-archive-bytes';
const VERSION = `2.${FAKE_REV}.0`;
/** The entry Anytype writes into Claude's config: the stable copy, the tier, the key only in `env` */
const entry = (key = KEY_A, tier = 'large', command = STABLE_BIN) => ({ command, args: [ 'serve', '--tier', tier ], env: { ANYTYPE_API_KEY: key } });

type Ext = { version?: string; signer?: string; enabled?: boolean; id?: string; installedAt?: string } | null;

/** Extension state files (field names UNVERIFIED: no extension was installed on the dev Mac) */
const extensionFiles = (ext: Ext, signed: boolean) => {
	if (!ext) {
		return {};
	};

	const id = ext.id || (signed ? EXTENSION_ID : EXTENSION_ID_DEV);

	return {
		[`${DIR}/extensions-installations.json`]: JSON.stringify({ extensions: { [id]: { id, version: ext.version || VERSION, installedAt: ext.installedAt || '2026-11-28T10:00:00Z', signatureInfo: ext.signer ? { status: 'signed', fingerprint: ext.signer } : { status: 'unsigned' } } } }),
		[`${DIR}/Claude Extensions Settings/${id}.json`]: JSON.stringify({ isEnabled: ext.enabled ?? true }),
	};
};

interface Opt {
	signed?: boolean;
	/** The archive on disk when it differs from the one the build's metadata describes */
	tampered?: string;
	ext?: Ext;
	files?: Record<string, string>;
	running?: boolean | 'unknown';
	opens?: boolean;
	forwarder?: FakeSpec['forwarder'];
	meta?: string | null;
};

/** A Mac with Claude Desktop; processes, quit and launches recorded */
const machine = (opt: Opt = {}) => {
	const state = { running: opt.running ?? false, killed: [] as number[], opened: [] as string[][] };
	const env = mac({
		apps: [ 'Claude' ],
		dirs: [ DIR ],
		signed: opt.signed,
		forwarder: opt.forwarder,
		...((opt.meta !== undefined) ? { meta: opt.meta } : {}),
		files: { ...FORWARDER_FILES, [`${MCP_DIR}/Anytype.mcpb`]: ARCHIVE, ...extensionFiles(opt.ext === undefined ? null : opt.ext, !!opt.signed), ...(opt.files || {}) },
		run: call => {
			if (call.file == '/usr/bin/open') {
				state.opened.push(call.args);
				if (call.args.length == 2) {
					state.running = true;
				};
				return { code: (opt.opens === false) ? 1 : 0, stdout: '' };
			};
			return null;
		},
	});

	if (opt.tampered) {
		env.unlink(`${MCP_DIR}/Anytype.mcpb`);
		env.writeFile(`${MCP_DIR}/Anytype.mcpb`, opt.tampered, 0o644).close();
	};

	env.listProcesses = async () => (state.running == 'unknown') ? null : (state.running ? [ { pid: 42, ppid: 1, exe: EXE, cmd: '' } ] : []);
	env.kill = (pid: number) => {
		state.killed.push(pid);
		state.running = false;
		return true;
	};
	return { env, state, svc: service(env) };
};

const cd = (over: Record<string, any> = {}) => applyParam({ appId: 'claude-desktop', route: 'stdio', name: 'Claude Desktop', ...over });
const fb = (over: Record<string, any> = {}) => cd({ method: 'config', ...over });
const plan = (svc: any, over: Record<string, any> = {}) => svc.plan(planParam({ appId: 'claude-desktop', route: 'stdio', ...over }));
const records = (env: FakeEnv): AiRecord[] => JSON.parse(env.readText(REGISTRY) || '{"connections":[]}').connections;
/** The bundle copies Anytype handed to Claude */
const copies = (env: FakeEnv): string[] => Object.keys(env.files()).filter(f => f.startsWith(`${COPY_DIR}/Anytype`) && f.endsWith('.mcpb'));
const check = (svc: any, port = 31009, keys: any = null) => svc.check({ accountId: 'acc-a', apiListening: true, port, keys });
const checkStatus = async (svc: any, port = 31009) => ((await check(svc, port)) as any).connections[0];
/** Every forwarder verb that ran, with the binary it ran on */
const verbs = (env: FakeEnv): string[] => env.forwarder.calls.map(c => `${c.file} ${c.args[0]}`);
const rewrite = (env: FakeEnv, file: string, text: string) => {
	const dir = file.slice(0, file.lastIndexOf('/'));

	if (!env.exists(dir)) {
		env.mkdir(dir, 0o755);
	};
	if (env.exists(file)) {
		env.unlink(file);
	};
	env.writeFile(file, text, 0o600).close();
};

describe('Claude Desktop: extension state', () => {
	test.each([
		[ 'installed', { ext: {} } ],
		[ 'disabled', { ext: { enabled: false } } ],
		[ 'outdated', { ext: { version: '2.4.0' } } ],
		[ 'outdated', { ext: { version: '1.0.0' } } ],
		[ 'absent', { ext: { id: 'local.mcpb.someone.other' } } ],
		[ 'unreadable', { ext: null } ],
	])('%s', (expected, opt: Opt) => {
		const { env } = machine(opt);
		expect(extensionState(env, bundleInfo(env))).toBe(expected);
	});

	test('the bundle version is 2.<forwarder rev>.0, and an extension at a higher version is accepted', () => {
		const { env } = machine({ ext: { version: '2.6.0' } });

		expect(bundleInfo(env)).toMatchObject({ signed: false, version: VERSION });
		expect(extensionState(env, bundleInfo(env))).toBe('installed');
	});

	test('a development build looks for its own extension (anytype-dev), never the release one, and the other way round', () => {
		const dev = machine({ ext: { id: EXTENSION_ID } });
		const release = machine({ signed: true, ext: { id: EXTENSION_ID_DEV, signer: FAKE_SIGNER } });

		expect(extensionState(dev.env, bundleInfo(dev.env))).toBe('absent');
		expect(extensionState(release.env, bundleInfo(release.env))).toBe('absent');
	});

	test('a missing settings file is unreadable; on a signed build a missing or different signer is outdated, enabled or not', () => {
		const noSettings = machine({ ext: {} });

		noSettings.env.unlink(`${DIR}/Claude Extensions Settings/${EXTENSION_ID_DEV}.json`);
		expect(extensionState(noSettings.env, bundleInfo(noSettings.env))).toBe('unreadable');

		for (const enabled of [ true, false ]) {
			const wrong = machine({ signed: true, ext: { signer: 'cd'.repeat(32), enabled } });
			const missing = machine({ signed: true, ext: { enabled } });
			const right = machine({ signed: true, ext: { signer: FAKE_SIGNER, enabled } });

			expect(extensionState(wrong.env, bundleInfo(wrong.env))).toBe('outdated');
			expect(extensionState(missing.env, bundleInfo(missing.env))).toBe('outdated');
			expect(extensionState(right.env, bundleInfo(right.env))).toBe(enabled ? 'installed' : 'disabled');
		};
	});
});

describe('Claude Desktop: the extension route', () => {
	test('the plan is always Full, runs the preflight on the in-app forwarder, and offers Configure for an installed extension of ours', async () => {
		const fresh = machine();

		expect(await plan(fresh.svc, { method: 'package', tier: 'full' })).toMatchObject({ ok: true, canApply: true, method: 'package', tier: 'full', nextStep: 'confirmInApp' });
		expect(await plan(fresh.svc, { tier: 'small' })).toMatchObject({ ok: true, tier: 'full', method: 'package' });
		expect(verbs(fresh.env)).toContain(`${FORWARDER_BIN} endpoint`);
		expect((await plan(fresh.svc, { tier: 'full' }) as any).configure).toBeUndefined();

		const installed = machine({ ext: {} });

		expect(await plan(installed.svc, { tier: 'full' })).toMatchObject({ configure: true, sentenceKey: 'aiConnectPlanPackageConfigure' });
	});

	test('apply saves the record `waiting` first (the commit), then copies the key, then opens the bundle copy; nothing of the key is written', async () => {
		const { env, state, svc } = machine();
		let savedBeforeCopy = false;
		const write = env.clipboardWrite;

		env.clipboardWrite = text => {
			savedBeforeCopy = (records(env)[0]?.appHash == 'hash-a1') && (state.opened.length == 0);
			write(text);
		};

		const res: any = await svc.apply(cd({ method: 'package', tier: 'full', recommendedTier: 'full' }));
		const [ copy ] = copies(env);

		expect(res).toMatchObject({ ok: true, connection: { method: 'package', status: 'pending', bundleState: 'finish', targetPath: '', tier: 'full' } });
		expect(savedBeforeCopy).toBe(true);
		expect(env.clip.text).toBe(KEY_A);
		expect(copy).toMatch(/\/Anytype-dev-[0-9a-f]{12}\.mcpb$/);
		expect(env.files()[copy]).toBe(ARCHIVE);
		expect(state.opened).toEqual([ [ '-a', APP, copy ] ]);
		expect(records(env)[0]).toMatchObject({ appHash: 'hash-a1', keyFp: res.connection.keyFp, ns: 'dev', armed: { appHash: 'hash-a1', version: '', installedAt: '' } });
		expect(JSON.stringify(env.files())).not.toContain(KEY_A);
	});

	test('an installed extension of ours is not opened again: Configure; an outdated one is (an update)', async () => {
		const ours = machine({ ext: {} });

		expect(await ours.svc.apply(cd({ method: 'package', tier: 'full' }))).toMatchObject({ ok: true, configure: true, connection: { bundleState: 'notConfirmed' } });
		expect(ours.state.opened).toEqual([]);
		expect(records(ours.env)[0].armed).toEqual({ appHash: 'hash-a1', version: VERSION, installedAt: '2026-11-28T10:00:00Z' });

		const old = machine({ ext: { version: '2.4.0' } });

		expect(await old.svc.apply(cd({ method: 'package', tier: 'full' }))).toMatchObject({ ok: true });
		expect(old.state.opened).toHaveLength(1);
	});

	test('a newer build\'s copy replaces the older copy of its flavour; the other flavour\'s copy stays', async () => {
		const { env, svc } = machine({ files: { [`${COPY_DIR}/Anytype-dev-000000000000.mcpb`]: 'OLD', [`${COPY_DIR}/Anytype-111111111111.mcpb`]: 'RELEASE' } });

		await svc.apply(cd({ method: 'package', tier: 'full' }));
		expect(copies(env).sort()).toEqual([ `${COPY_DIR}/Anytype-111111111111.mcpb`, expect.stringMatching(/Anytype-dev-[0-9a-f]{12}\.mcpb$/) ].sort());
	});

	test('a bundle whose archive fails its digest check, a forwarder whose bytes differ, or a build without metadata: refused, no record', async () => {
		for (const opt of [ { tampered: 'something else' }, { forwarderReplaced: true }, { meta: null } ] as (Opt & { forwarderReplaced?: boolean })[]) {
			const { env, svc } = machine(opt);

			if (opt.forwarderReplaced) {
				rewrite(env, FORWARDER_BIN, 'REPLACED');
			};

			expect(await svc.apply(cd({ method: 'package', tier: 'full' }))).toMatchObject({ ok: false });
			expect(records(env)).toEqual([]);
			expect(env.clip.writes).toEqual([]);
		};
	});

	test('remove queues the key and leaves the extension (the user removes it in Claude); the copied key leaves the clipboard', async () => {
		const { env, svc } = machine({ ext: {} });

		await svc.apply(cd({ method: 'package', tier: 'full' }));
		expect(env.clip.text).toBe(KEY_A);

		const res: any = await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' });

		expect(res).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ 'hash-a1' ], left: 'extension' } });
		expect(env.clip.text).toBe('');
	});

	test('update: a port change needs nothing; any tier but Full is refused', async () => {
		const { svc } = machine();

		await svc.apply(cd({ method: 'package', tier: 'full' }));
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', port: 31010 })).toMatchObject({ ok: true, connection: { port: 31010 } });
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', port: 31010, tier: 'small' })).toMatchObject({ ok: false });
	});
});

describe('Claude Desktop: config route', () => {
	test('the plan installs the stable copy, runs the preflight on it, asks for the quit (running) or for the user to quit (unknown), and writes no config', async () => {
		const running = machine({ running: true, files: { [CONFIG]: '{"x":1}' } });

		expect(await plan(running.svc, { method: 'config' })).toMatchObject({ ok: true, method: 'config', preflight: 'quitApp', targetPath: CONFIG, needsKey: true });
		expect(running.state.killed).toEqual([]);
		expect(running.env.files()[CONFIG]).toBe('{"x":1}');
		expect(verbs(running.env)).toContain(`${STABLE_BIN} endpoint`);

		const unknown = machine({ running: 'unknown' });

		expect(await plan(unknown.svc, { method: 'config' })).toMatchObject({ preflight: 'quitAppSelf' });
		expect(await unknown.svc.apply(fb({ allowQuit: true }))).toEqual({ ok: false, needs: 'quitAppSelf' });
	});

	test('apply with allowQuit: quit once, merge the entry with the key in `env`, digest recorded (no entry, no key), 0600, no backup, relaunch', async () => {
		const { env, state, svc } = machine({ running: true, files: { [CONFIG]: JSON.stringify({ globalShortcut: 'x', mcpServers: { other: { command: 'o' } } }) } });

		expect(await svc.apply(fb())).toEqual({ ok: false, needs: 'quitApp' });

		const res: any = await svc.apply(fb({ allowQuit: true }));
		const config = JSON.parse(env.files()[CONFIG]);

		expect(state.killed).toEqual([ 42 ]);
		expect(config.globalShortcut).toBe('x');
		expect(config.mcpServers.other).toEqual({ command: 'o' });
		expect(config.mcpServers.anytype).toEqual(entry());
		expect(env.modeOf(CONFIG)).toBe(0o600);
		expect(Object.keys(env.files()).filter(f => f.startsWith(`${DIR}/`) && (f != CONFIG) && !f.includes('Extensions'))).toEqual([]);
		expect(env.files()[STABLE_BIN]).toBe('FORWARDER-BYTES');
		expect(res).toMatchObject({ ok: true, connection: { method: 'config', nextStep: 'none', targetPath: CONFIG, entryDigest: canonicalDigest(entry()), configPath: CONFIG } });
		expect(JSON.stringify(res)).not.toContain(KEY_A);
		expect(env.readText(REGISTRY)).not.toContain(KEY_A);
		expect(state.opened).toEqual([ [ '-a', APP ] ]);
	});

	test('it needs no extension, also on a signed build; the release build names ~/.anytype/bin', async () => {
		const { env, svc } = machine({ signed: true, files: { [CONFIG]: '{}' } });

		expect(await svc.apply(fb())).toMatchObject({ ok: true, connection: { method: 'config', targetPath: CONFIG } });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toEqual(entry(KEY_A, 'large', STABLE_BIN_RELEASE));
		expect(env.files()[STABLE_BIN]).toBeUndefined();
	});

	test('a parse failure after the quit relaunches Claude', async () => {
		const { env, state, svc } = machine({ running: true, files: { [CONFIG]: '{}' } });
		const kill = env.kill;

		env.kill = (pid, signal) => {
			const ret = kill(pid, signal);

			rewrite(env, CONFIG, '{ broken');
			return ret;
		};
		expect(await svc.apply(fb({ allowQuit: true }))).toMatchObject({ ok: false });
		expect(state.opened).toEqual([ [ '-a', APP ] ]);
	});

	test('check: our entry → ok; edited (another key, another command) → reconnect; gone → removed; unparseable → unreadable', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

		await svc.apply(fb());
		expect((await checkStatus(svc)).status).toBe('ok');

		rewrite(env, CONFIG, JSON.stringify({ mcpServers: { anytype: entry(KEY_B) } }));
		expect((await checkStatus(svc)).status).toBe('reconnect');

		rewrite(env, CONFIG, JSON.stringify({ mcpServers: { anytype: entry(KEY_A, 'large', '/elsewhere/anytype-mcp') } }));
		expect((await checkStatus(svc)).status).toBe('reconnect');

		rewrite(env, CONFIG, '{ broken');
		expect((await checkStatus(svc)).status).toBe('unreadable');

		rewrite(env, CONFIG, '{}');
		expect((await checkStatus(svc)).status).toBe('removed');
	});

	test('check keeps the stable copy installed: a deleted or replaced copy is put back; one that can\'t be is `reconnect`', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

		await svc.apply(fb());
		env.unlink(STABLE_BIN);
		expect((await checkStatus(svc)).status).toBe('ok');
		expect(env.files()[STABLE_BIN]).toBe('FORWARDER-BYTES');

		rewrite(env, STABLE_BIN, 'SOMETHING-ELSE');
		expect((await checkStatus(svc)).status).toBe('ok');
		expect(env.files()[STABLE_BIN]).toBe('FORWARDER-BYTES');

		rewrite(env, FORWARDER_BIN, 'REPLACED');
		expect((await checkStatus(svc)).status).toBe('reconnect');
	});

	test('a tier change is a Reconnect: update refuses it', async () => {
		const { svc } = machine({ files: { [CONFIG]: '{}' } });

		await svc.apply(fb());
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', port: 31009, tier: 'small' })).toMatchObject({ ok: false, error: { category: 'unsupportedForm' } });
	});

	test('reconnect: the new key replaces our entry, the old hash is queued', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

		await svc.apply(fb());
		expect(await svc.apply(fb({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: true, connection: { appHash: 'hash-a2', revokePending: [ 'hash-a1' ] } });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toEqual(entry(KEY_B));
	});

	test('remove: our entry is removed while Claude is stopped (no backup holds the key), left (`entry`) while it runs; the key is queued either way', async () => {
		const stopped = machine({ files: { [CONFIG]: '{}' } });

		await stopped.svc.apply(fb());
		expect(await stopped.svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true, connection: { revokePending: [ 'hash-a1' ] } });
		expect(JSON.parse(stopped.env.files()[CONFIG]).mcpServers?.anytype).toBeUndefined();
		expect(JSON.stringify(stopped.env.files())).not.toContain(KEY_A);

		const running = machine({ files: { [CONFIG]: '{}' } });

		await running.svc.apply(fb());
		running.state.running = true;
		expect(await running.svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true, connection: { left: 'entry', revokePending: [ 'hash-a1' ] } });
	});

	test('Linux: an AppImage in portable-home mode is refused; a normal AppImage is supported', async () => {
		const linux = (dirs: string[] = []) => {
			const env = fakeEnv({
				platform: 'linux', home: '/home/me', vars: { APPIMAGE: '/home/me/Apps/Anytype.AppImage' }, signed: true,
				dirs: [ '/home/me/.config/Claude', '/home/me/.config/anytype', ...dirs ],
				files: { '/home/me/.config/Claude/claude_desktop_config.json': '{}', [FORWARDER_BIN]: 'LINUX-FWD' },
			});

			return { env, svc: service(env, '/home/me/.config/anytype/aiConnect.json') };
		};
		const portable = linux([ '/home/me/Apps/Anytype.AppImage.home' ]);

		expect(await plan(portable.svc)).toMatchObject({ canApply: false, error: { category: 'unsupportedPackage' } });
		expect(portable.env.forwarder.calls).toEqual([]);

		const { env, svc } = linux();

		expect(await plan(svc)).toMatchObject({ canApply: true, method: 'config', preflight: 'quitAppSelf' });
		expect(await svc.apply(cd())).toEqual({ ok: false, needs: 'quitAppSelf' });
		expect(await svc.apply(cd({ quitConfirmed: true }))).toMatchObject({ ok: true, connection: { method: 'config', nextStep: 'restart' } });
		expect(JSON.parse(env.files()['/home/me/.config/Claude/claude_desktop_config.json']).mcpServers.anytype).toEqual(entry(KEY_A, 'large', '/home/me/.anytype/bin/anytype-mcp'));
		expect(env.files()['/home/me/.anytype/bin/anytype-mcp']).toBe('LINUX-FWD');
		// The production detection supplies no executable: Claude is neither signalled nor opened
		expect(env.calls.filter(c => /open|taskkill/.test(c.file))).toEqual([]);
	});

	test('T7: a process list that can\'t be read on macOS is unknown: confirm, never assumed stopped', async () => {
		const { env, svc } = machine({ running: 'unknown', files: { [CONFIG]: '{}' } });

		expect(await svc.apply(fb({ allowQuit: true }))).toEqual({ ok: false, needs: 'quitAppSelf' });
		expect(env.files()[CONFIG]).toBe('{}');
		expect(await svc.apply(fb({ quitConfirmed: true }))).toMatchObject({ ok: true });
	});

	test('T10: a relaunch that fails after the commit is reported (openFailed, restart step)', async () => {
		const { svc } = machine({ running: true, opens: false, files: { [CONFIG]: '{}' } });

		expect(await svc.apply(fb({ allowQuit: true }))).toMatchObject({ ok: true, openFailed: true, connection: { nextStep: 'restart' } });
	});

	test('T11: a config the writer can\'t edit is manual in the plan (no key is minted for it)', async () => {
		const { svc } = machine({ files: { [CONFIG]: '{ broken' } });

		expect(await plan(svc, { method: 'config' })).toMatchObject({ canApply: false, method: 'manual', error: { category: 'unparseable' } });
	});

	test('T13: an unparseable config on the config route is unreadable, not removed', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

		await svc.apply(fb());
		rewrite(env, CONFIG, '{ broken');
		expect((await checkStatus(svc)).status).toBe('unreadable');
	});

	test('T17: another Claude instance appears while Anytype waits for the quit: left alone, nothing written, the quit is asked again', async () => {
		const { env, state, svc } = machine({ running: true, files: { [CONFIG]: '{}' } });
		let pid = 42;

		env.listProcesses = async () => [ { pid, ppid: 1, exe: EXE, cmd: '' } ];
		env.kill = (p: number) => {
			state.killed.push(p);
			pid = 43;
			return true;
		};
		expect(await svc.apply(fb({ allowQuit: true }))).toEqual({ ok: false, needs: 'quitApp' });
		expect(state.killed).toEqual([ 42 ]);
		expect(env.files()[CONFIG]).toBe('{}');
		expect(records(env)).toEqual([]);
	});

	test('T22 / U8: Windows launches only the detected Claude: the classic exe, or a known MSIX package by exact family AND exact publisher (one constant query)', async () => {
		const local = 'C:\\Users\\me\\AppData\\Local';
		const known = CLAUDE_PACKAGES[0];
		const location = `C:\\Program Files\\WindowsApps\\${known.family.replace('_', '_1.0.0_x64__')}`;
		const win = (rows: any[]) => fakeEnv({
			platform: 'win32', home: 'C:\\Users\\me', vars: { LOCALAPPDATA: local, SystemRoot: 'C:\\Windows' },
			files: { [`${location}\\app\\Claude.exe`]: '' },
			run: () => ({ code: 0, stdout: JSON.stringify(rows) }),
		});
		const msix = { appId: 'claude-desktop' as const, installed: true, appPath: `${local}\\Packages\\${known.family}`, targetPaths: [], canRestart: false };
		const exact = win([ { PackageFamilyName: known.family, Publisher: known.publisher, InstallLocation: location } ]);

		expect(await windowsClaudeExe(exact, msix)).toBe(`${location}\\app\\Claude.exe`);
		// The query is a constant: nothing from the machine is put into it
		expect(exact.calls[0].args[3]).toBe(CLAUDE_PACKAGE_QUERY);
		expect(CLAUDE_PACKAGE_QUERY).toContain('UTF8Encoding');

		// A publisher that merely starts the same way, or the right publisher on another family, is not Claude
		for (const rows of [
			[ { PackageFamilyName: known.family, Publisher: `${known.publisher.replace('Anthropic, PBC', 'Anthropic Labs')}`, InstallLocation: location } ],
			[ { PackageFamilyName: known.family, Publisher: 'CN=Anthropic', InstallLocation: location } ],
			[ { PackageFamilyName: 'Claude_lookalike0001', Publisher: known.publisher, InstallLocation: location } ],
		]) {
			expect(await windowsClaudeExe(win(rows), msix)).toBeNull();
		};

		// A package folder that isn't a known identity: not even asked
		const odd = win([]);

		expect(await windowsClaudeExe(odd, { ...msix, appPath: `${local}\\Packages\\Claude_somethingelse` })).toBeNull();
		expect(odd.calls).toEqual([]);

		const classic = fakeEnv({ platform: 'win32', home: 'C:\\Users\\me', files: { [`${local}\\AnthropicClaude\\Claude.exe`]: '' } });

		expect(await windowsClaudeExe(classic, { ...msix, appPath: undefined, exePath: `${local}\\AnthropicClaude\\Claude.exe` })).toBe(`${local}\\AnthropicClaude\\Claude.exe`);
		expect(classic.calls).toEqual([]);
	});


	test('U12: an owned entry Claude removed while quitting stays removed: the rotation stops, Claude is reopened, the record unchanged', async () => {
		const { env, state, svc } = machine({ files: { [CONFIG]: '{}' } });

		await svc.apply(fb());
		state.running = true;

		const kill = env.kill;

		env.kill = (pid, signal) => {
			const ret = kill(pid, signal);

			rewrite(env, CONFIG, '{"mcpServers":{}}');
			return ret;
		};

		expect(await svc.apply(fb({ allowQuit: true, key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, error: { category: 'changed' } });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers).toEqual({});
		expect(state.opened).toEqual([ [ '-a', APP ] ]);
		expect(records(env)[0]).toMatchObject({ appHash: 'hash-a1' });
		expect(records(env)[0].unconfirmed).toBeUndefined();
	});

	test('U16: two matching Claude processes: running, never written behind — not even after the user said they quit it', async () => {
		const { env, state, svc } = machine({ files: { [CONFIG]: '{}' } });

		env.listProcesses = async () => [ { pid: 42, ppid: 1, exe: EXE, cmd: '' }, { pid: 43, ppid: 1, exe: EXE, cmd: '' } ];
		expect(await plan(svc, { method: 'config' })).toMatchObject({ preflight: 'quitAppSelf' });
		expect(await svc.apply(fb({ allowQuit: true, quitConfirmed: true }))).toEqual({ ok: false, needs: 'quitAppSelf' });
		expect(state.killed).toEqual([]);
		expect(env.files()[CONFIG]).toBe('{}');
	});

	test('final 3: cleanup is bound to the config file recorded at install, never another profile\'s', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

		await svc.apply(fb());
		expect(records(env)[0].configPath).toBe(CONFIG);
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers?.anytype).toBeUndefined();
	});
});
