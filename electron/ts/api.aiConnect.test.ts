/**
 * The aiConnect* IPC methods through the real Api facade, with Electron mocked and the service's
 * outside world replaced by a fake Env (no real home, no real AI apps). Probes go to a local
 * HTTP stand-in for heart through the production node:http transport.
 */
import fs from 'fs';
import http from 'http';
import type { AddressInfo } from 'net';
import path from 'path';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({
	app: { getVersion: () => '0.0.0', getPath: vi.fn(() => '/nonexistent'), setPath: vi.fn(), isPackaged: false, on: vi.fn(), getApplicationInfoForProtocol: vi.fn() },
	shell: { openExternal: vi.fn(), showItemInFolder: vi.fn(), beep: vi.fn() },
	BrowserWindow: class {},
	Menu: { buildFromTemplate: vi.fn(), setApplicationMenu: vi.fn() },
	Notification: class {},
	ipcMain: { on: vi.fn(), handle: vi.fn() },
	session: { defaultSession: {} },
	clipboard: { writeText: vi.fn(), readText: () => '' },
}));
vi.mock('electron-util', () => ({ is: { macos: true, windows: false, linux: false, development: false }, fixPathForAsarUnpack: (p: string) => p }));
vi.mock('electron-dl', () => ({ download: vi.fn() }));
vi.mock('keytar', () => ({ default: {} }));
vi.mock('check-disk-space', () => ({ default: async () => ({ free: 0, size: 0 }) }));
vi.mock('./menu', () => ({ default: {} }));
vi.mock('./config', () => ({ default: { config: {}, set: (c: any, cb: () => void) => cb() } }));
vi.mock('./window', () => ({ default: { sendToAllTabs: vi.fn(), list: [] } }));
vi.mock('./update', () => ({ default: {} }));
vi.mock('./server', () => ({ default: {} }));
vi.mock('./util', () => ({ default: { log: vi.fn(), send: vi.fn(), dataPath: () => '', isDarkTheme: () => false, getCss: () => '' } }));
/** Main's copy of the renderer's shared settings (`localApi`, Z4) */
const safe = vi.hoisted(() => ({ localApi: undefined as any, localApiBind: undefined as any }));

vi.mock('./safeStorage', () => ({ getSafeStorage: () => ({ get: (k: string) => (safe as any)[k] }) }));
vi.mock('./linkApproval', () => ({ default: class { approve () {}; decide () {}; } }));
vi.mock('./download', () => ({ default: { start: vi.fn(), cancel: vi.fn() } }));

import { app } from 'electron';
import Api from './api';
import Util from './util';
import { AiConnectService, aiConnect, storedLiveApi } from './lib/aiConnect';
import { fakeEnv, type FakeEnv } from './lib/aiConnect/testEnv';
import { PROBE_PROTOCOL_VERSION } from './lib/aiConnect/probe';
import { keyFingerprint } from './lib/aiConnect/digest';
import type { AiRecord, Env } from './lib/aiConnect/types';

const win = {} as any;
const KEY = 'SENTINEL-api-key-0123456789abc';
const OTHER_KEY = 'SENTINEL-api-key-rotated-98765';
const REGISTRY = '/Users/me/userData/aiConnect.json';
const MCP = '/Applications/Anytype.app/Contents/Resources/app.asar.unpacked/dist/mcp';

let logs: string[] = [];
let port = 0;
let server: http.Server;
/** Delays the heart's answers, to rotate a key while a probe is in flight */
let gate: Promise<void> | null = null;

beforeAll(async () => {
	server = http.createServer((req, res) => {
		let body = '';

		req.on('data', c => body += c);
		req.on('end', async () => {
			if (gate) {
				await gate;
			};

			const auth = String(req.headers.authorization || '');

			if (![ `Bearer ${KEY}`, `Bearer ${OTHER_KEY}` ].includes(auth)) {
				res.writeHead(401).end();
				return;
			};
			if (req.method == 'DELETE') {
				res.writeHead(200).end();
				return;
			};

			const msg = JSON.parse(body);

			if (msg.method == 'initialize') {
				res.writeHead(200, { 'Mcp-Session-Id': 's1' }).end(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { protocolVersion: PROBE_PROTOCOL_VERSION } }));
			} else
			if (msg.method == 'tools/list') {
				res.writeHead(200).end(JSON.stringify({ jsonrpc: '2.0', id: 2, result: { tools: [ { name: 'search' } ] } }));
			} else {
				res.writeHead(202).end();
			};
		});
	});

	await new Promise<void>(r => server.listen(0, '127.0.0.1', () => r()));
	port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
	server.closeAllConnections?.();
	await new Promise(r => server.close(r));
});

const record = (id: string, over: Partial<AiRecord> = {}): AiRecord => ({
	id: id as any, appId: 'cursor', accountId: 'acc-1', appHash: 'h-' + id, keyFp: keyFingerprint(KEY), name: 'Cursor', route: 'http', tier: 'large',
	recommendedTier: 'large', method: 'config', targetPath: '/Users/me/.cursor/mcp.json', port: 31009, createdAt: 1,
	grant: { spaceIds: [], allSpaces: true, perm: 1 }, expireAt: 0, nextStep: 'none', observedInstalled: true, lastProbe: 'none',
	revokePending: [], removed: false, createdDirs: [], ...over,
});

const macEnv = (files: Record<string, string> = {}): FakeEnv => fakeEnv({
	platform: 'darwin',
	home: '/Users/me',
	dirs: [ '/Applications/Claude.app', '/Applications/Cursor.app', '/Users/me/.codex', '/Users/me/userData', '/Users/me/userData2' ],
	files,
	run: call => {
		if (call.file == '/usr/bin/plutil') {
			const ids: Record<string, string> = { '/Applications/Claude.app': 'com.anthropic.claudefordesktop', '/Applications/Cursor.app': 'com.todesktop.230313mzl4w4u92' };
			const app = call.args[call.args.length - 1].replace(/\/Contents\/Info\.plist$/, '');
			return ids[app] ? { code: 0, stdout: ids[app] + '\n' } : { code: 1, stdout: '' };
		};
		if (call.file == '/bin/zsh') {
			return { code: 0, stdout: 'claude=\nPATH=/usr/bin\n' };
		};
		return { code: 0, stdout: '' };
	},
});

const withRecords = (records: AiRecord[], extra: Record<string, string> = {}): FakeEnv => macEnv({
	[REGISTRY]: JSON.stringify({ version: 1, nudgeClaimed: false, connections: records }),
	...extra,
});

const stored = (env: Env, id: string): AiRecord => JSON.parse(env.readText(REGISTRY)).connections.find((c: AiRecord) => c.id == id);

beforeEach(() => {
	logs = [];
	gate = null;
	// The registry lives in the fake file system too
	aiConnect.configure({ env: macEnv(), registryFile: REGISTRY, version: '0.0.0', log: (method, code) => logs.push(`${method}:${code}`) });
});

describe('Api aiConnect*', () => {
	test('aiConnectList returns this machine\'s detections, scanOk and the account\'s orphans', async () => {
		const res: any = await Api.aiConnectList(win, { accountId: 'acc-1' });

		expect(res.ok).toBe(true);
		expect(res.scanOk).toBe(true);
		expect(res.connections).toEqual([]);
		expect(res.orphanHashes).toEqual([]);
		expect(res.detections.filter((d: any) => d.installed).map((d: any) => d.appId).sort()).toEqual([ 'claude-desktop', 'codex', 'cursor' ]);
		// Cursor.app was found on macOS: Anytype can restart it (only after a click)
		expect(res.detections.find((d: any) => d.appId == 'cursor')).toEqual({ appId: 'cursor', installed: true, targetId: 'cursor', targetPaths: [ '/Users/me/.cursor/mcp.json' ], canRestart: true, canOpen: true });
		// App and executable paths stay in main
		expect(JSON.stringify(res)).not.toContain('/Applications/');
	});

	test('aiConnectList caches detection until refresh', async () => {
		const env = macEnv();
		const scans: string[] = [];
		const run = env.run;

		env.run = async (file, args, opts) => {
			scans.push(file);
			return run(file, args, opts);
		};
		aiConnect.configure({ env, registryFile: REGISTRY });

		await Api.aiConnectList(win, { accountId: 'a' });
		const first = scans.length;

		await Api.aiConnectList(win, { accountId: 'a' });
		expect(scans.length).toBe(first);

		await Api.aiConnectList(win, { accountId: 'a', refresh: true });
		expect(scans.length).toBeGreaterThan(first);
	});

	test('aiConnectOrphan: remembered per account until done, listed by aiConnectList', async () => {
		expect(await Api.aiConnectOrphan(win, { accountId: 'acc-1', hash: 'h-orphan' })).toEqual({ ok: true });
		expect(await Api.aiConnectOrphan(win, { accountId: 'acc-2', hash: 'h-other' })).toEqual({ ok: true });
		expect(((await Api.aiConnectList(win, { accountId: 'acc-1' })) as any).orphanHashes).toEqual([ 'h-orphan' ]);

		expect(await Api.aiConnectOrphan(win, { accountId: 'acc-1', hash: 'h-orphan', done: true })).toEqual({ ok: true });
		expect(((await Api.aiConnectList(win, { accountId: 'acc-1' })) as any).orphanHashes).toEqual([]);
		expect(((await Api.aiConnectList(win, { accountId: 'acc-2' })) as any).orphanHashes).toEqual([ 'h-other' ]);
		expect(await Api.aiConnectOrphan(win, { accountId: 'acc-1', hash: 'bad hash' })).toMatchObject({ ok: false });
	});

	test('a registry that can not be read fails the call and is retried by the next one', async () => {
		const env = withRecords([ record('cursor') ]);
		const readFile = env.readFile;
		let fail = true;

		env.readFile = (p, max) => (fail && (p == REGISTRY)) ? { error: 'io' } : readFile(p, max);
		aiConnect.configure({ env, registryFile: REGISTRY, log: (m, c) => logs.push(`${m}:${c}`) });

		expect(await Api.aiConnectList(win, { accountId: 'acc-1' })).toMatchObject({ ok: false });
		expect(await Api.aiConnectClaimNudge(win, { accountId: 'acc-1' })).toEqual({ claimed: false });
		expect(logs).toEqual([ 'aiConnectList:EREGISTRYREAD', 'aiConnectClaimNudge:EREGISTRYREAD' ]);

		fail = false;
		expect(((await Api.aiConnectList(win, { accountId: 'acc-1' })) as any).connections).toHaveLength(1);
	});
});

describe('Api aiConnectProbe', () => {
	test('ok against a heart stand-in; a wrong key is unauthorized', async () => {
		expect(await Api.aiConnectProbe(win, { port, tier: 'large', route: 'http', key: KEY })).toEqual({ ok: true });
		expect(await Api.aiConnectProbe(win, { port, tier: 'large', route: 'http', key: 'wrong-key-0123456789abc' })).toEqual({ ok: false, category: 'unauthorized' });
	});

	test('an unknown connection id is refused', async () => {
		expect(await Api.aiConnectProbe(win, { port, tier: 'large', route: 'http', key: KEY, accountId: 'a', connectionId: 'cursor' })).toEqual({ ok: false, category: 'unknown' });
	});

	test('a record holding another key\'s fingerprint → stale, nothing probed or stored', async () => {
		const env = withRecords([ record('cursor', { keyFp: 'ffffffffffffffff' }) ]);

		aiConnect.configure({ env, registryFile: REGISTRY });

		expect(await Api.aiConnectProbe(win, { port, tier: 'large', route: 'http', key: KEY, accountId: 'acc-1', connectionId: 'cursor' })).toEqual({ ok: false, category: 'stale' });
		expect(stored(env, 'cursor').lastProbe).toBe('none');
	});

	test('the matching record stores its result; other accounts are invisible', async () => {
		const env = withRecords([ record('cursor') ]);

		aiConnect.configure({ env, registryFile: REGISTRY });

		expect(await Api.aiConnectProbe(win, { port, tier: 'large', route: 'http', key: KEY, accountId: 'acc-1', connectionId: 'cursor' })).toEqual({ ok: true });

		const list: any = await Api.aiConnectList(win, { accountId: 'acc-1' });

		expect(list.connections.map((c: any) => [ c.id, c.lastProbe, c.displayTarget ])).toEqual([ [ 'cursor', 'ok', '~/.cursor/mcp.json' ] ]);
		expect(env.readText(REGISTRY)).not.toContain(KEY);
		expect(((await Api.aiConnectList(win, { accountId: 'acc-2' })) as any).connections).toEqual([]);
	});

	test('a manual record (no fingerprint) persists its result, success and failure', async () => {
		const manual = record('other-0a1b2c3d', { appId: 'other', method: 'manual', keyFp: '', targetPath: '' });
		const env = withRecords([ manual ]);

		aiConnect.configure({ env, registryFile: REGISTRY });

		expect(await Api.aiConnectProbe(win, { port, tier: 'large', route: 'http', key: 'not-the-key-0123456789', accountId: 'acc-1', connectionId: manual.id })).toEqual({ ok: false, category: 'unauthorized' });
		expect(stored(env, manual.id).lastProbe).toBe('unauthorized');

		expect(await Api.aiConnectProbe(win, { port, tier: 'large', route: 'http', key: KEY, accountId: 'acc-1', connectionId: manual.id })).toEqual({ ok: true });
		expect(stored(env, manual.id).lastProbe).toBe('ok');
	});

	test('a rotation while the probe is in flight wins: the old result is not stored', async () => {
		const manual = record('other-0a1b2c3d', { appId: 'other', method: 'manual', keyFp: '', targetPath: '' });
		const env = withRecords([ manual ]);
		let release: () => void = () => {};

		aiConnect.configure({ env, registryFile: REGISTRY });
		gate = new Promise(r => release = r);

		const pending = Api.aiConnectProbe(win, { port, tier: 'large', route: 'http', key: KEY, accountId: 'acc-1', connectionId: manual.id });

		// Rotate while the request waits: what a Phase 2 reconnect does through the registry, in the queue
		await new Promise(r => setTimeout(r, 50));
		(aiConnect as any).registry.patch('acc-1', manual.id, { appHash: 'h-rotated' });
		release();

		expect(await pending).toEqual({ ok: true });
		expect(stored(env, manual.id)).toMatchObject({ appHash: 'h-rotated', lastProbe: 'none' });
	});
});

describe('the service queue', () => {
	test('a fresh, factory-built service serialises overlapping calls from the very first one', async () => {
		let release: () => void = () => {};
		const held = new Promise<void>(r => release = r);
		const order: string[] = [];
		const env = macEnv();
		const run = env.run;

		env.run = async (file, args, opts) => {
			if (file == '/bin/zsh') {
				order.push('scan-start');
				await held;
				order.push('scan-end');
			};
			return run(file, args, opts);
		};

		const service = new AiConnectService(() => ({ env, registryFile: REGISTRY }));
		const list = service.list({ accountId: 'acc-1' });

		// The first call is inside its scan (and so past start-up) before the second arrives
		await new Promise(r => setTimeout(r, 30));
		expect(order).toEqual([ 'scan-start' ]);

		const claim = service.claimNudge({ accountId: 'acc-1' }).then(r => {
			order.push('claim');
			return r;
		});

		await new Promise(r => setTimeout(r, 30));
		expect(order).toEqual([ 'scan-start' ]);

		release();
		await Promise.all([ list, claim ]);
		expect(order).toEqual([ 'scan-start', 'scan-end', 'claim' ]);
	});

	test('setUserDataPath moves the registry to the new profile folder, after queued work', async () => {
		const env = macEnv();

		aiConnect.configure({ env, registryFile: REGISTRY });
		expect(await Api.aiConnectClaimNudge(win, { accountId: 'acc-1' })).toEqual({ claimed: true });

		vi.mocked(app.getPath).mockReturnValue('/Users/me/userData2');
		Api.setUserDataPath(win, '/Users/me/userData2');

		// The new profile has its own registry: a fresh nudge claim, written there
		expect(await Api.aiConnectClaimNudge(win, { accountId: 'acc-1' })).toEqual({ claimed: true });
		expect(JSON.parse(env.readText('/Users/me/userData2/aiConnect.json')).nudgeClaimed).toBe(true);
		vi.mocked(app.getPath).mockReturnValue('/nonexistent');
	});
});

describe('Api aiConnect* validation and stubs', () => {
	test('aiConnectClaimNudge is true, then false', async () => {
		expect(await Api.aiConnectClaimNudge(win, { accountId: 'acc-1' })).toEqual({ claimed: true });
		expect(await Api.aiConnectClaimNudge(win, { accountId: 'acc-1' })).toEqual({ claimed: false });
		expect(await Api.aiConnectClaimNudge(win, { accountId: 'acc-2' })).toEqual({ claimed: false });
	});

	test('concurrent claims: exactly one wins', async () => {
		const results = await Promise.all([ 1, 2, 3, 4 ].map(() => Api.aiConnectClaimNudge(win, { accountId: 'acc-1' })));

		expect(results.filter(r => r.claimed)).toHaveLength(1);
	});

	test('a bad appId → the validation error, logged by method name only', async () => {
		expect(await Api.aiConnectPlan(win, { accountId: 'a', appId: 'notepad', route: 'http', tier: 'large', port: 31009 })).toEqual({ ok: false, error: { stage: 'validate', category: 'unknown' } });
		expect(await Api.aiConnectList(win, { accountId: 'a', extra: KEY })).toEqual({ ok: false, error: { stage: 'validate', category: 'unknown' } });
		expect(logs).toEqual([ 'aiConnectPlan:invalid', 'aiConnectList:invalid' ]);
		expect(logs.join()).not.toContain(KEY);
	});

	test('Z4: a window with a stale view heals nothing once the API was disabled or moved in another window', async () => {
		const env = macEnv();
		const grant = { spaceIds: [], allSpaces: true, perm: 1 };
		const url = () => JSON.parse(env.files()['/Users/me/.cursor/mcp.json']).mcpServers.anytype.url;
		const keys = [ { hash: 'h-1', present: true } ];

		aiConnect.configure({ env, registryFile: REGISTRY, liveApi: storedLiveApi });
		await Api.aiConnectApply(win, { accountId: 'a', appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, key: KEY, appHash: 'h-1', name: 'Cursor', grant, expireAt: 0, expectedHash: null });

		// Window A moved the port to 31010, then disabled the API; window B still believes 31010 listens
		safe.localApiBind = { addr: '127.0.0.1:31010', success: true };
		safe.localApi = { enabled: false, port: 31010 };
		expect(await Api.aiConnectCheck(win, { accountId: 'a', apiListening: true, port: 31010, keys })).toMatchObject({ ok: true, healed: [] });
		expect(url()).toBe('http://127.0.0.1:31009/mcp/large');

		// Moved on again (31011) while B names 31010: nothing either
		safe.localApi = { enabled: true, port: 31011 };
		expect(await Api.aiConnectCheck(win, { accountId: 'a', apiListening: true, port: 31010, keys })).toMatchObject({ ok: true, healed: [] });
		expect(url()).toBe('http://127.0.0.1:31009/mcp/large');

		// The setting agrees with the window: healed
		safe.localApi = { enabled: true, port: 31010 };
		// The bind failed or isn't known: nothing either
		safe.localApiBind = { addr: '127.0.0.1:31010', success: false };
		expect(await Api.aiConnectCheck(win, { accountId: 'a', apiListening: true, port: 31010, keys })).toMatchObject({ ok: true, healed: [] });
		safe.localApiBind = undefined;
		expect(await Api.aiConnectCheck(win, { accountId: 'a', apiListening: true, port: 31010, keys })).toMatchObject({ ok: true, healed: [] });
		expect(url()).toBe('http://127.0.0.1:31009/mcp/large');

		safe.localApiBind = { addr: '127.0.0.1:31010', success: true };
		expect(await Api.aiConnectCheck(win, { accountId: 'a', apiListening: true, port: 31010, keys })).toMatchObject({ ok: true, healed: [ 'cursor' ] });
		expect(url()).toBe('http://127.0.0.1:31010/mcp/large');
		safe.localApi = undefined;
		safe.localApiBind = undefined;
	});

	test('A1: a check queued behind other work heals nothing when the API is disabled while it waits', async () => {
		let release: () => void = () => {};
		const held = new Promise<void>(r => release = r);
		const env = macEnv();
		const run = env.run;
		const grant = { spaceIds: [], allSpaces: true, perm: 1 };
		const file = '/Users/me/.cursor/mcp.json';

		aiConnect.configure({ env, registryFile: REGISTRY, liveApi: storedLiveApi });
		await Api.aiConnectApply(win, { accountId: 'a', appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, key: KEY, appHash: 'h-1', name: 'Cursor', grant, expireAt: 0, expectedHash: null });

		const before = env.files()[file];

		// The port moved to 31010 (bound); a rescan holds the queue
		safe.localApi = { enabled: true, port: 31010 };
		safe.localApiBind = { addr: '127.0.0.1:31010', success: true };
		env.run = async (f, args, opts) => {
			if (f == '/bin/zsh') {
				await held;
			};
			return run(f, args, opts);
		};

		const scan = Api.aiConnectList(win, { accountId: 'a', refresh: true });

		await new Promise(r => setTimeout(r, 20));

		const check = Api.aiConnectCheck(win, { accountId: 'a', apiListening: true, port: 31010, keys: [ { hash: 'h-1', present: true } ] });

		// Another window disables the API while the check waits
		await new Promise(r => setTimeout(r, 20));
		safe.localApi = { enabled: false, port: 31010 };
		safe.localApiBind = { addr: '', success: false };
		release();

		await scan;
		expect(await check).toMatchObject({ ok: true, healed: [] });
		expect(env.files()[file]).toBe(before);
		safe.localApi = undefined;
		safe.localApiBind = undefined;
	});

	test('A8: a cold AI link isn\'t the tab\'s boot route: the (pinned) tab restores its own, the link goes along as its catalog id, once', () => {
		const docA = '/main/edit/doc-a/spaceId/space-1';
		const win: any = {
			id: 1, isChild: false, route: `/ai/connect?app=cursor&key=${KEY}`, activeTabId: 't1',
			views: [ { id: 't1', data: { route: docA, isPinned: true, spaceId: 'space-1' } } ],
			webContents: { session: { availableSpellCheckerLanguages: [] } },
		};

		const first = Api.getInitData(win, 't1');

		expect(first).toMatchObject({ route: docA, aiLink: 'cursor', isPinned: true });
		expect(JSON.stringify(first)).not.toContain(KEY);
		expect(Api.getInitData(win, 't1')).toMatchObject({ route: docA, aiLink: null });

		// Any other boot route is unchanged
		win.route = '/main/edit/doc-b/spaceId/space-1';
		expect(Api.getInitData(win, 't1')).toMatchObject({ route: '/main/edit/doc-b/spaceId/space-1', aiLink: null });
	});

	test('Z9: the nudge claim is refused while the account has a connection, and stays available', async () => {
		const env = macEnv();
		const grant = { spaceIds: [], allSpaces: true, perm: 1 };

		aiConnect.configure({ env, registryFile: REGISTRY });
		await Api.aiConnectApply(win, { accountId: 'a', appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, key: KEY, appHash: 'h-1', name: 'Cursor', grant, expireAt: 0, expectedHash: null });

		expect(await Api.aiConnectClaimNudge(win, { accountId: 'a' })).toEqual({ claimed: false });
		expect(JSON.parse(env.readText(REGISTRY)).nudgeClaimed).toBe(false);
		// Another account without connections still gets it, once
		expect(await Api.aiConnectClaimNudge(win, { accountId: 'b' })).toEqual({ claimed: true });
		expect(await Api.aiConnectClaimNudge(win, { accountId: 'b' })).toEqual({ claimed: false });
	});

	test('Z12: the check names an entry removed in the app once, also after a restart; again only after it came back', async () => {
		const env = macEnv();
		const grant = { spaceIds: [], allSpaces: true, perm: 1 };
		const keys = [ { hash: 'h-1', present: true } ];
		const check = () => Api.aiConnectCheck(win, { accountId: 'a', apiListening: true, port: 31009, keys });
		const file = '/Users/me/.cursor/mcp.json';

		aiConnect.configure({ env, registryFile: REGISTRY });
		await Api.aiConnectApply(win, { accountId: 'a', appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, key: KEY, appHash: 'h-1', name: 'Cursor', grant, expireAt: 0, expectedHash: null });

		const entry = env.files()[file];
		const put = (text: string) => {
			env.unlink(file);
			env.writeFile(file, text, 0o600).close();
		};

		expect(await check()).toMatchObject({ ok: true, removed: [] });
		put(JSON.stringify({ mcpServers: {} }));
		expect(await check()).toMatchObject({ ok: true, removed: [ 'cursor' ], connections: [ { id: 'cursor', status: 'removed' } ] });
		expect(await check()).toMatchObject({ ok: true, removed: [] });

		// A restart (a fresh service on the same profile): not reported again
		aiConnect.configure({ env, registryFile: REGISTRY });
		expect(await check()).toMatchObject({ ok: true, removed: [], connections: [ { id: 'cursor', status: 'removed' } ] });

		// Back in place, then gone again: one more report
		put(entry);
		expect(await check()).toMatchObject({ ok: true, removed: [], connections: [ { id: 'cursor', status: 'ok' } ] });
		put(JSON.stringify({ mcpServers: {} }));
		expect(await check()).toMatchObject({ ok: true, removed: [ 'cursor' ] });
	});

	test('Cursor end to end through the facade: plan → apply → check → remove → revoked', async () => {
		const env = macEnv();
		const grant = { spaceIds: [], allSpaces: true, perm: 1 };

		aiConnect.configure({ env, registryFile: REGISTRY });

		const plan: any = await Api.aiConnectPlan(win, { accountId: 'a', appId: 'cursor', route: 'http', tier: 'large', port: 31009 });

		expect(plan).toMatchObject({ ok: true, canApply: true, existing: 'none', method: 'config', nextStep: 'restart' });
		expect(JSON.stringify(plan)).not.toContain(KEY);

		const applied: any = await Api.aiConnectApply(win, { accountId: 'a', appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, key: KEY, appHash: 'h-1', name: 'Cursor', grant, expireAt: 0, expectedHash: null });

		expect(applied).toMatchObject({ ok: true, connection: { id: 'cursor', appHash: 'h-1', keyFp: keyFingerprint(KEY), nextStep: 'restart', observedInstalled: true, status: 'ok' } });
		expect(JSON.parse(env.files()['/Users/me/.cursor/mcp.json']).mcpServers.anytype.headers.Authorization).toBe(`Bearer ${KEY}`);
		// The registry holds a fingerprint, never the key
		expect(env.readText(REGISTRY)).not.toContain(KEY);

		expect(await Api.aiConnectCheck(win, { accountId: 'a', apiListening: true, port: 31010, keys: [ { hash: 'h-1', present: true } ] })).toMatchObject({ ok: true, healed: [ 'cursor' ] });
		expect(JSON.parse(env.files()['/Users/me/.cursor/mcp.json']).mcpServers.anytype.url).toBe('http://127.0.0.1:31010/mcp/large');

		expect(await Api.aiConnectRemove(win, { accountId: 'a', connectionId: 'cursor', expectedHash: 'h-1' })).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ 'h-1' ] } });
		expect(JSON.parse(env.files()['/Users/me/.cursor/mcp.json']).mcpServers).toEqual({});
		expect(await Api.aiConnectRevoked(win, { accountId: 'a', connectionId: 'cursor', hash: 'h-1' })).toEqual({ ok: true, connection: null });
		expect(await Api.aiConnectReveal(win, { appId: 'claude-desktop', what: 'bundle' })).toEqual({ ok: false });
	});

	test('U23: the LM Studio deeplink through the facade: the key, the URL and its encoded config reach no Util.log, console or registry write', async () => {
		const logged: string[] = [];
		const env = macEnv();

		for (const m of [ 'log', 'info', 'warn', 'error', 'debug' ] as const) {
			vi.spyOn(console, m).mockImplementation((...args: any[]) => {
				logged.push(JSON.stringify(args));
			});
		};
		vi.mocked(Util.log).mockClear();

		// LM Studio found by its bundle, and the registered handler is exactly that bundle
		const run = env.run;
		const opened: string[] = [];
		const writes: string[] = [];
		const write = env.writeFile;

		env.run = async (file, args, opts) => ((file == '/usr/bin/plutil') && args[args.length - 1].startsWith('/Applications/LM Studio.app/')) ? { code: 0, stdout: 'ai.elementlabs.lmstudio\n' } : run(file, args, opts);
		env.mkdir('/Applications/LM Studio.app', 0o755);
		env.mkdir('/Users/me/.lmstudio', 0o755);
		env.protocolHandler = async () => ({ name: 'LM Studio', path: '/Applications/LM Studio.app' });
		env.openExternal = async url => {
			opened.push(url);
			return true;
		};
		env.writeFile = (p, data, mode) => {
			writes.push(String(data));
			return write(p, data, mode);
		};
		aiConnect.configure({ env, registryFile: REGISTRY, log: (m, c) => logs.push(`${m}:${c}`) });

		const grant = { spaceIds: [], allSpaces: true, perm: 1 };
		const res: any = await Api.aiConnectApply(win, { accountId: 'a', appId: 'lmstudio', route: 'http', tier: 'small', recommendedTier: 'small', port: 31009, key: KEY, appHash: 'h-1', name: 'LM Studio', grant, expireAt: 0, expectedHash: null });

		expect(res).toMatchObject({ ok: true, connection: { method: 'deeplink' } });
		expect(opened).toHaveLength(1);

		const url = opened[0];
		const config = new URL(url).searchParams.get('config');
		const traces = [ KEY, url, config, url.slice(url.indexOf('config=') + 7) ];
		const seen = [ ...logged, ...logs, ...vi.mocked(Util.log).mock.calls.map(c => JSON.stringify(c)), ...writes, JSON.stringify(res) ].join('\n');

		expect(Buffer.from(config, 'base64').toString('utf8')).toContain(KEY);
		for (const trace of traces) {
			expect(seen.includes(trace)).toBe(false);
		};
		vi.restoreAllMocks();
	});

	test('aiConnectBundleInfo reads the build\'s metadata and checks the archive against it', async () => {
		// The fake env's metadata is what scripts/build-mcp.js would have written for these files
		aiConnect.configure({ env: macEnv({ [`${MCP}/Anytype.mcpb`]: 'zip' }), registryFile: REGISTRY });
		expect(await Api.aiConnectBundleInfo(win, {})).toEqual({ signed: false });
		expect(await Api.aiConnectBundleInfo(win, { x: 1 })).toBeNull();

		aiConnect.configure({ env: macEnv(), registryFile: REGISTRY });
		expect(await Api.aiConnectBundleInfo(win, {})).toBeNull();
	});

	test('every aiConnect method the renderer may call exists on the facade', () => {
		const methods = [
			'aiConnectList', 'aiConnectPlan', 'aiConnectApply', 'aiConnectRecordManual', 'aiConnectUpdate', 'aiConnectRemove', 'aiConnectRevoked',
			'aiConnectCheck', 'aiConnectProbe', 'aiConnectStepDone', 'aiConnectRestartApp', 'aiConnectReveal', 'aiConnectOpenApp',
			'aiConnectClaimNudge', 'aiConnectBundleInfo', 'aiConnectOrphan', 'aiConnectMintIntent',
		];

		expect(methods.every(m => typeof (Api as any)[m] == 'function')).toBe(true);
	});
});
