/**
 * anytype-mcp Phase 3, review round 3 (T1–T3, main side): one regression per theme, on the service with the
 * fake home and the fake forwarder. T4 is build-side (guard.test.ts).
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { FORWARDER_FILES, KEY_A, KEY_B, REGISTRY, applyParam, keysOf, mac, service } from './testKit';
import { fakeForwarderRun, type FakeEnv } from './testEnv';
import type { AiRecord } from './types';

const records = (env: FakeEnv): AiRecord[] => JSON.parse(env.readText(REGISTRY) || '{"connections":[]}').connections;
const check = (svc: any, keys: any = null, port = 31009, accountId = 'acc-a') => svc.check({ accountId, apiListening: true, port, keys });
const lost = { code: 1, stdout: JSON.stringify({ ok: false, unconfirmed: true, reason: 'the receipt was lost' }) + '\n' };
const waiting = { code: -1, stdout: '', timedOut: true };
const restore = (env: FakeEnv, file: string, text: string) => {
	if (env.exists(file)) {
		env.unlink(file);
	};
	env.writeFile(file, text, 0o600).close();
};
const command = (over: Record<string, any> = {}) => applyParam({ appId: 'other', route: 'stdio', method: 'command', name: 'My agent', ...over });

describe('T1: a confirmed reconnect keeps its record', () => {
	test('T1: an interrupted first install that expires after a confirmed reconnect retires only its own key — the record stays, with the reconnect\'s key', async () => {
		let saved = '';
		let now = 1000;
		let hold = true;
		const env = mac({ files: { ...FORWARDER_FILES }, forwarder: call => {
			if (hold && (call.args[1] == 'set')) {
				// Anytype exits here; the helper still waits for the item's lock
				saved = env.readText(REGISTRY);
				return waiting;
			};
			return null;
		} });

		env.now = () => now;

		const first: any = await service(env).apply(command());
		const id = first.connection.id;

		expect(first).toMatchObject({ ok: false, unconfirmed: true });
		hold = false;
		restore(env, REGISTRY, saved);

		const svc = service(env);
		const pending = records(env)[0];

		expect(pending.unconfirmed[0]).toMatchObject({ appHash: 'hash-a1', created: true, running: true });

		// Manage → Reconnect inside A's deadline: B is installed and confirmed
		expect(await svc.apply(command({ connectionId: id, key: KEY_B, appHash: 'hash-a2', expectedHash: pending.appHash }))).toMatchObject({ ok: true, connection: { id, appHash: 'hash-a2' } });
		expect(records(env)[0].unconfirmed).toMatchObject([ { appHash: 'hash-a1', created: false } ]);

		// A's writer can no longer commit: only A is retired
		now += 10 * 60 * 1000;

		const res: any = await check(svc, keysOf([ 'hash-a1', 'hash-a2' ]));

		expect(res.connections).toMatchObject([ { id, appHash: 'hash-a2', removed: false, status: 'ok', revokePending: [ 'hash-a1' ] } ]);
		expect(await svc.revoked({ accountId: 'acc-a', connectionId: id, hash: 'hash-a1' })).toMatchObject({ ok: true, connection: { id, appHash: 'hash-a2', removed: false, revokePending: [] } });
		expect(records(env)).toMatchObject([ { id, appHash: 'hash-a2', removed: false } ]);
		expect(env.forwarder.items.get(id).key).toBe(KEY_B);
		// Still manageable: Disconnect finds it and removes its item
		expect(await svc.remove({ accountId: 'acc-a', connectionId: id, expectedHash: 'hash-a2' })).toMatchObject({ ok: true, removedNow: true });
		expect(env.forwarder.items.get(id)).toBeUndefined();
	});
});

describe('T2: mint recovery and an installed key', () => {
	test('T2: Anytype died after Cursor\'s file got the new key and before the record was saved — recovery never queues that key; the next check promotes it', async () => {
		const FILE = '/Users/me/.cursor/mcp.json';
		let saved = '';
		const env = mac({
			apps: [ 'Cursor' ], files: { '/usr/local/bin/agent': '' }, shell: { agent: '/usr/local/bin/agent' },
			run: call => {
				if (call.file == '/usr/local/bin/agent') {
					// The post-write CLI call: Anytype exits during it
					saved = env.readText(REGISTRY);
					return { code: 0, stdout: '' };
				};
				return null;
			},
		});
		const svc = service(env);

		expect(await svc.apply(applyParam())).toMatchObject({ ok: true });

		const intent: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Cursor', time: 900 });

		await svc.apply(applyParam({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1', intentId: intent.id }));
		restore(env, REGISTRY, saved);
		// The file holds B, the registry still names A, and the intent is left
		expect(env.files()[FILE]).toContain(KEY_B);
		expect(records(env)).toMatchObject([ { appHash: 'hash-a1' } ]);
		expect(records(env)[0].unconfirmed).toBeUndefined();

		const restarted = service(env);

		expect(await restarted.list({ accountId: 'acc-a' })).toMatchObject({ mintIntents: [ { id: intent.id } ] });
		// The renderer's recovery finds hash-a2 by name and time, unmanaged: main reads the target and refuses
		expect(await restarted.orphan({ accountId: 'acc-a', hash: 'hash-a2', intentId: intent.id, key: KEY_B })).toMatchObject({ ok: false });
		expect(await restarted.list({ accountId: 'acc-a' })).toMatchObject({ orphanHashes: [], connections: [ { appHash: 'hash-a1', unconfirmed: [ { appHash: 'hash-a2', created: false, running: false } ] } ] });

		// The normal path: the installed key becomes the record's, the old one is retired
		expect(await check(restarted, keysOf([ 'hash-a1', 'hash-a2' ]))).toMatchObject({ connections: [ { appHash: 'hash-a2', status: 'ok', revokePending: [ 'hash-a1' ] } ] });
		expect(env.files()[FILE]).toContain(KEY_B);

		// Unknown is kept too: a target that can't be read queues nothing. A key that is nowhere is queued as before
		restore(env, FILE, '{ not json');
		expect(await restarted.orphan({ accountId: 'acc-a', hash: 'hash-x', intentId: intent.id, key: KEY_A })).toMatchObject({ ok: false });
		restore(env, FILE, '{}');
		expect(await restarted.orphan({ accountId: 'acc-a', hash: 'hash-x', intentId: intent.id, key: KEY_A })).toEqual({ ok: true });
		// Without the key nothing can be looked for: refused by the parameter check
		expect(await restarted.orphan({ accountId: 'acc-a', hash: 'hash-y', intentId: intent.id })).toMatchObject({ ok: false });
		expect(await restarted.list({ accountId: 'acc-a' })).toMatchObject({ orphanHashes: [ 'hash-x' ] });
	});
});

describe('T3: records of the other build flavour', () => {
	const losing = (on: () => boolean) => (call: any, state: any) => {
		if (on() && (call.args[1] == 'set')) {
			fakeForwarderRun(state, call, 'release');
			return lost;
		};
		return null;
	};

	test('T3: a development build leaves a release build\'s item-backed records untouched — nothing settled, retired or rewritten; the release build then promotes its own key', async () => {
		let lose = false;
		const release = mac({ signed: true, files: { ...FORWARDER_FILES }, forwarder: losing(() => lose) });
		const rel = service(release);
		const made: any = await rel.apply(command());
		const id = made.connection.id;

		expect(records(release)[0].ns).toBe('release');
		// A rotation whose receipt was lost: the release item holds B, the record knows it as a candidate
		lose = true;
		expect(await rel.apply(command({ connectionId: id, key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, unconfirmed: true });
		lose = false;
		expect(release.forwarder.items.get(id).key).toBe(KEY_B);

		// The same profile opened by a development build: its own store (`items-dev`) is empty
		const shared = release.readText(REGISTRY);
		const dev = mac({ files: { ...FORWARDER_FILES } });

		restore(dev, REGISTRY, shared);

		const svc = service(dev);
		const res: any = await check(svc, keysOf([ 'hash-a1', 'hash-a2' ]));

		expect(res.connections).toMatchObject([ { id, appHash: 'hash-a1', status: 'conflict', removed: false, revokePending: [], unconfirmed: [ { appHash: 'hash-a2' } ] } ]);
		expect(res.healed).toEqual([]);
		expect(res.removed).toEqual([]);
		expect(dev.readText(REGISTRY)).toBe(shared);
		expect(dev.forwarder.calls).toEqual([]);
		// Nothing of it can be changed from here; Forget is the only way out
		expect(await svc.update({ accountId: 'acc-a', connectionId: id, expectedHash: 'hash-a1', port: 31009, tier: 'full' })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(await svc.apply(command({ connectionId: id, key: KEY_B, appHash: 'hash-a3', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(await svc.remove({ accountId: 'acc-a', connectionId: id, expectedHash: 'hash-a1' })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(dev.readText(REGISTRY)).toBe(shared);
		expect(dev.forwarder.calls).toEqual([]);
		// A development record of its own is stamped `dev` and is handled as ever
		expect(await svc.apply(command({ name: 'Dev agent', key: KEY_A, appHash: 'hash-d1' }))).toMatchObject({ ok: true, connection: { ns: 'dev' } });
		expect(((await check(svc)) as any).connections.map((c: any) => [ c.ns, c.status ])).toEqual([ [ 'release', 'conflict' ], [ 'dev', 'ok' ] ]);

		// Back in the release build: B is promoted from its own store, only A is retired
		expect(await check(service(release), keysOf([ 'hash-a1', 'hash-a2' ]))).toMatchObject({ connections: [ { id, appHash: 'hash-a2', status: 'ok', revokePending: [ 'hash-a1' ] } ] });
	});

	test('T3: a release first install whose receipt was lost is not marked removed by a development build', async () => {
		const release = mac({ signed: true, files: { ...FORWARDER_FILES }, forwarder: losing(() => true) });
		const first: any = await service(release).apply(command());
		const id = first.connection.id;
		const shared = release.readText(REGISTRY);
		const dev = mac({ files: { ...FORWARDER_FILES } });

		expect(first).toMatchObject({ ok: false, unconfirmed: true });
		expect(records(release)[0]).toMatchObject({ ns: 'release', unconfirmed: [ { appHash: 'hash-a1', created: true } ] });
		restore(dev, REGISTRY, shared);
		expect(await check(service(dev), keysOf([ 'hash-a1' ]))).toMatchObject({ connections: [ { id, removed: false, revokePending: [] } ] });
		expect(dev.readText(REGISTRY)).toBe(shared);
		expect(release.forwarder.items.get(id).key).toBe(KEY_A);
	});
});
