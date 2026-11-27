/**
 * Other app's Command setup through the real renderer-to-main flow (anytype-mcp-plan §7.2): the renderer's
 * controller and flow talk to the real main-process service on a fake Mac with the fake forwarder; heart is
 * the harness's. Only the probe is answered here (no request ever leaves the test).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { FORWARDER_FILES, mac, service, STABLE_BIN } from '../../../../electron/ts/lib/aiConnect/testKit';
import { fakeForwarderRun, type FakeEnv } from '../../../../electron/ts/lib/aiConnect/testEnv';
import type { AiConnectService } from '../../../../electron/ts/lib/aiConnect';
import { AiConnectController, type AiConnectPopupData } from './controller';
import * as flow from './flow';
import { GRANT, installHarness, READ_ONE, SENTINEL, until, type Harness } from './testHarness';

let h: Harness;
let env: FakeEnv;
let svc: AiConnectService;
let ui: { close: () => void; toast: (msg: any) => void };
const sent: { cmd: string; param: any }[] = [];
const live: AiConnectController[] = [];

const METHODS: Record<string, string> = {
	aiConnectList: 'list', aiConnectPlan: 'plan', aiConnectApply: 'apply', aiConnectRecordManual: 'recordManual', aiConnectUpdate: 'update', aiConnectRemove: 'remove',
	aiConnectRevoked: 'revoked', aiConnectCheck: 'check', aiConnectStepDone: 'stepDone', aiConnectOrphan: 'orphan', aiConnectMintIntent: 'mintIntent',
};

const snippetOf = (steps: any[]) => JSON.parse(steps.find(s => s.snippet).snippet);
const item = (id: string) => env.forwarder.items.get(id);
const input = (over: Partial<flow.ManualInput> = {}): flow.ManualInput => ({
	appId: 'other', route: 'stdio', method: 'command', tier: 'large', recommendedTier: 'full', grant: GRANT, name: 'My agent', expireAt: 0, ...over,
});

const open = async (data: AiConnectPopupData, name = 'Other app'): Promise<AiConnectController> => {
	await flow.load();

	const ctrl = new AiConnectController(data, ui, name);

	live.push(ctrl);
	ctrl.init();
	await until(() => !ctrl.get().planLoading && !ctrl.get().manual.loading);
	return ctrl;
};

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

describe('Other app: the Command setup, renderer to main', () => {
	test('two Command connections: each gets its own id, key and setup text; the key appears in no result, step or file', async () => {
		const a: any = await flow.createManual(input());
		const b: any = await flow.createManual(input({ name: 'Another agent' }));

		expect(a.kind).toBe('ok');
		expect(b.kind).toBe('ok');

		const idA = a.connection.id;
		const idB = b.connection.id;

		expect(idA).toMatch(/^other-[0-9a-f]{8}$/);
		expect(idB).toMatch(/^other-[0-9a-f]{8}$/);
		expect(idA).not.toBe(idB);
		// The steps the view keeps (it used to drop them): the setup text of exactly this connection
		expect(snippetOf(a.plan.steps)).toEqual({ mcpServers: { anytype: { command: STABLE_BIN, args: [ 'serve', '--connection', idA ] } } });
		expect(snippetOf(b.plan.steps).mcpServers.anytype.args).toEqual([ 'serve', '--connection', idB ]);
		expect(a.connection).toMatchObject({ method: 'command', route: 'stdio', appId: 'other', name: 'My agent' });

		// Each key went to `key set` on stdin, under the account that minted it
		expect(item(idA)).toMatchObject({ key: h.heart.rows.get('hash-1').apiKey, account: 'acc-1', port: 31009, tier: 'large' });
		expect(item(idB)).toMatchObject({ key: h.heart.rows.get('hash-2').apiKey, account: 'acc-1' });
		expect(JSON.stringify([ a, b ])).not.toContain(SENTINEL);
		expect(JSON.stringify(env.files())).not.toContain(SENTINEL);
		expect(env.calls.filter(c => JSON.stringify([ c.args, c.opts.env || {} ]).includes(SENTINEL))).toEqual([]);

		// The mint intents were saved before each CreateApp and cleared by the commits
		const cmds = sent.map(it => it.cmd);

		expect(cmds.indexOf('aiConnectMintIntent')).toBeLessThan(cmds.indexOf('aiConnectApply'));
		expect(sent.filter(it => it.cmd == 'aiConnectApply').map(it => it.param.method)).toEqual([ 'command', 'command' ]);
		expect(((await svc.list({ accountId: 'acc-1' })) as any).connections.map((c: any) => c.id).sort()).toEqual([ idA, idB ].sort());
		expect(JSON.parse(env.readText('/Users/me/Library/Application Support/anytype/aiConnect.json')).mintIntents).toBeUndefined();
	});

	test('reconnect, a port change and disconnect touch only the chosen connection; the old key is revoked only after the new one is stored', async () => {
		const a: any = await flow.createManual(input());

		await flow.releasePendingKey();

		const b: any = await flow.createManual(input({ name: 'Another agent' }));

		await flow.releasePendingKey();

		const idA = a.connection.id;
		const idB = b.connection.id;
		const keyB = h.heart.rows.get('hash-2').apiKey;

		await flow.load();

		// Reconnect A (from Manage): a new key into A's item, by its own id; the setup text in the app stays valid
		const shown: any = await flow.plan({ appId: 'other', route: 'stdio', tier: 'large', connectionId: idA, method: 'command' });
		const again: any = await flow.reconnect(S.AiConnect.getById(idA), { plan: shown.plan });

		expect(again.kind).toBe('ok');
		expect(again.connection).toMatchObject({ id: idA, appHash: 'hash-3', revokePending: [] });
		expect(sent.filter(it => it.cmd == 'aiConnectApply').pop().param).toMatchObject({ method: 'command', connectionId: idA, expectedHash: 'hash-1' });
		expect(item(idA)).toMatchObject({ key: h.heart.rows.get('hash-3').apiKey, rev: 2 });
		expect(h.heart.rows.has('hash-1')).toBe(false);
		expect(h.heart.state.order.filter(it => /CreateApp|RevokeApp/.test(it)).slice(-2)).toEqual([ 'CreateApp', 'RevokeApp:hash-1' ]);
		expect(item(idB)).toEqual({ key: keyB, account: 'acc-1', port: 31009, tier: 'large', rev: 1 });
		await flow.releasePendingKey();

		// The API moves: one check retargets both items; no key is minted or revoked for it
		const creates = h.heart.state.creates;
		const revokes = h.heart.state.revokes.length;

		h.listening(true, 31020);
		await flow.check('port');
		expect(item(idA)).toMatchObject({ port: 31020, rev: 3 });
		expect(item(idB)).toMatchObject({ key: keyB, port: 31020, rev: 2 });
		expect(h.heart.state.creates).toBe(creates);
		expect(h.heart.state.revokes).toHaveLength(revokes);

		// A tool set change on B, in place
		expect(await flow.updateTier(S.AiConnect.getById(idB), 'full')).toMatchObject({ ok: true, connection: { tier: 'full' } });
		expect(item(idB)).toMatchObject({ key: keyB, tier: 'full', rev: 3 });
		expect(item(idA)).toMatchObject({ tier: 'large', rev: 3 });

		// Disconnect A: its item goes and its key is revoked; B is as it was
		await flow.disconnect(S.AiConnect.getById(idA));
		expect(item(idA)).toBeUndefined();
		expect(h.heart.rows.has('hash-3')).toBe(false);
		expect(S.AiConnect.getById(idA)).toBeFalsy();
		expect(item(idB)).toMatchObject({ key: keyB, tier: 'full', rev: 3 });
		expect(h.heart.rows.has('hash-2')).toBe(true);
		expect(S.AiConnect.getById(idB)).toMatchObject({ status: 'ok' });
	});

	test('the sheet: URL and key first, Command second; choosing mints nothing; Create key stores the key and shows the setup text', async () => {
		const ctrl = await open({ appId: 'other', view: 'manual' });

		expect(ctrl.get().manual).toMatchObject({ mode: 'create', setup: 'url', setups: [ 'url', 'command' ] });
		expect(ctrl.get().manual.steps[0].textKey).toBe('aiConnectManualFormatMost');

		await ctrl.setSetup('command');
		expect(ctrl.get().manual).toMatchObject({ mode: 'create', setup: 'command', key: '' });
		expect(ctrl.get().manual.steps.map(s => s.textKey)).toEqual([ 'aiConnectManualCommandPrepare' ]);
		expect(h.heart.state.creates).toBe(0);

		// Back and forth is free
		await ctrl.setSetup('url');
		expect(ctrl.get().manual.steps[0].textKey).toBe('aiConnectManualFormatMost');
		await ctrl.setSetup('command');

		ctrl.setForm({ name: 'My agent', grant: { ...GRANT } });
		await ctrl.createKey();
		await until(() => !ctrl.get().busy);

		const m = ctrl.get().manual;
		const id = ctrl.get().connectionId;

		expect(h.heart.state.creates).toBe(1);
		expect(m).toMatchObject({ mode: 'done', key: '', notice: { key: 'aiConnectManualCommandCreated' } });
		expect(id).toMatch(/^other-[0-9a-f]{8}$/);
		expect(snippetOf(m.steps)).toEqual({ mcpServers: { anytype: { command: STABLE_BIN, args: [ 'serve', '--connection', id ] } } });
		// The view never holds or shows this key
		expect(JSON.stringify(ctrl.get())).not.toContain(SENTINEL);
		expect(item(id).key).toBe(h.heart.rows.get('hash-1').apiKey);
		// The choice is closed once the connection exists
		await ctrl.setSetup('url');
		expect(ctrl.get().manual.setup).toBe('command');
	});

	test('Manage rebuilds the setup text from the record; "Set up manually" shows it without a key or a new mint', async () => {
		const made: any = await flow.createManual(input());
		const id = made.connection.id;

		await flow.releasePendingKey();

		const ctrl = await open({ appId: 'other', connectionId: id, view: 'manage' });

		await until(() => !!ctrl.get().plan);
		expect(snippetOf(ctrl.get().plan.steps).mcpServers.anytype.args).toEqual([ 'serve', '--connection', id ]);

		await ctrl.enterManual('done', S.AiConnect.getById(id));
		await until(() => !ctrl.get().manual.loading);
		expect(ctrl.get().manual).toMatchObject({ mode: 'done', key: '', setup: 'command' });
		expect(snippetOf(ctrl.get().manual.steps).mcpServers.anytype).toEqual({ command: STABLE_BIN, args: [ 'serve', '--connection', id ] });
		expect(h.heart.state.creates).toBe(1);
		expect(JSON.stringify(ctrl.get())).not.toContain(SENTINEL);
	});

	test('Q16: a Create key whose receipt was lost waits for the check — no second mint, no second record; the promoted connection shows its own setup text', async () => {
		let lose = true;

		env = mac({ files: { ...FORWARDER_FILES }, forwarder: (call, state) => {
			if (lose && (call.args[1] == 'set')) {
				fakeForwarderRun(state, call);
				return { code: 1, stdout: JSON.stringify({ ok: false, unconfirmed: true, reason: 'lost' }) + '\n' };
			};
			return null;
		} });
		svc = service(env);
		flow.flowConfig.pollTimeout = 0;

		const ctrl = await open({ appId: 'other', view: 'manual' });

		await ctrl.setSetup('command');
		ctrl.setForm({ name: 'My agent', grant: { ...GRANT } });
		await ctrl.createKey();
		await until(() => !ctrl.get().busy && (ctrl.get().manual.mode == 'waiting') && ctrl.get().pollStopped);

		const id = ctrl.get().connectionId;

		expect(id).toMatch(/^other-[0-9a-f]{8}$/);
		expect(item(id).key).toBe(h.heart.rows.get('hash-1').apiKey);
		// No click mints again while the outcome isn't known
		await ctrl.createKey();
		await ctrl.setSetup('url');
		expect(ctrl.get().manual).toMatchObject({ mode: 'waiting', setup: 'command' });
		// (the mode offers no Create key; the controller's own entry point is the only way to one)
		expect(h.heart.state.creates).toBe(1);
		expect(h.heart.state.revokes).toEqual([]);

		// The next check promotes the candidate: the same connection, its snippet, one record, one key
		lose = false;
		flow.flowConfig.pollTimeout = 2000;
		ctrl.recheckUnconfirmed();
		await until(() => ctrl.get().manual.mode == 'done' && !ctrl.get().manual.loading);
		expect(snippetOf(ctrl.get().manual.steps).mcpServers.anytype.args).toEqual([ 'serve', '--connection', id ]);
		expect(((await svc.list({ accountId: 'acc-1' })) as any).connections.map((c: any) => [ c.id, c.appHash, !!c.unconfirmed ])).toEqual([ [ id, 'hash-1', false ] ]);
		expect(h.heart.state.creates).toBe(1);
		expect(h.heart.rows.has('hash-1')).toBe(true);
	});

	test('S2: reconnecting a Command connection whose key is gone delivers exactly the access the form shows, as Command, to the same record', async () => {
		const made: any = await flow.createManual(input());
		const id = made.connection.id;

		await flow.releasePendingKey();
		// The key expired: read-write, all spaces, no expiry is what the record still stores
		h.heart.rows.get('hash-1').expireAt = Math.floor(Date.now() / 1000) - 60;

		const ctrl = await open({ appId: 'other', connectionId: id, view: 'manage' });

		await until(() => !!ctrl.get().plan);
		ctrl.reconnect();
		await until(() => !ctrl.get().busy && (ctrl.get().view == 'connect') && !ctrl.get().planLoading);
		expect(h.heart.state.creates).toBe(1);

		// The user narrows the access on the sheet: read-only, one space, 30 days
		ctrl.setForm({ grant: { ...READ_ONE }, days: 30, fixedExpireAt: undefined });
		ctrl.submit();
		await until(() => !ctrl.get().busy && (h.heart.state.creates == 2));
		await until(() => !ctrl.get().busy);

		const now = Math.floor(Date.now() / 1000);
		const row = h.heart.rows.get('hash-2');

		// Exactly one CreateApp, with the grant and the expiry shown
		expect(h.heart.state.creates).toBe(2);
		expect(row.grant).toEqual(READ_ONE);
		expect(Math.abs(row.expireAt - (now + 30 * 86400))).toBeLessThan(120);

		const applies = sent.filter(it => it.cmd == 'aiConnectApply');

		expect(applies).toHaveLength(2);
		expect(applies[1].param).toMatchObject({ method: 'command', connectionId: id, expectedHash: 'hash-1', appHash: 'hash-2', grant: READ_ONE, expireAt: row.expireAt });
		// Never the URL setup: no key shown, no manual record
		expect(sent.filter(it => it.cmd == 'aiConnectRecordManual')).toEqual([]);
		expect(ctrl.get().view).not.toBe('manual');
		expect(ctrl.get().manual.key).toBe('');
		expect(JSON.stringify(ctrl.get())).not.toContain(SENTINEL);
		expect(item(id).key).toBe(row.apiKey);

		const list: any = await svc.list({ accountId: 'acc-1' });

		expect(list.connections.filter((c: any) => !c.removed).map((c: any) => [ c.id, c.appHash, c.method ])).toEqual([ [ id, 'hash-2', 'command' ] ]);
		expect(list.connections[0]).toMatchObject({ grant: READ_ONE, expireAt: row.expireAt });
	});

	test('S13: Manage shows the restart line after a Command tier change', async () => {
		const made: any = await flow.createManual(input());
		const id = made.connection.id;

		await flow.releasePendingKey();

		const ctrl = await open({ appId: 'other', connectionId: id, view: 'manage' });

		await until(() => !!ctrl.get().plan);
		expect(ctrl.get().plan.instructions).toMatchObject({ restart: 'aiConnectManualCommandRestart' });

		await ctrl.saveTier('full');
		expect(item(id)).toMatchObject({ tier: 'full', rev: 2 });
		expect(S.AiConnect.getById(id)).toMatchObject({ tier: 'full', nextStep: 'restart' });
		expect(ctrl.get().manageNotice).toMatchObject({ key: 'aiConnectManualCommandRestart' });
	});

	test('not offered where the build ships no forwarder: the sheet has the URL setup only', async () => {
		env = mac({});
		svc = service(env);

		const ctrl = await open({ appId: 'other', view: 'manual' });

		expect(ctrl.get().manual.setups).toEqual([ 'url' ]);
		await ctrl.setSetup('command');
		expect(ctrl.get().manual.setup).toBe('url');
	});
});
