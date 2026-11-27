/**
 * Bookkeeping from mint to revoke (anytype-mcp-plan §2.9) for connections whose key is in the forwarder's
 * item: what is saved before each verb, how a lost receipt is settled by `key check`, the revocation order,
 * the mint intent, and Other app's Command setup as a managed connection (§7.2).
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { FORWARDER_BIN, FORWARDER_FILES, KEY_A, KEY_B, KEY_C, MCP_DIR, REGISTRY, STABLE_BIN, applyParam, keysOf, mac, service } from './testKit';
import { keyFingerprint } from './digest';
import { fakeForwarderRun, type FakeEnv, type FakeSpec, type ForwarderState, type RunCall } from './testEnv';
import { validateParam } from './validate';
import type { AiRecord } from './types';

const DIR = '/Users/me/Library/Application Support/Claude';
const EXT = 'local.mcpb.anytype.anytype-dev';
const EXT_FILES = {
	[`${DIR}/extensions-installations.json`]: JSON.stringify({ extensions: { [EXT]: { id: EXT, version: '2.5.0', signatureInfo: { status: 'unsigned' } } } }),
	[`${DIR}/Claude Extensions Settings/${EXT}.json`]: JSON.stringify({ isEnabled: true }),
};

/** A Mac with Claude Desktop and the Anytype extension installed: the bundle route delivers with `key set` only */
const machine = (forwarder?: FakeSpec['forwarder']) => {
	const env = mac({ apps: [ 'Claude' ], dirs: [ DIR ], forwarder, files: { ...FORWARDER_FILES, [`${MCP_DIR}/Anytype.mcpb`]: 'zip', ...EXT_FILES } });
	return { env, svc: service(env) };
};

const cd = (over: Record<string, any> = {}) => applyParam({ appId: 'claude-desktop', route: 'stdio', name: 'Claude Desktop', ...over });
const records = (env: FakeEnv): AiRecord[] => JSON.parse(env.readText(REGISTRY) || '{"connections":[]}').connections;
const item = (env: FakeEnv, id = 'claude-desktop') => env.forwarder.items.get(id);
const check = (svc: any, keys: any = null, port = 31009) => svc.check({ accountId: 'acc-a', apiListening: true, port, keys });
const lostReceipt = { code: 1, stdout: JSON.stringify({ ok: false, unconfirmed: true, reason: 'the receipt was lost' }) + '\n' };

/** The verb runs (or not), then its receipt is lost */
const losing = (verb: string, opt: { write: boolean; when?: () => boolean; seen?: (call: RunCall) => void }) => (call: RunCall, state: ForwarderState) => {
	if ((call.args[1] != verb) || (opt.when && !opt.when())) {
		return null;
	};
	opt.seen?.(call);
	if (opt.write) {
		fakeForwarderRun(state, call);
	};
	return lostReceipt;
};

describe('§2.9 key set: the candidate is saved first', () => {
	test('before `key set` runs, the registry already holds the new key as a candidate (hash and fingerprint, never the key)', async () => {
		let atSet: AiRecord[] = null;
		const { env, svc } = machine(call => {
			if (call.args[1] == 'set') {
				atSet = records(env);
			};
			return null;
		});

		expect(await svc.apply(cd())).toMatchObject({ ok: true });
		expect(atSet).toHaveLength(1);
		expect(atSet[0]).toMatchObject({ id: 'claude-desktop', unconfirmed: [ { appHash: 'hash-a1', keyFp: keyFingerprint(KEY_A), method: 'keyfile', created: true, running: true, until: expect.any(Number) } ] });
		expect(JSON.stringify(atSet)).not.toContain(KEY_A);
		// Committed: the candidate became the record's key
		expect(records(env)[0]).toMatchObject({ appHash: 'hash-a1', keyFp: keyFingerprint(KEY_A), itemRev: 1, revokePending: [] });
		expect(records(env)[0].unconfirmed).toBeUndefined();
	});

	test('a rotation: the old key keeps working until the receipt; then it is queued for revocation', async () => {
		let atSet: AiRecord[] = null;
		let rotating = false;
		const { env, svc } = machine(call => {
			if (rotating && (call.args[1] == 'set')) {
				atSet = records(env);
			};
			return null;
		});

		await svc.apply(cd());
		rotating = true;
		expect(await svc.apply(cd({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: true, connection: { appHash: 'hash-a2', revokePending: [ 'hash-a1' ], itemRev: 2 } });
		// While the verb ran: the old key still the record's, the new one only a candidate, nothing queued
		expect(atSet[0]).toMatchObject({ appHash: 'hash-a1', revokePending: [], unconfirmed: [ { appHash: 'hash-a2', keyFp: keyFingerprint(KEY_B), created: false } ] });
		expect(env.forwarder.calls.filter(c => c.args[1] == 'set')[1].args.slice(-2)).toEqual([ '--expect', `${keyFingerprint(KEY_A)}@1` ]);
	});

	test('a lost receipt, the item written: unconfirmed → the next check finds the new fingerprint, promotes it and queues the old key', async () => {
		let rotating = false;
		const { env, svc } = machine(losing('set', { write: true, when: () => rotating }));

		await svc.apply(cd());
		rotating = true;

		const res: any = await svc.apply(cd({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }));

		// The renderer neither releases the new key nor revokes the old one
		expect(res).toMatchObject({ ok: false, unconfirmed: true, connection: { appHash: 'hash-a1', revokePending: [], unconfirmed: [ { appHash: 'hash-a2' } ] } });
		expect(item(env).key).toBe(KEY_B);

		rotating = false;
		expect(await check(svc)).toMatchObject({ connections: [ { appHash: 'hash-a2', keyFp: keyFingerprint(KEY_B), revokePending: [ 'hash-a1' ], itemRev: 2, status: 'ok' } ] });
		expect(records(env)[0].unconfirmed).toBeUndefined();
	});

	test('a lost receipt, the item NOT written: the next check finds the old fingerprint, drops the candidate and queues the new key; the live key is never revoked', async () => {
		let rotating = false;
		const { env, svc } = machine(losing('set', { write: false, when: () => rotating }));

		await svc.apply(cd());
		rotating = true;
		expect(await svc.apply(cd({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, unconfirmed: true });
		expect(item(env).key).toBe(KEY_A);

		rotating = false;
		expect(await check(svc)).toMatchObject({ connections: [ { appHash: 'hash-a1', keyFp: keyFingerprint(KEY_A), revokePending: [ 'hash-a2' ], status: 'ok' } ] });
		expect(records(env)[0].unconfirmed).toBeUndefined();
	});

	test('main dies after the store write and before its registry save: the saved candidate alone settles it the same way', async () => {
		let saved = '';
		let rotating = false;
		const { env, svc } = machine((call, state) => {
			if (rotating && (call.args[1] == 'set')) {
				fakeForwarderRun(state, call);
				// The registry as it was when the store took the write: all a restarted main has
				saved = env.readText(REGISTRY);
				return { code: 0, stdout: JSON.stringify({ ok: true, fingerprint: keyFingerprint(KEY_B), rev: 2 }) + '\n' };
			};
			return null;
		});

		await svc.apply(cd());
		rotating = true;
		await svc.apply(cd({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }));
		rotating = false;

		// Main "died": the registry never got the commit
		env.unlink(REGISTRY);
		env.writeFile(REGISTRY, saved, 0o600).close();

		const restarted = service(env);

		expect(await check(restarted)).toMatchObject({ connections: [ { appHash: 'hash-a2', revokePending: [ 'hash-a1' ], status: 'ok' } ] });
		expect(item(env).key).toBe(KEY_B);
	});

	test('a first connection whose receipt is lost and whose item was never written: the record goes, its key queued for revocation', async () => {
		const { env, svc } = machine(losing('set', { write: false }));

		expect(await svc.apply(cd())).toMatchObject({ ok: false, unconfirmed: true, connection: { status: 'pending' } });
		expect(await check(svc)).toMatchObject({ connections: [ { removed: true, revokePending: [ 'hash-a1' ] } ] });
		expect(item(env)).toBeUndefined();
	});

	test('exit 7 / exit 5 mean nothing was written: no candidate stays, the record is as before', async () => {
		let code = 0;
		const { env, svc } = machine(call => ((code && (call.args[1] == 'set')) ? { code, stdout: JSON.stringify({ ok: false, reason: 'x', store: 'unreachable' }) + '\n' } : null));

		await svc.apply(cd());

		const before = records(env);

		for (code of [ 7, 5, 6 ]) {
			expect(await svc.apply(cd({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, error: expect.anything() });
			expect(records(env)).toEqual(before);
		};
		expect(item(env).key).toBe(KEY_A);
	});

	test('a receipt for another key than the one sent is no receipt', async () => {
		const { svc } = machine(call => ((call.args[1] == 'set') ? { code: 0, stdout: JSON.stringify({ ok: true, fingerprint: keyFingerprint(KEY_C), rev: 1 }) + '\n' } : null));

		expect(await svc.apply(cd())).toMatchObject({ ok: false, unconfirmed: true });
	});
});

describe('§2.9 key retarget: the intent is saved first, and nothing is ever revoked for it', () => {
	test('the intended port, tier and revision are on the record while the verb runs, and gone after its receipt', async () => {
		let atVerb: AiRecord = null;
		const { env, svc } = machine(call => {
			if (call.args[1] == 'retarget') {
				atVerb = records(env)[0];
			};
			return null;
		});

		await svc.apply(cd());
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', port: 31011, tier: 'full' })).toMatchObject({ ok: true, connection: { port: 31011, tier: 'full', itemRev: 2 } });
		// `until`: the verb has ended by then, whatever happened to Anytype meanwhile (S6)
		expect(atVerb.retarget).toEqual({ port: 31011, tier: 'full', rev: 2, until: expect.any(Number) });
		expect(atVerb).toMatchObject({ port: 31009, tier: 'large' });
		expect(records(env)[0].retarget).toBeUndefined();
		expect(records(env)[0].revokePending).toEqual([]);
	});

	test.each([ [ 'written', true ], [ 'not written', false ] ])('a lost receipt, the item %s: the record takes whatever port, tier and revision the item has; the same key, nothing revoked', async (name, write) => {
		let lose = false;
		const { env, svc } = machine(losing('retarget', { write, when: () => lose }));

		await svc.apply(cd());
		lose = true;
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', port: 31009, tier: 'full' })).toEqual({ ok: false, error: { stage: 'write', category: 'timeout' } });
		// The intent stays until the item was read back
		expect(records(env)[0]).toMatchObject({ tier: 'large', retarget: { port: 31009, tier: 'full', rev: 2 } });

		lose = false;

		let res: any = await check(svc, keysOf([ 'hash-a1' ]));
		const expected = write ? { tier: 'full', itemRev: 2 } : { tier: 'large', itemRev: 1 };

		expect(res.connections[0]).toMatchObject({ ...expected, appHash: 'hash-a1', revokePending: [], status: 'ok' });
		if (!write) {
			// S6: the old revision settles nothing while the writer could still commit; past its deadline it does
			expect(records(env)[0].retarget).toMatchObject({ tier: 'full', rev: 2 });
			env.now = () => 1000 + 10 * 60 * 1000;
			res = await check(svc, keysOf([ 'hash-a1' ]));
			expect(res.connections[0]).toMatchObject({ ...expected, appHash: 'hash-a1', revokePending: [], status: 'ok' });
		};
		expect(records(env)[0].retarget).toBeUndefined();
		// The record followed the item; the item was not "healed" back
		expect(item(env)).toMatchObject({ key: KEY_A, tier: expected.tier, rev: expected.itemRev });
		expect(env.forwarder.calls.filter(c => c.args[1] == 'retarget')).toHaveLength(1);
	});

	test('a refused retarget (exit 7) leaves no intent and changes nothing', async () => {
		const { env, svc } = machine();

		await svc.apply(cd());
		env.forwarder.store = 'denied';
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', port: 31011 })).toMatchObject({ ok: false, error: { category: 'storeDenied' } });
		expect(records(env)[0].retarget).toBeUndefined();
		expect(records(env)[0].port).toBe(31009);
	});
});

describe('§2.9 key delete: revocation is queued before the verb', () => {
	test('before `key delete` runs, the record is already removed with every hash of it queued', async () => {
		let atVerb: AiRecord = null;
		const { env, svc } = machine(call => {
			if (call.args[1] == 'delete') {
				atVerb = records(env)[0];
			};
			return null;
		});

		await svc.apply(cd());
		await svc.apply(cd({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }));
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a2' })).toMatchObject({ ok: true, removedNow: true });
		expect(atVerb).toMatchObject({ removed: true, revokePending: [ 'hash-a1', 'hash-a2' ], itemDelete: true });
		expect(item(env)).toBeUndefined();
		expect(records(env)[0]).toMatchObject({ removed: true, revokePending: [ 'hash-a1', 'hash-a2' ] });
		expect(records(env)[0].itemDelete).toBeUndefined();
	});

	test('a queued revocation is dropped only when RevokeApp answered (aiConnectRevoked): a key list that omits the hash clears nothing', async () => {
		const { env, svc } = machine();

		await svc.apply(cd());
		await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' });

		// The list doesn't show the hash (heart skipped a grant file it couldn't read): still queued, the record stays
		await check(svc, keysOf([], [ 'hash-a1' ]));
		await check(svc, []);
		expect(records(env)[0]).toMatchObject({ removed: true, revokePending: [ 'hash-a1' ] });

		// RevokeApp said success or "not found"
		expect(await svc.revoked({ accountId: 'acc-a', connectionId: 'claude-desktop', hash: 'hash-a1' })).toEqual({ ok: true, connection: null });
		expect(records(env)).toEqual([]);
	});

	test.each([ [ 'deleted', true ], [ 'still there', false ] ])('a lost receipt, the item %s: the revocation stays queued; the next check deletes what is left of this record\'s item', async (name, write) => {
		let lose = true;
		const { env, svc } = machine(losing('delete', { write, when: () => lose }));

		await svc.apply(cd());
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ 'hash-a1' ] } });
		expect(records(env)[0].itemDelete).toBe(true);
		expect(!!item(env)).toBe(!write);

		lose = false;
		await check(svc);
		expect(item(env)).toBeUndefined();
		expect(records(env)[0]).toMatchObject({ removed: true, revokePending: [ 'hash-a1' ] });
		expect(records(env)[0].itemDelete).toBeUndefined();
	});

	test('main dies right after saving the removal, before `key delete` ran: the key is still revoked, and the next run removes the item', async () => {
		let saved = '';
		let dying = true;
		const { env, svc } = machine(call => {
			if (dying && (call.args[1] == 'delete')) {
				// All a restarted main has: the registry as it was saved before the verb
				saved = env.readText(REGISTRY);
				return { code: -1, stdout: '', timedOut: true };
			};
			return null;
		});

		await svc.apply(cd());
		await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' });
		expect(JSON.parse(saved).connections[0]).toMatchObject({ removed: true, revokePending: [ 'hash-a1' ], itemDelete: true });
		expect(item(env).key).toBe(KEY_A);

		env.unlink(REGISTRY);
		env.writeFile(REGISTRY, saved, 0o600).close();
		dying = false;

		const restarted = service(env);

		// heart no longer accepts the key once the renderer revoked it; the item goes on the first check
		expect(await check(restarted)).toMatchObject({ connections: [ { removed: true, revokePending: [ 'hash-a1' ], status: 'revokeFailed' } ] });
		expect(item(env)).toBeUndefined();
		expect(await restarted.revoked({ accountId: 'acc-a', connectionId: 'claude-desktop', hash: 'hash-a1' })).toEqual({ ok: true, connection: null });
	});

	test('an item of another account is left alone; the revocation is queued either way', async () => {
		const { env, svc } = machine();

		await svc.apply(cd());
		env.forwarder.items.set('claude-desktop', { key: KEY_B, account: 'acc-b', port: 31009, tier: 'large', rev: 7 });
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ 'hash-a1' ] } });
		expect(item(env)).toMatchObject({ key: KEY_B, account: 'acc-b', rev: 7 });
		expect(env.forwarder.calls.filter(c => c.args[1] == 'delete')).toEqual([]);
	});

	test('a store that can\'t be used (exit 7) never deletes and never blocks the revocation', async () => {
		const { env, svc } = machine();

		await svc.apply(cd());
		env.forwarder.store = 'denied';
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ 'hash-a1' ] } });
		expect(item(env).key).toBe(KEY_A);
		expect(records(env)[0].itemDelete).toBe(true);
	});
});

describe('§2.9 the mint intent', () => {
	test('saved before CreateApp, cleared when the delivery commits; one left by an earlier run is reported to the renderer', async () => {
		const { env, svc } = machine();
		const a: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Claude Desktop', time: 1000 });
		const b: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Cursor', time: 1001 });

		expect(a).toEqual({ ok: true, id: expect.stringMatching(/^[0-9a-f]{16}$/) });
		expect(JSON.parse(env.readText(REGISTRY)).mintIntents).toEqual([ { id: a.id, accountId: 'acc-a', name: 'Claude Desktop', time: 1000 }, { id: b.id, accountId: 'acc-a', name: 'Cursor', time: 1001 } ]);
		// This run's flows may still be going on: nothing is reported as left over
		expect((await svc.list({ accountId: 'acc-a' }) as any).mintIntents).toEqual([]);

		expect(await svc.apply(cd({ intentId: a.id }))).toMatchObject({ ok: true });
		expect(JSON.parse(env.readText(REGISTRY)).mintIntents.map((it: any) => it.id)).toEqual([ b.id ]);

		// Anytype died between CreateApp and the delivery of the second key: the next run names its intent
		const restarted = service(env);

		expect((await restarted.list({ accountId: 'acc-a' }) as any).mintIntents).toEqual([ { id: b.id, name: 'Cursor', time: 1001 } ]);
		expect((await restarted.list({ accountId: 'acc-b' }) as any).mintIntents).toEqual([]);
		// The renderer found (or didn't find) the key and queued it: the intent goes
		expect(await restarted.mintIntent({ accountId: 'acc-a', id: b.id, done: true })).toEqual({ ok: true, id: b.id });
		expect(JSON.parse(env.readText(REGISTRY)).mintIntents).toBeUndefined();
	});

	test('a delivery that fails keeps the intent (the key is still pending); an unconfirmed one clears it (a candidate holds the key now)', async () => {
		let lose = false;
		const { env, svc } = machine(losing('set', { write: true, when: () => lose }));
		const a: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Claude Desktop', time: 1000 });

		env.forwarder.store = 'denied';
		expect(await svc.apply(cd({ intentId: a.id }))).toMatchObject({ ok: false });
		expect(JSON.parse(env.readText(REGISTRY)).mintIntents).toHaveLength(1);

		env.forwarder.store = 'ok';
		lose = true;
		expect(await svc.apply(cd({ intentId: a.id }))).toMatchObject({ ok: false, unconfirmed: true });
		expect(JSON.parse(env.readText(REGISTRY)).mintIntents).toBeUndefined();
	});

	test('the IPC shape: a name and a time to save, an id and `done` to clear; nothing else', () => {
		expect(validateParam('aiConnectMintIntent', { accountId: 'acc-a', name: 'Cursor', time: 5 })).toMatchObject({ name: 'Cursor', time: 5 });
		expect(validateParam('aiConnectMintIntent', { accountId: 'acc-a', id: '0123456789abcdef', done: true })).toMatchObject({ done: true });
		for (const bad of [ { accountId: 'acc-a' }, { accountId: 'acc-a', name: 'x' }, { accountId: 'acc-a', id: 'short', done: true }, { accountId: 'acc-a', name: 'x', time: 1, done: true }, { accountId: 'acc-a', name: 'x', time: -1 }, { accountId: 'acc-a', name: 'x', time: 1, key: 'k' } ]) {
			expect(validateParam('aiConnectMintIntent', bad)).toBeNull();
		};
	});
});

describe('§7.2 Other app: Command as a managed connection', () => {
	const other = (over: Record<string, any> = {}) => applyParam({ appId: 'other', route: 'stdio', method: 'command', name: 'My agent', ...over });
	const snippetOf = (steps: any[]) => JSON.parse(steps.find(s => s.snippet).snippet);
	const setup = async () => {
		const env = mac({ files: { ...FORWARDER_FILES } });
		const svc = service(env);
		const a: any = await svc.apply(other());
		const b: any = await svc.apply(other({ key: KEY_B, appHash: 'hash-b1', name: 'Another agent' }));

		return { env, svc, a, b, idA: a.connection.id as string, idB: b.connection.id as string };
	};

	test('the IPC contract: `method: command` only for Other app on stdio; `connectionId` only with it', () => {
		expect(validateParam('aiConnectApply', other())).toMatchObject({ method: 'command' });
		expect(validateParam('aiConnectApply', other({ connectionId: 'other-1a2b3c4d' }))).toMatchObject({ connectionId: 'other-1a2b3c4d' });
		expect(validateParam('aiConnectApply', other({ route: 'http' }))).toBeNull();
		expect(validateParam('aiConnectApply', other({ appId: 'cursor', route: 'http' }))).toBeNull();
		expect(validateParam('aiConnectApply', applyParam({ connectionId: 'cursor' }))).toBeNull();
		expect(validateParam('aiConnectPlan', { accountId: 'acc-a', appId: 'other', route: 'stdio', tier: 'large', port: 31009, method: 'command' })).toMatchObject({ method: 'command' });
		expect(validateParam('aiConnectPlan', { accountId: 'acc-a', appId: 'claude-desktop', route: 'stdio', tier: 'large', port: 31009, method: 'command' })).toBeNull();
	});

	test('creation: main allocates other-<8 hex> once, stores the key with `key set`, installs the stable copy, and returns the setup text — no key in it', async () => {
		const { env, a, idA } = await setup();

		expect(idA).toMatch(/^other-[0-9a-f]{8}$/);
		expect(a).toMatchObject({ ok: true, connection: { id: idA, appId: 'other', method: 'command', route: 'stdio', keyFp: keyFingerprint(KEY_A), itemRev: 1, status: 'ok' } });
		expect(snippetOf(a.steps)).toEqual({ mcpServers: { anytype: { command: STABLE_BIN, args: [ 'serve', '--connection', idA ] } } });
		expect(JSON.stringify(a)).not.toContain(KEY_A);
		expect(JSON.stringify(a.steps)).not.toMatch(/Bearer|<KEY>|files-dir|ELECTRON/);
		expect(env.files()[STABLE_BIN]).toBe('FORWARDER-BYTES');
		expect(item(env, idA)).toEqual({ key: KEY_A, account: 'acc-a', port: 31009, tier: 'large', rev: 1 });
		expect(env.forwarder.calls.find(c => c.args[1] == 'set').args).toEqual([ 'key', 'set', '--connection', idA, '--expect', 'absent' ]);
		expect(env.forwarder.calls.every(c => c.file == FORWARDER_BIN)).toBe(true);
		// No app was looked for: a Command connection has none
		expect(env.calls.filter(c => /plutil|mdfind/.test(c.file))).toEqual([]);
	});

	test('two Command connections never affect each other: reconnect, port change, tier change and disconnect touch only the chosen one', async () => {
		const { env, svc, idA, idB } = await setup();

		expect(idA).not.toBe(idB);

		// Reconnect A: names the existing record; main checks it against the account and expectedHash
		const again: any = await svc.apply(other({ key: KEY_C, appHash: 'hash-a2', expectedHash: 'hash-a1', connectionId: idA }));

		expect(again).toMatchObject({ ok: true, connection: { id: idA, appHash: 'hash-a2', revokePending: [ 'hash-a1' ], itemRev: 2 } });
		expect(item(env, idA)).toMatchObject({ key: KEY_C, rev: 2 });
		expect(item(env, idB)).toEqual({ key: KEY_B, account: 'acc-a', port: 31009, tier: 'large', rev: 1 });
		expect(await svc.apply(other({ key: KEY_C, appHash: 'hash-x', expectedHash: 'wrong', connectionId: idA }))).toMatchObject({ ok: false, error: { category: 'stale' } });
		expect(await svc.apply(other({ accountId: 'acc-b', key: KEY_C, appHash: 'hash-x', expectedHash: 'hash-a2', connectionId: idA }))).toMatchObject({ ok: false });
		expect(await svc.apply(other({ key: KEY_C, appHash: 'hash-x', connectionId: 'other-00000000' }))).toMatchObject({ ok: false });

		// A tier change on B: a retarget of B's item
		expect(await svc.update({ accountId: 'acc-a', connectionId: idB, expectedHash: 'hash-b1', port: 31009, tier: 'full' })).toMatchObject({ ok: true, connection: { tier: 'full', itemRev: 2 } });
		expect(item(env, idA)).toMatchObject({ tier: 'large', rev: 2 });

		// The API moved: the next check retargets both, each with its own key; nothing is revoked for it
		const moved: any = await check(svc, null, 31020);

		expect(moved.healed.sort()).toEqual([ idA, idB ].sort());
		expect(item(env, idA)).toMatchObject({ key: KEY_C, port: 31020, tier: 'large', rev: 3 });
		expect(item(env, idB)).toMatchObject({ key: KEY_B, port: 31020, tier: 'full', rev: 3 });
		expect(records(env).find(r => r.id == idB)).toMatchObject({ port: 31020, itemRev: 3, revokePending: [] });

		// Disconnect A: its item goes, its revocation is queued; B is untouched and still checks ok
		expect(await svc.remove({ accountId: 'acc-a', connectionId: idA, expectedHash: 'hash-a2' })).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ 'hash-a1', 'hash-a2' ] } });
		expect(item(env, idA)).toBeUndefined();
		expect(item(env, idB)).toMatchObject({ key: KEY_B, rev: 3 });
		expect(((await check(svc, null, 31020)) as any).connections.find((c: any) => c.id == idB)).toMatchObject({ status: 'ok' });
	});

	test('Manage rebuilds the setup text from the record at any time; the plan of a new one only says what will happen', async () => {
		const { svc, idA, idB } = await setup();
		const planFor = (connectionId?: string) => svc.plan({ accountId: 'acc-a', appId: 'other', route: 'stdio', tier: 'large', port: 31009, method: 'command', ...(connectionId ? { connectionId } : {}) });
		const a: any = await planFor(idA);
		const b: any = await planFor(idB);
		const fresh: any = await planFor();

		expect(snippetOf(a.steps).mcpServers.anytype.args).toEqual([ 'serve', '--connection', idA ]);
		expect(snippetOf(b.steps).mcpServers.anytype.args).toEqual([ 'serve', '--connection', idB ]);
		expect(a).toMatchObject({ canApply: true, method: 'command', existing: 'ours', targetId: idA });
		expect(fresh.steps.map((s: any) => s.textKey)).toEqual([ 'aiConnectManualCommandPrepare' ]);
		expect(JSON.stringify([ a, b, fresh ])).not.toMatch(/SENTINEL|Bearer/);
		// A URL-and-key record can't be planned as a Command one, and a Command record isn't recorded by hand
		expect(await svc.recordManual({ accountId: 'acc-a', appId: 'other', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, appHash: 'hash-m', name: 'x', grant: { spaceIds: [], allSpaces: true, perm: 1 }, expireAt: 0, expectedHash: 'hash-a1', connectionId: idA })).toMatchObject({ ok: false });
	});

	test('check: the item gone → removed; another account\'s → conflict; a store that can\'t say → unreadable; the stable copy is kept installed', async () => {
		const { env, svc, idA, idB } = await setup();
		const statusOf = async (id: string) => ((await check(svc)) as any).connections.find((c: any) => c.id == id).status;

		env.unlink(STABLE_BIN);
		expect(await statusOf(idA)).toBe('ok');
		expect(env.files()[STABLE_BIN]).toBe('FORWARDER-BYTES');

		env.forwarder.items.delete(idA);
		expect(await statusOf(idA)).toBe('removed');
		env.forwarder.items.set(idB, { key: KEY_C, account: 'acc-b', port: 31009, tier: 'large', rev: 9 });
		expect(await statusOf(idB)).toBe('conflict');
		env.forwarder.store = 'unreachable';
		expect(await statusOf(idB)).toBe('unreadable');
	});

	test('a lost `key set` receipt on a new Command connection is settled by the next check, also with the API off', async () => {
		const env = mac({ files: { ...FORWARDER_FILES }, forwarder: losing('set', { write: true }) });
		const svc = service(env);
		const res: any = await svc.apply(other());

		expect(res).toMatchObject({ ok: false, unconfirmed: true });

		const id = res.connection.id;
		const settled: any = await svc.check({ accountId: 'acc-a', apiListening: false, keys: null });

		expect(settled.connections[0]).toMatchObject({ id, appHash: 'hash-a1', keyFp: keyFingerprint(KEY_A), status: 'ok', revokePending: [] });
		expect(records(env)[0].unconfirmed).toBeUndefined();
	});

	test('not offered where other apps can\'t start the forwarder: refused before any key, nothing written', async () => {
		const noForwarder = mac({});
		const svc = service(noForwarder);

		expect(await svc.plan({ accountId: 'acc-a', appId: 'other', route: 'stdio', tier: 'large', port: 31009, method: 'command' })).toMatchObject({ canApply: false, steps: [], error: { stage: 'verify', category: 'notFound' } });
		expect(await svc.apply(other())).toMatchObject({ ok: false, error: { category: 'notFound' } });
		expect(records(noForwarder)).toEqual([]);
	});

	test('a failed stable-copy install is reported as such, before any key is stored', async () => {
		const env = mac({ files: { ...FORWARDER_FILES }, dirs: [ '/Users/me/elsewhere' ], links: { '/Users/me/.anytype': '/Users/me/elsewhere' } });
		const svc = service(env);

		expect(await svc.apply(other())).toMatchObject({ ok: false, error: { stage: 'write', category: 'installFailed' } });
		expect(env.forwarder.calls).toEqual([]);
		expect(records(env)).toEqual([]);
	});
});
