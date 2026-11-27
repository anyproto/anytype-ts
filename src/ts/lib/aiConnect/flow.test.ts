import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Storage from 'Lib/storage';
import { AiConnectStore } from 'Store/aiConnect';
import * as flow from './flow';
import { isDesktop } from './flow';
import { connectionState, visibleConnections } from './gallery';
import { BASE_PLAN, deferred, GRANT, installHarness, READ_ONE, record, SENTINEL, until, type Harness } from './testHarness';

let h: Harness;

const input = (over: Partial<flow.ConnectInput> = {}): flow.ConnectInput => ({
	appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', grant: GRANT, name: 'Cursor', expireAt: 0, ...over,
});

beforeEach(() => {
	h = installHarness();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	vi.resetModules();
	(window as any).Electron = {};
	flow.resetFlowForTests();
});

// ---------------------- the desktop gate ---------------------- //

describe('isDesktop', () => {
	test('true only with the preload capability', () => {
		expect(isDesktop({ Api: () => {}, aiConnect: true })).toBe(true);
		expect(isDesktop({ Api: () => {}, aiConnect: 'true' })).toBe(false);
		expect(isDesktop({ Api: () => {} })).toBe(false);
		expect(isDesktop(null)).toBe(false);
		expect(isDesktop({})).toBe(false);
	});

	test('reads window.Electron by default', () => {
		(window as any).Electron = { aiConnect: true };
		expect(isDesktop()).toBe(true);
		(window as any).Electron = {};
		expect(isDesktop()).toBe(false);
	});

	test('false for the web mock', async () => {
		const storage = new Map<string, string>();

		vi.stubGlobal('navigator', { platform: 'MacIntel', userAgent: 'test' });
		vi.stubGlobal('localStorage', {
			getItem: (k: string) => storage.get(k) ?? null,
			setItem: (k: string, v: string) => storage.set(k, v),
			removeItem: (k: string) => storage.delete(k),
		});

		const { electronMock } = await import('../web/electronMock');

		expect(typeof electronMock.Api).toBe('function');
		expect(isDesktop(electronMock)).toBe(false);
	});

	test('false for the extension bridge', async () => {
		// The very object extension/entry.tsx assigns to window.Electron
		const { extensionBridge } = await import('../../../../extension/lib/bridge');

		expect(typeof extensionBridge.Api).toBe('function');
		expect(isDesktop(extensionBridge)).toBe(false);
	});

	test('not desktop: no CreateApp and no key-bearing IPC', async () => {
		(window as any).Electron = { Api: vi.fn() };

		const res = await flow.connect(input());

		expect(res.kind).toBe('error');
		expect(h.heart.state.creates).toBe(0);
		expect(h.main.send).not.toHaveBeenCalled();
		expect(await flow.load()).toBe(false);
	});

	test('V14: key listing is gated too (keyFor, liveAccess, reconnect) with the web and extension bridges', async () => {
		const { extensionBridge } = await import('../../../../extension/lib/bridge');
		const old = h.existing();

		h.heart.add('hash-old');
		for (const bridge of [ { Api: vi.fn() }, extensionBridge ]) {
			(window as any).Electron = bridge;
			expect(await flow.keyFor(old)).toBeNull();
			expect((await flow.liveAccess(old)).ok).toBe(false);
			expect((await flow.reconnect(old)).kind).toBe('error');
			await flow.releasePendingKey();
		};
		expect(h.heart.state.lists).toBe(0);
		expect(h.heart.state.creates).toBe(0);
	});
});

describe('apiState', () => {
	test('disabled, unknown, failed, listening', () => {
		h.auth.localApiConfig = { enabled: false, port: 31009 };
		expect(flow.apiState()).toBe('disabled');
		h.auth.localApiConfig = { enabled: true, port: 31009 };
		h.auth.jsonApiStatus = null;
		expect(flow.apiState()).toBe('unknown');
		h.auth.jsonApiStatus = { success: false, listenAddr: '127.0.0.1:31009', error: 'busy' };
		expect(flow.apiState()).toBe('failed');
		h.auth.jsonApiStatus = { success: true, listenAddr: '127.0.0.1:0', error: '' };
		expect(flow.apiState()).toBe('failed');
		h.auth.jsonApiStatus = { success: true, listenAddr: '127.0.0.1:31010', error: '' };
		expect(flow.apiState()).toBe('listening');
		expect(flow.getPort()).toBe(31010);
	});

	test('the port only while listening; previews use the configured one', () => {
		h.listening(false, 31011);
		h.auth.localApiConfig = { enabled: true, port: 31011 };
		expect(flow.getPort()).toBe(0);
		expect(flow.previewPort()).toBe(31011);
	});
});

// ---------------------- mintKey ---------------------- //

describe('mintKey', () => {
	test('two rows with the same name: the hash of the row whose key matches', async () => {
		h.heart.add('hash-same-name', GRANT, 0, 'Cursor');

		const res = await flow.mintKey({ name: 'Cursor', grant: GRANT, expireAt: 0 });

		expect(res).toEqual({ ok: true, key: expect.stringContaining('-key-1-'), appHash: 'hash-1', intentId: expect.stringMatching(/^[0-9a-f]{16}$/) });
		expect(h.heart.state.creates).toBe(1);
	});

	test('§2.9: main saves the mint intent (account, key name, time) before CreateApp; no intent, no key', async () => {
		const before = Math.floor(Date.now() / 1000);
		const res: any = await flow.mintKey({ name: 'Cursor', grant: GRANT, expireAt: 0 });
		const sent = h.calls('aiConnectMintIntent')[0].param;

		expect(sent).toEqual({ accountId: 'acc-1', name: 'Cursor', time: expect.any(Number) });
		expect(sent.time).toBeLessThanOrEqual(before);
		expect(sent.time).toBeGreaterThan(before - 10);
		// Saved first, and still held while the key is undelivered
		expect(h.cmds().indexOf('aiConnectMintIntent')).toBe(0);
		expect(h.heart.state.order.indexOf('CreateApp')).toBeGreaterThanOrEqual(0);
		expect([ ...h.main.m.intents.keys() ]).toEqual([ res.intentId ]);

		h.main.m.intentFails = true;
		expect(await flow.mintKey({ name: 'Cursor', grant: GRANT, expireAt: 0 })).toEqual({ ok: false, error: { stage: 'write', category: 'unsaved' } });
		expect(h.heart.state.creates).toBe(1);
	});

	test('Q6: a CreateApp that fails keeps its intent (a lost reply may still have minted the key); a 65th intent means no CreateApp; a released key clears its intent', async () => {
		// The dispatcher folds a transport error into "failed": nothing says no key exists
		h.heart.state.createFails = true;
		expect(await flow.mintKey({ name: 'Cursor', grant: GRANT, expireAt: 0 })).toMatchObject({ ok: false, error: { stage: 'key' } });
		expect(h.main.m.intents.size).toBe(1);
		expect(h.calls('aiConnectMintIntent').filter(c => c.param.done)).toEqual([]);
		h.heart.state.createFails = false;
		h.main.m.intents.clear();

		// Main holds 64 unresolved intents: it refuses another one, and no key is created
		for (let i = 0; i < 64; i++) {
			h.main.m.intents.set(`x${i}`, { id: `x${i}`, accountId: 'acc-1', name: 'k', time: 1 });
		};

		const creates = h.heart.state.creates;

		expect(await flow.mintKey({ name: 'Cursor', grant: GRANT, expireAt: 0 })).toEqual({ ok: false, error: { stage: 'write', category: 'unsaved' } });
		expect(h.heart.state.creates).toBe(creates);
		h.main.m.intents.clear();

		// A flow that mints and is closed before delivering: the key is revoked and the intent goes with it
		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'permission' } });
		expect((await flow.connect(input())).kind).toBe('error');
		expect(h.main.m.intents.size).toBe(1);
		await flow.releasePendingKey();
		expect(h.heart.state.revokes).toHaveLength(1);
		expect(h.main.m.intents.size).toBe(0);
	});

	test('the row missing on the first two lookups is found on the third; CreateApp once', async () => {
		h.heart.state.hideNewFor = 2;

		const res = await flow.mintKey({ name: 'Cursor', grant: GRANT, expireAt: 0 });

		expect(res.ok).toBe(true);
		expect(h.heart.state.lists).toBe(3);
		expect(h.heart.state.creates).toBe(1);
	});

	test('never found: keyNotFound, CreateApp once, nothing delivered', async () => {
		h.heart.state.hideNewFor = 100;

		const res = await flow.connect(input());

		expect(res).toMatchObject({ kind: 'error', error: { stage: 'key', category: 'keyNotFound' } });
		expect(h.heart.state.creates).toBe(1);
		expect(h.heart.state.lists).toBe(flow.flowConfig.lookupRetries + 1);
		expect(h.calls('aiConnectApply')).toHaveLength(0);
	});

	test('API not listening: no CreateApp', async () => {
		h.listening(false);

		expect(await flow.mintKey({ name: 'Cursor', grant: GRANT, expireAt: 0 })).toMatchObject({ ok: false, error: { category: 'apiOff' } });
		expect((await flow.connect(input())).kind).toBe('error');
		expect(h.heart.state.creates).toBe(0);
	});

	test('V13: a CreateApp that answers after the timeout is looked up and revoked, never dropped', async () => {
		flow.flowConfig.rpcTimeout = 5;
		h.heart.gate.hold = true;

		const res = await flow.connect(input());

		expect(res).toMatchObject({ kind: 'error', error: { stage: 'key', category: 'timeout' } });
		expect(h.calls('aiConnectApply')).toHaveLength(0);

		h.heart.gate.release();
		await until(() => h.heart.state.revokes.length == 1);

		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
		expect(h.heart.rows.has('hash-1')).toBe(false);
	});
});

// ---------------------- connect ---------------------- //

describe('connect', () => {
	test('order: plan → mint → apply → revoke old → revoked → probe', async () => {
		h.heart.add('hash-old');

		const old = h.existing();
		const res = await flow.connect(input({ existing: old }));

		expect(res.kind).toBe('ok');
		expect(h.cmds().filter(it => it != 'aiConnectList')).toEqual([ 'aiConnectPlan', 'aiConnectMintIntent', 'aiConnectApply', 'aiConnectRevoked', 'aiConnectProbe' ]);
		expect(h.heart.state.order.filter(it => it != 'ListApps')).toEqual([ 'CreateApp', 'RevokeApp:hash-old' ]);
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ appHash: 'hash-1', expectedHash: 'hash-old', previewTarget: BASE_PLAN.targetPath, port: 31009, intentId: expect.any(String) });
		// The delivery committed: main dropped the intent
		expect(h.main.m.intents.size).toBe(0);
		expect(h.heart.rows.has('hash-old')).toBe(false);
	});

	test('a preflight without consent: needsQuit and no CreateApp', async () => {
		h.main.m.plans.cursor = { ...BASE_PLAN, preflight: 'quitApp' };

		expect(await flow.connect(input())).toMatchObject({ kind: 'needsQuit', preflight: 'quitApp' });

		h.main.m.plans.cursor = { ...BASE_PLAN, preflight: 'quitAppSelf' };
		expect(await flow.connect(input({ allowQuit: true }))).toMatchObject({ kind: 'needsQuit', preflight: 'quitAppSelf' });
		expect(h.heart.state.creates).toBe(0);

		expect((await flow.connect(input({ quitConfirmed: true }))).kind).toBe('ok');
		expect(h.calls('aiConnectApply')[0].param.quitConfirmed).toBe(true);
	});

	test('a foreign entry without the consent bound to it: needsReplace, no CreateApp', async () => {
		const replace = { targetPath: BASE_PLAN.targetPath, foreignDigest: 'a'.repeat(64) };

		h.main.m.plans.cursor = { ...BASE_PLAN, existing: 'foreign', replace };

		expect(await flow.connect(input())).toMatchObject({ kind: 'plan', reason: 'needsReplace' });
		expect(await flow.connect(input({ replace: { ...replace, foreignDigest: 'b'.repeat(64) } }))).toMatchObject({ kind: 'plan', reason: 'needsReplace' });
		expect(h.heart.state.creates).toBe(0);

		expect((await flow.connect(input({ replace }))).kind).toBe('ok');
		expect(h.calls('aiConnectApply')[0].param.replace).toEqual(replace);
	});

	test('V3: an agreed replace whose entry vanished since the preview → a fresh preview, nothing recreated', async () => {
		const replace = { targetPath: BASE_PLAN.targetPath, foreignDigest: 'a'.repeat(64) };

		expect(await flow.connect(input({ replace }))).toMatchObject({ kind: 'plan', reason: 'changed' });
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectApply')).toHaveLength(0);
	});

	test('V3: an entry replaced by another one between Replace and the quit consent needs a new Replace click', async () => {
		const shown = { targetPath: BASE_PLAN.targetPath, foreignDigest: 'a'.repeat(64) };

		h.main.m.plans.cursor = { ...BASE_PLAN, existing: 'foreign', replace: shown, preflight: 'quitApp' };
		expect((await flow.connect(input({ replace: shown }))).kind).toBe('needsQuit');

		h.main.m.plans.cursor = { ...BASE_PLAN, existing: 'foreign', replace: { ...shown, foreignDigest: 'c'.repeat(64) }, preflight: 'quitApp' };
		expect(await flow.connect(input({ replace: shown, allowQuit: true }))).toMatchObject({ kind: 'plan', reason: 'needsReplace' });
		expect(h.calls('aiConnectApply')).toHaveLength(0);
	});

	test('a plan that can not be applied, or a target that moved since the preview: nothing minted', async () => {
		h.main.m.plans.cursor = { ...BASE_PLAN, canApply: false, error: { stage: 'parse', category: 'unparseable' } };
		expect(await flow.connect(input())).toMatchObject({ kind: 'plan', reason: 'manual' });

		h.main.m.plans.cursor = { ...BASE_PLAN, canApply: false, steps: [], error: { stage: 'detect', category: 'unsupportedPackage' } };
		expect(await flow.connect(input())).toMatchObject({ kind: 'plan', reason: 'cantApply' });

		h.main.m.plans.cursor = BASE_PLAN;
		expect(await flow.connect(input({ shown: { ...BASE_PLAN, targetPath: '/Users/me/old/mcp.json' } }))).toMatchObject({ kind: 'plan', reason: 'changed' });
		expect(h.heart.state.creates).toBe(0);
	});

	test('V9: the port moves while the key is minted: no apply to the old port, the key kept for the retry', async () => {
		h.heart.gate.hold = true;

		const run = flow.connect(input());

		await until(() => !!h.heart.gate.release);
		h.listening(true, 31010);
		h.heart.gate.release();

		expect(await run).toMatchObject({ kind: 'plan', reason: 'changed' });
		expect(h.calls('aiConnectApply')).toHaveLength(0);
		expect(flow.heldKey()).toMatchObject({ appHash: 'hash-1', committed: false });

		expect((await flow.connect(input())).kind).toBe('ok');
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ port: 31010, appHash: 'hash-1' });
		expect(h.heart.state.creates).toBe(1);
	});

	test('a second delivery of the same flow reuses the pending key; changed access mints anew', async () => {
		let n = 0;

		h.main.m.apply = () => ((n++ == 0) ? { ok: false, needs: 'quitApp' } : { ok: true, connection: h.main.view(record({ appHash: 'hash-1' })) });
		expect((await flow.connect(input())).kind).toBe('needsQuit');
		expect((await flow.connect(input({ allowQuit: true }))).kind).toBe('ok');
		expect(h.heart.state.creates).toBe(1);

		await flow.releasePendingKey();
		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'changed' } });
		await flow.connect(input());
		await flow.connect(input({ grant: READ_ONE }));
		expect(h.heart.state.creates).toBe(3);
		expect(h.heart.state.revokes).toEqual([ 'hash-2' ]);
	});

	test('a failed apply keeps the old key; release revokes the pending key exactly once; a committed one is kept', async () => {
		h.heart.add('hash-old');
		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'permission' } });

		expect(await flow.connect(input({ existing: h.existing() }))).toMatchObject({ kind: 'error', hasKey: true });
		await flow.releasePendingKey();
		await flow.releasePendingKey();
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
		expect(h.heart.rows.has('hash-old')).toBe(true);

		h.main.m.apply = null;
		h.main.m.records.clear();
		expect((await flow.connect(input())).kind).toBe('ok');
		await flow.releasePendingKey();
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
	});

	test('stale: the new key is released at once and the list reloaded', async () => {
		h.existing({ appHash: 'hash-other' });

		expect(await flow.connect(input({ existing: null }))).toMatchObject({ kind: 'error', error: { category: 'stale' } });
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
		expect(flow.heldKey()).toBeNull();
	});

	test('unconfirmed: neither the new key released nor the old one revoked', async () => {
		h.heart.add('hash-old');

		const old = h.existing();

		h.main.m.apply = () => ({ ok: false, unconfirmed: true, error: { stage: 'cli', category: 'timeout' }, connection: old });
		expect((await flow.connect(input({ existing: old }))).kind).toBe('unconfirmed');
		await flow.releasePendingKey();
		expect(h.heart.state.revokes).toEqual([]);
	});

	test('recordSaved: false counts as committed and is reported', async () => {
		h.heart.add('hash-old');

		const old = h.existing();

		h.main.m.apply = (p: any) => ({ ok: true, recordSaved: false, connection: h.main.view(record({ appHash: p.appHash, revokePending: [ 'hash-old' ] })) });

		expect(await flow.connect(input({ existing: old }))).toMatchObject({ kind: 'ok', recordSaved: false });
		await flow.releasePendingKey();
		expect(h.heart.state.revokes).toEqual([ 'hash-old' ]);
	});
});

// ---------------------- V10: running CLI candidates ---------------------- //

describe('running candidates (V10)', () => {
	/**
	 * Main's record after an unconfirmed first install of A and a successful retry with B (index.ts freshRecord):
	 * the old appHash A goes to revokePending while A, still running, stays in `unconfirmed`.
	 */
	const mainShape = () => record({
		id: 'claude-code', appId: 'claude-code', appHash: 'hash-B', revokePending: [ 'hash-A', 'hash-old2' ],
		unconfirmed: [ { appHash: 'hash-A', keyFp: 'aaaaaaaaaaaaaaaa', route: 'http', method: 'cli', targetPath: '/Users/me/.claude.json', tier: 'large', recommendedTier: 'large', port: 31009, nextStep: 'newSession', name: 'Claude Code', grant: GRANT, expireAt: 0, created: true, running: true } ],
	});

	test('rotation never revokes a candidate whose CLI may still write it', async () => {
		h.heart.add('hash-A');
		h.heart.add('hash-old2');
		h.main.m.apply = () => ({ ok: true, connection: h.main.view(mainShape()) });

		expect((await flow.connect(input({ appId: 'claude-code', name: 'Claude Code' }))).kind).toBe('ok');
		expect(h.heart.state.revokes).toEqual([ 'hash-old2' ]);
		expect(h.heart.rows.has('hash-A')).toBe(true);
	});

	test('a check skips it too; an explicit disconnect revokes the complete set', async () => {
		h.heart.add('hash-A');
		h.heart.add('hash-B');
		h.main.m.records.set('claude-code', mainShape());

		await flow.check('test');
		expect(h.heart.state.revokes).not.toContain('hash-A');

		await flow.disconnect(h.main.view(h.main.m.records.get('claude-code')));
		expect(h.heart.state.revokes).toEqual(expect.arrayContaining([ 'hash-A', 'hash-B' ]));
	});

	test('revocable(): running candidates out unless the record is removed', () => {
		expect(flow.revocable(mainShape())).toEqual([ 'hash-old2' ]);
		expect(flow.revocable({ ...mainShape(), removed: true })).toEqual([ 'hash-A', 'hash-old2' ]);
	});
});

// ---------------------- close during delivery (R3-1, V1) ---------------------- //

describe('close during a flow', () => {
	test('release waits for the apply; ok keeps the new key and revokes the old one', async () => {
		h.heart.add('hash-old');

		const old = h.existing();
		const d = h.main.holdNext('aiConnectApply');
		const run = flow.connect(input({ existing: old }));

		await until(() => h.calls('aiConnectApply').length == 1);

		let released = false;
		const release = flow.releasePendingKey().then(() => { released = true; });

		await new Promise(r => setTimeout(r, 0));
		expect(released).toBe(false);

		d.resolve({ ok: true, connection: h.main.view(record({ appHash: 'hash-1', revokePending: [ 'hash-old' ] })) });
		await Promise.all([ run, release ]);

		expect(h.heart.state.revokes).toEqual([ 'hash-old' ]);
		expect(h.heart.rows.has('hash-1')).toBe(true);
	});

	test('an error reply: the new key is revoked once; a failed revoke is remembered as an orphan', async () => {
		const d = h.main.holdNext('aiConnectApply');
		const run = flow.connect(input());

		await until(() => h.calls('aiConnectApply').length == 1);
		h.heart.state.revokeFails.add('hash-1');

		const release = flow.releasePendingKey();

		d.resolve({ ok: false, error: { stage: 'write', category: 'permission' } });
		await Promise.all([ run, release ]);

		expect(h.calls('aiConnectOrphan').map(it => it.param)).toEqual([ { accountId: 'acc-1', hash: 'hash-1' } ]);
		expect(h.main.m.orphans.has('hash-1')).toBe(true);
	});

	test('a close while the key is being minted: no apply, the key revoked', async () => {
		h.heart.gate.hold = true;

		const run = flow.connect(input());

		await until(() => !!h.heart.gate.release);

		const release = flow.releasePendingKey();

		h.heart.gate.release();
		expect(await run).toEqual({ kind: 'cancelled' });
		await release;
		expect(h.calls('aiConnectApply')).toHaveLength(0);
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
	});

	test('V1: a close during Reconnect\'s first lookup → zero CreateApp, nothing held', async () => {
		h.heart.add('hash-old');

		const old = h.existing();

		h.heart.gate.holdList = true;

		const run = flow.reconnect(old);

		await until(() => !!h.heart.gate.releaseList);

		const release = flow.releasePendingKey();

		h.heart.gate.releaseList();
		expect(await run).toEqual({ kind: 'cancelled' });
		await release;
		expect(h.heart.state.creates).toBe(0);
		expect(flow.heldKey()).toBeNull();
	});

	test('V1: a close while Create key waits for its plan → zero CreateApp', async () => {
		const d = h.main.holdNext('aiConnectPlan');
		const run = flow.createManual({ ...input({ appId: 'other', name: 'Zed' }) });

		await until(() => h.calls('aiConnectPlan').length == 1);

		const release = flow.releasePendingKey();

		d.resolve();
		expect(await run).toEqual({ kind: 'cancelled' });
		await release;
		expect(h.heart.state.creates).toBe(0);
	});
});

// ---------------------- accounts and leftovers (V11, V12) ---------------------- //

describe('accounts and leftovers', () => {
	test('V11: an account switch during a check: B\'s list never reconciles A, nothing revoked', async () => {
		h.heart.add('hash-old');
		h.existing({ revokePending: [ 'hash-p' ] });

		const d = h.main.holdNext('aiConnectList');
		const run = flow.check('test');

		await until(() => h.calls('aiConnectList').length == 1);
		h.auth.account = { id: 'acc-2' };
		d.resolve();

		expect(await run).toBe('stale');
		expect(h.calls('aiConnectCheck')).toHaveLength(0);
		expect(h.heart.state.revokes).toEqual([]);
	});

	test('V11: a pending key of account A is not revoked under B\'s session; A\'s next check revokes it', async () => {
		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'permission' } });
		await flow.connect(input());

		h.auth.account = { id: 'acc-2' };
		await flow.releasePendingKey();
		expect(h.heart.state.revokes).toEqual([]);

		h.auth.account = { id: 'acc-1' };
		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
	});

	test('V12: revoke and orphan registration both fail: the hash is kept and retried by the next check', async () => {
		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'permission' } });
		await flow.connect(input());
		h.heart.state.revokeFails.add('hash-1');
		h.main.m.orphanFails = true;
		await flow.releasePendingKey();
		expect(h.main.m.orphans.size).toBe(0);

		await flow.check('test');
		expect(flow.cleanupFailed()).toBe(true);
		expect(h.store.cleanupFailed).toBe(true);

		h.heart.state.revokeFails.clear();
		await flow.check('test');
		expect(h.heart.rows.has('hash-1')).toBe(false);
		expect(flow.cleanupFailed()).toBe(false);
	});
});

// ---------------------- revocation end to end (R3-3, V5) ---------------------- //

describe('revocation', () => {
	test('rotate A→B with A failing → disconnect B → restart → Retry with the API off revokes both', async () => {
		h.heart.add('hash-A');

		const a = h.existing({ appHash: 'hash-A' });

		h.heart.state.revokeFails.add('hash-A');
		expect((await flow.connect(input({ existing: a }))).kind).toBe('ok');

		h.heart.state.revokeFails.add('hash-1');
		expect(await flow.disconnect(h.store.getById('cursor'))).toMatchObject({ ok: true, revoked: false });

		const s2 = new AiConnectStore();

		vi.stubGlobal('S', { Auth: h.auth, AiConnect: s2 });
		flow.resetFlowForTests();
		h.listening(false);
		h.heart.state.revokeFails.clear();

		await flow.retryRevoke();
		expect(h.heart.rows.has('hash-A')).toBe(false);
		expect(h.heart.rows.has('hash-1')).toBe(false);
		expect(h.main.m.records.has('cursor')).toBe(false);
	});

	test('V5: a removed record with a revoke outstanding stays visible as Retry at once (main\'s "removed" status)', async () => {
		h.heart.add('hash-x');
		h.heart.state.revokeFails.add('hash-x');

		const res = await flow.disconnect(h.existing({ appHash: 'hash-x' }));
		const c = h.store.getById('cursor');

		expect(res).toMatchObject({ ok: true, revoked: false });
		expect(c).toMatchObject({ removed: true, status: 'removed' });
		expect(visibleConnections(h.store.connectionList).map(it => it.id)).toEqual([ 'cursor' ]);
		expect(connectionState(c)).toBe('revokeFailed');
	});

	test('a conflict touches nothing; forget revokes without cleanup', async () => {
		h.heart.add('hash-old');
		h.main.m.removeConflict = true;

		expect(await flow.disconnect(h.existing())).toMatchObject({ ok: false, conflict: true });
		expect(h.heart.state.revokes).toEqual([]);
		expect(await flow.forget(h.existing())).toMatchObject({ ok: true, revoked: true });
	});
});

// ---------------------- fallback keys (R3-2) ---------------------- //

describe('fallback keys', () => {
	test('manual after a failed apply: the new key is recorded only by "I\'ve updated", then the old one goes', async () => {
		h.heart.add('hash-old');

		const old = h.existing();

		h.main.m.apply = () => ({ ok: false, error: { stage: 'parse', category: 'unparseable' } });
		await flow.connect(input({ existing: old }));

		const res = await flow.confirmManual({ ...input(), existing: old, previewTarget: BASE_PLAN.targetPath });

		expect(res.ok).toBe(true);
		expect(h.calls('aiConnectRecordManual')[0].param).toMatchObject({ appHash: 'hash-1', expectedHash: 'hash-old', previewTarget: BASE_PLAN.targetPath });
		expect(h.cmds().indexOf('aiConnectRecordManual')).toBeLessThan(h.cmds().indexOf('aiConnectRevoked'));
	});

	test('manual reconnect keeps the connectionId; the old key goes only after "I\'ve updated"; closing first releases', async () => {
		h.heart.add('hash-old', READ_ONE, 0, 'My app');

		const old = h.existing({ id: 'other-0a1b2c3d', appId: 'other', method: 'manual', keyFp: '', targetPath: '', grant: READ_ONE, name: 'My app' });

		expect(await flow.reconnect(old)).toMatchObject({ kind: 'manual', connection: old, access: { grant: READ_ONE, expireAt: 0 } });
		expect((await flow.confirmManual({ ...input({ appId: 'other' }), existing: old, connectionId: old.id })).ok).toBe(true);
		expect(h.calls('aiConnectRecordManual')[0].param).toMatchObject({ connectionId: 'other-0a1b2c3d', expectedHash: 'hash-old', grant: READ_ONE });
		expect(h.heart.state.revokes).toEqual([ 'hash-old' ]);

		await flow.releasePendingKey();
		h.heart.add('hash-o2', READ_ONE);
		await flow.reconnect(h.existing({ id: 'other-2', appId: 'other', appHash: 'hash-o2', method: 'manual', grant: READ_ONE }));
		await flow.releasePendingKey();
		expect(h.heart.state.revokes).toEqual([ 'hash-old', 'hash-2' ]);
	});

	test('LM Studio file fallback after a committed deeplink: the committed key again (keyFor), no CreateApp', async () => {
		h.heart.add('hash-lm', GRANT, 0, 'LM Studio');

		const lm = h.existing({ id: 'lmstudio', appId: 'lmstudio', appHash: 'hash-lm', method: 'deeplink', nextStep: 'confirmInApp' });

		expect((await flow.connect(input({ appId: 'lmstudio', name: 'LM Studio', method: 'config', sameKey: true, existing: lm }))).kind).toBe('ok');
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ appHash: 'hash-lm', expectedHash: 'hash-lm', method: 'config' });
	});
});

// ---------------------- reconnect (R3-8, V2) ---------------------- //

describe('reconnect', () => {
	test('the current grant and the same absolute expiry; the old key revoked after the delivery', async () => {
		h.heart.add('hash-old', READ_ONE, 1900000000);

		expect((await flow.reconnect(h.existing({ grant: GRANT, expireAt: 1800000000 }))).kind).toBe('ok');
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ grant: READ_ONE, expireAt: 1900000000, expectedHash: 'hash-old' });
		expect(h.heart.rows.has('hash-old')).toBe(false);
	});

	test('the grant changed between the sheet and the mint: no CreateApp, the new values back', async () => {
		h.heart.add('hash-old', READ_ONE, 0);

		expect(await flow.reconnect(h.existing(), { shown: { grant: GRANT, expireAt: 0 } })).toMatchObject({ kind: 'grantChanged', grant: READ_ONE });
		expect(h.heart.state.creates).toBe(0);
	});

	test('V2: after a quit consent the old key is re-read before the minted replacement is delivered', async () => {
		h.heart.add('hash-old', GRANT, 0);

		const old = h.existing();

		h.main.m.apply = (p: any) => (p.allowQuit ? { ok: true, connection: h.main.view(record({ appHash: p.appHash })) } : { ok: false, needs: 'quitApp' });
		expect((await flow.reconnect(old)).kind).toBe('needsQuit');
		expect(h.heart.state.creates).toBe(1);

		h.heart.rows.get('hash-old').grant = READ_ONE;
		expect(await flow.reconnect(old, { allowQuit: true })).toMatchObject({ kind: 'grantChanged', grant: READ_ONE });
		expect(h.calls('aiConnectApply')).toHaveLength(1);
		// The undelivered replacement is released
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
		expect(flow.heldKey()).toBeNull();
	});

	test('a revoked key: the form, with a future expiry kept and a passed one dropped', async () => {
		const future = Math.floor(Date.now() / 1000) + 86400;

		expect(await flow.reconnect(h.existing({ expireAt: future, grant: READ_ONE }))).toEqual({
			kind: 'needsForm', prefill: { grant: READ_ONE, tier: 'large', route: 'http', name: 'Cursor', expireAt: future },
		});
		await flow.releasePendingKey();
		expect(await flow.reconnect(h.existing({ expireAt: 1000 }))).toMatchObject({ kind: 'needsForm', prefill: { expireAt: undefined } });
		expect(h.heart.state.creates).toBe(0);
	});
});

// ---------------------- manual setup (V7, V8) ---------------------- //

describe('manual setup', () => {
	test('V7: a key for a named file waits for "I\'ve updated"; Other app records at once', async () => {
		expect(await flow.createManual({ ...input() })).toMatchObject({ kind: 'pending' });
		expect(h.calls('aiConnectRecordManual')).toHaveLength(0);
		await flow.releasePendingKey();

		expect(await flow.createManual({ ...input({ appId: 'other', name: 'Zed' }) })).toMatchObject({ kind: 'ok' });
		expect(h.calls('aiConnectRecordManual')).toHaveLength(1);
	});

	test('V8: a prerequisite-only plan (update the CLI) mints nothing', async () => {
		h.main.m.plans['claude-code'] = { ...BASE_PLAN, appId: 'claude-code', canApply: false, steps: [ { textKey: 'aiConnectManualUpdateCli', args: [ 'Claude Code', '2.1.327' ] } ], error: { stage: 'cli', category: 'cliTooOld' } };

		expect(await flow.createManual({ ...input({ appId: 'claude-code', name: 'Claude Code' }) })).toMatchObject({ kind: 'plan' });
		expect(h.heart.state.creates).toBe(0);
	});

	test('V8: a target refused since the preview, or another target: the fresh plan, nothing minted', async () => {
		h.main.m.plans.cursor = { ...BASE_PLAN, canApply: false, steps: [], error: { stage: 'read', category: 'outsideHome' } };
		expect(await flow.createManual({ ...input(), shown: BASE_PLAN })).toMatchObject({ kind: 'plan' });

		h.main.m.plans.cursor = { ...BASE_PLAN, targetPath: '/Users/me/other.json' };
		expect(await flow.createManual({ ...input(), shown: BASE_PLAN })).toMatchObject({ kind: 'plan' });
		expect(h.heart.state.creates).toBe(0);
	});

	test('createManual for Claude Desktop applies manual: true with the flow\'s pending key', async () => {
		h.main.m.plans['claude-desktop'] = { ...BASE_PLAN, appId: 'claude-desktop', route: 'stdio', steps: [ { textKey: 'aiConnectManualPrepare' } ] };

		const res = await flow.createManual({ ...input({ appId: 'claude-desktop', route: 'stdio', name: 'Claude Desktop' }) });

		expect(res.kind).toBe('ok');
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ manual: true, appId: 'claude-desktop' });
		expect(h.calls('aiConnectRecordManual')).toHaveLength(0);
	});
});

// ---------------------- manage ---------------------- //

describe('manage', () => {
	test('retryProbe calls neither CreateApp nor apply', async () => {
		h.heart.add('hash-old');

		expect(await flow.retryProbe(h.existing({ lastProbe: 'unauthorized' }))).toEqual({ ok: true });
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectApply')).toHaveLength(0);
	});

	test('V20: a failed lookup is a lookup error, not an absent key; no check, no reconcile, no revoke', async () => {
		h.existing({ revokePending: [ 'hash-p' ] });
		h.heart.state.listFails = true;

		expect(await flow.retryProbe(h.store.getById('cursor'))).toEqual({ ok: false, category: 'unknown', lookupFailed: true });
		h.heart.state.listFails = false;
		expect(await flow.retryProbe(h.store.getById('cursor'))).toEqual({ ok: false, category: 'unauthorized' });
		expect(h.calls('aiConnectCheck')).toHaveLength(0);
		expect(h.calls('aiConnectProbe')).toHaveLength(0);
		expect(h.heart.state.revokes).toEqual([]);
	});

	test('updateTier and updateAccess', async () => {
		h.heart.add('hash-old');
		expect(await flow.updateTier(h.existing(), 'full')).toMatchObject({ ok: true });
		expect(await flow.updateTier(h.existing({ method: 'manual' }), 'full')).toMatchObject({ ok: false, reconnect: true });
		expect(await flow.updateAccess(h.existing(), READ_ONE)).toBe(true);
		expect(h.heart.state.updates).toEqual([ { hash: 'hash-old', grant: READ_ONE } ]);
	});

	test('V18: stepDone reports a failed save; a check reports an unsaved registry', async () => {
		h.main.m.stepDoneFails = true;
		expect(await flow.stepDone(h.existing({ nextStep: 'restart' }))).toBe(false);
		h.main.m.checkUnsaved = true;
		expect(await flow.retrySave()).toBe(false);
		h.main.m.checkUnsaved = false;
		expect(await flow.retrySave()).toBe(true);
	});
});

// ---------------------- check ---------------------- //

describe('check', () => {
	test('single-flight: one pass at a time, a call during a pass gets a pass after it', async () => {
		const d = h.main.holdNext('aiConnectList');
		const a = flow.check('a');
		const b = flow.check('b');

		expect(b).toBe(a);
		await until(() => h.calls('aiConnectList').length == 1);
		d.resolve();
		await a;
		expect(h.calls('aiConnectList')).toHaveLength(2);
	});

	test('only managed hashes are sent; legacy and other keys are ignored', async () => {
		h.heart.add('hash-old');
		h.heart.add('hash-pending');
		h.heart.add('hash-unrelated');
		h.existing({ revokePending: [ 'hash-pending' ], unconfirmed: [ { appHash: 'hash-cand', running: false } ] });
		h.main.m.orphans.add('hash-orphan');
		h.heart.state.revokeFails.add('hash-pending');

		await flow.check('test');

		const keys = h.calls('aiConnectCheck')[0].param.keys;

		expect(keys.map((k: any) => k.hash).sort()).toEqual([ 'hash-cand', 'hash-old', 'hash-orphan', 'hash-pending' ]);
		// RevokeApp is called for every queued hash, also one the list doesn't show (the orphan): only its answer counts
		expect(h.heart.state.revokes).toEqual([ 'hash-pending', 'hash-orphan' ]);
		expect([ ...h.main.m.orphans ]).toEqual([]);
	});

	test('§2.9: a queued revocation is dropped only by RevokeApp\'s answer — a key list that lacks the hash clears nothing', async () => {
		// Neither hash is in heart's list (it skipped their grant files), and RevokeApp fails for both
		h.existing({ revokePending: [ 'hash-unlisted' ] });
		h.main.m.orphans.add('hash-orphan');
		h.heart.state.revokeFails.add('hash-unlisted');
		h.heart.state.revokeFails.add('hash-orphan');

		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([ 'hash-unlisted', 'hash-orphan' ]);
		expect(h.calls('aiConnectRevoked')).toEqual([]);
		expect(h.calls('aiConnectOrphan').filter(c => c.param.done)).toEqual([]);
		expect(S.AiConnect.getById('cursor').revokePending).toEqual([ 'hash-unlisted' ]);
		expect([ ...h.main.m.orphans ]).toEqual([ 'hash-orphan' ]);

		// "Not found" is an answer: both go
		h.heart.state.revokeFails.clear();
		await flow.check('test');
		expect(h.calls('aiConnectRevoked').map(c => c.param.hash)).toEqual([ 'hash-unlisted' ]);
		expect(h.calls('aiConnectOrphan').filter(c => c.param.done).map(c => c.param.hash)).toEqual([ 'hash-orphan' ]);
		expect(S.AiConnect.getById('cursor').revokePending).toEqual([]);
	});

	test('§2.9: Anytype died right after CreateApp — the next check finds the key by its intent and revokes it; managed keys and other names are left alone', async () => {
		const now = Math.floor(Date.now() / 1000);

		h.existing();
		h.heart.add('hash-old', GRANT, 0, 'Cursor');
		// The key of the dead flow, a user's own key of another name, and an older key of the same name
		h.heart.rows.set('hash-lost', { hash: 'hash-lost', apiKey: 'k-lost', name: 'Cursor', createdAt: now, grant: GRANT, expireAt: 0 });
		h.heart.rows.set('hash-mine', { hash: 'hash-mine', apiKey: 'k-mine', name: 'My script', createdAt: now, grant: GRANT, expireAt: 0 });
		h.heart.rows.set('hash-before', { hash: 'hash-before', apiKey: 'k-before', name: 'Cursor', createdAt: now - 500, grant: GRANT, expireAt: 0 });
		h.heart.rows.get('hash-old').createdAt = now;
		h.main.m.staleIntents = [ { id: '00000000000000aa', name: 'Cursor', time: now - 5 } ];

		await flow.check('test');

		expect(h.heart.state.revokes).toEqual([ 'hash-lost' ]);
		expect(h.heart.rows.has('hash-lost')).toBe(false);
		expect([ ...h.heart.rows.keys() ].sort()).toEqual([ 'hash-before', 'hash-mine', 'hash-old' ]);
		expect(h.main.m.staleIntents).toEqual([]);
		// Queued as an orphan before it was revoked
		expect(h.calls('aiConnectOrphan').map(c => [ c.param.hash, !!c.param.done ])).toEqual([ [ 'hash-lost', false ], [ 'hash-lost', true ] ]);
	});

	test('S1: a queued revocation is cleared only by heart\'s own answer — a transport error with grpc-web\'s code 3 keeps it', async () => {
		h.existing({ revokePending: [ 'hash-pending' ] });
		h.heart.add('hash-pending');
		h.heart.add('hash-orphan');
		h.main.m.orphans.add('hash-orphan');
		// HTTP 400 before heart handled the call: the same number as heart's NOT_FOUND, and both keys are still valid
		h.heart.state.revokeTransport.add('hash-pending');
		h.heart.state.revokeTransport.add('hash-orphan');

		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([ 'hash-pending', 'hash-orphan' ]);
		expect(h.calls('aiConnectRevoked')).toEqual([]);
		expect(h.calls('aiConnectOrphan').filter(c => c.param.done)).toEqual([]);
		expect(S.AiConnect.getById('cursor').revokePending).toEqual([ 'hash-pending' ]);
		expect([ ...h.main.m.orphans ]).toEqual([ 'hash-orphan' ]);
		expect(h.heart.rows.has('hash-pending')).toBe(true);

		// The next check asks heart again; its decoded "not found" (code 3, no transport mark) does clear a hash
		h.heart.state.revokeTransport.clear();
		h.heart.rows.delete('hash-orphan');
		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([ 'hash-pending', 'hash-orphan', 'hash-pending', 'hash-orphan' ]);
		expect(h.calls('aiConnectRevoked').map(c => c.param.hash)).toEqual([ 'hash-pending' ]);
		expect(h.calls('aiConnectOrphan').filter(c => c.param.done).map(c => c.param.hash)).toEqual([ 'hash-orphan' ]);
		expect(S.AiConnect.getById('cursor').revokePending).toEqual([]);
	});

	test('S3: intent recovery never revokes the key of a mint still in flight — the old intent waits and is cleared once the key has its record', async () => {
		const now = Math.floor(Date.now() / 1000);

		h.main.m.staleIntents = [ { id: '00000000000000aa', name: 'Cursor', time: now - 5 } ];
		// The retry: heart has minted hash-1, its CreateApp answer is still on the way
		h.heart.gate.hold = true;

		const going = flow.connect(input());

		await until(() => !!h.heart.gate.release);
		expect(h.heart.rows.has('hash-1')).toBe(true);

		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.calls('aiConnectOrphan').map(c => c.param)).toEqual([ { accountId: 'acc-1', hash: 'hash-1', intentId: '00000000000000aa', key: h.heart.rows.get('hash-1').apiKey } ]);
		expect([ ...h.main.m.orphans ]).toEqual([]);
		expect(h.main.m.staleIntents).toHaveLength(1);

		h.heart.gate.release();
		expect((await going).kind).toBe('ok');

		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.heart.rows.has('hash-1')).toBe(true);
		expect(h.main.m.staleIntents).toEqual([]);
		expect(h.calls('aiConnectOrphan')).toHaveLength(1);
	});

	test('S3: a connection committed after this check read the records is not revoked — main refuses the recovery hash its record owns', async () => {
		const now = Math.floor(Date.now() / 1000);

		h.main.m.staleIntents = [ { id: '00000000000000aa', name: 'Cursor', time: now - 5 } ];
		// The check has the record list (no Cursor record yet) and waits for heart's key list
		h.heart.gate.holdList = true;

		const checking = flow.check('test');

		await until(() => !!h.heart.gate.releaseList);

		// Another window commits a new Cursor connection meanwhile
		h.heart.rows.set('hash-new', { hash: 'hash-new', apiKey: 'k-new', name: 'Cursor', createdAt: now, grant: GRANT, expireAt: 0 });
		h.main.m.records.set('cursor', record({ appHash: 'hash-new' }));

		h.heart.gate.releaseList();
		await checking;
		expect(h.calls('aiConnectOrphan').map(c => c.param)).toEqual([ { accountId: 'acc-1', hash: 'hash-new', intentId: '00000000000000aa', key: 'k-new' } ]);
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.heart.rows.has('hash-new')).toBe(true);
		expect([ ...h.main.m.orphans ]).toEqual([]);

		// The next check sees the record: no match, the intent is done
		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.main.m.staleIntents).toEqual([]);
	});

	test('S9: a Claude preview refused by the two-server guard (no steps, no target) mints nothing on Create key', async () => {
		h.main.m.plans['claude-desktop'] = {
			...BASE_PLAN, appId: 'claude-desktop', targetId: 'claude-desktop', route: 'stdio', method: 'manual', canApply: false, steps: [], targetPath: undefined,
			note: 'aiConnectClaudeBothRoutes', error: { stage: 'validate', category: 'conflict' },
		} as any;

		const res: any = await flow.createManual({ appId: 'claude-desktop', route: 'stdio', tier: 'large', recommendedTier: 'large', grant: GRANT, name: 'Claude Desktop', expireAt: 0, shown: h.main.m.plans['claude-desktop'] } as any);

		expect(res.kind).not.toBe('ok');
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectMintIntent')).toEqual([]);
		expect(h.calls('aiConnectApply')).toEqual([]);
	});

	test('§2.9: a failed key list settles no intent', async () => {
		h.main.m.staleIntents = [ { id: '00000000000000ab', name: 'Cursor', time: 1 } ];
		h.heart.state.listFails = true;
		await flow.check('test');
		expect(h.main.m.staleIntents).toHaveLength(1);
		expect(h.calls('aiConnectMintIntent')).toEqual([]);
	});

	test('a failed ListApps sends keys: null; with the API off: no port', async () => {
		h.heart.state.listFails = true;
		await flow.check('test');
		expect(h.calls('aiConnectCheck')[0].param).toMatchObject({ keys: null, apiListening: true, port: 31009 });

		h.heart.state.listFails = false;
		h.listening(false);
		await flow.check('test');
		expect(h.calls('aiConnectCheck')[1].param).toEqual({ accountId: 'acc-1', apiListening: false, keys: [] });
	});

	test('V21: a failed list is kept visible (loadFailed), the earlier data stays', async () => {
		await flow.load();
		expect(h.store.isLoaded).toBe(true);

		h.main.m.listFails = true;
		expect(await flow.load()).toBe(false);
		expect(h.store.loadFailed).toBe(true);
		expect(h.store.detectionMap.size).toBeGreaterThan(0);
		expect(await flow.check('test')).toBe('failed');

		h.main.m.listFails = false;
		expect(await flow.check('test')).toBe('ok');
		expect(h.store.loadFailed).toBe(false);
	});
});

// ---------------------- sentinel (V30) ---------------------- //

describe('sentinel key', () => {
	test('a minted key never reaches console, the store (at any write), Storage (local and desktop, W23), the router or analytics', async () => {
		const spies = [ 'log', 'info', 'warn', 'error', 'debug' ].map(m => vi.spyOn(console, m as any));
		const storage = vi.fn();
		const storeSet = vi.fn();
		const analyticsEvent = vi.fn();
		const routerGo = vi.fn();
		const writes: any[] = [];
		// The app's Storage write API, and the desktop persistence it uses (electron().storeSet)
		const storageWrites = [ 'set', 'setSpaceKey', 'setAccountKey' ].filter(m => typeof (Storage as any)[m] == 'function').map(m => vi.spyOn(Storage as any, m));

		vi.stubGlobal('localStorage', { setItem: storage, getItem: () => null, removeItem: () => {} });
		vi.stubGlobal('analytics', { event: analyticsEvent });
		vi.stubGlobal('U', { Router: { go: routerGo }, Common: { getElectron: () => (window as any).Electron } });
		(window as any).Electron = { aiConnect: true, storeSet, storeGet: () => null, storeDelete: () => {} };
		for (const m of [ 'set', 'setConnections', 'upsert' ] as const) {
			const orig = (h.store as any)[m].bind(h.store);

			vi.spyOn(h.store as any, m).mockImplementation((v: any) => {
				writes.push(JSON.parse(JSON.stringify(v ?? null)));
				return orig(v);
			});
		};

		h.heart.add('hash-old');
		expect((await flow.connect(input({ existing: h.existing() }))).kind).toBe('ok');

		// The populated store right after the delivery, before anything is removed
		expect(JSON.stringify(h.store.connectionList)).not.toContain(SENTINEL);
		expect(h.store.connectionList.length).toBe(1);

		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'permission' } });
		await flow.reconnect(h.store.getById('cursor'));
		await flow.releasePendingKey();
		await flow.check('test');
		await flow.disconnect(h.store.getById('cursor'));

		for (const spy of spies) {
			expect(JSON.stringify(spy.mock.calls)).not.toContain(SENTINEL);
		};
		expect(writes.length).toBeGreaterThan(3);
		expect(JSON.stringify(writes)).not.toContain(SENTINEL);
		expect(JSON.stringify(storage.mock.calls)).not.toContain(SENTINEL);
		expect(JSON.stringify(storeSet.mock.calls)).not.toContain(SENTINEL);
		expect(storageWrites.length).toBeGreaterThan(0);
		for (const spy of storageWrites) {
			expect(JSON.stringify(spy.mock.calls)).not.toContain(SENTINEL);
		};
		expect(JSON.stringify(analyticsEvent.mock.calls)).not.toContain(SENTINEL);
		expect(JSON.stringify(routerGo.mock.calls)).not.toContain(SENTINEL);

		// The key only travels in the delivery and the probe
		const carriers = h.main.m.calls.filter(it => JSON.stringify(it.param).includes(SENTINEL)).map(it => it.cmd);

		expect([ ...new Set(carriers) ].sort()).toEqual([ 'aiConnectApply', 'aiConnectProbe' ]);
	});
});

// ---------------------- polling helper ---------------------- //

describe('pollUntil', () => {
	test('done, timeout, cancelled', async () => {
		let n = 0;

		expect(await flow.pollUntil(async () => (++n >= 3), () => false)).toBe('done');
		expect(await flow.pollUntil(async () => false, () => false, { timeout: 5 })).toBe('timeout');
		expect(await flow.pollUntil(async () => false, () => true)).toBe('cancelled');
		expect(deferred).toBeTypeOf('function');
	});
});
