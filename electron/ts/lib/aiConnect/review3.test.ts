/**
 * anytype-mcp Phase 3, review round 3 (T1–T3, main side): one regression per theme, on the service with the
 * fake home and the fake forwarder. T4 is build-side (guard.test.ts).
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { FORWARDER_FILES, KEY_A, KEY_B, MCP_DIR, REGISTRY, applyParam, keysOf, mac, service } from './testKit';
import type { FakeEnv } from './testEnv';
import type { AiRecord } from './types';

const records = (env: FakeEnv): AiRecord[] => JSON.parse(env.readText(REGISTRY) || '{"connections":[]}').connections;
const check = (svc: any, keys: any = null, port = 31009, accountId = 'acc-a') => svc.check({ accountId, apiListening: true, port, keys });
const restore = (env: FakeEnv, file: string, text: string) => {
	if (env.exists(file)) {
		env.unlink(file);
	};
	env.writeFile(file, text, 0o600).close();
};

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
	const CLAUDE = '/Users/me/Library/Application Support/Claude';
	const claude = (signed: boolean) => {
		const env = mac({ apps: [ 'Claude' ], dirs: [ CLAUDE ], signed, files: { ...FORWARDER_FILES, [`${MCP_DIR}/Anytype.mcpb`]: signed ? 'release-zip' : 'dev-zip' } });

		env.listProcesses = async () => [];
		return env;
	};
	const bundle = (over: Record<string, any> = {}) => applyParam({ appId: 'claude-desktop', route: 'stdio', method: 'package', tier: 'full', recommendedTier: 'full', name: 'Claude Desktop', ...over });

	test('D1-20: release then dev build on one profile — the release record is `conflict` in the dev build, nothing rewritten; two bundle copies with different names', async () => {
		const release = claude(true);

		expect(await service(release).apply(bundle())).toMatchObject({ ok: true, connection: { ns: 'release' } });

		const shared = release.readText(REGISTRY);
		const dev = claude(false);

		restore(dev, REGISTRY, shared);
		// The release build's copy is in the same folder
		dev.mkdir('/Users/me/.anytype', 0o700);
		dev.mkdir('/Users/me/.anytype/ai-connect', 0o700);
		for (const [ f, text ] of Object.entries(release.files()).filter(([ f ]) => f.startsWith('/Users/me/.anytype/ai-connect/Anytype'))) {
			restore(dev, f, text);
		};

		const svc = service(dev);
		const res: any = await check(svc, keysOf([ 'hash-a1' ]));

		expect(res.connections).toMatchObject([ { id: 'claude-desktop', ns: 'release', status: 'conflict', removed: false, revokePending: [] } ]);
		expect(dev.readText(REGISTRY)).toBe(shared);
		// Nothing of it can be changed from here; Forget is the only way out
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', port: 31009 })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(await svc.apply(bundle({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(await svc.retire({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1' })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(dev.readText(REGISTRY)).toBe(shared);

		// Forget: the record goes once its revocation is confirmed; then the dev build connects its own extension
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-desktop', expectedHash: 'hash-a1', forget: true })).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ 'hash-a1' ] } });
		await svc.revoked({ accountId: 'acc-a', connectionId: 'claude-desktop', hash: 'hash-a1' });
		expect(await svc.apply(bundle({ key: KEY_A, appHash: 'hash-d1' }))).toMatchObject({ ok: true, connection: { ns: 'dev' } });

		const copies = Object.keys(dev.files()).filter(f => /\/\.anytype\/ai-connect\/Anytype.*\.mcpb$/.test(f)).map(f => f.split('/').pop()).sort();

		expect(copies).toEqual([ expect.stringMatching(/^Anytype-[0-9a-f]{12}\.mcpb$/), expect.stringMatching(/^Anytype-dev-[0-9a-f]{12}\.mcpb$/) ]);
	});
});

