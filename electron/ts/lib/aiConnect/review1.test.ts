/**
 * anytype-mcp Phase 3, review round 1 (Q1–Q19, main side): one regression per theme, on the service with the
 * fake home and the fake forwarder.
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { FORWARDER_FILES, KEY_B, MCP_DIR, REGISTRY, STABLE_BIN, applyParam, mac, service } from './testKit';
import { ensureInstalled } from './forwarder';
import { FAKE_REV, fakeEnv, type FakeEnv, type FakeSpec, type RunCall } from './testEnv';
import type { AiRecord } from './types';

const DIR = '/Users/me/Library/Application Support/Claude';
const CONFIG = `${DIR}/claude_desktop_config.json`;
const EXT = 'local.mcpb.anytype.anytype-dev';
const ext = (version = `2.${FAKE_REV}.0`, enabled = true) => ({
	[`${DIR}/extensions-installations.json`]: JSON.stringify({ extensions: { [EXT]: { id: EXT, version, signatureInfo: { status: 'unsigned' } } } }),
	[`${DIR}/Claude Extensions Settings/${EXT}.json`]: JSON.stringify({ isEnabled: enabled }),
});

const machine = (opt: { forwarder?: FakeSpec['forwarder']; files?: Record<string, string>; extension?: Record<string, string> | null } = {}) => {
	const env = mac({
		apps: [ 'Claude' ], dirs: [ DIR ], forwarder: opt.forwarder,
		files: { ...FORWARDER_FILES, [`${MCP_DIR}/Anytype.mcpb`]: 'zip', ...((opt.extension === undefined) ? ext() : (opt.extension || {})), ...(opt.files || {}) },
	});

	env.listProcesses = async () => [];
	return { env, svc: service(env) };
};

const cd = (over: Record<string, any> = {}) => applyParam({ appId: 'claude-desktop', route: 'stdio', name: 'Claude Desktop', ...over });
const fb = (over: Record<string, any> = {}) => cd({ method: 'config', ...over });
const records = (env: FakeEnv): AiRecord[] => JSON.parse(env.readText(REGISTRY) || '{"connections":[]}').connections;
const check = (svc: any, keys: any = null, port = 31009, accountId = 'acc-a') => svc.check({ accountId, apiListening: true, port, keys });
const restore = (env: FakeEnv, file: string, text: string) => {
	env.unlink(file);
	env.writeFile(file, text, 0o600).close();
};

describe('Q5, Q6: bookkeeping', () => {
	test('Q5: Claude config ownership is per account — A\'s Disconnect never removes the entry B owns now (conflict, nothing queued); Forget still retires A\'s key', async () => {
		const { env, svc } = machine({ extension: null, files: { [CONFIG]: '{}' } });

		await svc.apply(fb());

		const planB: any = await svc.plan({ accountId: 'acc-b', appId: 'claude-desktop', route: 'stdio', tier: 'large', port: 31009, method: 'config' });

		expect(planB).toMatchObject({ existing: 'foreign', replace: { targetPath: CONFIG } });
		expect(await svc.apply(fb({ accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1', replace: planB.replace }))).toMatchObject({ ok: true });

		const bytes = env.files()[CONFIG];

		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(env.files()[CONFIG]).toBe(bytes);
		expect(records(env).find(r => r.accountId == 'acc-a')).toMatchObject({ removed: false, revokePending: [] });
		expect(((await check(svc, null, 31009, 'acc-b')) as any).connections[0].status).toBe('ok');
		expect(((await check(svc, null, 31009, 'acc-a')) as any).connections[0].status).toBe('reconnect');

		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', forget: true })).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ 'hash-a1' ] } });
		expect(env.files()[CONFIG]).toBe(bytes);
	});

	test('Q6: a mint intent is cleared only once its key is on disk in a record — a commit whose save fails keeps it, for apply and for a manual record; a 65th intent is refused, never evicting one', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);
		const a: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Cursor', time: 1000 });
		const b: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Other', time: 1001 });
		const rename = env.rename;
		let failing = true;

		// Every registry write fails from here on
		env.rename = (from, to) => {
			if (failing && (to == REGISTRY)) {
				throw Object.assign(new Error('EIO'), { code: 'EIO' });
			};
			rename(from, to);
		};
		expect(await svc.apply(applyParam({ intentId: a.id }))).toMatchObject({ ok: true, recordSaved: false });
		expect(JSON.parse(env.readText(REGISTRY)).mintIntents.map((it: any) => it.id)).toEqual([ a.id, b.id ]);

		const manual = service(env);

		expect(await manual.recordManual({ accountId: 'acc-a', appId: 'other', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, appHash: 'hash-m', name: 'Other', grant: { spaceIds: [], allSpaces: true, perm: 1 }, expireAt: 0, expectedHash: null, intentId: b.id })).toMatchObject({ ok: true, recordSaved: false });
		expect(JSON.parse(env.readText(REGISTRY)).mintIntents).toHaveLength(2);

		// Anytype dies with the records only in memory: the next run still knows both keys by their intents
		failing = false;
		expect(((await service(env).list({ accountId: 'acc-a' })) as any).mintIntents.map((it: any) => it.id)).toEqual([ a.id, b.id ]);

		const full = service(env);

		for (let i = 0; i < 62; i++) {
			expect(await full.mintIntent({ accountId: 'acc-a', name: `k${i}`, time: 1 })).toMatchObject({ ok: true });
		};
		expect(await full.mintIntent({ accountId: 'acc-a', name: 'one-too-many', time: 1 })).toMatchObject({ ok: false });
		expect(JSON.parse(env.readText(REGISTRY)).mintIntents.map((it: any) => it.id).slice(0, 2)).toEqual([ a.id, b.id ]);
	});
});

describe('Q7, Q17, Q18: the stable copy', () => {
	const meta = (env: FakeEnv) => env;

	test('Q7: the installer lock never spins — a create that fails for any reason but "exists" ends at once; a lock that can\'t be removed is waited for with sleeps until the deadline; a fresh empty lock is not stolen', async () => {
		const ro = mac({ files: { ...FORWARDER_FILES } });
		const write = ro.writeFile;
		let sleeps = 0;
		let attempts = 0;

		ro.sleep = async () => {
			sleeps++;
		};
		ro.writeFile = (p, d, m) => {
			if (p.endsWith('/.lock')) {
				attempts++;
				throw Object.assign(new Error('EROFS'), { code: 'EROFS' });
			};
			return write(p, d, m);
		};
		expect(await ensureInstalled(meta(ro))).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(sleeps).toBe(0);
		expect(attempts).toBe(1);

		// `.lock` is a directory, older than a minute: never removed, waited for, then given up
		const dirLock = mac({ files: { ...FORWARDER_FILES }, dirs: [ '/Users/me/.anytype/bin-dev/.lock' ] });
		let now = 10 * 60 * 1000;
		let slept = 0;

		dirLock.chmod('/Users/me/.anytype', 0o700);
		dirLock.now = () => now;
		dirLock.sleep = async ms => {
			slept++;
			now += ms;
		};
		expect(await ensureInstalled(dirLock)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(slept).toBeGreaterThan(10);
		expect(slept).toBeLessThan(100);
		expect(dirLock.exists('/Users/me/.anytype/bin-dev/.lock')).toBe(true);

		// A fresh, empty lock (another installer is still writing it) is left alone
		const fresh = mac({ files: { ...FORWARDER_FILES, '/Users/me/.anytype/bin-dev/.lock': '' } });
		let t = 5000;

		fresh.now = () => t;
		fresh.sleep = async ms => {
			t += ms;
		};
		// Created "now" for the test: written through the env so it carries the current time
		fresh.unlink('/Users/me/.anytype/bin-dev/.lock');
		fresh.writeFile('/Users/me/.anytype/bin-dev/.lock', '', 0o600).close();
		expect(await ensureInstalled(fresh)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(fresh.files()['/Users/me/.anytype/bin-dev/.lock']).toBe('');
	});

	test('Q17: Windows — a store folder Anytype creates gets the protected list (user, SYSTEM, Administrators) at once; an existing one is never changed; a failure installs nothing and runs no key verb', async () => {
		const BIN = 'C:\\Program Files\\Anytype\\resources\\app.asar.unpacked\\dist\\anytype-mcp.exe';
		const win = (opt: { icacls: number; dirs?: string[] }) => {
			const acl: RunCall[] = [];
			const env = fakeEnv({
				platform: 'win32', home: 'C:\\Users\\me', vars: { SystemRoot: 'C:\\Windows' }, files: { [BIN]: 'EXE' }, dirs: opt.dirs,
				run: call => {
					if (/icacls\.exe$/i.test(call.file)) {
						acl.push(call);
						return { code: opt.icacls, stdout: '' };
					};
					return /powershell\.exe$/i.test(call.file) ? { code: 0, stdout: 'S-1-5-21-1111-2222-3333-1001\r\n' } : { code: 1, stdout: '' };
				},
			});

			return { env, acl };
		};
		const created = win({ icacls: 0 });

		expect(await ensureInstalled(created.env)).toMatchObject({ ok: true, installed: true });
		// `.anytype`, then the stable copy's own folder (S5): each as it is created
		expect(created.acl).toHaveLength(2);
		expect(created.acl[0].file).toBe('C:\\Windows\\System32\\icacls.exe');
		expect(created.acl[0].args).toEqual([ 'C:\\Users\\me\\.anytype', '/inheritance:r', '/grant:r', '*S-1-5-21-1111-2222-3333-1001:(OI)(CI)F', '*S-1-5-18:(OI)(CI)F', '*S-1-5-32-544:(OI)(CI)F' ]);
		expect(created.acl[1].args[0]).toBe('C:\\Users\\me\\.anytype\\bin-dev');

		const existing = win({ icacls: 0, dirs: [ 'C:\\Users\\me\\.anytype', 'C:\\Users\\me\\.anytype\\bin-dev' ] });

		expect(await ensureInstalled(existing.env)).toMatchObject({ ok: true });
		expect(existing.acl).toEqual([]);

		const failing = win({ icacls: 5 });

		expect(await ensureInstalled(failing.env)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(failing.env.exists('C:\\Users\\me\\.anytype')).toBe(false);
		expect(failing.env.forwarder.calls).toEqual([]);
	});

	test('Q18: the stable copy is handed out only from an `.anytype` others can\'t write, and only when it can execute — a wrong mode is repaired, for an equal copy and for a kept higher revision', async () => {
		const loose = mac({ files: { ...FORWARDER_FILES }, dirs: [ '/Users/me/.anytype' ], modes: { '/Users/me/.anytype': 0o775 } });
		const svc = service(loose);

		expect(await ensureInstalled(loose)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(await svc.plan({ accountId: 'acc-a', appId: 'other', route: 'stdio', tier: 'large', port: 31009, method: 'command' })).toMatchObject({ ok: true, needsKey: false, error: { category: 'installFailed' } });
		expect(Object.keys(loose.files()).filter(f => f.startsWith('/Users/me/.anytype'))).toEqual([]);
		expect(loose.forwarder.calls).toEqual([]);
		// The folder is shared with heart: never chmod-ed
		expect(loose.modeOf('/Users/me/.anytype')).toBe(0o775);

		const equal = mac({ files: { ...FORWARDER_FILES, [STABLE_BIN]: 'FORWARDER-BYTES' }, modes: { [STABLE_BIN]: 0o644, '/Users/me/.anytype': 0o700 } });

		expect(await ensureInstalled(equal)).toMatchObject({ ok: true, installed: false });
		expect(equal.modeOf(STABLE_BIN)).toBe(0o755);

		const higher = mac({
			signed: true, files: { ...FORWARDER_FILES, '/Users/me/.anytype/bin/anytype-mcp': 'NEWER', '/Users/me/.anytype/bin/anytype-mcp.rev': '9\n' },
			modes: { '/Users/me/.anytype/bin/anytype-mcp': 0o600, '/Users/me/.anytype': 0o700 },
			run: call => (/codesign$/.test(call.file) ? { code: 0, stdout: '' } : null),
		});

		expect(await ensureInstalled(higher)).toMatchObject({ ok: true, installed: false });
		expect(higher.files()['/Users/me/.anytype/bin/anytype-mcp']).toBe('NEWER');
		expect(higher.modeOf('/Users/me/.anytype/bin/anytype-mcp')).toBe(0o755);
	});
});

describe('Q15', () => {
	test('Q15: main dies after the config write, before its save — the candidate saved first owns the entry: the next check promotes it, and Disconnect removes it', async () => {
		let saved = '';
		const { env, svc } = machine({ extension: null, files: { [CONFIG]: '{}' } });
		const write = env.writeFile;

		// The registry as it is when the entry's temp is written: the candidate is already there
		env.writeFile = (p, data, mode) => {
			if (p.includes('claude_desktop_config.json.new-')) {
				saved = env.readText(REGISTRY);
			};
			return write(p, data, mode);
		};
		await svc.apply(fb());
		restore(env, REGISTRY, saved);
		expect(records(env)[0]).toMatchObject({ unconfirmed: [ { appHash: 'hash-a1', method: 'config', configPath: CONFIG } ] });

		const restarted = service(env);
		const res: any = await check(restarted);

		expect(res.connections[0]).toMatchObject({ status: 'ok', method: 'config', configPath: CONFIG, appHash: 'hash-a1' });
		expect(records(env)[0].entryDigest).toMatch(/^[0-9a-f]{64}$/);
		expect(await restarted.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers?.anytype).toBeUndefined();
	});

});
