/**
 * anytype-mcp Phase 3, review round 2 (S1–S14, main side): one regression per theme, on the service with the
 * fake home and the fake forwarder. S1 and S2 are renderer-only (flow.test.ts, controller.test.ts,
 * dispatcher.sentinel.test.ts); S4, S10, S11 and S14 are build-side (guard.test.ts, packaging.test.ts).
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { FORWARDER_FILES, KEY_A, KEY_B, MCP_DIR, REGISTRY, STABLE_BIN, applyParam, mac, service } from './testKit';
import { ensureInstalled } from './forwarder';
import { canonicalDigest } from './digest';
import { FAKE_REV, FAKE_SID, fakeEnv, type FakeEnv, type FakeSpec, type RunCall } from './testEnv';
import type { AiRecord } from './types';

const DIR = '/Users/me/Library/Application Support/Claude';
const CONFIG = `${DIR}/claude_desktop_config.json`;
const EXT = 'local.mcpb.anytype.anytype-dev';
const ext = (version = `2.${FAKE_REV}.0`, enabled = true) => ({
	[`${DIR}/extensions-installations.json`]: JSON.stringify({ extensions: { [EXT]: { id: EXT, version, signatureInfo: { status: 'unsigned' } } } }),
	[`${DIR}/Claude Extensions Settings/${EXT}.json`]: JSON.stringify({ isEnabled: enabled }),
});

/** A Mac with Claude Desktop (not running) and this build's bundle; `extension: null` → no Anytype extension installed */
const machine = (opt: { forwarder?: FakeSpec['forwarder']; files?: Record<string, string>; extension?: Record<string, string> | null; bundle?: boolean } = {}) => {
	const env = mac({
		apps: [ 'Claude' ], dirs: [ DIR ], forwarder: opt.forwarder,
		files: { ...FORWARDER_FILES, ...((opt.bundle === false) ? {} : { [`${MCP_DIR}/Anytype.mcpb`]: 'zip' }), ...((opt.extension === undefined) ? ext() : (opt.extension || {})), ...(opt.files || {}) },
	});

	env.listProcesses = async () => [];
	return { env, svc: service(env) };
};

const cd = (over: Record<string, any> = {}) => applyParam({ appId: 'claude-desktop', route: 'stdio', name: 'Claude Desktop', ...over });
const fb = (over: Record<string, any> = {}) => cd({ method: 'config', ...over });
const records = (env: FakeEnv): AiRecord[] => JSON.parse(env.readText(REGISTRY) || '{"connections":[]}').connections;
const check = (svc: any, keys: any = null, port = 31009, accountId = 'acc-a') => svc.check({ accountId, apiListening: true, port, keys });
/** The entry Claude's config route writes for `key` */
const entry = (key: string) => ({ command: STABLE_BIN, args: [ 'serve', '--tier', 'large' ], env: { ANYTYPE_API_KEY: key } });
const commandPlan = (svc: any) => svc.plan({ accountId: 'acc-a', appId: 'other', route: 'stdio', tier: 'large', port: 31009, method: 'command' });

describe('S3: intent recovery', () => {
	test('S3: main refuses a recovery hash that a record owns, or while a mint of this run for the same name is unresolved', async () => {
		const env = mac({ apps: [ 'Cursor' ], files: { ...FORWARDER_FILES } });
		const earlier = service(env);
		const old: any = await earlier.mintIntent({ accountId: 'acc-a', name: 'Cursor', time: 500 });

		// The next run: the intent is a leftover
		const svc = service(env);

		expect(await svc.list({ accountId: 'acc-a' })).toMatchObject({ mintIntents: [ { id: old.id, name: 'Cursor' } ] });

		// The user retries Cursor: heart may have minted hash-a1 already, its answer still on the way
		const live: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Cursor', time: 900 });

		expect(await svc.orphan({ accountId: 'acc-a', hash: 'hash-a1', intentId: old.id, key: KEY_B })).toMatchObject({ ok: false });
		// A live intent is never a recovery intent itself
		expect(await svc.orphan({ accountId: 'acc-a', hash: 'hash-a1', intentId: live.id, key: KEY_B })).toMatchObject({ ok: false });
		expect(await svc.list({ accountId: 'acc-a' })).toMatchObject({ orphanHashes: [] });

		// Delivered: the record owns the key now, and the live intent is done
		expect(await svc.apply(applyParam({ intentId: live.id }))).toMatchObject({ ok: true });
		expect(records(env)[0].appHash).toBe('hash-a1');
		expect(await svc.orphan({ accountId: 'acc-a', hash: 'hash-a1', intentId: old.id, key: KEY_B })).toMatchObject({ ok: false });
		expect(await svc.list({ accountId: 'acc-a' })).toMatchObject({ orphanHashes: [], mintIntents: [ { id: old.id } ] });

		// A key nothing owns, with no mint in flight: queued as before
		expect(await svc.orphan({ accountId: 'acc-a', hash: 'hash-lost', intentId: old.id, key: KEY_B })).toEqual({ ok: true });
		// A released key (no intent id) is queued whatever else is going on
		expect(await svc.orphan({ accountId: 'acc-a', hash: 'hash-released' })).toEqual({ ok: true });
		expect(await svc.list({ accountId: 'acc-a' })).toMatchObject({ orphanHashes: [ 'hash-lost', 'hash-released' ] });
		// An intent main doesn't hold says nothing
		expect(await svc.orphan({ accountId: 'acc-a', hash: 'hash-x', intentId: '00000000000000ff', key: KEY_B })).toMatchObject({ ok: false });
	});
});

describe('S5: the stable copy', () => {
	const BIN = 'C:\\Program Files\\Anytype\\resources\\app.asar.unpacked\\dist\\anytype-mcp.exe';
	const DIR = 'C:\\Users\\me\\.anytype\\bin-dev';
	const STABLE = `${DIR}\\anytype-mcp.exe`;
	const win = (over: Partial<FakeSpec> = {}) => {
		const icacls: RunCall[] = [];
		const env = fakeEnv({
			platform: 'win32', home: 'C:\\Users\\me', vars: { SystemRoot: 'C:\\Windows' }, ...over, files: { [BIN]: 'EXE', ...(over.files || {}) },
			run: call => {
				if (/icacls\.exe$/i.test(call.file)) {
					icacls.push(call);
					return { code: 0, stdout: '' };
				};
				return /powershell\.exe$/i.test(call.file) ? { code: 0, stdout: `${FAKE_SID}\r\n` } : { code: 1, stdout: '' };
			},
		});

		return { env, icacls };
	};
	const USERS = 'S-1-5-32-545';

	test('S5: Windows — a `bin` Anytype creates gets the protected list; an existing `bin` or exe that another account may change is refused, with no key verb and no command', async () => {
		// `.anytype` is there (heart made it), `bin` is not: one icacls call, for `bin`, with the Q17 grants
		const created = win({ dirs: [ 'C:\\Users\\me\\.anytype' ] });

		expect(await ensureInstalled(created.env)).toEqual({ ok: true, path: STABLE, installed: true });
		expect(created.icacls.map(c => c.args)).toEqual([ [ DIR, '/inheritance:r', '/grant:r', `*${FAKE_SID}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F', '*S-1-5-32-544:(OI)(CI)F' ] ]);

		// The query: the home and every path from `.anytype` down to the exe through the environment, never in the script
		// text; asked again on every use, never cached by name (D1R2-E)
		const query = created.env.calls.filter(c => c.opts.env?.ANYTYPE_MCP_ACL_PATHS);

		expect(query).toHaveLength(1);
		expect(query[0].opts.env).toEqual({ ANYTYPE_MCP_ACL_HOME: 'C:\\Users\\me', ANYTYPE_MCP_ACL_PATHS: [ 'C:\\Users\\me\\.anytype', DIR, STABLE ].join('|') });
		expect(query[0].args.join(' ')).not.toContain('Users\\me');
		expect(await ensureInstalled(created.env)).toEqual({ ok: true, path: STABLE, installed: false });
		expect(created.env.calls.filter(c => c.opts.env?.ANYTYPE_MCP_ACL_PATHS)).toHaveLength(2);

		// A restored `bin` that grants Users Modify: nothing is repaired, nothing is handed out
		const loose = win({ dirs: [ DIR, 'C:\\Users\\me\\AppData\\Roaming\\anytype' ], acl: { [DIR]: [ USERS ] } });
		const svc = service(loose.env, 'C:\\Users\\me\\AppData\\Roaming\\anytype\\aiConnect.json');

		expect(await ensureInstalled(loose.env)).toEqual({ ok: false, error: { stage: 'write', category: 'installFailed', path: STABLE } });
		expect(await commandPlan(svc)).toMatchObject({ ok: true, canApply: false, needsKey: false, error: { category: 'installFailed' }, steps: [] });
		expect(loose.icacls).toEqual([]);
		expect(loose.env.forwarder.calls).toEqual([]);

		// The right bytes, but the exe itself names another account (the equal-hash path)
		const equal = win({ dirs: [ DIR ], files: { [STABLE]: 'EXE' }, acl: { [STABLE]: [ 'S-1-5-21-9-9-9-1002' ] } });

		expect(await ensureInstalled(equal.env)).toMatchObject({ ok: false, error: { category: 'installFailed' } });

		// Only the user, SYSTEM and Administrators on both: used as it is
		const clean = win({ dirs: [ DIR ], files: { [STABLE]: 'EXE' } });

		expect(await ensureInstalled(clean.env)).toEqual({ ok: true, path: STABLE, installed: false });
		expect(clean.icacls).toEqual([]);

		// No answer is a refusal
		const silent = win({ dirs: [ DIR ], files: { [STABLE]: 'EXE' }, acl: null });

		expect(await ensureInstalled(silent.env)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
	});

	test('S5: Linux — a home mounted noexec fails the install before any key is written', async () => {
		const ROOT = '/Applications/Anytype.app/Contents/Resources/app.asar.unpacked';
		const env = fakeEnv({ platform: 'linux', home: '/home/me', dirs: [ '/home/me/.config/anytype' ], files: { [`${ROOT}/dist/anytype-mcp`]: 'ELF' }, noexec: [ '/home/me' ] });
		const svc = service(env, '/home/me/.config/anytype/aiConnect.json');

		// The bundled one runs (the app is not on that mount); the copy has mode 0755 and still can't
		expect(env.canExecute(`${ROOT}/dist/anytype-mcp`)).toBe(false);
		env.chmod(`${ROOT}/dist/anytype-mcp`, 0o755);
		expect(env.canExecute(`${ROOT}/dist/anytype-mcp`)).toBe(true);

		expect(await ensureInstalled(env)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(env.modeOf('/home/me/.anytype/bin-dev/anytype-mcp')).toBe(0o755);
		expect(await commandPlan(svc)).toMatchObject({ ok: true, canApply: false, needsKey: false, error: { category: 'installFailed' } });
		expect(env.forwarder.calls).toEqual([]);

		// The same machine without the mount option installs
		const fine = fakeEnv({ platform: 'linux', home: '/home/me', files: { [`${ROOT}/dist/anytype-mcp`]: 'ELF' } });

		expect(await ensureInstalled(fine)).toMatchObject({ ok: true, installed: true });
	});
});

describe('S8: Claude\'s config entry across profiles', () => {
	test('S8: profile A\'s removal and profile B\'s config-route apply run one at a time — B\'s Replace of A\'s entry waits, and finds it gone (refused, nothing written); B then connects', async () => {
		const REGISTRY_B = '/Users/me/Library/Application Support/anytype-b/aiConnect.json';
		const { env, svc: a } = machine({ extension: null, files: { [CONFIG]: '{}' } });
		const tick = () => new Promise(resolve => setTimeout(resolve, 1));
		let held: null | (() => void) = null;
		let hold = false;

		env.mkdir('/Users/me/Library/Application Support/anytype-b', 0o700);
		// A waiting lock holder yields to the event loop, as the real sleep does
		env.sleep = tick as any;
		env.listProcesses = () => {
			if (hold) {
				hold = false;
				return new Promise(resolve => {
					held = () => resolve([]);
				});
			};
			return Promise.resolve([]);
		};

		const b = service(env, REGISTRY_B);

		expect(await a.apply(fb())).toMatchObject({ ok: true, connection: { method: 'config' } });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toEqual(entry(KEY_A));

		// A disconnects: its key is queued and it now asks whether Claude runs, holding the lock
		hold = true;

		const removing = a.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' });

		while (!held) {
			await tick();
		};
		expect(env.exists('/Users/me/.anytype/ai-connect/claude-desktop.lock')).toBe(true);
		expect(records(env)[0]).toMatchObject({ removed: true, revokePending: [ 'hash-a1' ] });

		// B replaces A's entry meanwhile (the user agreed to the one shown): it waits for the lock, writing nothing
		const replace = { targetPath: CONFIG, foreignDigest: canonicalDigest(entry(KEY_A)) };
		const applying = b.apply(fb({ accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1', replace }));

		for (let i = 0; i < 20; i++) {
			await tick();
		};
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toEqual(entry(KEY_A));

		held();
		expect(await removing).toMatchObject({ ok: true, connection: { removed: true } });
		// The entry B agreed to replace is gone: refused, nothing written, no record
		expect(await applying).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers?.anytype).toBeUndefined();
		expect(env.readText(REGISTRY_B) ? JSON.parse(env.readText(REGISTRY_B)).connections : []).toEqual([]);

		expect(await b.apply(fb({ accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1' }))).toMatchObject({ ok: true, connection: { method: 'config', appHash: 'hash-b1' } });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toEqual(entry(KEY_B));
		expect(((await check(b, null, 31009, 'acc-b')) as any).connections[0].status).toBe('ok');
		expect(env.exists('/Users/me/.anytype/ai-connect/claude-desktop.lock')).toBe(false);
	});

	test('S8: a lock that can\'t be taken changes nothing — a removal queues and deletes nothing, an apply writes nothing', async () => {
		const LOCK = '/Users/me/.anytype/ai-connect/claude-desktop.lock';
		const { env, svc } = machine({ extension: null, files: { [CONFIG]: '{}' } });
		let now = 1000;

		env.now = () => now;
		env.sleep = async ms => {
			now += ms;
		};
		expect(await svc.apply(fb())).toMatchObject({ ok: true });

		const bytes = env.files()[CONFIG];

		// Another profile holds it (fresh: never stolen within its minute): nothing queued, nothing deleted
		env.writeFile(LOCK, '', 0o600).close();
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: false, error: { category: 'changed' } });
		expect(records(env)[0]).toMatchObject({ removed: false, revokePending: [] });
		expect(env.files()[CONFIG]).toBe(bytes);

		const other = machine({ extension: null, files: { [CONFIG]: '{}', [LOCK]: '' } });

		other.env.unlink(LOCK);
		other.env.now = () => now;
		other.env.sleep = async ms => {
			now += ms;
		};
		other.env.writeFile(LOCK, '', 0o600).close();
		expect(await other.svc.apply(fb())).toEqual({ ok: false, error: { stage: 'write', category: 'changed' } });
		expect(other.env.files()[CONFIG]).toBe('{}');
		expect(records(other.env)).toEqual([]);
	});
});

