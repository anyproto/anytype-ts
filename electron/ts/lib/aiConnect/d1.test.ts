/**
 * tokens-plan §5 D1, main side: one test per acceptance case (named after it). D1-01 is in service.test.ts,
 * D1-04 in endpoint.test.ts, D1-07 in forwarder.test.ts and packaging.test.ts, D1-08 in packaging.test.ts,
 * D1-20 in review3.test.ts, the real forwarder's part of D1-05 in forwarder(.windows).integration.test.ts,
 * D1-21 in src/ts/lib/aiConnect/command.test.ts; the renderer's parts in src/ts/lib/aiConnect/tokens.test.ts.
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() }, clipboard: { readText: vi.fn(), writeText: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));
vi.mock('./probe', async original => ({ ...(await original<typeof import('./probe')>()), probe: vi.fn(async () => ({ ok: true })) }));

import { AiConnectService } from './index';
import { probe } from './probe';
import { FORWARDER_FILES, GRANT, KEY_A, KEY_B, MCP_DIR, REGISTRY, STABLE_BIN, applyParam, keysOf, listening, mac, planParam, service } from './testKit';
import { CLIPBOARD_TTL_MS } from './clipboard';
import { serveCommand } from './forwarder';
import { FAKE_REV, FAKE_SIGNER, type FakeEnv } from './testEnv';
import { validateParam } from './validate';
import type { AiRecord, TempFile } from './types';

const DIR = '/Users/me/Library/Application Support/Claude';
const CONFIG = `${DIR}/claude_desktop_config.json`;
const CURSOR = '/Users/me/.cursor/mcp.json';
const APP = '/Applications/Claude.app';
const EXT_DEV = 'local.mcpb.anytype.anytype-dev';
const EXT = 'local.mcpb.anytype.anytype';
const VERSION = `2.${FAKE_REV}.0`;

/** Claude's extension state files: the installation record (identity) and the switch */
const extension = (opt: { id?: string; version?: string; installedAt?: string; enabled?: boolean; signer?: string; status?: string } = {}) => {
	const id = opt.id || EXT_DEV;
	const signatureInfo = { status: opt.status || 'unsigned', ...(opt.signer ? { fingerprint: opt.signer } : {}) };

	return {
		[`${DIR}/extensions-installations.json`]: JSON.stringify({ extensions: { [id]: { id, version: opt.version || VERSION, installedAt: opt.installedAt || 't1', signatureInfo } } }),
		[`${DIR}/Claude Extensions Settings/${id}.json`]: JSON.stringify({ isEnabled: opt.enabled ?? true }),
	};
};

/** A Mac with Claude Desktop (stopped) and Cursor; `opened` records each bundle Claude was asked to open */
const machine = (opt: { files?: Record<string, string>; signed?: boolean } = {}) => {
	const opened: string[][] = [];
	const env = mac({
		apps: [ 'Claude', 'Cursor' ], dirs: [ DIR ], signed: opt.signed,
		files: { ...FORWARDER_FILES, [`${MCP_DIR}/Anytype.mcpb`]: 'zip', ...(opt.files || {}) },
		run: call => {
			if (call.file == '/usr/bin/open') {
				opened.push(call.args);
				return { code: 0, stdout: '' };
			};
			return null;
		},
	});

	env.listProcesses = async () => [];
	return { env, opened, svc: service(env) };
};

const records = (env: FakeEnv): AiRecord[] => JSON.parse(env.readText(REGISTRY) || '{"connections":[]}').connections;
const recordOf = (env: FakeEnv, id = 'claude-desktop') => records(env).find(r => r.id == id);
const bundle = (over: Record<string, any> = {}) => applyParam({ appId: 'claude-desktop', route: 'stdio', name: 'Claude Desktop', method: 'package', tier: 'full', recommendedTier: 'full', ...over });
const config = (over: Record<string, any> = {}) => applyParam({ appId: 'claude-desktop', route: 'stdio', name: 'Claude Desktop', method: 'config', ...over });
const check = async (svc: AiConnectService, keys: any = null, port = 31009): Promise<any> => svc.check({ accountId: 'acc-a', apiListening: true, port, keys });
const row = async (svc: AiConnectService, keys: any = null, id = 'claude-desktop') => (await check(svc, keys)).connections.find((c: any) => c.id == id);
const active = (hash: string, isActive: boolean) => [ { hash, present: true, active: isActive } ];
const put = (env: FakeEnv, file: string, text: string) => {
	const dir = file.slice(0, file.lastIndexOf('/'));

	if (!env.exists(dir)) {
		env.mkdir(dir, 0o700);
	};
	if (env.exists(file)) {
		env.unlink(file);
	};
	env.writeFile(file, text, 0o600).close();
};

describe('D1: Claude\'s extension route', () => {
	test('D1-09: bundle connect with a minted key and no request from Claude — stays "key not confirmed", no probe, the key still on the clipboard', async () => {
		const { env, svc } = machine({ files: extension() });

		vi.mocked(probe).mockClear();
		expect(await svc.apply(bundle())).toMatchObject({ ok: true, configure: true, connection: { status: 'pending', bundleState: 'notConfirmed' } });

		for (let i = 0; i < 3; i++) {
			expect(await row(svc, active('hash-a1', false))).toMatchObject({ status: 'pending', bundleState: 'notConfirmed' });
		};
		expect(probe).not.toHaveBeenCalled();
		expect(env.clip.text).toBe(KEY_A);
		expect(recordOf(env).confirmed).toBeUndefined();
	});

	test('D1-10: then one authenticated request with that key (isActive) — "Connected", the latch saved with the install identity, the clipboard cleared', async () => {
		const { env, svc } = machine({ files: extension({ installedAt: 't1' }) });

		await svc.apply(bundle());
		await check(svc, active('hash-a1', false));
		expect(await row(svc, active('hash-a1', true))).toMatchObject({ status: 'ok' });
		expect(recordOf(env).confirmed).toEqual({ appHash: 'hash-a1', version: VERSION, installedAt: 't1' });
		expect(env.clip.text).toBe('');
		// A fresh install that confirms on its first use, before any "not active" was seen
		const fresh = machine();

		await fresh.svc.apply(bundle());
		expect(await row(fresh.svc, active('hash-a1', false))).toMatchObject({ bundleState: 'finish' });
		for (const [ f, text ] of Object.entries(extension())) {
			put(fresh.env, f, text);
		};
		expect(await row(fresh.svc, active('hash-a1', true))).toMatchObject({ status: 'ok' });
	});

	test('D1-11: the install identity changes while isActive stays true → "Updated in Claude · key not reconfirmed"; isActive false, then true → "Connected"', async () => {
		for (const changed of [ { version: '2.99.0' }, { installedAt: 't2' } ]) {
			const { env, svc } = machine({ files: extension() });

			await svc.apply(bundle());
			expect(await row(svc, active('hash-a1', true))).toMatchObject({ status: 'ok' });

			for (const [ f, text ] of Object.entries(extension(changed))) {
				put(env, f, text);
			};
			expect(await row(svc, active('hash-a1', true))).toMatchObject({ status: 'pending', bundleState: 'updated' });
			expect(await row(svc, active('hash-a1', true))).toMatchObject({ status: 'pending', bundleState: 'updated' });
			// heart restarted, then Claude used the key again
			expect(await row(svc, active('hash-a1', false))).toMatchObject({ status: 'pending', bundleState: 'updated' });
			expect(await row(svc, active('hash-a1', true))).toMatchObject({ status: 'ok' });
			expect(recordOf(env).confirmed).toMatchObject({ appHash: 'hash-a1', ...changed });
		};
	});

	test('D1-12: bundle Reconnect — the old key goes first: CreateApp fails after the confirmation, a crash after aiConnectRetire, RevokeApp fails → the old hash is queued, the row "Disconnected · Reconnect", revoked later', async () => {
		const { env, svc } = machine({ files: extension() });

		await svc.apply(bundle());
		await check(svc, active('hash-a1', true));

		const retired: any = await svc.retire({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' });

		expect(retired).toMatchObject({ ok: true, connection: { appHash: '', status: 'disconnected', revokePending: [ 'hash-a1' ], grant: GRANT } });
		expect(retired.connection.confirmed).toBeUndefined();
		// The new mint failed, RevokeApp failed, or Anytype died here: a restart finds the same, never a live record without its queue entry
		const restarted = service(env);

		expect(await row(restarted, keysOf([ 'hash-a1' ]))).toMatchObject({ status: 'disconnected', appHash: '', revokePending: [ 'hash-a1' ] });
		expect(await restarted.revoked({ accountId: 'acc-a', connectionId: 'claude-desktop', hash: 'hash-a1' })).toMatchObject({ ok: true, connection: { status: 'disconnected', revokePending: [] } });
		// Then Connect on the same record: a new key over "none"
		expect(await restarted.apply(bundle({ key: KEY_B, appHash: 'hash-a2', expectedHash: null }))).toMatchObject({ ok: true, connection: { id: 'claude-desktop', appHash: 'hash-a2', revokePending: [] } });
		expect(await row(restarted, active('hash-a2', true))).toMatchObject({ status: 'ok' });
		// A retire for a key the record doesn't hold is stale
		expect(await restarted.retire({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: false, error: { category: 'stale' } });
	});

	test('D1-13: copy or open fails after the save, the reply is lost, a crash before or after the save — the record survives with its retry action and its key; no save, no record', async () => {
		// The clipboard refuses and Claude can't be asked: the record is saved anyway, both flags set
		const { env, svc } = machine();

		env.clipboardWrite = () => {
			throw new Error('no clipboard');
		};
		const run = env.run;

		env.run = (file, args, opts) => (file == '/usr/bin/open') ? Promise.resolve({ code: 1, stdout: '' }) : run(file, args, opts);

		expect(await svc.apply(bundle())).toMatchObject({ ok: true, copyFailed: true, openFailed: true, connection: { appHash: 'hash-a1', bundleState: 'finish' } });
		expect(recordOf(env)).toMatchObject({ appHash: 'hash-a1', revokePending: [] });

		// A lost reply (or a crash after the save or the copy): the next run lists the record by its hash
		expect((await service(env).list({ accountId: 'acc-a' }) as any).connections).toMatchObject([ { appHash: 'hash-a1', revokePending: [] } ]);

		// A crash before the save: the registry save fails, nothing is copied or opened, no record (the mint intent revokes the key)
		const before = machine();
		const intent: any = await before.svc.mintIntent({ accountId: 'acc-a', name: 'Claude Desktop', time: 1 });
		const rename = before.env.rename;

		before.env.rename = (from, to) => {
			if (to == REGISTRY) {
				throw Object.assign(new Error('EIO'), { code: 'EIO' });
			};
			rename(from, to);
		};
		expect(await before.svc.apply(bundle({ intentId: intent.id }))).toMatchObject({ ok: false, error: { category: 'unsaved' } });
		expect(before.env.clip.writes).toEqual([]);
		expect(before.opened).toEqual([]);
		before.env.rename = rename;
		expect(records(before.env)).toEqual([]);
		expect((await service(before.env).list({ accountId: 'acc-a' }) as any).mintIntents).toEqual([ { id: intent.id, name: 'Claude Desktop', time: 1 } ]);
	});

	test('D1-18: direct IPC aiConnectApply with `method: package`, `tier: small` → validation error; without a method, any tier but Full is refused too', async () => {
		const { env, svc } = machine();

		expect(validateParam('aiConnectApply', bundle({ tier: 'small' }))).toBeNull();
		expect(await svc.apply(bundle({ tier: 'small' }))).toMatchObject({ ok: false, error: { stage: 'validate' } });
		expect(await svc.apply(applyParam({ appId: 'claude-desktop', route: 'stdio', tier: 'small' }))).toMatchObject({ ok: false, error: { stage: 'validate' } });
		expect(records(env)).toEqual([]);
		expect(env.clip.writes).toEqual([]);
	});

	test('D1-19: an extension record with our fingerprint and an unsigned status on a signed build — the bundle is opened, Configure is not offered', async () => {
		const { env, opened, svc } = machine({ signed: true, files: extension({ id: EXT, signer: FAKE_SIGNER, status: 'unsigned' }) });

		expect(await svc.plan(planParam({ appId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'package' }))).not.toMatchObject({ configure: true });

		const res: any = await svc.apply(bundle());

		expect(res).toMatchObject({ ok: true });
		expect(res.configure).toBeUndefined();
		expect(opened).toEqual([ [ '-a', APP, expect.stringMatching(/\/Anytype-[0-9a-f]{12}\.mcpb$/) ] ]);
		// Verified for the status rows all the same: installed and on, waiting for the key
		expect(await row(svc, active('hash-a1', false))).toMatchObject({ bundleState: 'notConfirmed' });
		expect(env.clip.text).toBe(KEY_A);
	});
});

describe('D1: both Claude routes, Disconnect order', () => {
	test('D1-17: config present then bundle plan; bundle present then config plan — refused before mint, each naming the other; both appear after setup → conflict at the check', async () => {
		const withConfig = machine({ files: { [CONFIG]: JSON.stringify({ mcpServers: { anytype: { command: 'x' } } }) } });

		expect(await withConfig.svc.plan(planParam({ appId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'package' }))).toMatchObject({ canApply: false, error: { category: 'conflict' }, note: 'aiConnectClaudeBothConfig' });
		expect(await withConfig.svc.apply(bundle())).toMatchObject({ ok: false, error: { category: 'conflict' } });

		const withExtension = machine({ files: { [CONFIG]: '{}', ...extension() } });

		expect(await withExtension.svc.plan(planParam({ appId: 'claude-desktop', route: 'stdio', method: 'config' }))).toMatchObject({ canApply: false, error: { category: 'conflict' }, note: 'aiConnectClaudeBothExtension' });
		expect(await withExtension.svc.apply(config())).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(withExtension.env.files()[CONFIG]).toBe('{}');
		expect(records(withExtension.env)).toEqual([]);

		// Set up by the config route, then the extension appears: conflict, nothing removed
		const later = machine({ files: { [CONFIG]: '{}' } });

		expect(await later.svc.apply(config())).toMatchObject({ ok: true });
		for (const [ f, text ] of Object.entries(extension())) {
			put(later.env, f, text);
		};

		const bytes = later.env.files()[CONFIG];

		expect(await row(later.svc)).toMatchObject({ status: 'conflict' });
		expect(later.env.files()[CONFIG]).toBe(bytes);
	});

	test('D1-15: Disconnect on the Claude config route when the entry is no longer ours, and a refused HTTP Disconnect → conflict, nothing queued, the key still works after the next check', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}', [CURSOR]: '{"mcpServers":{}}' } });

		await svc.apply(config());
		put(env, CONFIG, JSON.stringify({ mcpServers: { anytype: serveCommand(env, { tier: 'large', key: KEY_B }) } }));
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(recordOf(env)).toMatchObject({ removed: false, revokePending: [] });

		await svc.apply(applyParam({ appHash: 'hash-c1' }));
		put(env, CURSOR, JSON.stringify({ mcpServers: { anytype: { url: 'http://127.0.0.1:31009/mcp/large', headers: { Authorization: 'Bearer someone-elses-key-0123456789' } } } }));
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'hash-c1' })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(recordOf(env, 'cursor')).toMatchObject({ removed: false, revokePending: [] });

		const res = await check(svc, keysOf([ 'hash-a1', 'hash-c1' ]));

		expect(res.connections.every((c: any) => !c.removed && !c.revokePending.length)).toBe(true);
		expect(res.connections.map((c: any) => c.status)).not.toContain('accessEnded');
	});

	test('D1-16: the registry save (or its folder fsync) fails before a Disconnect\'s cleanup → the entry is not removed and no revoke is sent', async () => {
		for (const failing of [ 'rename', 'fsync' ] as const) {
			const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

			await svc.apply(config());

			const bytes = env.files()[CONFIG];
			const rename = env.rename;

			if (failing == 'rename') {
				env.rename = (from, to) => {
					if (to == REGISTRY) {
						throw Object.assign(new Error('EIO'), { code: 'EIO' });
					};
					rename(from, to);
				};
			} else {
				env.fsyncDir = () => {
					throw Object.assign(new Error('EIO'), { code: 'EIO' });
				};
			};

			const res: any = await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' });

			// Not ok: the renderer revokes only what an ok Disconnect handed it
			expect(res, failing).toMatchObject({ ok: false });
			expect(env.files()[CONFIG]).toBe(bytes);
		};

		// The extension and a manual record: the queue is the first step, so nothing follows it
		const { env, svc } = machine({ files: extension() });

		await svc.apply(bundle());
		env.fsyncDir = () => {
			throw Object.assign(new Error('EIO'), { code: 'EIO' });
		};
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: false, error: { category: 'unsaved' } });
		expect(env.clip.text).toBe('');
	});
});

describe('D1: files, commands and the probe', () => {
	/**
	 * Anytype is killed between a secret temp's fsync and its rename: the temp file stays, with the key in it.
	 * Emulated by a write whose rename never happens and whose cleanup never runs
	 */
	const killedWrite = (env: FakeEnv, target: string): (() => void) => {
		const write = env.writeFile;
		const rename = env.rename;
		const unlink = env.unlink;
		let kept = '';

		env.writeFile = (p, data, mode) => {
			const file = write(p, data, mode);

			if (p.startsWith(`${target.slice(0, target.lastIndexOf('/'))}/.${target.split('/').pop()}.new-`)) {
				kept = p;
				return { ...file, wipe: () => {}, close: () => {} } as TempFile;
			};
			return file;
		};
		env.rename = (from, to) => {
			if (from == kept) {
				throw Object.assign(new Error('killed'), { code: 'EKILLED' });
			};
			rename(from, to);
		};
		env.unlink = p => {
			if (p != kept) {
				unlink(p);
			};
		};
		return () => {
			env.writeFile = write;
			env.rename = rename;
			env.unlink = unlink;
		};
	};
	const temps = (env: FakeEnv, file: string) => Object.keys(env.files()).filter(f => f.startsWith(`${file.slice(0, file.lastIndexOf('/'))}/.${file.split('/').pop()}.`) && f.endsWith('.tmp'));

	test('D1-02: killed between a secret temp\'s fsync and its rename (Claude config and Cursor); restart → the temp is gone after start and before the next write; a younger one or one not matching the pattern is left', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}', [CURSOR]: '{"mcpServers":{}}' } });
		let now = 1000;

		env.now = () => now;
		await svc.apply(config());
		await svc.apply(applyParam({ appHash: 'hash-c1' }));

		for (const [ file, param ] of [ [ CONFIG, config({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }) ], [ CURSOR, applyParam({ key: KEY_B, appHash: 'hash-c2', expectedHash: 'hash-c1' }) ] ] as const) {
			const restore = killedWrite(env, file);

			await svc.apply(param);
			restore();
			expect(temps(env, file), file).toHaveLength(1);
			expect(env.files()[temps(env, file)[0]]).toContain(KEY_B);
		};

		// A writer still at work (younger than a minute), and a file that only looks similar
		now += 61 * 1000;
		put(env, `${DIR}/.claude_desktop_config.json.new-${now}-abcdef12.tmp`, 'young');
		put(env, `${DIR}/.claude_desktop_config.json.backup.tmp`, 'other');

		await service(env).startup('/Users/me/Library/Application Support/anytype');
		expect(temps(env, CONFIG).sort()).toEqual([ `${DIR}/.claude_desktop_config.json.backup.tmp`, `${DIR}/.claude_desktop_config.json.new-${now}-abcdef12.tmp` ]);
		expect(temps(env, CURSOR)).toEqual([]);

		// Before the next secret write the same sweep runs (here: the young one has aged)
		now += 61 * 1000;
		expect(await service(env).apply(applyParam({ key: KEY_B, appHash: 'hash-c3', expectedHash: 'hash-c1' }))).toMatchObject({ ok: true });
		expect(temps(env, CURSOR)).toEqual([]);
		expect(JSON.stringify(env.files())).not.toMatch(/\.anytype-backup/);
	});

	test('D1-03: every command Anytype writes or shows carries the key only under `env`, never in `command` or `args`', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

		await svc.apply(config());

		const written = JSON.parse(env.files()[CONFIG]).mcpServers.anytype;
		const other: any = await svc.plan(planParam({ appId: 'other', route: 'stdio', tier: 'full', method: 'command' }));
		const shown = JSON.parse(other.steps.find((s: any) => s.snippet).snippet).mcpServers.anytype;
		const manual: any = await svc.plan(planParam({ appId: 'claude-desktop', route: 'stdio', method: 'config' }));
		const claudeShown = JSON.parse(manual.steps.find((s: any) => s.snippet).snippet).mcpServers.anytype;

		expect(written).toEqual({ command: STABLE_BIN, args: [ 'serve', '--tier', 'large' ], env: { ANYTYPE_API_KEY: KEY_A } });
		for (const it of [ written, shown, claudeShown ]) {
			expect(JSON.stringify([ it.command, it.args ])).not.toMatch(/SENTINEL|<KEY>/);
			expect(Object.keys(it.env)).toEqual([ 'ANYTYPE_API_KEY' ]);
		};
		// No child Anytype starts gets a key in argv (the forwarder's own verbs included)
		expect(env.calls.filter(c => c.args.join(' ').includes('SENTINEL'))).toEqual([]);
		expect(env.calls.filter(c => JSON.stringify(c.opts.env || {}).includes('SENTINEL'))).toEqual([]);
	});

	test('D1-05: preflight with an unsafe existing folder (the forwarder says `denied`) — the stdio plans are refused with its rule and path, before any key; the HTTP plan is unaffected', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

		env.forwarder.verdict = { ok: false, reason: 'denied', path: '/Users/me/.anytype', rule: 'a folder on the endpoint path is writable by others' };

		const denied = { canApply: false, needsKey: false, error: { category: 'storeDenied', path: '/Users/me/.anytype', rule: 'a folder on the endpoint path is writable by others' } };

		expect(await svc.plan(planParam({ appId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'package' }))).toMatchObject(denied);
		expect(await svc.plan(planParam({ appId: 'claude-desktop', route: 'stdio', method: 'config' }))).toMatchObject(denied);
		expect(await svc.plan(planParam({ appId: 'other', route: 'stdio', method: 'command' }))).toMatchObject(denied);
		// Apply runs it again
		expect(await svc.apply(bundle())).toMatchObject({ ok: false, error: { category: 'storeDenied' } });
		expect(await svc.apply(config())).toMatchObject({ ok: false, error: { category: 'storeDenied' } });
		expect(env.files()[CONFIG]).toBe('{}');
		expect(records(env)).toEqual([]);
		expect(await svc.plan(planParam())).toMatchObject({ ok: true, canApply: true, method: 'config', route: 'http' });

		// The verb ran on the in-app forwarder for the extension, on the stable copy for the config route and Command
		const files = env.forwarder.calls.filter(c => c.args[0] == 'endpoint').map(c => c.file);

		expect(files.some(f => f.endsWith('/dist/anytype-mcp'))).toBe(true);
		expect(files).toContain(STABLE_BIN);
		// Another instance's port: not ours either
		env.forwarder.verdict = { ok: true, port: 40000 };
		expect(await svc.plan(planParam({ appId: 'other', route: 'stdio', method: 'command' }))).toMatchObject({ canApply: false, error: { category: 'unreachable' } });
	});

	test('D1-06: aiConnectProbe with the API off or another port live in main → no request is sent, any route, on apply and on Retry', async () => {
		const env = mac({ apps: [ 'Cursor' ], files: { ...FORWARDER_FILES } });
		let live = 0;
		const setup = { env, registryFile: REGISTRY, apiState: () => listening(), liveApi: (port: number) => port == live };
		const svc = new AiConnectService(() => setup);

		svc.configure(setup);
		await svc.apply(applyParam());
		vi.mocked(probe).mockClear();

		for (const route of [ 'http', 'stdio', 'skill' ]) {
			// API off, then another port live: refused before anything leaves (the first call is the apply's, the second Retry's)
			for (const now of [ 0, 31010 ]) {
				live = now;
				expect(await svc.probe({ port: 31009, tier: 'large', route, key: KEY_A, accountId: 'acc-a', connectionId: 'cursor' })).toEqual({ ok: false, category: 'apiOff' });
				expect(await svc.probe({ port: 31009, tier: 'large', route, key: KEY_A })).toEqual({ ok: false, category: 'apiOff' });
			};
		};
		expect(probe).not.toHaveBeenCalled();

		live = 31009;
		expect(await svc.probe({ port: 31009, tier: 'large', route: 'http', key: KEY_A })).toEqual({ ok: true });
		expect(probe).toHaveBeenCalledTimes(1);
	});
});

describe('D1: the clipboard', () => {
	test('D1-23: copy again before and after the deadline, two sheets, account switch, unrelated text — only the latest copy is cleared, and only while the clipboard still holds it', async () => {
		const { env, svc } = machine();
		let now = 1000;

		env.now = () => now;

		const copy = (text: string, owner: Record<string, string> = { connectionId: 'claude-desktop' }, accountId = 'acc-a') => svc.copySecret({ accountId, text, ...owner });

		// Copy, then Copy again before the deadline: the first one's timer no longer clears anything
		expect(await copy('SECRET-ONE-0123456789')).toEqual({ ok: true });
		now += CLIPBOARD_TTL_MS - 1000;
		expect(await copy('SECRET-TWO-0123456789')).toEqual({ ok: true });
		now += 2000;
		env.fireTimers();
		expect(env.clip.text).toBe('SECRET-TWO-0123456789');
		// …the second one's deadline does
		now += CLIPBOARD_TTL_MS;
		env.fireTimers();
		expect(env.clip.text).toBe('');

		// After the deadline the user copied something else: left alone
		await copy('SECRET-THREE-0123456789');
		env.clipboardWrite('the user\'s own text');
		now += CLIPBOARD_TTL_MS + 1;
		env.fireTimers();
		expect(env.clip.text).toBe('the user\'s own text');

		// Two sheets: an Other snippet replaces the bundle key; Disconnect of the bundle record clears nothing of the other sheet's
		await svc.apply(bundle());
		await copy('{"env":{"ANYTYPE_API_KEY":"SECRET-FOUR-0123456789"}}', { appHash: 'hash-other' });
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true });
		expect(env.clip.text).toContain('SECRET-FOUR');

		// Account switch: the next call of another account clears the previous account's copy
		await svc.list({ accountId: 'acc-b' });
		expect(env.clip.text).toBe('');

		// Logout and quit clear it too
		await copy('SECRET-FIVE-0123456789', { appHash: 'h' }, 'acc-b');
		await svc.accountStopped();
		expect(env.clip.text).toBe('');
		await copy('SECRET-SIX-0123456789', { appHash: 'h' }, 'acc-b');
		svc.shutdown();
		expect(env.clip.text).toBe('');
		// A copy bound to no record or key is refused
		expect(await svc.copySecret({ accountId: 'acc-a', text: 'x' })).toEqual({ ok: false });
	});
});

describe('D1: regressions kept', () => {
	test('D1-24: HTTP port healing and T2 orphan recovery (the S1 transport mark is the renderer\'s: flow.test.ts, dispatcher.sentinel.test.ts)', async () => {
		const { env, svc } = machine({ files: { [CURSOR]: '{"mcpServers":{}}' } });

		await svc.apply(applyParam({ appHash: 'hash-c1' }));
		expect(await check(svc, keysOf([ 'hash-c1' ]), 31010)).toMatchObject({ healed: [ 'cursor' ] });
		expect(JSON.parse(env.files()[CURSOR]).mcpServers.anytype.url).toBe('http://127.0.0.1:31010/mcp/large');
		expect(env.files()[`${CURSOR}.anytype-backup`]).toBeUndefined();

		// T2: a key the recovery found is already in Cursor's file (Anytype died before saving the rotation): kept, promoted
		const intent: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Cursor', time: 1 });
		const restarted = service(env);

		put(env, CURSOR, JSON.stringify({ mcpServers: { anytype: { url: 'http://127.0.0.1:31010/mcp/large', headers: { Authorization: `Bearer ${KEY_B}` } } } }));
		expect(await restarted.orphan({ accountId: 'acc-a', hash: 'hash-c2', intentId: intent.id, key: KEY_B })).toMatchObject({ ok: false });
		expect(await row(restarted, keysOf([ 'hash-c1', 'hash-c2' ]), 'cursor')).toMatchObject({ appHash: 'hash-c2', revokePending: [ 'hash-c1' ] });
	});
});
