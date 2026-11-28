/**
 * D1 review round 2 (`.review-d1r2-adjudication.md`), main side: one regression per accepted theme. The renderer's
 * are in src/ts/lib/aiConnect/review-d1r2.test.ts (D1R2-B, D1R2-C); the real Windows ACLs in
 * forwarder.windows.integration.test.ts (D1R2-E).
 */
import fs from 'fs';
import path from 'path';
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() }, clipboard: { readText: vi.fn(), writeText: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));
vi.mock('./probe', async original => ({ ...(await original<typeof import('./probe')>()), probe: vi.fn(async () => ({ ok: true })) }));

import { AiConnectService } from './index';
import { probe } from './probe';
import { ENDPOINT_DEV, FORWARDER_FILES, GRANT, KEY_A, MCP_DIR, REGISTRY, applyParam, listening, mac, service } from './testKit';
import { ensureInstalled } from './forwarder';
import { fakeEnv, type FakeEnv } from './testEnv';
import type { AiRecord } from './types';

const DIR = '/Users/me/Library/Application Support/Claude';
const CONFIG = `${DIR}/claude_desktop_config.json`;
const CURSOR = '/Users/me/.cursor/mcp.json';
const USERS = 'S-1-5-32-545';
const eio = () => Object.assign(new Error('EIO'), { code: 'EIO' });
const machine = (files: Record<string, string> = {}) => {
	const env = mac({ apps: [ 'Claude', 'Cursor' ], dirs: [ DIR ], files: { ...FORWARDER_FILES, [`${MCP_DIR}/Anytype.mcpb`]: 'zip', ...files } });

	env.listProcesses = async () => [];
	return { env, svc: service(env) };
};
const records = (env: FakeEnv): AiRecord[] => JSON.parse(env.readText(REGISTRY) || '{"connections":[]}').connections;
const put = (env: FakeEnv, file: string, text: string) => {
	if (env.exists(file)) {
		env.unlink(file);
	};
	env.writeFile(file, text, 0o600).close();
};

/** A Windows profile with the store folders; `acl`: path → SIDs besides the user, SYSTEM and Administrators */
const windows = (acl: Record<string, string[]> = {}, over: Record<string, any> = {}) => fakeEnv({
	platform: 'win32', home: 'C:\\Users\\me', vars: { SystemRoot: 'C:\\Windows' }, acl,
	dirs: [ 'C:\\Users\\me\\.anytype', 'C:\\Users\\me\\.anytype\\ai-connect', 'C:\\Users\\me\\AppData\\Roaming\\anytype' ], ...over,
});
const WIN_REGISTRY = 'C:\\Users\\me\\AppData\\Roaming\\anytype\\aiConnect.json';
const WIN_ENDPOINT = 'C:\\Users\\me\\.anytype\\ai-connect\\endpoint-dev.json';

describe('D1R2-A: publish and withdraw of the endpoint file are ordered', () => {
	test('D1R2-A: a Windows rename still retrying when Anytype quits (or the account stops) never lands afterwards; a startup removal that keeps failing is finished by the next lifecycle call', async () => {
		const env = windows();
		const rename = env.rename;
		let busy = 1;
		let wake: (() => void) | null = null;

		env.rename = (from, to) => {
			if ((to == WIN_ENDPOINT) && (busy-- > 0)) {
				throw Object.assign(new Error('EBUSY'), { code: 'EBUSY' });
			};
			rename(from, to);
		};
		env.sleep = () => new Promise<void>(resolve => {
			wake = resolve;
		});

		const svc = service(env, WIN_REGISTRY);
		const publishing = svc.apiChanged('localApiBind');

		await vi.waitFor(() => expect(wake).not.toBeNull());
		svc.shutdown();
		wake();
		await publishing;
		expect(env.files()[WIN_ENDPOINT]).toBeUndefined();
		expect(Object.keys(env.files()).filter(f => f.endsWith('.tmp'))).toEqual([]);

		// The same with a logout instead of a quit
		const again = service(env, WIN_REGISTRY);

		busy = 1;
		wake = null;

		const next = again.apiChanged('localApiBind');

		await vi.waitFor(() => expect(wake).not.toBeNull());
		await Promise.all([ again.accountStopped(), (wake(), next) ]);
		expect(env.files()[WIN_ENDPOINT]).toBeUndefined();

		// A previous run's file that start-up can't remove (every retry busy): kept as this run's, removed at the next chance
		env.sleep = async () => {};
		put(env, WIN_ENDPOINT, '{"v":1,"port":31009}');

		const unlink = env.unlink;
		let locked = true;

		env.unlink = p => {
			if (locked && (p == WIN_ENDPOINT)) {
				throw Object.assign(new Error('EBUSY'), { code: 'EBUSY' });
			};
			unlink(p);
		};

		const restarted = service(env, WIN_REGISTRY, { localApi: { enabled: false, port: 31009 }, bind: null });

		await restarted.startup('C:\\Users\\me\\AppData\\Roaming\\anytype');
		expect(env.files()[WIN_ENDPOINT]).toBeTruthy();
		locked = false;
		await restarted.accountStopped();
		expect(env.files()[WIN_ENDPOINT]).toBeUndefined();
	});

	test('D1R2-A: a helper that crashes runs the same cleanup before its dialog ends the app', () => {
		const server = fs.readFileSync(path.join(__dirname, '../../server.ts'), 'utf8');
		const main = fs.readFileSync(path.join(__dirname, '../../main.ts'), 'utf8');

		expect(main).toContain('Server.onCrash = () => aiConnect.shutdown();');
		expect(server.indexOf('this.onCrash?.()')).toBeGreaterThan(0);
		expect(server.indexOf('this.onCrash?.()')).toBeLessThan(server.indexOf('dialog.showErrorBox'));
	});
});

describe('D1R2-B: a key a record or a failed operation may own is never revoked', () => {
	test('D1R2-B: Disconnect whose folder fsync fails and whose rollback can\'t be written either: reported failed, entry kept, and a restart queues nothing; the next good save drops the undo', async () => {
		const { env, svc } = machine({ [CONFIG]: '{}' });

		await svc.apply(applyParam({ appId: 'claude-desktop', route: 'stdio', method: 'config', name: 'Claude Desktop' }));

		const bytes = env.files()[CONFIG];
		const writeFile = env.writeFile;
		const fsyncDir = env.fsyncDir;
		let syncs = 0;
		let broken = false;

		// The undo's fsync works; from the registry's own fsync on, the disk refuses every write
		env.fsyncDir = p => {
			if (broken || (++syncs == 2)) {
				broken = true;
				throw eio();
			};
			fsyncDir(p);
		};
		env.writeFile = (p, data, mode) => {
			if (broken) {
				throw eio();
			};
			return writeFile(p, data, mode);
		};
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: false });
		expect(env.files()[CONFIG]).toBe(bytes);
		// The file holds the save that failed; its undo is beside it
		expect(records(env)[0]).toMatchObject({ removed: true, revokePending: [ 'hash-a1' ] });
		expect(env.files()[`${REGISTRY}.txn`]).toBeTruthy();

		env.fsyncDir = fsyncDir;
		env.writeFile = writeFile;

		const restarted = service(env);

		expect((await restarted.list({ accountId: 'acc-a' }) as any).connections[0]).toMatchObject({ id: 'claude-desktop', appHash: 'hash-a1', removed: false, revokePending: [] });
		expect(await restarted.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true });
		expect(env.files()[`${REGISTRY}.txn`]).toBeUndefined();
		expect(records(env)[0]).toMatchObject({ removed: true, revokePending: [ 'hash-a1' ] });
	});

	test('D1R2-B: a committed delivery and its mint intent leave the registry in one save; main stamps the intent with its own time and keeps its access', async () => {
		const { env, svc } = machine({ [CURSOR]: '{"mcpServers":{}}' });
		const writes: string[] = [];
		const writeFile = env.writeFile;

		env.writeFile = (p, data, mode) => {
			if (p.startsWith(path.dirname(REGISTRY))) {
				writes.push(String(data));
			};
			return writeFile(p, data, mode);
		};
		env.now = () => 2000000000 * 1000;

		const intent: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Cursor', time: 5, grant: GRANT, expireAt: 0 });

		expect(intent).toEqual({ ok: true, id: expect.stringMatching(/^[0-9a-f]{16}$/), time: 2000000000 - 2 });
		expect(JSON.parse(env.readText(REGISTRY)).mintIntents).toEqual([ { id: intent.id, accountId: 'acc-a', name: 'Cursor', time: 2000000000 - 2, grant: GRANT, expireAt: 0 } ]);
		expect(await svc.apply(applyParam({ intentId: intent.id }))).toMatchObject({ ok: true });

		const saves = writes.map(w => JSON.parse(w)).filter(w => Array.isArray(w.connections));

		// No save on disk ever had the delivered key's record and its intent both (D1C-21)
		expect(saves.some(w => w.connections.some((c: any) => c.appHash == 'hash-a1') && (w.mintIntents || []).length)).toBe(false);
		expect(JSON.parse(env.readText(REGISTRY)).mintIntents).toBeUndefined();
	});
});

describe('D1R2-D: logout ends the session at once', () => {
	test('D1R2-D: a probe in flight is aborted and its gate closes before the queue drains; the endpoint goes and a copy asked for before the logout lands nowhere', async () => {
		const env = mac({ apps: [ 'Cursor' ], files: { ...FORWARDER_FILES } });
		const api = listening(31009);
		const setup = { env, registryFile: REGISTRY, apiState: () => api, liveApi: () => true };
		const svc = new AiConnectService(() => setup);
		let seen: any = null;
		let finish: (() => void) | null = null;

		svc.configure(setup);
		await svc.apiChanged('localApiBind');
		expect(env.files()[ENDPOINT_DEV]).toBeTruthy();
		vi.mocked(probe).mockImplementationOnce(async (_param, opt) => {
			seen = opt;
			await new Promise<void>(resolve => {
				finish = resolve;
			});
			return { ok: true };
		});

		const probing = svc.probe({ port: 31009, tier: 'large', route: 'http', key: KEY_A });

		await vi.waitFor(() => expect(finish).not.toBeNull());
		expect(seen.gate()).toBe(true);

		const copy = svc.copySecret({ accountId: 'acc-a', appHash: 'hash-a1', text: KEY_A });
		const stopped = svc.accountStopped();

		// Synchronously, before anything queued runs
		expect(seen.signal.aborted).toBe(true);
		expect(seen.gate()).toBe(false);
		expect(env.files()[ENDPOINT_DEV]).toBeUndefined();
		finish();
		await probing;
		await stopped;
		expect(await copy).toEqual({ ok: false });
		expect(env.clip.text).toBe('');

		// A bind reported before the logout but still queued behind it opens nothing
		const queued = svc.apiChanged('localApiBind');

		svc.accountStopped();
		await queued;
		expect(env.files()[ENDPOINT_DEV]).toBeUndefined();

		// The next account's bind: the new session copies again, the old probe's gate stays shut
		await svc.apiChanged('localApiBind');
		expect(env.files()[ENDPOINT_DEV]).toBeTruthy();
		expect(seen.gate()).toBe(false);
		expect(await svc.copySecret({ accountId: 'acc-a', appHash: 'hash-a1', text: KEY_A })).toEqual({ ok: true });
	});
});

describe('D1R2-E: the stable forwarder\'s whole path is trusted before it runs', () => {
	const ROOT = 'C:\\Program Files\\Anytype\\resources\\app.asar.unpacked';
	const BIN = 'C:\\Users\\me\\.anytype\\bin';
	const STABLE = `${BIN}\\anytype-mcp.exe`;
	const newer = (acl: Record<string, string[]>) => windows(acl, {
		signed: true,
		dirs: [ 'C:\\Users\\me\\.anytype', 'C:\\Users\\me\\.anytype\\ai-connect', 'C:\\Users\\me\\AppData\\Roaming\\anytype', BIN ],
		files: { [`${ROOT}\\dist\\anytype-mcp.exe`]: 'EXE', [STABLE]: 'NEWER', [`${STABLE}.rev`]: '9\n' },
		run: (call: any) => (/powershell\.exe$/i.test(call.file) ? { code: 0, stdout: 'same-signer\r\n' } : { code: 1, stdout: '' }),
	});

	test('D1R2-E: a private `bin` and exe under a `.anytype` another account may change, or under a home that lets it replace children: refused before `version` or `endpoint` runs', async () => {
		for (const acl of [ { 'C:\\Users\\me\\.anytype': [ USERS ] }, { 'C:\\Users\\me': [ USERS ] } ]) {
			const env = newer(acl);

			expect(await ensureInstalled(env)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
			// The Command plan: the stable copy is refused, so neither its `version` nor the preflight's `endpoint` runs
			expect(await service(env, WIN_REGISTRY).plan({ accountId: 'acc-a', appId: 'other', route: 'stdio', tier: 'full', port: 31009, method: 'command' })).toMatchObject({ ok: true, canApply: false, error: { category: 'installFailed' } });
			expect(env.calls.filter(c => c.file == STABLE)).toEqual([]);
		};

		// Every path from `.anytype` down, asked again on each use
		const clean = newer({});

		expect(await ensureInstalled(clean)).toMatchObject({ ok: true, path: STABLE });
		expect(await ensureInstalled(clean)).toMatchObject({ ok: true, path: STABLE });
		expect(clean.calls.filter(c => c.opts.env?.ANYTYPE_MCP_ACL_PATHS).map(c => c.opts.env.ANYTYPE_MCP_ACL_PATHS.split('|')).filter(p => p.includes(STABLE)).length).toBeGreaterThanOrEqual(4);
	});
});

describe('D1R2-F: a temp too young for the start-up sweep is looked at again', () => {
	test('D1R2-F: Anytype restarted within a minute of a killed secret write: the temp is left at first and deleted once it is old enough, without another write', async () => {
		const { env, svc } = machine({ [CURSOR]: '{"mcpServers":{}}' });
		const temp = '/Users/me/.cursor/.mcp.json.new-1000-abcdef12.tmp';
		let now = 1000;

		env.now = () => now;
		await svc.apply(applyParam({ appHash: 'hash-c1' }));
		put(env, temp, '{"headers":{"Authorization":"Bearer x"}}');
		now += 10 * 1000;

		const restarted = service(env);

		await restarted.startup('/Users/me/Library/Application Support/anytype');
		// The first scan's sweep comes too early as well
		await restarted.list({ accountId: 'acc-a', refresh: true });
		expect(env.files()[temp]).toBeTruthy();
		now += 52 * 1000;
		env.fireTimers();
		// Drains the queue (the cached scan sweeps nothing itself)
		await restarted.list({ accountId: 'acc-a' });
		expect(env.files()[temp]).toBeUndefined();
	});
});
