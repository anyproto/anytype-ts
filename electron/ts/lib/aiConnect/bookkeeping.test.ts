/**
 * Bookkeeping from mint to revoke that survives the item store: the revocation queue and the mint intent
 * (tokens-plan §3.2). Claude's extension is the delivery used here.
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { FORWARDER_FILES, MCP_DIR, REGISTRY, applyParam, keysOf, mac, service } from './testKit';
import { FAKE_REV, type FakeEnv } from './testEnv';
import { validateParam } from './validate';
import type { AiRecord } from './types';

const DIR = '/Users/me/Library/Application Support/Claude';
const EXT = 'local.mcpb.anytype.anytype-dev';
const EXT_FILES = {
	[`${DIR}/extensions-installations.json`]: JSON.stringify({ extensions: { [EXT]: { id: EXT, version: `2.${FAKE_REV}.0`, signatureInfo: { status: 'unsigned' } } } }),
	[`${DIR}/Claude Extensions Settings/${EXT}.json`]: JSON.stringify({ isEnabled: true }),
};

/** A Mac with Claude Desktop and the Anytype extension installed */
const machine = () => {
	const env = mac({ apps: [ 'Claude' ], dirs: [ DIR ], files: { ...FORWARDER_FILES, [`${MCP_DIR}/Anytype.mcpb`]: 'zip', ...EXT_FILES } });
	return { env, svc: service(env) };
};

const cd = (over: Record<string, any> = {}) => applyParam({ appId: 'claude-desktop', route: 'stdio', name: 'Claude Desktop', method: 'package', tier: 'full', recommendedTier: 'full', ...over });
const records = (env: FakeEnv): AiRecord[] => JSON.parse(env.readText(REGISTRY) || '{"connections":[]}').connections;
const check = (svc: any, keys: any = null, port = 31009) => svc.check({ accountId: 'acc-a', apiListening: true, port, keys });

describe('the revocation queue', () => {
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

});

describe('§2.9 the mint intent', () => {
	test('saved before CreateApp, cleared when the delivery commits; one left by an earlier run is reported to the renderer', async () => {
		const { env, svc } = machine();
		const a: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Claude Desktop', time: 1000 });
		const b: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Cursor', time: 1001 });

		expect(a).toEqual({ ok: true, id: expect.stringMatching(/^[0-9a-f]{16}$/), time: 1000 });
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

	test('a delivery that fails keeps the intent (the key is still pending)', async () => {
		const { env, svc } = machine();
		const a: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Claude Desktop', time: 1000 });

		// A tier other than Full on the extension route: refused before anything is saved
		expect(await svc.apply(cd({ intentId: a.id, tier: 'large' }))).toMatchObject({ ok: false });
		expect(JSON.parse(env.readText(REGISTRY)).mintIntents).toHaveLength(1);
		expect(records(env)).toEqual([]);
	});

	test('the IPC shape: a name and a time to save, an id and `done` to clear; nothing else', () => {
		expect(validateParam('aiConnectMintIntent', { accountId: 'acc-a', name: 'Cursor', time: 5 })).toMatchObject({ name: 'Cursor', time: 5 });
		expect(validateParam('aiConnectMintIntent', { accountId: 'acc-a', id: '0123456789abcdef', done: true })).toMatchObject({ done: true });
		for (const bad of [ { accountId: 'acc-a' }, { accountId: 'acc-a', name: 'x' }, { accountId: 'acc-a', id: 'short', done: true }, { accountId: 'acc-a', name: 'x', time: 1, done: true }, { accountId: 'acc-a', name: 'x', time: -1 }, { accountId: 'acc-a', name: 'x', time: 1, key: 'k' } ]) {
			expect(validateParam('aiConnectMintIntent', bad)).toBeNull();
		};
	});
});

