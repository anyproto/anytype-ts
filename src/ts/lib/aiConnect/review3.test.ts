/**
 * Phase 3 review round 3 (X1–X8): regressions at the popup-to-flow boundary. Where a finding names an adapter,
 * the plan comes from the real main-process service on a fake Mac (LM Studio and Copilot homes, Claude
 * Desktop's manual fallback).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import fs from 'fs';
import path from 'path';
import { KEY_A, mac, MCP_DIR, planParam, service, FORWARDER_FILES } from '../../../../electron/ts/lib/aiConnect/testKit';
import type { FakeEnv } from '../../../../electron/ts/lib/aiConnect/testEnv';
import { AiConnectController, type AiConnectPopupData } from './controller';
import * as flow from './flow';
import { closeTabSession } from './session';
import { isValidLinkGrant } from '../linkApprovalGrant';
import { BASE_PLAN, GRANT, installHarness, READ_ONE, record, SENTINEL, until, type Harness } from './testHarness';

let h: Harness;
let ui: { close: () => void; toast: (msg: any) => void };
const live: AiConnectController[] = [];

const FUTURE = Math.floor(Date.now() / 1000) + 30 * 86400;
/** The label of Claude Desktop's item in the connector's store (never a file Anytype reads or writes itself) */
const CLAUDE_DIR = '/Users/me/Library/Application Support/Claude';
const CC_DET = { appId: 'claude-code', installed: true, targetId: 'claude-code', targetPaths: [ '/Users/me/.claude.json' ], canRestart: false } as any;

const input = (over: Partial<flow.ConnectInput> = {}): flow.ConnectInput => ({
	appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', grant: GRANT, name: 'Cursor', expireAt: 0, ...over,
});

/** The real adapter's plan on a fake Mac, as main sends it (without `ok`) */
const realPlan = async (env: FakeEnv, param: Record<string, any>): Promise<any> => {
	const res: any = await service(env).plan(planParam(param));
	const ret = { ...res };

	expect(res.ok).toBe(true);
	delete ret.ok;
	return ret;
};

const tick = () => new Promise(r => setTimeout(r, 0));

const open = async (data: AiConnectPopupData, name = 'Cursor', pristine = false): Promise<AiConnectController> => {
	await flow.load();

	const ctrl = new AiConnectController(data, ui, name);

	live.push(ctrl);
	ctrl.init();
	await until(() => !ctrl.get().planLoading && !ctrl.get().manual.loading);
	// A new connection starts with no spaces chosen: tests choose All spaces explicitly, as a user would
	if (!pristine && !isValidLinkGrant(ctrl.get().form.grant)) {
		ctrl.setForm({ grant: { ...GRANT } });
	};
	return ctrl;
};

const manage = async (id = 'cursor', appId = 'cursor', name = 'Cursor'): Promise<AiConnectController> => {
	const ctrl = await open({ appId: appId as any, connectionId: id, view: 'manage' }, name);

	await until(() => !!ctrl.get().access && !!ctrl.get().plan);
	return ctrl;
};

const settled = async (ctrl: AiConnectController) => {
	await until(() => !ctrl.get().busy);
	await tick();
};

beforeEach(() => {
	h = installHarness();
	ui = { close: vi.fn(), toast: vi.fn() };
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

describe('X1: no older key behind an edited form', () => {
	test('X1: back on the sheet after write/changed, access and expiry narrowed, then Set up manually: the earlier key is released, never shown; Create key mints the edited values', async () => {
		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'changed' } });

		const ctrl = await open({ appId: 'cursor' });

		ctrl.submit();
		await settled(ctrl);
		expect(ctrl.get().view).toBe('connect');
		expect(flow.heldKey()).toMatchObject({ appHash: 'hash-1', committed: false });

		ctrl.setForm({ grant: READ_ONE, days: 7 });
		await ctrl.enterManual('create');
		await until(() => !ctrl.get().manual.loading);
		expect(ctrl.get().manual).toMatchObject({ mode: 'create', keyHash: '' });
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);

		await ctrl.createKey();

		const row = h.heart.rows.get('hash-2');

		expect(row.grant).toEqual(READ_ONE);
		expect(row.expireAt).toBeGreaterThan(Math.floor(Date.now() / 1000) + 6 * 86400);

		await ctrl.confirmManual();
		expect(h.calls('aiConnectRecordManual')[0].param).toMatchObject({ appHash: 'hash-2', grant: READ_ONE, expireAt: row.expireAt });
	});

	test('X1: the same values: the pending key is shown as it is (no second key)', async () => {
		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'changed' } });

		const ctrl = await open({ appId: 'cursor' });

		ctrl.submit();
		await settled(ctrl);
		await ctrl.enterManual('create');
		await until(() => !ctrl.get().manual.loading);
		expect(ctrl.get().manual).toMatchObject({ mode: 'confirm', keyHash: 'hash-1' });
		expect(h.heart.state.creates).toBe(1);
		expect(h.heart.state.revokes).toEqual([]);
	});
});

describe('X2: manual reconnect keeps the old key\'s access, read fresh', () => {
	test('X2: the old key narrowed while the plan was loading: shown, nothing minted', async () => {
		h.heart.add('hash-old', GRANT, 0);
		h.existing({ method: 'manual', keyFp: '', targetPath: '' });

		const ctrl = await manage();
		const plan = h.main.holdNext('aiConnectPlan');
		const run = ctrl.reconnect();

		await until(() => !!h.main.m.hold.aiConnectPlan === false);
		h.heart.rows.get('hash-old').grant = READ_ONE;
		plan.resolve();
		await run;
		await until(() => (ctrl.get().view == 'manual') && !ctrl.get().manual.loading);
		expect(h.heart.state.creates).toBe(0);
		expect(ctrl.get().form.grant).toEqual(READ_ONE);
		expect(ctrl.get().manual).toMatchObject({ mode: 'create', keyHash: '', notice: { key: 'aiConnectManualGrantChanged' } });
	});
});

describe('X3: a moved file with the same target id is still a move', () => {
	test('X3: LM Studio\'s home moved (real plans): Reconnect shows the new place first; only its approval writes there', async () => {
		const moved = await realPlan(mac({ apps: [ 'LM Studio' ], dirs: [ '/Users/me/.lmstudio', '/Users/me/lm-new' ], files: { '/Users/me/.lmstudio-home-pointer': '/Users/me/lm-new\n' } }), { appId: 'lmstudio', tier: 'small' });

		expect(moved).toMatchObject({ targetId: 'lmstudio', method: 'config', targetPath: '/Users/me/lm-new/mcp.json' });
		h.main.m.detections = [ { appId: 'lmstudio', installed: true, targetId: 'lmstudio', targetPaths: [ moved.targetPath ], canRestart: false } ];
		h.main.m.plans.lmstudio = moved;
		h.heart.add('hash-old', GRANT, 0, 'LM Studio');
		h.existing({ id: 'lmstudio', appId: 'lmstudio', name: 'LM Studio', method: 'config', targetPath: '/Users/me/.lmstudio/mcp.json' });

		const ctrl = await manage('lmstudio', 'lmstudio', 'LM Studio');

		await ctrl.reconnect();
		await settled(ctrl);
		expect(ctrl.get()).toMatchObject({ view: 'connect', movedTo: '~/lm-new/mcp.json' });
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectApply')).toHaveLength(0);

		ctrl.submit();
		await settled(ctrl);
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ previewTarget: '/Users/me/lm-new/mcp.json', expectedHash: 'hash-old' });
	});

	test('X3: Copilot\'s home moved after Manage showed the old file (real plans): no key, no write, the new place on the sheet', async () => {
		const before = await realPlan(mac({ apps: [ 'Visual Studio Code' ] }), { appId: 'vscode' });
		const after = await realPlan(mac({ apps: [ 'Visual Studio Code' ], shell: { COPILOT_HOME: '/Users/me/cp-new' }, dirs: [ '/Users/me/cp-new' ] }), { appId: 'vscode' });

		expect([ before.targetId, after.targetId ]).toEqual([ 'copilot', 'copilot' ]);
		h.main.m.detections = [ { appId: 'vscode', installed: true, targetId: 'copilot', targetPaths: [ before.targetPath ], canRestart: false } ];
		h.main.m.plans.vscode = before;
		h.heart.add('hash-old', GRANT, 0, 'VS Code');
		h.existing({ id: 'copilot', appId: 'vscode', name: 'VS Code', method: 'config', targetPath: before.targetPath });

		const ctrl = await manage('copilot', 'vscode', 'VS Code + GitHub Copilot');

		h.main.m.detections = [ { appId: 'vscode', installed: true, targetId: 'copilot', targetPaths: [ after.targetPath ], canRestart: false } ];
		h.main.m.plans.vscode = after;
		await ctrl.reconnect();
		await settled(ctrl);
		expect(ctrl.get().view).toBe('connect');
		expect(ctrl.get().plan.targetPath).toBe('/Users/me/cp-new/mcp-config.json');
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectApply')).toHaveLength(0);

		// The flow on its own: a reconnect that shows no plan never writes to the moved file
		await flow.releasePendingKey();
		expect(await flow.reconnect(h.store.getById('copilot'))).toMatchObject({ kind: 'plan', reason: 'moved', plan: { targetPath: after.targetPath } });
		expect(h.heart.state.creates).toBe(0);
	});
});

describe('X4: key-bearing snippets need a live listener', () => {
	test('X4: the API failed on its port: Manage ▸ Set up manually withholds the key; "I\'ve updated" is refused until it listens there again', async () => {
		const ctrl = await open({ appId: 'cursor', view: 'manual' });

		await ctrl.createKey();
		expect(ctrl.get().manual.mode).toBe('confirm');
		expect(ctrl.keyLive()).toBe(true);

		// Another process holds the port: the API status failed, the configured port unchanged
		h.auth.jsonApiStatus = { success: false, listenAddr: '', error: 'address in use' };
		expect(flow.apiState()).toBe('failed');
		expect(flow.previewPort()).toBe(31009);
		expect(ctrl.keyLive()).toBe(false);
		await ctrl.confirmManual();
		expect(h.calls('aiConnectRecordManual')).toHaveLength(0);
		expect(await flow.confirmManual({ ...input(), port: 31009 })).toMatchObject({ ok: false, reason: 'changed' });

		// Listening again on that port: the key may go out
		h.listening(true, 31009);
		expect(ctrl.keyLive()).toBe(true);
		await ctrl.confirmManual();
		expect(h.calls('aiConnectRecordManual')).toHaveLength(1);
	});

	test('X4: Manage ▸ Set up manually while the API failed: the record\'s key is not live for the configured port', async () => {
		h.heart.add('hash-old');
		h.existing();
		h.auth.jsonApiStatus = { success: false, listenAddr: '', error: 'address in use' };

		const m = await open({ appId: 'cursor', connectionId: 'cursor', view: 'manage' });

		await m.enterManual('done', m.connection());
		await until(() => !m.get().manual.loading);
		expect(m.get().manual.planPort).toBe(31009);
		expect(m.keyLive()).toBe(false);
		expect(m.portCurrent()).toBe(false);
	});
});

describe('X5: tab close releases the pending key', () => {
	test('X5: the close-session handler revokes the undelivered key before it closes the session; bounded; a committed key stays', async () => {
		// What heart had revoked when the session closed
		const atClose: string[][] = [];
		const closeSession = vi.fn((cb: () => void) => {
			atClose.push(h.heart.state.revokes.slice());
			cb();
		});
		const sendIpc = vi.fn();

		vi.stubGlobal('U', { Data: { closeSession } });
		vi.stubGlobal('Renderer', { send: h.main.send, sendIpc });

		expect((await flow.createManual({ ...input() })).kind).toBe('pending');
		await closeTabSession('tab-2', 'tab-1');
		expect(atClose).toEqual([ [ 'hash-1' ] ]);
		expect(sendIpc).toHaveBeenCalledWith('tab-session-closed', 'tab-2');

		// A revoke that never answers: the tab still closes after the bound
		flow.flowConfig.closeTimeout = 20;
		flow.flowConfig.rpcTimeout = 60;
		expect((await flow.createManual({ ...input() })).kind).toBe('pending');
		h.heart.state.revokeHold = () => {};
		await closeTabSession('', 'tab-1');
		expect(closeSession).toHaveBeenCalledTimes(2);
		expect(sendIpc).toHaveBeenLastCalledWith('tab-session-closed', 'tab-1');
		await new Promise(r => setTimeout(r, 100));

		// Delivered (recorded) already: kept
		flow.flowConfig.rpcTimeout = 30000;
		h.heart.state.revokeHold = null;
		expect((await flow.createManual({ ...input({ appId: 'other', name: 'Zed' }) })).kind).toBe('ok');

		const revokes = h.heart.state.revokes.length;

		await closeTabSession('tab-3', 'tab-1');
		expect(h.heart.state.revokes.length).toBe(revokes);
	});
});

describe('X6: a key that isn\'t listed yet is not forgotten', () => {
	test('X6: an unidentified key survives lookups that miss it, keeps the hint, and is revoked once listed', async () => {
		h.heart.state.hideNewFor = 7;
		expect(await flow.connect(input())).toMatchObject({ kind: 'error', error: { category: 'keyNotFound' } });
		expect(flow.cleanupFailed()).toBe(true);

		await flow.check('test');
		expect(flow.cleanupFailed()).toBe(true);
		await flow.check('test');
		expect(flow.cleanupFailed()).toBe(true);
		expect(h.heart.state.revokes).toEqual([]);

		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
		expect(flow.cleanupFailed()).toBe(false);
		expect(h.store.cleanupFailed).toBe(false);
	});

	test('X6: missing from 5 successful lists of its account (revoked elsewhere): dropped, with a log line that has no key', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		h.heart.state.hideNewFor = 1000;
		await flow.connect(input());
		for (let i = 0; i < 4; i++) {
			await flow.check('test');
		};
		expect(flow.cleanupFailed()).toBe(true);

		await flow.check('test');
		expect(flow.cleanupFailed()).toBe(false);
		expect(warn).toHaveBeenCalledTimes(1);
		expect(JSON.stringify(warn.mock.calls)).not.toContain(SENTINEL);
	});
});

describe('X7: Claude Desktop\'s manual fallback can finish', () => {
	test('X7: the real adapter\'s manual plan (the forwarder shipped, no bundle) is the settings-file entry with the key placeholder in `env`; one Create key, and main records it as a Command setup', async () => {
		const env = mac({ apps: [ 'Claude' ], dirs: [ CLAUDE_DIR ], files: { ...FORWARDER_FILES } });
		const real = await realPlan(env, { appId: 'claude-desktop', route: 'stdio' });

		expect(real).toMatchObject({ method: 'manual', canApply: false, needsKey: true, error: { category: 'unsupportedPackage' } });
		expect(JSON.parse(real.steps.find((it: any) => it.snippet).snippet).mcpServers.anytype.env).toEqual({ ANYTYPE_API_KEY: '<KEY>' });
		h.main.m.plans['claude-desktop'] = real;

		const ctrl = await open({ appId: 'claude-desktop', view: 'manual' }, 'Claude Desktop');

		expect(ctrl.get().manual.mode).toBe('create');
		await ctrl.createKey();
		expect(h.heart.state.creates).toBe(1);
		expect(h.calls('aiConnectApply')).toHaveLength(0);

		// Main accepts exactly that record
		const res: any = await service(env).recordManual({ accountId: 'acc-a', appId: 'claude-desktop', route: 'stdio', tier: 'full', recommendedTier: 'full', port: 31009, appHash: 'hash-a1', name: 'Claude Desktop', grant: GRANT, expireAt: 0, expectedHash: null, setup: 'command' });

		expect(res).toMatchObject({ ok: true, connection: { method: 'manual', setup: 'command' } });
		expect(JSON.stringify(env.files())).not.toContain(KEY_A);
	});
});

describe('X8: restore and install are separate choices', () => {
	const setup = async () => {
		h.main.m.detections.push(CC_DET);
		h.heart.add('hash-old', GRANT, 0, 'Claude Code');
		h.existing({ id: 'claude-code', appId: 'claude-code', name: 'Claude Code', method: 'cli', targetPath: '/Users/me/.claude.json' });
		h.main.m.plans['claude-code'] = { ...BASE_PLAN, appId: 'claude-code', targetId: 'claude-code', method: 'cli', nextStep: 'newSession', targetPath: '/Users/me/.claude.json' };
		h.main.m.apply = () => ({ ok: false, error: { stage: 'cli', category: 'cliFailed', removedOld: true } });

		const ctrl = await manage('claude-code', 'claude-code', 'Claude Code');

		await ctrl.reconnect();
		await settled(ctrl);
		expect(ctrl.get()).toMatchObject({ phase: 'error', canManual: true });
		await ctrl.enterManual('create');
		await until(() => !ctrl.get().manual.loading && !!ctrl.get().manual.oldHash);
		expect(ctrl.get().manual).toMatchObject({ mode: 'restoreOld', oldHash: 'hash-old' });
		return ctrl;
	};

	test('X8: "I\'ve put it back" releases the replacement and keeps the old key and record', async () => {
		const ctrl = await setup();

		await ctrl.restoredOld();
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
		expect(h.calls('aiConnectRecordManual')).toHaveLength(0);
		expect(h.heart.rows.has('hash-old')).toBe(true);
		expect(h.main.m.records.get('claude-code').appHash).toBe('hash-old');
		expect(ui.toast).toHaveBeenCalledWith({ key: 'aiConnectManualRestoredToast', args: [ 'Claude Code' ] });
		expect(ui.close).toHaveBeenCalled();
	});

	test('X8: only the install-new path\'s "I\'ve updated" commits the rotation', async () => {
		const ctrl = await setup();

		await ctrl.confirmManual();
		expect(h.calls('aiConnectRecordManual')[0].param).toMatchObject({ appHash: 'hash-1', expectedHash: 'hash-old' });
		expect(h.heart.rows.has('hash-old')).toBe(false);
	});
});

// ---------------------- verification round (Y1–Y8) ---------------------- //

/** Replaces main's answer to one command (the call is still recorded) */
const answer = (cmd: string, fn: (p: any, next: () => Promise<any>) => any) => {
	const send = h.main.send.getMockImplementation();

	h.main.send.mockImplementation(async (c: string, p: any) => {
		if (c != cmd) {
			return send(c, p);
		};
		return fn(p, () => send(c, p));
	});
};

describe('Y: the verification round', () => {
	test('Y1: a tab closing while the popup\'s own release is still revoking waits for it before the session closes', async () => {
		const goneAtClose: boolean[] = [];
		let release: (() => void) | null = null;

		vi.stubGlobal('U', { Data: { closeSession: vi.fn((cb: () => void) => {
			goneAtClose.push(!h.heart.rowsOf('acc-1').has('hash-1'));
			cb();
		}) } });
		vi.stubGlobal('Renderer', { send: h.main.send, sendIpc: vi.fn() });

		expect((await flow.createManual({ ...input() })).kind).toBe('pending');
		h.heart.state.revokeHold = go => { release = go; };

		// The popup's unmount started the revoke; then the tab closes
		const disposing = flow.releasePendingKey();

		await until(() => !!release);

		const closing = closeTabSession('tab-2', 'tab-1');

		await until(() => false, 10);
		expect(goneAtClose).toEqual([]);
		release();
		await Promise.all([ closing, disposing ]);
		expect(goneAtClose).toEqual([ true ]);
	});

	test('Y2: a signed build with a damaged archive (real plan): the bundle route is never used; a forwarder that fails its hash offers no Create key, no mint, no write', async () => {
		const files = { ...FORWARDER_FILES, [`${MCP_DIR}/Anytype.mcpb`]: 'mcpb-archive-bytes' };
		const env = mac({ apps: [ 'Claude' ], dirs: [ CLAUDE_DIR ], signed: true, files });

		// The archive on disk is not the one the build's metadata describes
		env.unlink(`${MCP_DIR}/Anytype.mcpb`);
		env.writeFile(`${MCP_DIR}/Anytype.mcpb`, 'tampered', 0o644).close();

		const damaged = await realPlan(env, { appId: 'claude-desktop', route: 'stdio' });

		// The config route needs no extension, so it is still offered by hand
		expect(damaged).toMatchObject({ canApply: false, method: 'manual', needsKey: true, error: { stage: 'verify', category: 'unsupportedPackage' } });
		expect(damaged.steps.map((it: any) => it.textKey)).toEqual([ 'aiConnectManualMerge', 'aiConnectManualKeepPrivate', 'aiConnectStepRestartSelf' ]);

		// The forwarder itself replaced: nothing can be verified, so nothing is offered
		for (const f of Object.keys(FORWARDER_FILES)) {
			env.unlink(f);
			env.writeFile(f, 'replaced', 0o755).close();
		};

		const asked = env.forwarder.calls.length;
		const real = await realPlan(env, { appId: 'claude-desktop', route: 'stdio' });

		expect(real).toMatchObject({ canApply: false, steps: [], error: { stage: 'verify' } });
		expect(real.targetPath).toBeUndefined();
		h.main.m.plans['claude-desktop'] = real;

		const ctrl = await open({ appId: 'claude-desktop', view: 'manual' }, 'Claude Desktop');

		expect(ctrl.get().manual.mode).toBe('prerequisite');
		await ctrl.createKey();
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectApply')).toHaveLength(0);
		// A forwarder that isn't the build's is never run, not even to read
		expect(env.forwarder.calls).toHaveLength(asked);
	});

	test('Y3: an expiry chosen while the earlier key is being released is the one minted', async () => {
		let release: (() => void) | null = null;

		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'changed' } });

		const ctrl = await open({ appId: 'cursor' });

		ctrl.submit();
		await settled(ctrl);
		ctrl.setForm({ grant: READ_ONE });
		h.heart.state.revokeHold = go => { release = go; };

		const entering = ctrl.enterManual('create');

		await until(() => !!release);
		ctrl.setForm({ days: 7 });
		release();
		await entering;
		await until(() => !ctrl.get().manual.loading);
		await ctrl.createKey();
		expect(h.heart.rows.get('hash-2').expireAt).toBeGreaterThan(Math.floor(Date.now() / 1000) + 6 * 86400);
	});

	test('Y4: the listener fails while "I\'ve updated" re-reads the old key: nothing recorded, the replacement stays pending', async () => {
		h.heart.add('hash-old');
		h.existing({ method: 'manual', keyFp: '', targetPath: '' });

		const ctrl = await manage();

		await ctrl.reconnect();
		await until(() => (ctrl.get().manual.mode == 'confirm') && !ctrl.get().manual.loading);
		h.heart.gate.holdList = true;

		const confirming = ctrl.confirmManual();

		await until(() => !!h.heart.gate.releaseList);
		h.auth.jsonApiStatus = { success: false, listenAddr: '', error: 'address in use' };
		h.heart.gate.releaseList();
		await confirming;
		expect(h.calls('aiConnectRecordManual')).toHaveLength(0);
		expect(flow.heldKey()).toMatchObject({ appHash: 'hash-1', committed: false });
		expect(h.heart.rows.has('hash-old')).toBe(true);
		expect(ctrl.keyLive()).toBe(false);
	});

	test('Y5: continuing a failed reconnect by hand reads the old key again: narrowed → the replacement released, the access now shown', async () => {
		h.heart.add('hash-old', GRANT, 0);
		h.existing();
		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'permission' } });

		const ctrl = await manage();

		await ctrl.reconnect();
		await settled(ctrl);
		expect(ctrl.get()).toMatchObject({ phase: 'error', canManual: true });

		h.heart.rows.get('hash-old').grant = READ_ONE;
		await ctrl.enterManual('create');
		await until(() => !ctrl.get().manual.loading);
		expect(ctrl.get().manual).toMatchObject({ mode: 'create', keyHash: '', notice: { key: 'aiConnectManualGrantChanged' } });
		expect(ctrl.get().form.grant).toEqual(READ_ONE);
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
	});

	test('Y6: a destination that changed after Manage loaded is named as a move (Claude Code skill file), before any key', async () => {
		const A = '/Users/me/.claude/skills/anytype-api/SKILL.md';
		const B = '/Users/me/profile-b/skills/anytype-api/SKILL.md';
		const skill = (path: string): any => ({ ...BASE_PLAN, appId: 'claude-code', targetId: 'claude-code', route: 'skill', method: 'file', displayTarget: '', targetPath: path, nextStep: 'newSession' });

		h.main.m.detections.push(CC_DET);
		h.heart.add('hash-old', GRANT, 0, 'Claude Code');
		h.existing({ id: 'claude-code', appId: 'claude-code', name: 'Claude Code', route: 'skill', method: 'file', targetPath: A });
		h.main.m.plans['claude-code'] = skill(A);

		const ctrl = await manage('claude-code', 'claude-code', 'Claude Code');

		h.main.m.plans['claude-code'] = skill(B);
		await ctrl.reconnect();
		await settled(ctrl);
		expect(ctrl.get()).toMatchObject({ view: 'connect', movedTo: B, movedFrom: '~/x' });
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectApply')).toHaveLength(0);
		// The plan right before a mint asks main for fresh homes
		expect(h.calls('aiConnectPlan').some(it => it.param.fresh === true)).toBe(true);
	});

	test('Y6: main resolves the config homes again for a fresh plan (a COPILOT_HOME changed within the cache\'s lifetime)', async () => {
		const shell: Record<string, string> = { COPILOT_HOME: '' };
		const env = mac({ apps: [ 'Visual Studio Code' ], shell, dirs: [ '/Users/me/cp-new' ] });
		const svc = service(env);

		expect(await svc.plan(planParam({ appId: 'vscode' }))).toMatchObject({ ok: true, targetPath: '/Users/me/.copilot/mcp-config.json' });
		shell.COPILOT_HOME = '/Users/me/cp-new';
		expect(await svc.plan(planParam({ appId: 'vscode' }))).toMatchObject({ targetPath: '/Users/me/.copilot/mcp-config.json' });
		expect(await svc.plan(planParam({ appId: 'vscode', fresh: true }))).toMatchObject({ ok: true, targetPath: '/Users/me/cp-new/mcp-config.json' });
	});

	test('Y7: the same connection moving names both places and says the old key stops working', async () => {
		const moved = await realPlan(mac({ apps: [ 'LM Studio' ], dirs: [ '/Users/me/.lmstudio', '/Users/me/lm-new' ], files: { '/Users/me/.lmstudio-home-pointer': '/Users/me/lm-new\n' } }), { appId: 'lmstudio', tier: 'small' });

		h.main.m.detections = [ { appId: 'lmstudio', installed: true, targetId: 'lmstudio', targetPaths: [ moved.targetPath ], canRestart: false } ];
		h.main.m.plans.lmstudio = moved;
		h.heart.add('hash-old', GRANT, 0, 'LM Studio');
		h.existing({ id: 'lmstudio', appId: 'lmstudio', name: 'LM Studio', method: 'config', targetPath: '/Users/me/.lmstudio/mcp.json' });

		const ctrl = await manage('lmstudio', 'lmstudio', 'LM Studio');

		await ctrl.reconnect();
		await settled(ctrl);
		expect(ctrl.get()).toMatchObject({ view: 'connect', movedTo: '~/lm-new/mcp.json', movedFrom: '~/x' });
		// The sheet's text for this case: the app, the new file, the old file; the old key stops working
		const sentence = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../json/text.json'), 'utf8')).aiConnectTargetMovedSame;

		expect(sentence.split('%s')).toHaveLength(4);
		expect(sentence).toContain('stops working');
	});

	test('Y8: LM Studio\'s same-key settings-file fallback keeps its key and access through a moved-location approval', async () => {
		const moved = await realPlan(mac({ apps: [ 'LM Studio' ], dirs: [ '/Users/me/.lmstudio', '/Users/me/lm-new' ], files: { '/Users/me/.lmstudio-home-pointer': '/Users/me/lm-new\n' } }), { appId: 'lmstudio', tier: 'small', method: 'config' });

		h.main.m.detections = [ { appId: 'lmstudio', installed: true, targetId: 'lmstudio', targetPaths: [ moved.targetPath ], canRestart: false } ];
		h.main.m.plans.lmstudio = moved;
		h.heart.add('hash-lm', READ_ONE, FUTURE, 'LM work');
		h.existing({
			id: 'lmstudio', appId: 'lmstudio', appHash: 'hash-lm', name: 'LM work', tier: 'full', grant: READ_ONE, expireAt: FUTURE, method: 'deeplink',
			nextStep: 'confirmInApp', observedInstalled: false, targetPath: '/Users/me/.lmstudio/mcp.json',
		});

		const ctrl = await open({ appId: 'lmstudio', connectionId: 'lmstudio', view: 'finish' }, 'LM Studio');

		ctrl.useFileRoute();
		await settled(ctrl);
		expect(ctrl.get()).toMatchObject({
			view: 'connect', formLocked: true, movedTo: '~/lm-new/mcp.json', movedFrom: '', form: { grant: READ_ONE, fixedExpireAt: FUTURE, name: 'LM work', tier: 'full' },
		});

		ctrl.submit();
		await settled(ctrl);
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({
			appHash: 'hash-lm', expectedHash: 'hash-lm', previewTarget: '/Users/me/lm-new/mcp.json', grant: READ_ONE, expireAt: FUTURE, name: 'LM work', method: 'config',
		});
		expect(h.heart.state.creates).toBe(0);
		expect(h.heart.state.revokes).toEqual([]);
	});
});
