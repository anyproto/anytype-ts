/**
 * D1 review round 1 (`.review-d1r1-adjudication.md`), main side: one regression per accepted theme.
 * The renderer's are in src/ts/lib/aiConnect (D1R1-C/D/G), the build's in packaging.test.ts (D1R1-B…), the
 * probe's per-request gate in probe.test.ts (D1R1-F).
 */
import fs from 'fs';
import path from 'path';
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() }, clipboard: { readText: vi.fn(), writeText: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));
vi.mock('./probe', async original => ({ ...(await original<typeof import('./probe')>()), probe: vi.fn(async () => ({ ok: true })) }));

import { AiConnectService } from './index';
import { probe } from './probe';
import { ENDPOINT_DEV, FORWARDER_FILES, GRANT, KEY_A, KEY_B, MCP_DIR, REGISTRY, applyParam, keysOf, listening, mac, planParam, service } from './testKit';
import { ensureInstalled } from './forwarder';
import { syncEndpoint } from './endpoint';
import { Registry } from './registry';
import { FAKE_REV, FAKE_SID, fakeEnv, type FakeEnv } from './testEnv';
import type { AiRecord } from './types';

const DIR = '/Users/me/Library/Application Support/Claude';
const CONFIG = `${DIR}/claude_desktop_config.json`;
const CUSTOM = '/Users/me/Profiles/work';
const EXT = 'local.mcpb.anytype.anytype-dev';
const extension = (enabled: any = true) => ({
	[`${DIR}/extensions-installations.json`]: JSON.stringify({ extensions: { [EXT]: { id: EXT, version: `2.${FAKE_REV}.0`, installedAt: 't1', signatureInfo: { status: 'unsigned' } } } }),
	[`${DIR}/Claude Extensions Settings/${EXT}.json`]: JSON.stringify((enabled == 'missing') ? {} : { isEnabled: enabled }),
});
const machine = (files: Record<string, string> = {}, signed = false) => {
	const env = mac({ apps: [ 'Claude', 'Cursor' ], dirs: [ DIR, CUSTOM ], signed, files: { ...FORWARDER_FILES, [`${MCP_DIR}/Anytype.mcpb`]: 'zip', ...files } });

	env.listProcesses = async () => [];
	return { env, svc: service(env) };
};
const records = (env: FakeEnv, file = REGISTRY): AiRecord[] => JSON.parse(env.readText(file) || '{"connections":[]}').connections;
const bundle = (over: Record<string, any> = {}) => applyParam({ appId: 'claude-desktop', route: 'stdio', name: 'Claude Desktop', method: 'package', tier: 'full', recommendedTier: 'full', ...over });
const check = async (svc: AiConnectService, keys: any = null): Promise<any> => svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys });
const put = (env: FakeEnv, file: string, text: string) => {
	if (env.exists(file)) {
		env.unlink(file);
	};
	env.writeFile(file, text, 0o600).close();
};

describe('D1R1-A: the profile a cold start really uses', () => {
	test('D1R1-A: startup binds the service to the custom profile: its records and queued revocations are the ones listed; the default profile is untouched', async () => {
		const { env, svc } = machine();
		const custom = `${CUSTOM}/aiConnect.json`;

		new Registry(env, custom).upsert({ ...(await (async () => {
			const tmp = machine();

			await tmp.svc.apply(applyParam({ appHash: 'hash-w' }));
			return records(tmp.env)[0];
		})()), removed: true, revokePending: [ 'hash-w' ] });

		await svc.startup(CUSTOM);
		expect((await svc.list({ accountId: 'acc-a' }) as any).connections).toMatchObject([ { id: 'cursor', revokePending: [ 'hash-w' ] } ]);
		expect(await svc.apply(applyParam({ appHash: 'hash-new', appId: 'claude-desktop', route: 'stdio', method: 'package', tier: 'full' }))).toMatchObject({ ok: true });
		expect(records(env, custom).map(r => r.id).sort()).toEqual([ 'claude-desktop', 'cursor' ]);
		expect(env.exists(REGISTRY)).toBe(false);
	});
});

describe('D1R1-B: quit cleans up on every path', () => {
	test('D1R1-B: Api.exit runs the cleanup before heart stops; after it nothing queued publishes the endpoint or copies a key', async () => {
		const api = fs.readFileSync(path.join(__dirname, '../../api.ts'), 'utf8');
		const exit = api.slice(api.indexOf('exit (win: AppWindow | null'), api.indexOf('closeAllTabSessions (win'));

		expect(exit.indexOf('aiConnect.shutdown()')).toBeGreaterThan(0);
		expect(exit.indexOf('aiConnect.shutdown()')).toBeLessThan(exit.indexOf('Server.stop'));

		const { env, svc } = machine();

		await svc.apply(bundle());
		expect(env.files()[ENDPOINT_DEV]).toBeTruthy();
		expect(env.clip.text).toBe(KEY_A);
		svc.shutdown();
		svc.shutdown();
		expect(env.files()[ENDPOINT_DEV]).toBeUndefined();
		expect(env.clip.text).toBe('');

		await svc.apiChanged('localApiBind');
		expect(env.files()[ENDPOINT_DEV]).toBeUndefined();
		expect(await svc.copySecret({ accountId: 'acc-a', connectionId: 'claude-desktop', text: KEY_A })).toEqual({ ok: false });
		expect(env.clip.text).toBe('');
	});
});

describe('D1R1-C: no revocation for a save reported as failed', () => {
	test('D1R1-C: the registry rename succeeds and its folder fsync fails → the previous state is put back: a restart queues nothing, the entry stays', async () => {
		const { env, svc } = machine({ [CONFIG]: '{}' });

		await svc.apply(applyParam({ appId: 'claude-desktop', route: 'stdio', method: 'config', name: 'Claude Desktop' }));

		const bytes = env.files()[CONFIG];
		let fail = true;

		env.fsyncDir = () => {
			if (fail) {
				fail = false;
				throw Object.assign(new Error('EIO'), { code: 'EIO' });
			};
		};
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: false });
		expect(env.files()[CONFIG]).toBe(bytes);
		expect(records(env)[0]).toMatchObject({ removed: false, revokePending: [] });
		expect((await service(env).list({ accountId: 'acc-a' }) as any).connections[0]).toMatchObject({ removed: false, revokePending: [] });
	});
});

describe('D1R1-D: the old extension key goes first', () => {
	test('D1R1-D: a new key over a live extension record is refused until aiConnectRetire; retire keeps the access just confirmed, also across a restart', async () => {
		const { env, svc } = machine();

		await svc.apply(bundle());
		expect(await svc.apply(bundle({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, error: { category: 'stale' } });
		expect(records(env)[0]).toMatchObject({ appHash: 'hash-a1', revokePending: [] });

		const narrow = { spaceIds: [ 'space-1' ], allSpaces: false, perm: 0 };

		expect(await svc.retire({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', grant: narrow, expireAt: 4000000000 })).toMatchObject({ ok: true, connection: { status: 'disconnected', grant: narrow, expireAt: 4000000000 } });
		expect(records(service(env) && env)[0]).toMatchObject({ appHash: '', grant: narrow, expireAt: 4000000000, revokePending: [ 'hash-a1' ] });
		expect(await service(env).apply(bundle({ key: KEY_B, appHash: 'hash-a2', expectedHash: null, grant: narrow, expireAt: 4000000000 }))).toMatchObject({ ok: true, connection: { grant: narrow } });
	});
});

describe('D1R1-E: a kept stable copy is judged before it runs', () => {
	test('D1R1-E: Windows — a higher-revision copy another account may replace is never executed; an unsigned build never keeps a copy it can\'t verify', async () => {
		const ROOT = 'C:\\Program Files\\Anytype\\resources\\app.asar.unpacked';
		const BIN = 'C:\\Users\\me\\.anytype\\bin';
		const STABLE = `${BIN}\\anytype-mcp.exe`;
		const win = (signed: boolean, acl: Record<string, string[]>) => fakeEnv({
			platform: 'win32', home: 'C:\\Users\\me', vars: { SystemRoot: 'C:\\Windows' }, signed, acl,
			dirs: [ 'C:\\Users\\me\\.anytype', signed ? BIN : `${BIN}-dev` ],
			files: { [`${ROOT}\\dist\\anytype-mcp.exe`]: 'EXE', [signed ? STABLE : `${BIN}-dev\\anytype-mcp.exe`]: 'NEWER', [`${signed ? STABLE : `${BIN}-dev\\anytype-mcp.exe`}.rev`]: '9\n' },
			run: call => (/powershell\.exe$/i.test(call.file) ? { code: 0, stdout: 'same-signer\r\n' } : { code: 1, stdout: '' }),
		});
		const loose = win(true, { [STABLE]: [ 'S-1-5-32-545' ] });

		expect(await ensureInstalled(loose)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(loose.calls.filter(c => c.file == STABLE)).toEqual([]);

		const dev = win(false, {});

		expect(await ensureInstalled(dev)).toMatchObject({ ok: true, installed: true });
		expect(dev.files()[`${BIN}-dev\\anytype-mcp.exe`]).toBe('EXE');
		expect(dev.calls.filter(c => c.args[0] == 'version')).toEqual([]);
		expect(FAKE_SID).toBeTruthy();
	});
});

describe('D1R1-F: the desktop\'s own probe', () => {
	test('D1R1-F: a [::1] bind of the same port, or a logout, means no request leaves main', async () => {
		const env = mac({ apps: [ 'Cursor' ], files: { ...FORWARDER_FILES } });
		const api = listening(40999);
		const setup = { env, registryFile: REGISTRY, apiState: () => api, liveApi: () => true };
		const svc = new AiConnectService(() => setup);

		svc.configure(setup);
		vi.mocked(probe).mockClear();
		api.bind = { addr: '[::1]:40999', success: true };
		expect(await svc.probe({ port: 40999, tier: 'large', route: 'http', key: KEY_A })).toEqual({ ok: false, category: 'apiOff' });
		api.bind = { addr: '127.0.0.1:40999', success: true };
		await svc.accountStopped();
		expect(await svc.probe({ port: 40999, tier: 'large', route: 'http', key: KEY_A })).toEqual({ ok: false, category: 'apiOff' });
		expect(probe).not.toHaveBeenCalled();

		await svc.apiChanged('localApiBind');
		expect(await svc.probe({ port: 40999, tier: 'large', route: 'http', key: KEY_A })).toEqual({ ok: true });
		expect(vi.mocked(probe).mock.calls[0][1].gate()).toBe(true);
		api.localApi = { enabled: false, port: 40999 };
		// The gate the transport asks before each request sees the change at once
		expect(vi.mocked(probe).mock.calls[0][1].gate()).toBe(false);
	});
});

describe('D1R1-G: the rest', () => {
	test('D1R1-G: endpoint ownership survives a failed withdrawal and a failed fsync after the rename', async () => {
		const env = mac({ files: { ...FORWARDER_FILES } });
		const on = { ...listening(), account: true };
		const off = { ...on, localApi: { enabled: false, port: 31009 } };
		const logged: string[] = [];

		env.fsyncDir = () => {
			throw Object.assign(new Error('EIO'), { code: 'EIO' });
		};
		expect(await syncEndpoint(env, on, null, c => logged.push(c))).toBe(31009);
		expect(logged).toEqual([ 'EIO' ]);

		const unlink = env.unlink;

		env.unlink = p => {
			if (p == ENDPOINT_DEV) {
				throw Object.assign(new Error('EBUSY'), { code: 'EBUSY' });
			};
			unlink(p);
		};
		expect(await syncEndpoint(env, off, 31009)).toBe(31009);
		env.unlink = unlink;
		expect(await syncEndpoint(env, off, 31009)).toBeNull();
		expect(env.files()[ENDPOINT_DEV]).toBeUndefined();
	});

	test('D1R1-G: start-up and first-scan sweeps reach a first install\'s target and Hermes\' .env', async () => {
		const { env, svc } = machine({ '/Users/me/.cursor/mcp.json': '{"mcpServers":{}}' });
		let now = 1000;

		env.now = () => now;
		await svc.apply(applyParam({ appHash: 'hash-c1' }));
		env.mkdir('/Users/me/.hermes', 0o700);
		put(env, '/Users/me/.hermes/..env.new-1000-abcdef12.tmp', 'MCP_ANYTYPE_API_KEY=x');
		put(env, `${DIR}/.claude_desktop_config.json.new-1000-abcdef12.tmp`, 'first install');
		now += 61 * 1000;

		const restarted = service(env);

		await restarted.startup('/Users/me/Library/Application Support/anytype');
		await restarted.list({ accountId: 'acc-a', refresh: true });
		expect(Object.keys(env.files()).filter(f => f.endsWith('.tmp'))).toEqual([]);
	});

	test('D1R1-G: Claude settings that can\'t be read never show "Connected" and confirm nothing; the latch is kept', async () => {
		const { env, svc } = machine(extension('missing'));

		await svc.apply(bundle());
		const row = async (active: boolean) => (await check(svc, [ { hash: 'hash-a1', present: true, active } ])).connections[0];

		expect(await row(true)).toMatchObject({ status: 'pending', bundleState: 'off' });
		expect(records(env)[0].confirmed).toBeUndefined();
		expect(env.clip.text).toBe(KEY_A);
	});

	test('D1R1-G: Claude by hand with the extension there too → conflict with `bothRoutes`; Open again refuses while the settings file has an entry', async () => {
		const { env, svc } = machine({ [CONFIG]: JSON.stringify({ mcpServers: { anytype: { command: 'x' } } }), ...extension() });

		await svc.recordManual({ accountId: 'acc-a', appId: 'claude-desktop', route: 'stdio', tier: 'full', recommendedTier: 'full', port: 31009, appHash: 'hash-m', name: 'Claude Desktop', grant: GRANT, expireAt: 0, expectedHash: null, setup: 'command' });
		expect((await check(svc, keysOf([ 'hash-m' ]))).connections[0]).toMatchObject({ status: 'conflict', bothRoutes: true });
		expect(await svc.openApp({ appId: 'claude-desktop', bundle: true })).toEqual({ ok: false });
		expect(env.calls.filter(c => c.file == '/usr/bin/open')).toEqual([]);
	});

	test('D1R1-G: a manual stdio record names its build: a development build gets no snippet, no replacement, `conflict` at the check', async () => {
		const release = machine({}, true);
		const manual = { accountId: 'acc-a', appId: 'other', route: 'stdio', tier: 'full', recommendedTier: 'full', port: 31009, appHash: 'hash-o', name: 'Agent', grant: GRANT, expireAt: 0, expectedHash: null, setup: 'command' };
		const made: any = await release.svc.recordManual(manual);

		expect(made.connection).toMatchObject({ ns: 'release', setup: 'command' });

		const dev = machine();

		put(dev.env, REGISTRY, release.env.readText(REGISTRY));
		expect(await dev.svc.plan(planParam({ appId: 'other', route: 'stdio', method: 'command', connectionId: made.connection.id }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(await dev.svc.recordManual({ ...manual, appHash: 'hash-o2', expectedHash: 'hash-o', connectionId: made.connection.id })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect((await check(dev.svc)).connections[0]).toMatchObject({ status: 'conflict' });
	});

	test('D1R1-G: Windows — an existing Anytype folder another account may change gets no endpoint file', async () => {
		const ai = 'C:\\Users\\me\\.anytype\\ai-connect';
		const env = fakeEnv({ platform: 'win32', home: 'C:\\Users\\me', vars: { SystemRoot: 'C:\\Windows' }, dirs: [ 'C:\\Users\\me\\.anytype', ai ], acl: { [ai]: [ 'S-1-5-32-545' ] } });

		expect(await syncEndpoint(env, { ...listening(), account: true }, null)).toBeNull();
		expect(env.files()[`${ai}\\endpoint-dev.json`]).toBeUndefined();
	});
});
