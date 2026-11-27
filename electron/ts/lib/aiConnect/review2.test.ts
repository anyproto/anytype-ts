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
import { keyStoreConfig } from './keyStore';
import { FAKE_SID, fakeEnv, fakeForwarderRun, type FakeEnv, type FakeSpec, type RunCall } from './testEnv';
import type { AiRecord } from './types';

const DIR = '/Users/me/Library/Application Support/Claude';
const CONFIG = `${DIR}/claude_desktop_config.json`;
const EXT = 'local.mcpb.anytype.anytype-dev';
const ext = (version = '2.5.0', enabled = true) => ({
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
const item = (env: FakeEnv, id = 'claude-desktop') => env.forwarder.items.get(id);
const check = (svc: any, keys: any = null, port = 31009, accountId = 'acc-a') => svc.check({ accountId, apiListening: true, port, keys });
const lost = { code: 1, stdout: JSON.stringify({ ok: false, unconfirmed: true, reason: 'the receipt was lost' }) + '\n' };
const waiting = { code: -1, stdout: '', timedOut: true };
const restore = (env: FakeEnv, file: string, text: string) => {
	env.unlink(file);
	env.writeFile(file, text, 0o600).close();
};
const verbs = (env: FakeEnv, verb: string) => env.forwarder.calls.filter(c => c.args[1] == verb);

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

		// The query: both paths through the environment, never in the script text; a pass is kept for the run
		const query = created.env.calls.filter(c => c.opts.env?.ANYTYPE_MCP_ACL_DIR);

		expect(query).toHaveLength(1);
		expect(query[0].opts.env).toEqual({ ANYTYPE_MCP_ACL_DIR: DIR, ANYTYPE_MCP_ACL_FILE: STABLE });
		expect(query[0].args.join(' ')).not.toContain('Users\\me');
		expect(await ensureInstalled(created.env)).toEqual({ ok: true, path: STABLE, installed: false });
		expect(created.env.calls.filter(c => c.opts.env?.ANYTYPE_MCP_ACL_DIR)).toHaveLength(1);

		// A restored `bin` that grants Users Modify: nothing is repaired, nothing is handed out
		const loose = win({ dirs: [ DIR ], acl: { [DIR]: [ USERS ] } });
		const svc = service(loose.env, 'C:\\Users\\me\\AppData\\Roaming\\anytype\\aiConnect.json');

		expect(await ensureInstalled(loose.env)).toEqual({ ok: false, error: { stage: 'write', category: 'installFailed', path: STABLE } });
		expect(await svc.apply(applyParam({ appId: 'other', route: 'stdio', method: 'command', name: 'x' }))).toMatchObject({ ok: false, error: { category: 'installFailed' } });
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
		const env = fakeEnv({ platform: 'linux', home: '/home/me', files: { [`${ROOT}/dist/anytype-mcp`]: 'ELF' }, noexec: [ '/home/me' ] });
		const svc = service(env, '/home/me/.config/anytype/aiConnect.json');

		// The bundled one runs (the app is not on that mount); the copy has mode 0755 and still can't
		expect(env.canExecute(`${ROOT}/dist/anytype-mcp`)).toBe(false);
		env.chmod(`${ROOT}/dist/anytype-mcp`, 0o755);
		expect(env.canExecute(`${ROOT}/dist/anytype-mcp`)).toBe(true);

		expect(await ensureInstalled(env)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(env.modeOf('/home/me/.anytype/bin-dev/anytype-mcp')).toBe(0o755);
		expect(await svc.apply(applyParam({ appId: 'other', route: 'stdio', method: 'command', name: 'x' }))).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(env.forwarder.calls.filter(c => c.args[1] == 'set')).toEqual([]);

		// The same machine without the mount option installs
		const fine = fakeEnv({ platform: 'linux', home: '/home/me', files: { [`${ROOT}/dist/anytype-mcp`]: 'ELF' } });

		expect(await ensureInstalled(fine)).toMatchObject({ ok: true, installed: true });
	});
});

describe('S6: a writer that outlived its verb', () => {
	test('S6: Disconnect while a first `key set` may still commit — an absent item is not final before the deadline: a key written afterwards is deleted, and only then the record goes', async () => {
		let saved = '';
		let now = 1000;
		const { env, svc } = machine({ forwarder: call => {
			if (call.args[1] == 'set') {
				// Anytype exits here; the helper is still waiting for the item's lock and has written nothing
				saved = env.readText(REGISTRY);
				return waiting;
			};
			return null;
		} });

		env.now = () => now;
		expect(await svc.apply(cd())).toMatchObject({ ok: false, unconfirmed: true });
		expect(item(env)).toBeUndefined();

		const disconnect = async () => {
			restore(env, REGISTRY, saved);

			const restarted = service(env);
			const rec = records(env)[0];

			expect(rec.unconfirmed[0]).toMatchObject({ appHash: 'hash-a1', running: true, until: expect.any(Number) });
			// The item is absent now; the revocation is queued at once
			expect(await restarted.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: rec.appHash })).toMatchObject({
				ok: true, connection: { removed: true, itemDelete: true, itemUntil: rec.unconfirmed[0].until, revokePending: [ 'hash-a1' ] },
			});
			expect(await restarted.revoked({ accountId: 'acc-a', connectionId: 'claude-desktop', hash: 'hash-a1' })).toMatchObject({ ok: true, connection: { removed: true, itemDelete: true, revokePending: [] } });
			return restarted;
		};
		const first = await disconnect();

		// Inside the deadline with no item: the record stays, hidden
		now += 5000;
		expect(await check(first)).toMatchObject({ connections: [ { removed: true, itemDelete: true } ] });
		expect(records(env)).toHaveLength(1);

		// The helper gets its lock and writes the (revoked) key
		env.forwarder.items.set('claude-desktop', { key: KEY_A, account: 'acc-a', port: 31009, tier: 'large', rev: 1 });
		expect(((await check(first)) as any).connections).toEqual([]);
		expect(item(env)).toBeUndefined();
		expect(verbs(env, 'delete')).toHaveLength(1);
		expect(records(env)).toEqual([]);

		// The other outcome: the helper never writes — once it can no longer commit, the record goes
		now = 1000;

		const second = await disconnect();

		now += 10 * 60 * 1000;
		expect(((await check(second)) as any).connections).toEqual([]);
		expect(records(env)).toEqual([]);
		expect(verbs(env, 'delete')).toHaveLength(1);
	});

	test('S6: a deferred retarget — a check that reads the old revision inside the deadline keeps the intent; the committed change is then taken, not healed back', async () => {
		let defer = false;
		let now = 1000;
		const env = mac({ files: { ...FORWARDER_FILES }, forwarder: call => ((defer && (call.args[1] == 'retarget')) ? waiting : null) });
		const svc = service(env);

		env.now = () => now;

		const made: any = await svc.apply(applyParam({ appId: 'other', route: 'stdio', method: 'command', name: 'My agent' }));
		const id = made.connection.id;
		const snapshot = () => env.readText(REGISTRY);

		defer = true;
		expect(await svc.update({ accountId: 'acc-a', connectionId: id, expectedHash: 'hash-a1', port: 31009, tier: 'full' })).toMatchObject({ ok: false });
		defer = false;
		expect(records(env)[0].retarget).toEqual({ port: 31009, tier: 'full', rev: 2, until: 1000 + keyStoreConfig.timeout + 5000 });

		const pending = snapshot();
		const writes = () => [ ...verbs(env, 'retarget'), ...verbs(env, 'set') ].length;
		const before = writes();

		// The old revision, the helper still waiting: the intent stays and nothing is written
		now += 5000;
		expect(await check(svc)).toMatchObject({ connections: [ { status: 'ok', tier: 'large', retarget: { tier: 'full', rev: 2 } } ] });
		expect(writes()).toBe(before);

		// The helper commits `full`
		env.forwarder.items.set(id, { ...env.forwarder.items.get(id), tier: 'full', rev: 2 });
		expect(await check(svc)).toMatchObject({ connections: [ { status: 'ok', tier: 'full', nextStep: 'restart', itemRev: 2, revokePending: [] } ] });
		expect(records(env)[0].retarget).toBeUndefined();
		expect(env.forwarder.items.get(id)).toMatchObject({ tier: 'full', rev: 2 });
		expect(writes()).toBe(before);

		// The other outcome: it never commits — past the deadline the intent goes, and nothing is rewritten
		env.forwarder.items.set(id, { ...env.forwarder.items.get(id), tier: 'large', rev: 1 });
		restore(env, REGISTRY, pending);
		now = 1000 + 10 * 60 * 1000;

		const late = service(env);

		expect(await check(late)).toMatchObject({ connections: [ { status: 'ok', tier: 'large', nextStep: 'none' } ] });
		expect(records(env)[0].retarget).toBeUndefined();
		expect(writes()).toBe(before);
	});
});

describe('S7: a config-route candidate', () => {
	test('S7: a manual Create key whose receipt was lost keeps the entry it journaled — the pasted snippet is owned: check is ok, and Disconnect removes it', async () => {
		const { env, svc } = machine({ extension: null, files: { [CONFIG]: '{}' }, forwarder: (call, state) => {
			if (call.args[1] == 'set') {
				fakeForwarderRun(state, call);
				return lost;
			};
			return null;
		} });

		expect(await svc.apply(fb({ manual: true }))).toMatchObject({ ok: false, unconfirmed: true });
		expect(item(env).key).toBe(KEY_A);
		// Manual: Anytype did not touch Claude's config
		expect(env.files()[CONFIG]).toBe('{}');

		const entry = { command: STABLE_BIN, args: [ 'serve', '--connection', 'claude-desktop' ] };

		expect(records(env)[0].unconfirmed[0]).toMatchObject({ appHash: 'hash-a1', configEntry: entry, entryDigest: expect.stringMatching(/^[0-9a-f]{64}$/), configPath: CONFIG });

		// The user pastes the snippet
		restore(env, CONFIG, JSON.stringify({ mcpServers: { anytype: entry } }, null, 2));

		const res: any = await check(svc);

		expect(res.connections[0]).toMatchObject({ status: 'ok', appHash: 'hash-a1', configPath: CONFIG });
		expect(res.removed).toEqual([]);
		expect(records(env)[0]).toMatchObject({ entryDigest: expect.stringMatching(/^[0-9a-f]{64}$/), configEntry: entry });
		expect(records(env)[0].unconfirmed).toBeUndefined();

		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true });
		expect(JSON.parse(env.files()[CONFIG]).mcpServers?.anytype).toBeUndefined();
		expect(item(env)).toBeUndefined();
	});
});

describe('S8: Claude\'s config entry across profiles', () => {
	test('S8: profile A\'s removal and profile B\'s config-route apply run one at a time — B connects only after A finished, and keeps its entry, item and record', async () => {
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
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toBeTruthy();

		// A disconnects: its item is deleted, and it now asks whether Claude runs
		hold = true;

		const removing = a.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' });

		while (!held) {
			await tick();
		};
		expect(item(env)).toBeUndefined();
		expect(env.exists('/Users/me/.anytype/ai-connect/claude-desktop.lock')).toBe(true);

		// B connects through the config route meanwhile: it waits for the lock, writing nothing
		const applying = b.apply(fb({ accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1' }));

		for (let i = 0; i < 20; i++) {
			await tick();
		};
		expect(item(env)).toBeUndefined();
		expect(verbs(env, 'set')).toHaveLength(1);

		held();
		expect(await removing).toMatchObject({ ok: true, connection: { removed: true } });
		expect(await applying).toMatchObject({ ok: true, connection: { method: 'config', appHash: 'hash-b1' } });

		// The entry is B's now and is there; so are B's item and record
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toEqual({ command: STABLE_BIN, args: [ 'serve', '--connection', 'claude-desktop' ] });
		expect(item(env)).toMatchObject({ key: KEY_B, account: 'acc-b' });
		expect(JSON.parse(env.readText(REGISTRY_B)).connections[0]).toMatchObject({ accountId: 'acc-b', appHash: 'hash-b1', removed: false });
		expect(((await check(b, null, 31009, 'acc-b')) as any).connections[0].status).toBe('ok');
		expect(env.exists('/Users/me/.anytype/ai-connect/claude-desktop.lock')).toBe(false);
	});

	test('S8: a lock that can\'t be taken changes nothing — a removal keeps its item for the next check, an apply writes no item', async () => {
		const LOCK = '/Users/me/.anytype/ai-connect/claude-desktop.lock';
		const { env, svc } = machine({ extension: null, files: { [CONFIG]: '{}' } });
		let now = 1000;

		env.now = () => now;
		env.sleep = async ms => {
			now += ms;
		};
		expect(await svc.apply(fb())).toMatchObject({ ok: true });

		const bytes = env.files()[CONFIG];

		// Another profile holds it (fresh: never stolen within its minute)
		env.writeFile(LOCK, '', 0o600).close();
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true, connection: { removed: true, itemDelete: true, left: 'entry', revokePending: [ 'hash-a1' ] } });
		expect(item(env).key).toBe(KEY_A);
		expect(env.files()[CONFIG]).toBe(bytes);
		expect(verbs(env, 'delete')).toEqual([]);

		const other = machine({ extension: null, files: { [CONFIG]: '{}', [LOCK]: '' } });

		other.env.unlink(LOCK);
		other.env.now = () => now;
		other.env.sleep = async ms => {
			now += ms;
		};
		other.env.writeFile(LOCK, '', 0o600).close();
		expect(await other.svc.apply(fb())).toEqual({ ok: false, error: { stage: 'write', category: 'changed' } });
		expect(await other.svc.apply(fb({ manual: true }))).toEqual({ ok: false, error: { stage: 'write', category: 'changed' } });
		expect(item(other.env)).toBeUndefined();
		expect(other.env.files()[CONFIG]).toBe('{}');
		expect(records(other.env)).toEqual([]);
	});
});

describe('S9: the two-server guard', () => {
	const planOf = (svc: any, over: Record<string, any> = {}) => svc.plan({ accountId: 'acc-a', appId: 'claude-desktop', route: 'stdio', tier: 'large', port: 31009, ...over });

	test('S9: no usable bundle and an enabled Anytype extension — the preview refuses, with no target for Create key', async () => {
		const on = machine({ bundle: false, files: { [CONFIG]: '{}' } });
		const plan: any = await planOf(on.svc);

		expect(plan).toMatchObject({ ok: true, canApply: false, method: 'manual', note: 'aiConnectClaudeBothRoutes', steps: [], error: { category: 'conflict' } });
		expect(plan.targetPath).toBeUndefined();
		expect(await on.svc.apply(fb({ manual: true }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(item(on.env)).toBeUndefined();

		// Switched off: the manual config steps, with the item as Create key's target
		const off = machine({ bundle: false, extension: ext('2.5.0', false), files: { [CONFIG]: '{}' } });
		const allowed: any = await planOf(off.svc);

		expect(allowed.note).toBeUndefined();
		expect(allowed.steps.map((it: any) => it.textKey)).toContain('aiConnectManualPrepare');
		expect(allowed.targetPath).toBeTruthy();
	});

	test('S9: an installation registry that exists but can\'t be read counts as an enabled extension — plan, Apply and manual Create key write nothing; a missing one is allowed', async () => {
		const huge = machine({ extension: { [`${DIR}/extensions-installations.json`]: `{"extensions":{"x":"${'x'.repeat(4 * 1024 * 1024)}"}}` }, files: { [CONFIG]: '{}' } });

		expect(await planOf(huge.svc, { method: 'config' })).toMatchObject({ canApply: false, note: 'aiConnectClaudeBothRoutes' });
		expect(await huge.svc.apply(fb())).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(await huge.svc.apply(fb({ manual: true }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(item(huge.env)).toBeUndefined();
		expect(huge.env.files()[CONFIG]).toBe('{}');
		expect(verbs(huge.env, 'set')).toEqual([]);

		const broken = machine({ extension: { [`${DIR}/extensions-installations.json`]: '{ not json' }, files: { [CONFIG]: '{}' } });

		expect(await planOf(broken.svc, { method: 'config' })).toMatchObject({ canApply: false, note: 'aiConnectClaudeBothRoutes' });

		const missing = machine({ extension: null, files: { [CONFIG]: '{}' } });

		expect((await planOf(missing.svc, { method: 'config' }) as any).note).toBeUndefined();
		expect(await missing.svc.apply(fb())).toMatchObject({ ok: true, connection: { method: 'config' } });
	});
});
