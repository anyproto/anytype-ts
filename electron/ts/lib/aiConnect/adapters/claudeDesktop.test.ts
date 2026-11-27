import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { CLAUDE_ITEM, FORWARDER_BIN, FORWARDER_FILES, KEY_A, KEY_B, MCP_DIR, REGISTRY, STABLE_BIN, STABLE_BIN_RELEASE, applyParam, mac, planParam, service } from '../testKit';
import { CLAUDE_PACKAGES, CLAUDE_PACKAGE_QUERY, EXTENSION_ID, EXTENSION_ID_DEV, extensionState, windowsClaudeExe } from './claudeDesktop';
import { bundleInfo } from '../bundle';
import { canonicalDigest, keyFingerprint } from '../digest';
import { FAKE_SIGNER, fakeEnv, type FakeEnv, type FakeSpec } from '../testEnv';
import type { AiRecord } from '../types';

const DIR = '/Users/me/Library/Application Support/Claude';
const CONFIG = `${DIR}/claude_desktop_config.json`;
const COPY = '/Users/me/.anytype/ai-connect/Anytype.mcpb';
const APP = '/Applications/Claude.app';
const EXE = `${APP}/Contents/MacOS/Claude`;
const ARCHIVE = 'mcpb-archive-bytes';
const VERSION = '2.5.0';
/** The one command shape Anytype writes into Claude's config: the stable copy, no key, no env */
const ENTRY = { command: STABLE_BIN, args: [ 'serve', '--connection', 'claude-desktop' ] };

type Ext = { version?: string; signer?: string; enabled?: boolean; id?: string } | null;

/** Extension state files (field names UNVERIFIED: no extension was installed on the dev Mac) */
const extensionFiles = (ext: Ext, signed: boolean) => {
	if (!ext) {
		return {};
	};

	const id = ext.id || (signed ? EXTENSION_ID : EXTENSION_ID_DEV);

	return {
		[`${DIR}/extensions-installations.json`]: JSON.stringify({ extensions: { [id]: { id, version: ext.version || VERSION, signatureInfo: ext.signer ? { status: 'signed', fingerprint: ext.signer } : { status: 'unsigned' } } } }),
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
const item = (env: FakeEnv) => env.forwarder.items.get('claude-desktop');
const check = (svc: any, port = 31009, keys: any = null) => svc.check({ accountId: 'acc-a', apiListening: true, port, keys });
const checkStatus = async (svc: any, port = 31009) => ((await check(svc, port)) as any).connections[0];
const verbs = (env: FakeEnv): string[] => env.forwarder.calls.map(c => c.args.slice(0, 2).join(' '));
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

describe('Claude Desktop: bundle + item', () => {
	test('installed → `key set` only (the key on stdin, never in argv), no open; disabled → the toggle step', async () => {
		const installed = machine({ ext: {} });

		expect(await plan(installed.svc)).toMatchObject({ ok: true, method: 'keyfile', nextStep: 'restart', bundleSigned: false, targetPath: CLAUDE_ITEM });
		expect(await installed.svc.apply(cd())).toMatchObject({ ok: true, connection: { method: 'keyfile', nextStep: 'restart', targetPath: CLAUDE_ITEM, observedInstalled: true, itemRev: 1 } });
		expect(item(installed.env)).toEqual({ key: KEY_A, account: 'acc-a', port: 31009, tier: 'large', rev: 1 });
		expect(installed.state.opened).toEqual([]);

		const set = installed.env.forwarder.calls.find(c => c.args[1] == 'set');

		expect(set.file).toBe(FORWARDER_BIN);
		expect(set.args).toEqual([ 'key', 'set', '--connection', 'claude-desktop', '--expect', 'absent' ]);
		expect(JSON.parse(set.opts.stdin)).toEqual({ key: KEY_A, account: 'acc-a', port: 31009, tier: 'large' });
		// The child's home is the service's home, and nothing key-like is in its environment or arguments
		expect(set.opts.env).toEqual({ HOME: '/Users/me', USERPROFILE: '/Users/me' });
		expect(JSON.stringify(installed.env.calls.map(c => [ c.file, c.args, c.opts.env ]))).not.toContain(KEY_A);
		// No key file of the old kind, nothing of Anytype's in the items folder, no stable copy on the bundle route
		expect(Object.keys(installed.env.files()).filter(f => f.startsWith('/Users/me/.anytype'))).toEqual([]);
		expect(JSON.stringify(installed.env.files())).not.toContain(KEY_A);

		const disabled = machine({ ext: { enabled: false } });

		expect(await disabled.svc.apply(cd())).toMatchObject({ ok: true, connection: { method: 'keyfile', nextStep: 'toggle' } });
		expect(disabled.state.opened).toEqual([]);
	});

	test('absent → `key set` (commit), then the verified bundle bytes are copied and opened in Claude; manual → copied, not opened; open failure → ok + openFailed', async () => {
		const absent = machine();

		expect(await absent.svc.apply(cd())).toMatchObject({ ok: true, connection: { method: 'package', nextStep: 'confirmInApp', observedInstalled: false } });
		expect(item(absent.env).key).toBe(KEY_A);
		expect(absent.env.files()[COPY]).toBe(ARCHIVE);
		expect(absent.state.opened).toEqual([ [ '-a', APP, COPY ] ]);

		const manual = machine();

		expect(await manual.svc.apply(cd({ manual: true, previewTarget: CLAUDE_ITEM }))).toMatchObject({ ok: true });
		expect(manual.env.files()[COPY]).toBe(ARCHIVE);
		expect(manual.state.opened).toEqual([]);

		const failing = machine({ opens: false });

		expect(await failing.svc.apply(cd())).toMatchObject({ ok: true, openFailed: true });
	});

	test('signed build: an extension that isn\'t verified gets NO key — the bundle is opened, no item and no record until the expected one is there (R3-4)', async () => {
		for (const ext of [ { signer: 'cd'.repeat(32), enabled: true }, { signer: 'cd'.repeat(32), enabled: false }, null ] as Ext[]) {
			const { env, state, svc } = machine({ signed: true, ext });

			expect(await plan(svc)).toMatchObject({ ok: true, method: 'package', bundleSigned: true });
			expect(await svc.apply(cd())).toEqual({ ok: false, needs: 'installExtension' });
			expect(state.opened).toEqual([ [ '-a', APP, COPY ] ]);
			expect(item(env)).toBeUndefined();
			expect(verbs(env)).not.toContain('key set');
			expect(records(env)).toEqual([]);

			// The user installed the signed bundle: the plan now says keyfile, and the same key is delivered
			rewrite(env, `${DIR}/extensions-installations.json`, JSON.stringify({ extensions: { [EXTENSION_ID]: { id: EXTENSION_ID, version: VERSION, signatureInfo: { status: 'signed', fingerprint: FAKE_SIGNER } } } }));
			rewrite(env, `${DIR}/Claude Extensions Settings/${EXTENSION_ID}.json`, JSON.stringify({ isEnabled: true }));

			expect(await plan(svc)).toMatchObject({ method: 'keyfile' });
			expect(await svc.apply(cd())).toMatchObject({ ok: true, connection: { method: 'keyfile' } });
			expect(item(env).key).toBe(KEY_A);
		};
	});

	test('a bundle whose archive fails its digest check is never used, and gets no key', async () => {
		const { env, state, svc } = machine({ signed: true, tampered: 'tampered' });

		expect(bundleInfo(env)).toMatchObject({ integrityError: true, signed: false });
		expect(await plan(svc)).toMatchObject({ ok: true, canApply: false, error: { stage: 'verify', category: 'unsupportedPackage' } });
		expect(await svc.apply(cd())).toEqual({ ok: false, error: { stage: 'verify', category: 'unsupportedPackage' } });
		expect(item(env)).toBeUndefined();
		expect(state.opened).toEqual([]);
	});

	test('a forwarder whose bytes differ from the metadata is never given a key (and never copied)', async () => {
		const { env, svc } = machine({ ext: {}, files: { [CONFIG]: '{}' } });

		rewrite(env, FORWARDER_BIN, 'REPLACED-BYTES');
		expect(await plan(svc)).toMatchObject({ canApply: false, error: { stage: 'verify', category: 'notFound' } });
		expect(await svc.apply(cd())).toMatchObject({ ok: false, error: { stage: 'verify', category: 'notFound' } });
		expect(await plan(svc, { method: 'config' })).toMatchObject({ canApply: false, error: { stage: 'verify', category: 'notFound' }, steps: [] });
		expect(env.forwarder.calls).toEqual([]);
		expect(env.files()[STABLE_BIN]).toBeUndefined();
	});

	test('a build without metadata (or whose namespace disagrees with `signed`) refuses the stdio routes', async () => {
		const none = machine({ ext: {}, meta: null });
		const sha = require('crypto').createHash('sha256').update('FORWARDER-BYTES').digest('hex');
		const mismatch = machine({ ext: {}, meta: JSON.stringify({ signed: true, forwarder: { rev: 5, namespace: 'dev', sha256: { darwin: sha } }, mcpb: null }) });

		for (const m of [ none, mismatch ]) {
			expect(await plan(m.svc, { method: 'config' })).toMatchObject({ canApply: false, error: { category: 'notFound' } });
			expect(await m.svc.apply(fb())).toMatchObject({ ok: false });
			expect(m.env.forwarder.calls).toEqual([]);
		};
	});

	test('ownership across accounts on the item: Replace names the item as shown (fingerprint@rev); the other account is left with a conflict', async () => {
		const { env, svc } = machine({ ext: {} });

		await svc.apply(cd());

		const planB: any = await plan(svc, { accountId: 'acc-b' });

		expect(planB).toMatchObject({ existing: 'foreign', replace: { targetPath: CLAUDE_ITEM, foreignDigest: canonicalDigest(`${keyFingerprint(KEY_A)}@1`) } });
		expect(await svc.apply(cd({ accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1' }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(item(env).key).toBe(KEY_A);
		expect(records(env).filter(r => r.accountId == 'acc-b')).toEqual([]);
		expect(await svc.apply(cd({ accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1', replace: planB.replace }))).toMatchObject({ ok: true });
		expect(item(env)).toMatchObject({ key: KEY_B, account: 'acc-b', rev: 2 });
		// The replacing `key set` named exactly the item the user saw
		expect(env.forwarder.calls.filter(c => c.args[1] == 'set').pop().args.slice(-2)).toEqual([ '--expect', `${keyFingerprint(KEY_A)}@1` ]);

		expect((await checkStatus(svc, 31010)).status).toBe('conflict');
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', port: 31011 })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		// Disconnect: another account's item is left alone, and the revocation is queued all the same
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ 'hash-a1' ] } });
		expect(item(env)).toMatchObject({ key: KEY_B, account: 'acc-b', rev: 2 });
		expect(verbs(env)).not.toContain('key delete');
	});

	test('check: a port change is a `key retarget` (the same key, nothing revoked, restart step); remove deletes the item and reports the extension left behind', async () => {
		const { env, svc } = machine({ ext: {} });

		await svc.apply(cd());
		expect(await check(svc, 31010)).toMatchObject({ ok: true, healed: [ 'claude-desktop' ], connections: [ { status: 'ok', port: 31010, itemRev: 2, nextStep: 'restart', revokePending: [] } ] });
		expect(item(env)).toEqual({ key: KEY_A, account: 'acc-a', port: 31010, tier: 'large', rev: 2 });
		expect(env.forwarder.calls.find(c => c.args[1] == 'retarget').args).toEqual([
			'key', 'retarget', '--connection', 'claude-desktop', '--expect', `${keyFingerprint(KEY_A)}@1`, '--account', 'acc-a', '--port', '31010', '--tier', 'large',
		]);
		expect(records(env)[0].retarget).toBeUndefined();

		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true, connection: { removed: true, left: 'extension' } });
		expect(item(env)).toBeUndefined();
		expect(env.forwarder.calls.find(c => c.args[1] == 'delete').args).toEqual([ 'key', 'delete', '--connection', 'claude-desktop', '--expect', `${keyFingerprint(KEY_A)}@2`, '--account', 'acc-a' ]);
	});

	test('update: a tier change is a retarget; the item gone → notFound, never recreated', async () => {
		const { env, svc } = machine({ ext: {} });

		await svc.apply(cd());
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', port: 31009, tier: 'full' })).toMatchObject({ ok: true, connection: { tier: 'full', itemRev: 2, nextStep: 'restart' } });
		expect(item(env)).toMatchObject({ key: KEY_A, tier: 'full', rev: 2 });

		env.forwarder.items.clear();
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', port: 31010 })).toMatchObject({ ok: false, error: { category: 'notFound' } });
		expect(item(env)).toBeUndefined();
		expect(records(env)[0].retarget).toBeUndefined();
		expect((await checkStatus(svc)).status).toBe('removed');
	});

	test('a store that fails its rules (exit 7, denied) is named: nothing is planned, written or healed', async () => {
		const { env, svc } = machine({ ext: {} });

		env.forwarder.store = 'denied';
		expect(await plan(svc)).toMatchObject({ canApply: false, error: { category: 'storeDenied', path: CLAUDE_ITEM } });
		expect(await svc.apply(cd())).toMatchObject({ ok: false, error: { category: 'storeDenied' } });
		expect(records(env)).toEqual([]);

		env.forwarder.store = 'ok';
		await svc.apply(cd());
		env.forwarder.store = 'unreachable';
		expect((await checkStatus(svc, 31010)).status).toBe('unreadable');
		expect(item(env).port).toBe(31009);
	});
});

describe('Claude Desktop: config route', () => {
	test('the plan asks for the quit (running) or for the user to quit (unknown) and writes nothing', async () => {
		const running = machine({ running: true, files: { [CONFIG]: '{"x":1}' } });

		expect(await plan(running.svc, { method: 'config' })).toMatchObject({ ok: true, method: 'config', preflight: 'quitApp', targetPath: CONFIG });
		expect(running.state.killed).toEqual([]);
		expect(running.env.files()[CONFIG]).toBe('{"x":1}');
		expect(running.env.files()[STABLE_BIN]).toBeUndefined();

		const unknown = machine({ running: 'unknown' });

		expect(await plan(unknown.svc, { method: 'config' })).toMatchObject({ preflight: 'quitAppSelf' });
		expect(await unknown.svc.apply(fb({ allowQuit: true }))).toEqual({ ok: false, needs: 'quitAppSelf' });
		expect(item(unknown.env)).toBeUndefined();
	});

	test('apply with allowQuit: quit once, install the stable copy, merge the keyless entry, `key set`, configEntry stored, relaunch', async () => {
		const { env, state, svc } = machine({ running: true, files: { [CONFIG]: JSON.stringify({ globalShortcut: 'x', mcpServers: { other: { command: 'o' } } }) } });

		expect(await svc.apply(fb())).toEqual({ ok: false, needs: 'quitApp' });

		const res: any = await svc.apply(fb({ allowQuit: true }));
		const config = JSON.parse(env.files()[CONFIG]);

		expect(state.killed).toEqual([ 42 ]);
		expect(config.globalShortcut).toBe('x');
		expect(config.mcpServers.other).toEqual({ command: 'o' });
		// One command shape: the stable copy with `serve --connection claude-desktop`; no env, no key, no Electron
		expect(config.mcpServers.anytype).toEqual(ENTRY);
		expect(env.files()[CONFIG]).not.toContain(KEY_A);
		expect(env.files()[CONFIG]).not.toContain('Anytype.app');
		expect(env.files()[STABLE_BIN]).toBe('FORWARDER-BYTES');
		expect(env.files()[`${STABLE_BIN}.rev`]).toBe('5\n');
		expect(env.modeOf(STABLE_BIN)).toBe(0o755);
		expect(env.modeOf('/Users/me/.anytype/bin-dev')).toBe(0o700);
		expect(item(env).key).toBe(KEY_A);
		expect(res).toMatchObject({ ok: true, connection: { method: 'config', nextStep: 'none', targetPath: CONFIG, configEntry: ENTRY, entryDigest: canonicalDigest(ENTRY), itemRev: 1 } });
		expect(state.opened).toEqual([ [ '-a', APP ] ]);
	});

	test('it needs no extension, also on a signed build with none installed; the release build uses ~/.anytype/bin', async () => {
		const { env, svc } = machine({ signed: true, files: { [CONFIG]: '{}' } });

		expect(await plan(svc, { method: 'config' })).toMatchObject({ canApply: true, method: 'config' });
		expect(await svc.apply(fb())).toMatchObject({ ok: true, connection: { method: 'config', targetPath: CONFIG } });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toEqual({ command: STABLE_BIN_RELEASE, args: [ 'serve', '--connection', 'claude-desktop' ] });
		expect(env.files()[STABLE_BIN_RELEASE]).toBe('FORWARDER-BYTES');
		expect(env.files()[STABLE_BIN]).toBeUndefined();
		expect(item(env).key).toBe(KEY_A);
	});

	test('with the Anytype extension installed and enabled as well: refused ("remove one of the two"), nothing written', async () => {
		const { env, svc } = machine({ ext: {}, files: { [CONFIG]: '{}' } });

		expect(await plan(svc, { method: 'config' })).toMatchObject({ canApply: false, method: 'manual', error: { category: 'conflict' }, note: 'aiConnectClaudeBothRoutes', steps: [] });
		expect(await svc.apply(fb())).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(env.files()[CONFIG]).toBe('{}');
		expect(item(env)).toBeUndefined();

		// Switched off, it is no second server
		const off = machine({ ext: { enabled: false }, files: { [CONFIG]: '{}' } });

		expect(await off.svc.apply(fb())).toMatchObject({ ok: true });
	});

	test('a `key set` that is refused puts the previous entry back (no leftover reported) and relaunches Claude', async () => {
		const previous = { command: 'old', args: [] as string[] };
		const { env, state, svc } = machine({
			running: true, files: { [CONFIG]: JSON.stringify({ mcpServers: { anytype: previous } }) },
			forwarder: (call, st) => ((call.args[1] == 'set') ? { code: 7, stdout: JSON.stringify({ ok: false, reason: 'x', store: 'denied' }) + '\n' } : null),
		});
		// The user agreed to replace the entry they were shown
		const replace = { targetPath: CONFIG, foreignDigest: canonicalDigest(previous) };
		const res: any = await svc.apply(fb({ allowQuit: true, replace }));

		expect(res).toMatchObject({ ok: false, error: { category: 'storeDenied' } });
		expect(res.error.left).toBeUndefined();
		expect(state.killed).toEqual([ 42 ]);
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toEqual(previous);
		expect(state.opened).toEqual([ [ '-a', APP ] ]);
		// Exit 7 means nothing was written: no record and no candidate stays
		expect(records(env)).toEqual([]);
	});

	test('a store that can\'t be used is refused before Claude is quit', async () => {
		const { env, state, svc } = machine({ running: true, files: { [CONFIG]: '{}' } });

		env.forwarder.store = 'denied';
		expect(await svc.apply(fb({ allowQuit: true }))).toMatchObject({ ok: false, error: { category: 'storeDenied' } });
		expect(state.killed).toEqual([]);
		expect(state.opened).toEqual([]);
		expect(env.files()[CONFIG]).toBe('{}');
	});

	test('an edit between the merge and a refused `key set` is left alone (no rollback): `left: entry` reported', async () => {
		const { env, svc } = machine({
			files: { [CONFIG]: '{}' },
			forwarder: call => {
				if (call.args[1] != 'set') {
					return null;
				};

				const doc = JSON.parse(env.readText(CONFIG));

				doc.mcpServers.anytype.args.push('--extra');
				rewrite(env, CONFIG, JSON.stringify(doc));
				return { code: 7, stdout: JSON.stringify({ ok: false, reason: 'x', store: 'unreachable' }) + '\n' };
			},
		});

		expect(await svc.apply(fb())).toMatchObject({ ok: false, error: { left: 'entry' } });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype.args).toContain('--extra');
	});

	test('a parse failure after the quit relaunches Claude', async () => {
		const { env, state, svc } = machine({ running: true, files: { [CONFIG]: '{}' } });
		const p: any = await plan(svc, { method: 'config' });
		const kill = env.kill;

		// Claude rewrites its config on the way out, broken
		env.kill = (pid, signal) => {
			const ret = kill(pid, signal);

			rewrite(env, CONFIG, '{ broken');
			return ret;
		};
		expect(p.canApply).toBe(true);
		expect(await svc.apply(fb({ allowQuit: true }))).toMatchObject({ ok: false, error: { category: 'unparseable' } });
		expect(state.killed).toEqual([ 42 ]);
		expect(state.opened).toEqual([ [ '-a', APP ] ]);
		expect(item(env)).toBeUndefined();
	});

	test('ownership by digest: an edit of our entry → conflict on check, left alone on remove (the item still goes)', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

		await svc.apply(fb());

		const doc = JSON.parse(env.readText(CONFIG));

		doc.mcpServers.anytype.env = { NODE_OPTIONS: '--inspect' };
		rewrite(env, CONFIG, JSON.stringify(doc));

		const bytes = env.files()[CONFIG];

		expect((await checkStatus(svc)).status).toBe('conflict');
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true });
		expect(env.files()[CONFIG]).toBe(bytes);
		expect(item(env)).toBeUndefined();
	});

	test('remove: our entry is removed while Claude is stopped, left (`entry`) while it runs', async () => {
		const stopped = machine({ files: { [CONFIG]: '{"mcpServers":{}}' } });

		await stopped.svc.apply(fb());
		expect(await stopped.svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true });
		expect(JSON.parse(stopped.env.files()[CONFIG]).mcpServers).toEqual({});

		const running = machine({ files: { [CONFIG]: '{"mcpServers":{}}' } });

		await running.svc.apply(fb());
		running.state.running = true;
		expect(await running.svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true, connection: { left: 'entry' } });
	});

	test.each([
		[ 'Snap', { SNAP: '/snap/anytype/1' } ],
		[ 'Flatpak', { FLATPAK_ID: 'io.anytype.anytype' } ],
	])('Linux %s: expected refusal before any key, no steps, no item and no stable copy', async (name, vars) => {
		const env = fakeEnv({ platform: 'linux', home: '/home/me', vars, dirs: [ '/home/me/.config/Claude', '/home/me/.config/anytype' ], files: { [FORWARDER_BIN]: 'F' }, signed: true });
		const svc = service(env, '/home/me/.config/anytype/aiConnect.json');

		expect(await plan(svc)).toMatchObject({ ok: true, canApply: false, error: { category: 'unsupportedPackage' }, note: 'aiConnectLinuxPackageLimit', steps: [] });
		expect(await svc.apply(cd())).toMatchObject({ ok: false, error: { category: 'unsupportedPackage' } });
		expect(env.forwarder.calls).toEqual([]);
		expect(Object.keys(env.files()).filter(f => f.startsWith('/home/me/.anytype'))).toEqual([]);
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
		expect(env.forwarder.items.size).toBe(0);
		expect(await svc.apply(cd({ quitConfirmed: true }))).toMatchObject({ ok: true, connection: { method: 'config', nextStep: 'restart' } });
		expect(JSON.parse(env.files()['/home/me/.config/Claude/claude_desktop_config.json']).mcpServers.anytype).toEqual({ command: '/home/me/.anytype/bin/anytype-mcp', args: [ 'serve', '--connection', 'claude-desktop' ] });
		expect(env.files()['/home/me/.anytype/bin/anytype-mcp']).toBe('LINUX-FWD');
		expect(env.forwarder.items.get('claude-desktop').key).toBe(KEY_A);
		// The production detection supplies no executable: Claude is neither signalled nor opened
		expect(env.calls.filter(c => /open|taskkill/.test(c.file))).toEqual([]);
	});

	test('T7: a process list that can\'t be read on macOS is unknown: confirm, never assumed stopped', async () => {
		const { env, svc } = machine({ running: 'unknown', files: { [CONFIG]: '{}' } });

		expect(await svc.apply(fb({ allowQuit: true }))).toEqual({ ok: false, needs: 'quitAppSelf' });
		expect(env.files()[CONFIG]).toBe('{}');
		expect(await svc.apply(fb({ quitConfirmed: true }))).toMatchObject({ ok: true });
	});

	test('T10: another account on the config route: the entry is the same for both, so Replace is bound to the item, and completes', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

		await svc.apply(fb());

		const configBytes = env.files()[CONFIG];
		const planB: any = await plan(svc, { accountId: 'acc-b', method: 'config' });

		expect(planB).toMatchObject({ canApply: true, existing: 'foreign', targetPath: CONFIG, replace: { targetPath: CLAUDE_ITEM } });
		expect(await svc.apply(fb({ accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1' }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(await svc.apply(fb({ accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1', replace: planB.replace }))).toMatchObject({ ok: true });
		expect(env.files()[CONFIG]).toBe(configBytes);
		expect(item(env)).toMatchObject({ key: KEY_B, account: 'acc-b' });
	});

	test('T10: both the config entry and the item belong to someone else: manual only, before any key', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: JSON.stringify({ mcpServers: { anytype: { command: 'someone' } } }) } });

		env.forwarder.items.set('claude-desktop', { key: KEY_B, account: 'acc-b', port: 31009, tier: 'large', rev: 3 });
		expect(await plan(svc, { method: 'config' })).toMatchObject({ canApply: false, error: { category: 'conflict' }, steps: [] });
	});

	test('T10: a relaunch that fails after the commit is reported (openFailed, restart step)', async () => {
		const { svc } = machine({ running: true, opens: false, files: { [CONFIG]: '{}' } });

		expect(await svc.apply(fb({ allowQuit: true }))).toMatchObject({ ok: true, openFailed: true, connection: { nextStep: 'restart' } });
	});

	test('T11: a config the writer can\'t edit is manual in the plan (no key is minted for it)', async () => {
		const { svc } = machine({ files: { [CONFIG]: '{ broken' } });

		expect(await plan(svc, { method: 'config' })).toMatchObject({ canApply: false, method: 'manual', error: { category: 'unparseable' } });
	});

	test('T12: manual setup on the config route prepares Anytype\'s side only (the stable copy and the item): no quit, no config edit; pending until the user adds the entry', async () => {
		const { env, state, svc } = machine({ running: true, files: { [CONFIG]: '{"x":1}' } });
		const shown: any = await plan(svc, { method: 'config' });
		const entry = JSON.parse(shown.steps[1].snippet).mcpServers.anytype;
		const res: any = await svc.apply(fb({ manual: true }));

		expect(entry).toEqual(ENTRY);
		expect(JSON.stringify(shown.steps)).not.toMatch(/KEY|Bearer|ELECTRON/);
		expect(res).toMatchObject({ ok: true, connection: { method: 'config', observedInstalled: false, targetPath: CONFIG, entryDigest: canonicalDigest(entry) } });
		expect(state.killed).toEqual([]);
		expect(state.opened).toEqual([]);
		expect(env.files()[CONFIG]).toBe('{"x":1}');
		expect(env.files()[STABLE_BIN]).toBe('FORWARDER-BYTES');
		expect(item(env).key).toBe(KEY_A);

		state.running = false;
		expect((await checkStatus(svc)).status).toBe('pending');

		// The user pasted exactly the step's entry
		rewrite(env, CONFIG, JSON.stringify({ x: 1, mcpServers: { anytype: entry } }));
		expect((await checkStatus(svc)).status).toBe('ok');
	});

	test('T13: an owned entry that isn\'t today\'s command (another channel\'s copy): rewritten while Claude is stopped, reconnect while it runs', async () => {
		const { env, state, svc } = machine({ files: { [CONFIG]: '{}' } });
		const other = { command: STABLE_BIN_RELEASE, args: ENTRY.args };

		await svc.apply(fb());
		// As a release build of this account had written it
		rewrite(env, CONFIG, JSON.stringify({ mcpServers: { anytype: other } }));
		rewrite(env, REGISTRY, env.readText(REGISTRY).split(canonicalDigest(ENTRY)).join(canonicalDigest(other)).split(JSON.stringify(ENTRY.command)).join(JSON.stringify(other.command)));

		const again = service(env);

		state.running = true;
		expect((await checkStatus(again)).status).toBe('reconnect');
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toEqual(other);

		state.running = false;

		const res: any = await check(again);

		expect(res).toMatchObject({ healed: [ 'claude-desktop' ], connections: [ { status: 'ok', nextStep: 'restart' } ] });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toEqual(ENTRY);
		expect(records(env)[0]).toMatchObject({ configEntry: ENTRY, entryDigest: canonicalDigest(ENTRY) });
	});

	test('B2: the API stops before a heal: nothing is retargeted, nothing healed', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });
		let live = true;

		svc.configure({ env, registryFile: REGISTRY, liveApi: () => live });
		await svc.apply(fb());
		live = false;

		const res: any = await check(svc, 31010);

		expect(res).toMatchObject({ ok: true, healed: [] });
		expect(item(env)).toMatchObject({ port: 31009, rev: 1 });
		expect(verbs(env)).not.toContain('key retarget');
	});

	test('T13: an unparseable config on the config route is unreadable, not removed', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

		await svc.apply(fb());
		rewrite(env, CONFIG, '{ broken');
		expect((await checkStatus(svc)).status).toBe('unreadable');
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

		// The in-app forwarder no longer matches its metadata: nothing can be verified or installed
		rewrite(env, FORWARDER_BIN, 'REPLACED');
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
		expect(item(env)).toBeUndefined();
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


	test('T24: config → bundle route keeps the config entry\'s ownership; disconnect still removes that entry and the item', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{"mcpServers":{}}' } });

		await svc.apply(fb());

		const digest = records(env)[0].entryDigest;

		expect(await svc.apply(cd({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: true, connection: { method: 'package', entryDigest: digest, revokePending: [ 'hash-a1' ] } });
		expect(item(env)).toMatchObject({ key: KEY_B, rev: 2 });
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a2' })).toMatchObject({ ok: true });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers).toEqual({});
		expect(item(env)).toBeUndefined();
	});

	test('U12: an owned entry Claude removed while quitting stays removed: the rotation stops, Claude is reopened, the item unchanged', async () => {
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
		expect(item(env)).toMatchObject({ key: KEY_A, rev: 1 });
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
