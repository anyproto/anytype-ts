/**
 * Other app's two manual setups (URL and key, Command) through the real renderer-to-main flow (tokens-plan §3.2):
 * the renderer's flow talks to the real main-process service on a fake Mac with the fake forwarder; heart is the
 * harness's. Only the probe is answered here (no request ever leaves the test).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() }, clipboard: { readText: vi.fn(), writeText: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { FORWARDER_FILES, mac, REGISTRY, service, STABLE_BIN } from '../../../../electron/ts/lib/aiConnect/testKit';
import type { FakeEnv } from '../../../../electron/ts/lib/aiConnect/testEnv';
import type { AiConnectService } from '../../../../electron/ts/lib/aiConnect';
import type { AiConnectController } from './controller';
import * as flow from './flow';
import { GRANT, installHarness, SENTINEL, type Harness } from './testHarness';

let h: Harness;
let env: FakeEnv;
let svc: AiConnectService;
let ui: { close: () => void; toast: (msg: any) => void };
const sent: { cmd: string; param: any }[] = [];
const live: AiConnectController[] = [];

const METHODS: Record<string, string> = {
	aiConnectList: 'list', aiConnectPlan: 'plan', aiConnectApply: 'apply', aiConnectRecordManual: 'recordManual', aiConnectUpdate: 'update', aiConnectRemove: 'remove',
	aiConnectRevoked: 'revoked', aiConnectCheck: 'check', aiConnectStepDone: 'stepDone', aiConnectOrphan: 'orphan', aiConnectMintIntent: 'mintIntent',
	aiConnectCopySecret: 'copySecret', aiConnectRetire: 'retire',
};

const snippetOf = (steps: any[]) => JSON.parse(steps.find(s => s.snippet).snippet);
const input = (over: Partial<flow.ManualInput> = {}): flow.ManualInput => ({
	appId: 'other', route: 'stdio', method: 'command', setup: 'command', tier: 'large', recommendedTier: 'full', grant: GRANT, name: 'My agent', expireAt: 0, ...over,
});
const urlInput = (over: Partial<flow.ManualInput> = {}) => input({ route: 'http', method: undefined, setup: 'url', name: 'URL agent', ...over });
/** The rows as main lists them */
const rows = async (): Promise<any[]> => ((await svc.list({ accountId: 'acc-1' })) as any).connections;

beforeEach(() => {
	h = installHarness();
	ui = { close: vi.fn(), toast: vi.fn() };
	env = mac({ files: { ...FORWARDER_FILES } });
	svc = service(env);
	sent.length = 0;
	// The real main; the probe alone is answered here, so nothing is ever sent to a port
	vi.stubGlobal('Renderer', {
		send: async (cmd: string, param: any) => {
			sent.push({ cmd, param });
			if (cmd == 'aiConnectProbe') {
				return { ok: true };
			};
			return METHODS[cmd] ? (svc as any)[METHODS[cmd]](param) : null;
		},
	});
});

afterEach(async () => {
	for (const c of live.splice(0)) {
		await c.dispose();
	};
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	(window as any).Electron = {};
	flow.resetFlowForTests();
});

describe('D1-21: Other app\'s manual setups, renderer to main', () => {
	test('D1-21: one Other URL row and two Other Command rows — check, Retry, reconnect and disconnect each kind; restart: every row stays `manual` with its `setup`, never stale or notInstalled, the other rows untouched', async () => {
		const url: any = await flow.createManual(urlInput());

		await flow.releasePendingKey();

		const a: any = await flow.createManual(input({ name: 'Agent A' }));

		await flow.releasePendingKey();

		const b: any = await flow.createManual(input({ name: 'Agent B' }));

		await flow.releasePendingKey();

		for (const it of [ url, a, b ]) {
			expect(it.kind).toBe('ok');
		};
		expect(url.connection).toMatchObject({ method: 'manual', setup: 'url', route: 'http' });
		expect(a.connection).toMatchObject({ method: 'manual', setup: 'command', route: 'stdio' });
		expect(b.connection).toMatchObject({ method: 'manual', setup: 'command', route: 'stdio' });
		expect(new Set([ url.connection.id, a.connection.id, b.connection.id ]).size).toBe(3);
		// The Command snippet: the stable copy, the key placeholder in `env` (the screen masks it; Copy fills it in main's clipboard)
		expect(snippetOf(a.plan.steps).mcpServers.anytype).toEqual({ command: STABLE_BIN, args: [ 'serve', '--tier', 'large' ], env: { ANYTYPE_API_KEY: '<KEY>' } });
		// Each kind is recorded by aiConnectRecordManual, never aiConnectApply
		expect(sent.filter(it => it.cmd == 'aiConnectApply')).toEqual([]);
		expect(sent.filter(it => it.cmd == 'aiConnectRecordManual').map(it => it.param.setup)).toEqual([ undefined, 'command', 'command' ]);

		const ids = { url: url.connection.id, a: a.connection.id, b: b.connection.id };
		const byId = async () => Object.fromEntries((await rows()).map(c => [ c.id, c ]));
		const steady = (c: any) => {
			expect(c.method).toBe('manual');
			expect([ 'stale', 'notInstalled' ]).not.toContain(c.status);
		};

		// check (twice: a heal pass would show on the second), and Retry of each
		await flow.check('test');
		await flow.check('test');
		for (const c of await rows()) {
			steady(c);
			expect(c.status).toBe('ok');
			expect((await flow.retryProbe(S.AiConnect.getById(c.id))).ok).toBe(true);
		};

		// Reconnect each kind by its id: the old key goes only after the new one is recorded; the other rows don't move
		const before = await byId();

		for (const [ id, over ] of [ [ ids.url, urlInput({ name: 'URL agent' }) ], [ ids.a, input({ name: 'Agent A' }) ] ] as const) {
			const existing = S.AiConnect.getById(id);
			const shown: any = await flow.plan({ appId: 'other', route: over.route, tier: 'large', method: over.method, connectionId: id });
			const pending: any = await flow.createManual({ ...over, existing, connectionId: id, shown: shown.plan, port: shown.port });

			expect(pending.kind, id).toBe('pending');

			const done: any = await flow.confirmManual({ ...over, existing, connectionId: id, shown: shown.plan, port: shown.port });

			expect(done, id).toMatchObject({ ok: true, connection: { id, method: 'manual', setup: over.setup } });
			expect(done.connection.appHash).not.toBe(existing.appHash);
			expect(h.heart.rows.has(existing.appHash)).toBe(false);
			await flow.releasePendingKey();
		};

		const after = await byId();

		expect(after[ids.b]).toMatchObject({ appHash: before[ids.b].appHash, setup: 'command', name: 'Agent B' });
		expect(snippetOf(((await flow.plan({ appId: 'other', route: 'stdio', tier: 'large', method: 'command', connectionId: ids.b })) as any).plan.steps)).toEqual(snippetOf(a.plan.steps));

		// Restart: a new main on the same registry
		svc = service(env);
		await flow.load();
		await flow.check('restart');
		for (const c of await rows()) {
			steady(c);
		};
		expect((await rows()).map(c => [ c.id, c.setup || 'url' ]).sort()).toEqual([ [ ids.url, 'url' ], [ ids.a, 'command' ], [ ids.b, 'command' ] ].sort());

		// Disconnect each kind: its key revoked, the remaining row unchanged
		for (const id of [ ids.url, ids.a ]) {
			const hash = S.AiConnect.getById(id).appHash;

			await flow.disconnect(S.AiConnect.getById(id));
			expect(h.heart.rows.has(hash), id).toBe(false);
		};
		expect((await rows()).map(c => [ c.id, c.appHash ])).toEqual([ [ ids.b, before[ids.b].appHash ] ]);

		// No key in any result, file, or child of main
		expect(JSON.stringify([ url, a, b ])).not.toContain(SENTINEL);
		expect(JSON.stringify(env.files())).not.toContain(SENTINEL);
		expect(env.readText(REGISTRY)).not.toContain(SENTINEL);
		expect(env.calls.filter(c => JSON.stringify([ c.args, c.opts.env || {} ]).includes(SENTINEL))).toEqual([]);
	});

	test('not offered where the build ships no forwarder: the plan has the URL setup only', async () => {
		env = mac({});
		svc = service(env);

		const res: any = await flow.plan({ appId: 'other', route: 'http', tier: 'large' });

		expect(res.plan.setups).toEqual([ 'url' ]);
	});
});
