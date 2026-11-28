/**
 * Phase 3 review round 2 (W1–W24): regressions at the popup-to-flow boundary. Each test drives the controller
 * (or the flow) as the popup does, with deferred replies and account-specific key lists, and asserts what
 * reaches CreateApp, aiConnectApply, aiConnectRecordManual, RevokeApp, the store and the view state.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AiConnectController, probeMessage, type AiConnectPopupData } from './controller';
import * as flow from './flow';
import { connectionState } from './gallery';
import { canOpenApp, sentenceArgs } from './steps';
import { isValidLinkGrant } from '../linkApprovalGrant';
import { BASE_PLAN, GRANT, installHarness, READ_ONE, record, SENTINEL, until, type Harness } from './testHarness';

let h: Harness;
let ui: { close: () => void; toast: (msg: any) => void };
const live: AiConnectController[] = [];

const FUTURE = Math.floor(Date.now() / 1000) + 30 * 86400;
const CLAUDE_CONFIG = '/Users/me/Library/Application Support/Claude/claude_desktop_config.json';
const CC_DET = { appId: 'claude-code', installed: true, targetId: 'claude-code', targetPaths: [ '/Users/me/.claude.json' ], canRestart: false } as any;
/** Claude Desktop's settings-file route: its manual steps are the command entry with the key in `env` */
const CLAUDE_PLAN: any = {
	...BASE_PLAN, appId: 'claude-desktop', targetId: 'claude-desktop', route: 'stdio', method: 'config', targetPath: CLAUDE_CONFIG, displayTarget: '~/Library/Application Support/Claude/claude_desktop_config.json',
	needsKey: true,
	steps: [
		{ textKey: 'aiConnectManualMerge', snippet: '{"mcpServers":{"anytype":{"command":"/Users/me/.anytype/bin/anytype-mcp","args":["serve","--tier","full"],"env":{"ANYTYPE_API_KEY":"<KEY>"}}}}', lang: 'json' },
		{ textKey: 'aiConnectManualKeepPrivate' },
	],
};

const candidate = (appHash: string, running = true) => ({
	appHash, keyFp: 'aaaaaaaaaaaaaaaa', route: 'http', method: 'cli', targetPath: '/Users/me/.claude.json', tier: 'large', recommendedTier: 'large', port: 31009,
	nextStep: 'newSession', name: 'Claude Code', grant: GRANT, expireAt: 0, created: false, running,
});

const input = (over: Partial<flow.ConnectInput> = {}): flow.ConnectInput => ({
	appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', grant: GRANT, name: 'Cursor', expireAt: 0, ...over,
});

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

/** Manage with its key lookup done */
const manage = async (id = 'cursor', appId = 'cursor', name = 'Cursor'): Promise<AiConnectController> => {
	const ctrl = await open({ appId: appId as any, connectionId: id, view: 'manage' }, name);

	await until(() => !!ctrl.get().access);
	return ctrl;
};

const settled = async (ctrl: AiConnectController) => {
	await until(() => !ctrl.get().busy);
	await tick();
};

/** Wraps main's answer to one command */
const answer = (cmd: string, fn: (p: any) => any) => {
	const send = h.main.send.getMockImplementation();

	h.main.send.mockImplementation(async (c: string, p: any) => {
		if (c != cmd) {
			return send(c, p);
		};
		h.main.m.calls.push({ cmd: c, param: JSON.parse(JSON.stringify(p)) });
		return fn(p);
	});
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

describe('W1: the access on screen is the access minted', () => {
	test('W1: a reconnect that lands on manual setup shows the live access and absolute expiry; Create key mints exactly that', async () => {
		h.heart.add('hash-old', READ_ONE, FUTURE);
		h.existing({ grant: GRANT, expireAt: 0 });
		h.main.m.plans.cursor = { ...BASE_PLAN, canApply: false };

		const ctrl = await manage();

		// Manage shows the record's access (no key lookup, D1S-15); Reconnect reads heart's, which changed: the sheet
		// shows it first, and the user goes on from there
		await ctrl.reconnect();
		await until(() => (ctrl.get().view == 'connect') && !ctrl.get().planLoading);
		expect(ctrl.get()).toMatchObject({ formNotice: 'grantChanged', form: { grant: READ_ONE, fixedExpireAt: FUTURE } });
		ctrl.submit();
		await until(() => (ctrl.get().view == 'manual') && !ctrl.get().manual.loading);
		expect(ctrl.get().form.grant).toEqual(READ_ONE);
		expect(ctrl.get().manual).toMatchObject({ mode: 'create', expireAt: FUTURE });
		expect(h.heart.state.creates).toBe(0);

		await ctrl.createKey();
		expect(h.heart.rows.get('hash-1')).toMatchObject({ grant: READ_ONE, expireAt: FUTURE });

		await ctrl.confirmManual();
		expect(h.calls('aiConnectRecordManual')[0].param).toMatchObject({ appHash: 'hash-1', grant: READ_ONE, expireAt: FUTURE, expectedHash: 'hash-old', connectionId: 'cursor' });
	});

	test('W1: Claude Desktop\'s fallback: access narrowed on the manual sheet is what is minted and recorded; the earlier key is released', async () => {
		h.main.m.plans['claude-desktop'] = CLAUDE_PLAN;
		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'permission' } });

		const ctrl = await open({ appId: 'claude-desktop' }, 'Claude Desktop');

		ctrl.setForm({ grant: GRANT });
		ctrl.submit();
		await settled(ctrl);
		await ctrl.enterManual('create');
		ctrl.setForm({ grant: READ_ONE });
		await ctrl.createKey();
		await ctrl.confirmManual();

		expect(h.calls('aiConnectApply').map(it => it.param)).toEqual([ expect.objectContaining({ grant: GRANT, appHash: 'hash-1' }) ]);
		expect(h.calls('aiConnectRecordManual')[0].param).toMatchObject({ grant: READ_ONE, appHash: 'hash-2', setup: 'command', route: 'stdio' });
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
	});
});

describe('W2: "the key is gone" only on confirmed absence', () => {
	const replace = { targetPath: BASE_PLAN.targetPath, foreignDigest: 'a'.repeat(64) };

	beforeEach(() => {
		h.heart.add('hash-old', READ_ONE, 0);
		h.existing({ grant: GRANT });
		h.main.m.statuses.set('cursor', 'conflict');
		h.main.m.plans.cursor = { ...BASE_PLAN, existing: 'foreign', replace };
	});

	test('W2: Replace after a failed lookup is a lookup error with Try again; once it works the live, narrower grant is minted', async () => {
		h.heart.state.listFails = true;

		const ctrl = await manage();

		await ctrl.replace();
		expect(ctrl.get()).toMatchObject({ view: 'manage', reconnect: null, access: { ok: false } });
		expect(h.heart.state.creates).toBe(0);

		h.heart.state.listFails = false;
		await ctrl.retryLookup();
		await ctrl.replace();
		await until(() => !ctrl.get().planLoading);
		expect(ctrl.get()).toMatchObject({ view: 'connect', form: { grant: READ_ONE }, reconnect: { keyGone: false } });

		ctrl.submit();
		await settled(ctrl);
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ grant: READ_ONE, replace, expectedHash: 'hash-old' });
		// The pre-mint re-read ran right before the mint
		const order = h.heart.state.order;

		expect(order[order.indexOf('CreateApp') - 1]).toBe('ListApps');
	});

	test('W2: Replace while the lookup is still running waits for it', async () => {
		h.heart.gate.holdList = true;

		const ctrl = await open({ appId: 'cursor', connectionId: 'cursor', view: 'manage' });

		await until(() => !!h.heart.gate.releaseList);

		const run = ctrl.replace();

		await tick();
		expect(ctrl.get().view).toBe('manage');
		h.heart.gate.releaseList();
		await run;
		expect(ctrl.get()).toMatchObject({ view: 'connect', form: { grant: READ_ONE }, reconnect: { keyGone: false } });
	});
});

describe('W3: same-key intent survives a Replace preview', () => {
	test('W3: Continue → settings file → a foreign entry: Replace delivers the record\'s key with its values; nothing minted or revoked', async () => {
		const target = '/Users/me/.lmstudio/mcp.json';
		const replace = { targetPath: target, foreignDigest: 'b'.repeat(64) };

		h.heart.add('hash-lm', READ_ONE, FUTURE, 'LM work');
		h.existing({
			id: 'lmstudio', appId: 'lmstudio', appHash: 'hash-lm', name: 'LM work', tier: 'full', grant: READ_ONE, expireAt: FUTURE, method: 'deeplink',
			nextStep: 'confirmInApp', observedInstalled: false, targetPath: target,
		});
		h.main.m.plans.lmstudio = { ...BASE_PLAN, appId: 'lmstudio', targetId: 'lmstudio', existing: 'foreign', replace, targetPath: target };

		const ctrl = await open({ appId: 'lmstudio', connectionId: 'lmstudio', view: 'finish' }, 'LM Studio');

		ctrl.useFileRoute();
		await settled(ctrl);
		expect(ctrl.get()).toMatchObject({ view: 'connect', formLocked: true, form: { grant: READ_ONE, fixedExpireAt: FUTURE, name: 'LM work', tier: 'full' } });
		expect(h.calls('aiConnectApply')).toHaveLength(0);

		ctrl.submit();
		await settled(ctrl);
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({
			appHash: 'hash-lm', expectedHash: 'hash-lm', grant: READ_ONE, expireAt: FUTURE, name: 'LM work', tier: 'full', method: 'config', replace,
		});
		expect(h.heart.state.creates).toBe(0);
		expect(h.heart.state.revokes).toEqual([]);
	});
});

describe('W4: manual reconnect is safe', () => {
	test('W4: a manual reconnect whose plan only says to update the CLI mints nothing, offers Check again, and keeps the old key', async () => {
		h.main.m.detections.push(CC_DET);
		h.heart.add('hash-old');
		h.existing({ id: 'claude-code', appId: 'claude-code', method: 'manual', keyFp: '', targetPath: '' });
		h.main.m.plans['claude-code'] = {
			...BASE_PLAN, appId: 'claude-code', targetId: 'claude-code', canApply: false, steps: [ { textKey: 'aiConnectManualUpdateCli', args: [ 'Claude Code', '2.1.327' ] } ],
		};

		const ctrl = await manage('claude-code', 'claude-code', 'Claude Code');

		await ctrl.reconnect();
		await until(() => (ctrl.get().view == 'manual') && !ctrl.get().manual.loading);
		expect(ctrl.get().manual).toMatchObject({ mode: 'prerequisite', keyHash: '' });

		await ctrl.confirmManual();
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectRecordManual')).toHaveLength(0);
		expect(h.heart.rows.has('hash-old')).toBe(true);

		h.main.m.plans['claude-code'] = { ...BASE_PLAN, appId: 'claude-code', targetId: 'claude-code', canApply: false };
		await ctrl.recheck();
		expect(ctrl.get().manual.mode).toBe('create');
	});

	test('W4: a refused place (no steps): no key, the reason, Check again', async () => {
		h.heart.add('hash-old');
		h.existing({ method: 'manual', keyFp: '', targetPath: '' });
		h.main.m.plans.cursor = { ...BASE_PLAN, canApply: false, steps: [], error: { stage: 'read', category: 'outsideHome' } };

		const ctrl = await manage();

		await ctrl.reconnect();
		await until(() => (ctrl.get().view == 'manual') && !ctrl.get().manual.loading);
		expect(ctrl.get().manual.mode).toBe('prerequisite');
		expect(h.heart.state.creates).toBe(0);
	});

	test('W4: a manual record whose key is gone stays on the manual path (no automatic delivery)', async () => {
		h.existing({ method: 'manual', keyFp: '', targetPath: '', grant: READ_ONE });

		const ctrl = await manage();

		// Manage reads no key list (D1S-15); Reconnect finds the key gone
		expect(ctrl.get().override).toBeNull();
		await ctrl.reconnect();
		await until(() => (ctrl.get().view == 'manual') && !ctrl.get().manual.loading);
		expect(ctrl.get().manual.mode).toBe('create');
		expect(ctrl.get().form.grant).toEqual(READ_ONE);
		expect(h.calls('aiConnectApply')).toHaveLength(0);
		expect(h.heart.state.creates).toBe(0);
	});

	test('W4: the old key narrowed while the sheet was open: "I\'ve updated" releases the replacement and shows the access now; the corrected key is recorded', async () => {
		h.heart.add('hash-old', GRANT, 0);
		h.existing({ method: 'manual', keyFp: '', targetPath: '' });

		const ctrl = await manage();

		await ctrl.reconnect();
		await until(() => (ctrl.get().manual.mode == 'confirm') && !ctrl.get().manual.loading);
		expect(ctrl.get().manual.keyHash).toBe('hash-1');

		h.heart.rows.get('hash-old').grant = READ_ONE;
		await ctrl.confirmManual();
		expect(h.calls('aiConnectRecordManual')).toHaveLength(0);
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
		expect(ctrl.get().manual).toMatchObject({ mode: 'create', keyHash: '', notice: { key: 'aiConnectManualGrantChanged' } });
		expect(ctrl.get().form.grant).toEqual(READ_ONE);

		await ctrl.createKey();
		expect(h.heart.rows.get('hash-2').grant).toEqual(READ_ONE);
		await ctrl.confirmManual();
		expect(h.calls('aiConnectRecordManual')[0].param).toMatchObject({ appHash: 'hash-2', grant: READ_ONE, expectedHash: 'hash-old', connectionId: 'cursor' });
		expect(h.heart.rows.has('hash-old')).toBe(false);
	});
});

describe('W5: no manual rotation over a running CLI candidate', () => {
	test('W5: "I\'ve updated", Create key and Reconnect are refused while a CLI may still save an earlier key; nothing minted, recorded or revoked', async () => {
		h.main.m.detections.push(CC_DET);
		h.heart.add('hash-old');
		h.heart.add('hash-A');
		h.main.m.plans['claude-code'] = { ...BASE_PLAN, appId: 'claude-code', targetId: 'claude-code', canApply: false };

		const base = { id: 'claude-code', appId: 'claude-code', method: 'cli', targetPath: '/Users/me/.claude.json' };
		const rec = h.existing(base);
		const manualInput = { ...input({ appId: 'claude-code', name: 'Claude Code' }), existing: rec, connectionId: 'claude-code' };

		expect((await flow.createManual(manualInput)).kind).toBe('pending');

		// Main's record now has a candidate whose CLI may still be writing it
		h.existing({ ...base, unconfirmed: [ candidate('hash-A') ] });
		expect(await flow.confirmManual(manualInput)).toMatchObject({ ok: false, reason: 'stillSaving' });
		expect(h.calls('aiConnectRecordManual')).toHaveLength(0);
		await flow.releasePendingKey();
		expect(h.heart.rows.has('hash-A')).toBe(true);
		expect(h.heart.rows.has('hash-old')).toBe(true);

		const creates = h.heart.state.creates;
		const ctrl = await open({ appId: 'claude-code', view: 'manual' }, 'Claude Code');

		await ctrl.createKey();
		expect(ctrl.get().manual.error).toEqual({ key: 'aiConnectStillSaving', args: [ 'Claude Code' ] });
		expect(h.heart.state.creates).toBe(creates);

		h.existing({ ...base, method: 'manual', keyFp: '', targetPath: '', unconfirmed: [ candidate('hash-A') ] });

		const m = await manage('claude-code', 'claude-code', 'Claude Code');

		await m.reconnect();
		await settled(m);
		expect(m.get()).toMatchObject({ view: 'manage', manageNotice: { key: 'aiConnectStillSaving' } });
		expect(h.heart.state.creates).toBe(creates);
		expect(h.heart.state.revokes).not.toContain('hash-A');
	});

	test('W5: the harness answers recordManual as main does: candidates go to revokePending, unconfirmed is dropped', async () => {
		h.heart.add('hash-old');
		h.heart.add('hash-A');

		const rec = h.existing({ unconfirmed: [ candidate('hash-A', false) ] });

		await flow.createManual({ ...input(), existing: rec, connectionId: 'cursor' });

		const res = await flow.confirmManual({ ...input(), existing: rec, connectionId: 'cursor' });

		expect(res.ok).toBe(true);
		expect(h.main.m.records.get('cursor').unconfirmed).toBeUndefined();
		// Settled (not running) candidates may go: only a running one is protected
		expect(h.heart.state.revokes).toEqual(expect.arrayContaining([ 'hash-old', 'hash-A' ]));
	});
});

describe('W6: account and cancel checks at every side effect', () => {
	const fail = () => ({ ok: false, error: { stage: 'write', category: 'permission' } });

	test('W6: closed while an earlier pending key is released: no new CreateApp; another account signed in: none under it either', async () => {
		let release: (() => void) | null = null;

		h.main.m.apply = fail;
		await flow.connect(input());
		h.heart.state.revokeHold = go => { release = go; };

		const closed = flow.connect(input({ grant: READ_ONE }));

		await until(() => !!release);
		flow.requestCancel();
		release();
		expect((await closed).kind).toBe('cancelled');
		expect(h.heart.state.creates).toBe(1);
		await flow.releasePendingKey();

		release = null;
		await flow.connect(input());
		h.heart.state.revokeHold = go => { release = go; };

		const switched = flow.connect(input({ grant: READ_ONE }));

		await until(() => !!release);
		h.auth.account = { id: 'acc-2' };
		release();
		expect((await switched).kind).toBe('cancelled');
		expect(h.heart.state.createdUnder).toEqual([ 'acc-1', 'acc-1' ]);
	});

	test('W6: a late CreateApp of account A arriving under B is kept in module memory, never in B\'s store, and revoked under A once A is back', async () => {
		flow.flowConfig.rpcTimeout = 5;
		h.heart.gate.hold = true;
		expect(await flow.connect(input())).toMatchObject({ kind: 'error', error: { category: 'timeout' } });
		await flow.releasePendingKey();

		h.store.clear();
		h.auth.account = { id: 'acc-2' };
		h.heart.gate.release();
		await until(() => false, 30);
		expect(h.heart.rowsOf('acc-1').has('hash-1')).toBe(true);
		expect(h.heart.state.revokes).toEqual([]);
		expect(flow.cleanupFailed()).toBe(false);
		expect(h.store.cleanupFailed).toBe(false);
		expect(JSON.stringify(h.store.connectionList)).not.toContain(SENTINEL);

		// A again: the hint until its check finds and revokes the key, under A
		flow.flowConfig.rpcTimeout = 30000;
		h.auth.account = { id: 'acc-1' };
		expect(flow.cleanupFailed()).toBe(true);
		expect(await flow.check('test')).toBe('ok');
		expect(h.heart.state.revokedUnder).toEqual([ 'acc-1:hash-1' ]);
		expect(h.heart.rowsOf('acc-1').has('hash-1')).toBe(false);
		expect(flow.cleanupFailed()).toBe(false);
	});

	test('W6: a committed apply answering after B signed in: the key is kept; B\'s store, the probe and the old key wait for A', async () => {
		h.heart.add('hash-old');

		const old = h.existing();
		const d = h.main.holdNext('aiConnectApply');
		const run = flow.connect(input({ existing: old }));

		await until(() => h.calls('aiConnectApply').length == 1);
		h.store.clear();
		h.auth.account = { id: 'acc-2' };
		d.resolve();
		expect((await run).kind).toBe('cancelled');
		expect(h.store.connectionList).toEqual([]);
		expect(h.calls('aiConnectProbe')).toHaveLength(0);

		await flow.releasePendingKey();
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.heart.rowsOf('acc-1').has('hash-1')).toBe(true);

		h.auth.account = { id: 'acc-1' };
		await flow.check('test');
		expect(h.heart.state.revokedUnder).toEqual([ 'acc-1:hash-old' ]);
	});

	test('W6: an unconfirmed reply under B never puts A\'s connection into B\'s store; a manual record under B neither', async () => {
		h.main.m.apply = (p: any) => ({ ok: false, unconfirmed: true, error: { stage: 'cli', category: 'timeout' }, connection: h.main.view(record({ appHash: p.appHash, name: 'A private' })) });

		const d = h.main.holdNext('aiConnectApply');
		const run = flow.connect(input());

		await until(() => h.calls('aiConnectApply').length == 1);
		h.store.clear();
		h.auth.account = { id: 'acc-2' };
		d.resolve();
		expect((await run).kind).toBe('cancelled');
		expect(JSON.stringify(h.store.connectionList)).not.toContain('A private');
		await flow.releasePendingKey();

		h.auth.account = { id: 'acc-1' };
		await flow.createManual({ ...input() });

		const m = h.main.holdNext('aiConnectRecordManual');
		const manual = flow.confirmManual({ ...input() });

		await until(() => h.calls('aiConnectRecordManual').length == 1);
		h.store.clear();
		h.auth.account = { id: 'acc-2' };
		m.resolve();
		expect(await manual).toMatchObject({ ok: false, reason: 'cancelled' });
		expect(h.store.connectionList).toEqual([]);
		expect(h.calls('aiConnectProbe')).toHaveLength(0);
	});

	test('W6: a check stops at an account switch, also right after a failed revoke', async () => {
		h.heart.add('hash-p1');
		h.heart.add('hash-p2');
		h.existing({ revokePending: [ 'hash-p1', 'hash-p2' ] });

		const orig = h.heart.C.AccountLocalLinkRevokeApp;

		h.heart.C.AccountLocalLinkRevokeApp = (hash: string, cb: any) => {
			if (hash == 'hash-p1') {
				h.heart.state.revokedUnder.push(`acc-1:${hash}`);
				h.auth.account = { id: 'acc-2' };
				queueMicrotask(() => cb({ error: { code: 1 } }));
				return;
			};
			orig(hash, cb);
		};

		expect(await flow.check('test')).toBe('stale');
		expect(h.heart.state.revokedUnder).toEqual([ 'acc-1:hash-p1' ]);
		expect(h.calls('aiConnectCheck')).toHaveLength(0);
	});
});

describe('W7: a stale retry never adopts another record', () => {
	test('W7: a first connect that meets another window\'s new record opens its Manage; that record\'s key is never touched', async () => {
		const ctrl = await open({ appId: 'cursor' });

		h.heart.add('hash-other');
		h.main.m.records.set('cursor', record({ appHash: 'hash-other' }));
		ctrl.submit();
		await until(() => ctrl.get().view == 'manage');
		expect(h.calls('aiConnectApply').map(it => it.param.expectedHash)).toEqual([ null ]);
		expect(ctrl.get()).toMatchObject({ connectionId: 'cursor', manageNotice: { error: { category: 'stale' } } });
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
		expect(h.heart.rows.has('hash-other')).toBe(true);
	});

	test('W7: the store learned of that record before Connect: its Manage, nothing minted', async () => {
		const ctrl = await open({ appId: 'cursor' });

		h.heart.add('hash-other');
		h.existing({ appHash: 'hash-other' });
		ctrl.submit();
		expect(ctrl.get()).toMatchObject({ view: 'manage', connectionId: 'cursor' });
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectApply')).toHaveLength(0);
	});

	test('W7: a reconnect whose record was rotated elsewhere reloads Manage; one that vanished closes; the obsolete hash is sent once', async () => {
		h.heart.add('hash-old');
		h.existing();

		const ctrl = await manage();

		h.heart.add('hash-new');
		h.main.m.records.set('cursor', record({ appHash: 'hash-new' }));
		await ctrl.reconnect();
		await settled(ctrl);
		await until(() => (ctrl.get().view == 'manage') && !!ctrl.get().access);
		expect(h.calls('aiConnectApply').map(it => it.param.expectedHash)).toEqual([ 'hash-old' ]);
		expect(ctrl.connection().appHash).toBe('hash-new');
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
		expect(h.heart.rows.has('hash-new')).toBe(true);

		// Gone in the meantime: the popup closes
		h.main.m.records.delete('cursor');
		h.main.m.apply = () => ({ ok: false, error: { stage: 'validate', category: 'stale' } });
		await ctrl.reconnect();
		await settled(ctrl);
		expect(ui.close).toHaveBeenCalled();
	});
});

describe('W8: Claude manual setup is bound to the displayed plan', () => {
	test('W8: a delivery plan for another file, or a refused one, goes back to the screen; nothing minted or applied', async () => {
		h.main.m.plans['claude-desktop'] = CLAUDE_PLAN;

		const ctrl = await open({ appId: 'claude-desktop', view: 'manual' }, 'Claude Desktop');
		let plans = 0;

		answer('aiConnectPlan', p => ((++plans == 1) ? { ok: true, ...CLAUDE_PLAN, targetPath: '/Users/me/other.json', steps: [], needsKey: false, canApply: false, error: { stage: 'read', category: 'outsideHome' } } : { ok: true, ...CLAUDE_PLAN, tier: p.tier }));
		await ctrl.createKey();
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectApply')).toHaveLength(0);
		expect(ctrl.get().manual).toMatchObject({ mode: 'prerequisite', notice: { key: 'aiConnectManualChanged' }, plan: { targetPath: '/Users/me/other.json' } });
	});
});

describe('W9: a promoted replacement finishes cleanly', () => {
	test('W9: the check that promotes the replacement revokes the key it retired and probes the promoted key before the next step', async () => {
		h.main.m.detections.push(CC_DET);
		h.heart.add('hash-old');
		h.existing({ id: 'claude-code', appId: 'claude-code', method: 'cli', targetPath: '/Users/me/.claude.json' });
		h.main.m.plans['claude-code'] = { ...BASE_PLAN, appId: 'claude-code', targetId: 'claude-code', method: 'cli', nextStep: 'newSession', targetPath: '/Users/me/.claude.json' };
		h.main.m.apply = (p: any) => {
			const kept = { ...h.main.m.records.get('claude-code'), unconfirmed: [ candidate(p.appHash, false) ] };

			h.main.m.records.set('claude-code', kept);
			return { ok: false, unconfirmed: true, error: { stage: 'cli', category: 'timeout' }, connection: h.main.view(kept) };
		};

		let checks = 0;

		h.main.m.onCheck = () => {
			if (++checks == 2) {
				const rec = h.main.m.records.get('claude-code');
				const next = { ...rec, appHash: 'hash-1', revokePending: [ ...rec.revokePending, rec.appHash ], nextStep: 'newSession' };

				delete next.unconfirmed;
				h.main.m.records.set('claude-code', next);
			};
		};

		const ctrl = await manage('claude-code', 'claude-code', 'Claude Code');

		await ctrl.reconnect();
		await until(() => ctrl.get().phase == 'step');
		expect(ctrl.get().step).toBe('newSession');
		expect(h.heart.rows.has('hash-old')).toBe(false);
		expect(h.calls('aiConnectProbe').map(it => it.param.connectionId)).toEqual([ 'claude-code' ]);
		expect(h.main.m.records.get('claude-code').revokePending).toEqual([]);
	});
});

describe('W10: manual reconnect keeps its record', () => {
	test('W10: a manual reconnect records under its own record id', async () => {
		h.heart.add('hash-old');
		h.existing({ method: 'manual', keyFp: '', targetPath: '' });

		const ctrl = await manage();

		await ctrl.reconnect();
		await until(() => (ctrl.get().manual.mode == 'confirm') && !ctrl.get().manual.loading);
		await ctrl.confirmManual();
		expect(h.calls('aiConnectRecordManual')[0].param).toMatchObject({ connectionId: 'cursor', expectedHash: 'hash-old' });
	});

	test('W10: a manual record whose card now reads another Codex home: the location is chosen first, no key', async () => {
		h.main.m.detections = [ { appId: 'codex', installed: true, targetId: 'codex-home-22222222', targetPaths: [ '/Users/me/b/config.toml' ], canRestart: false } ];
		h.heart.add('hash-old');
		h.existing({ id: 'codex-home-11111111', appId: 'codex', method: 'manual', keyFp: '', targetPath: '' });

		const ctrl = await manage('codex-home-11111111', 'codex', 'Codex');

		await ctrl.reconnect();
		expect(ctrl.get().view).toBe('connect');
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectRecordManual')).toHaveLength(0);
	});
});

describe('W11: close cancels synchronously', () => {
	test('W11: a consent between the close (onClose) and the unmount starts no delivery; the unmount releases the key', async () => {
		h.main.m.apply = () => ({ ok: false, needs: 'quitApp' });

		const ctrl = await open({ appId: 'cursor' });

		ctrl.submit();
		await until(() => ctrl.get().phase == 'needsQuit');

		ctrl.cancel();
		ctrl.consent('allowQuit');
		await until(() => false, 20);
		expect(h.calls('aiConnectApply')).toHaveLength(1);

		await ctrl.dispose();
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
	});
});

describe('W12: finishing follows the current status and the followed key', () => {
	const install = (status: string) => {
		h.main.m.plans.lmstudio = { ...BASE_PLAN, appId: 'lmstudio', targetId: 'lmstudio', method: 'deeplink', nextStep: 'confirmInApp', targetPath: '/Users/me/.lmstudio/mcp.json' };
		h.main.m.apply = (p: any) => {
			const rec = record({ id: 'lmstudio', appId: 'lmstudio', appHash: p.appHash, method: 'deeplink', nextStep: 'confirmInApp', observedInstalled: true });

			h.main.m.records.set('lmstudio', rec);
			return { ok: true, connection: h.main.view(rec) };
		};
		h.main.m.onCheck = () => h.main.m.statuses.set('lmstudio', status);
	};

	test.each([ 'accessEnded', 'conflict', 'removed' ])('W12: the install poll meets %s: Manage with its actions, never Added', async status => {
		install(status);

		const ctrl = await open({ appId: 'lmstudio' }, 'LM Studio');

		ctrl.submit();
		await until(() => ctrl.get().view == 'manage');
		expect(h.calls('aiConnectStepDone')).toHaveLength(0);
		expect(ctrl.get().phase).not.toBe('added');
	});

	test('W12: only a successful check counts: a failing one never acknowledges an install', async () => {
		install('ok');
		h.main.m.onCheck = () => {
			h.main.m.checkUnsaved = true;
		};

		const ctrl = await open({ appId: 'lmstudio' }, 'LM Studio');

		ctrl.submit();
		await until(() => ctrl.get().phase == 'stalled', 1000);
		expect(h.calls('aiConnectStepDone')).toHaveLength(0);
	});

	test('W12: a confirmed retry shows its next step while main keeps an older running candidate (popup and gallery)', async () => {
		h.main.m.detections.push(CC_DET);
		h.heart.add('hash-A');
		h.main.m.plans['claude-code'] = { ...BASE_PLAN, appId: 'claude-code', targetId: 'claude-code', method: 'cli', nextStep: 'newSession' };
		h.main.m.apply = (p: any) => {
			const rec = record({ id: 'claude-code', appId: 'claude-code', appHash: p.appHash, method: 'cli', nextStep: 'newSession', unconfirmed: [ candidate('hash-A') ] });

			h.main.m.records.set('claude-code', rec);
			return { ok: true, connection: h.main.view(rec) };
		};

		const ctrl = await open({ appId: 'claude-code' }, 'Claude Code');

		ctrl.submit();
		await settled(ctrl);
		expect(ctrl.get()).toMatchObject({ phase: 'step', step: 'newSession' });
		expect(connectionState(h.store.getById('claude-code'))).toBe('finish');
		expect(connectionState({ ...h.store.getById('claude-code'), status: 'pending' })).toBe('checking');
		expect(h.heart.rows.has('hash-A')).toBe(true);
	});

	test('W12: an unconfirmed write whose wait runs out offers Check again', async () => {
		h.main.m.detections.push(CC_DET);
		h.main.m.plans['claude-code'] = { ...BASE_PLAN, appId: 'claude-code', targetId: 'claude-code', method: 'cli', nextStep: 'newSession' };
		h.main.m.apply = (p: any) => {
			const rec = record({ id: 'claude-code', appId: 'claude-code', appHash: p.appHash, method: 'cli', nextStep: 'newSession', unconfirmed: [ candidate(p.appHash, false) ] });

			h.main.m.records.set('claude-code', rec);
			return { ok: false, unconfirmed: true, error: { stage: 'cli', category: 'timeout' }, connection: h.main.view(rec) };
		};

		const ctrl = await open({ appId: 'claude-code' }, 'Claude Code');

		ctrl.submit();
		await until(() => ctrl.get().pollStopped, 2000);
		expect(ctrl.get().phase).toBe('unconfirmed');

		h.main.m.onCheck = () => {
			delete h.main.m.records.get('claude-code').unconfirmed;
		};
		ctrl.checkAgain();
		await until(() => ctrl.get().phase == 'step');
		expect(ctrl.get().step).toBe('newSession');
	});
});

describe('W13: previews are bound to their request', () => {
	test('W13: only the latest preview enables submit; an older reply changes nothing', async () => {
		const ctrl = await open({ appId: 'cursor' });
		const older = h.main.holdNext('aiConnectPlan');

		ctrl.setForm({ tier: 'small' });
		ctrl.setForm({ route: 'skill' });
		await until(() => !ctrl.get().planLoading);

		const latest = ctrl.get().plan;

		older.resolve({ ok: true, ...BASE_PLAN, displayTarget: 'OLD' });
		await until(() => false, 10);
		expect(ctrl.get().plan).toBe(latest);

		// The newer one still pending, the older one answered: still loading, Connect does nothing
		ctrl.setForm({ tier: 'full' });

		const newer = h.main.holdNext('aiConnectPlan');

		ctrl.setForm({ tier: 'small' });
		await until(() => false, 10);
		expect(ctrl.get().planLoading).toBe(true);
		ctrl.submit();
		expect(h.heart.state.creates).toBe(0);
		newer.resolve();
		await until(() => !ctrl.get().planLoading);
	});

	test('W13: manual instructions are bound to their port: a moved port re-makes them before a key, a copy or "I\'ve updated"', async () => {
		const ctrl = await open({ appId: 'cursor', view: 'manual' });

		expect(ctrl.get().manual.planPort).toBe(31009);
		h.listening(true, 31010);
		await ctrl.createKey();
		expect(h.heart.state.creates).toBe(0);
		expect(ctrl.get().manual).toMatchObject({ planPort: 31010, notice: { key: 'aiConnectManualChanged' } });

		await ctrl.createKey();
		expect(ctrl.get().manual.mode).toBe('confirm');

		h.listening(true, 31011);
		expect(ctrl.portCurrent()).toBe(false);
		await until(() => (ctrl.get().manual.planPort == 31011) && !ctrl.get().manual.loading);
		expect(ctrl.get().manual.mode).toBe('confirm');
		await ctrl.confirmManual();
		expect(h.calls('aiConnectRecordManual')[0].param.port).toBe(31011);

		// The flow itself refuses a record for another port than the instructions'
		await flow.releasePendingKey();
		await flow.createManual({ ...input() });
		expect(await flow.confirmManual({ ...input(), port: 31009 })).toMatchObject({ ok: false, reason: 'changed' });
	});

	test('W13: Other app: the steps shown after an immediate record are the fresh plan\'s, with the recorded port', async () => {
		answer('aiConnectPlan', p => ({
			ok: true, ...BASE_PLAN, appId: 'other', targetId: undefined, targetPath: undefined, needsKey: true,
			steps: [ { textKey: 'aiConnectManualMerge', snippet: `{"url":"http://127.0.0.1:${p.port}/mcp","key":"<KEY>"}`, lang: 'json' } ],
		}));

		const ctrl = await open({ appId: 'other', view: 'manual' }, 'Other app');

		h.listening(true, 31010);
		await ctrl.createKey();
		expect(h.heart.state.creates).toBe(0);
		await ctrl.createKey();
		expect(h.calls('aiConnectRecordManual')[0].param.port).toBe(31010);
		expect(ctrl.get().manual.steps[0].snippet).toContain(':31010/');
	});
});

describe('W14: every save failure has a retry', () => {
	test('W14: Other app recorded but unsaved: the manual view shows it with Save again; saving keeps the key', async () => {
		h.main.m.recordManual = (p: any) => {
			const rec = record({ id: 'other-0a1b2c3d', appId: 'other', appHash: p.appHash, method: 'manual', keyFp: '', targetPath: '' });

			h.main.m.records.set(rec.id, rec);
			return { ok: true, recordSaved: false, connection: h.main.view(rec) };
		};

		const ctrl = await open({ appId: 'other', view: 'manual' }, 'Other app');

		await ctrl.createKey();
		expect(ctrl.get()).toMatchObject({ unsaved: true, manual: { mode: 'done' } });
		await ctrl.retrySave();
		expect(ctrl.get().unsaved).toBe(false);
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.heart.rows.has('hash-1')).toBe(true);
	});

	test('W14: "I\'ve updated" with a file others can read and an unsaved list: both shown, each on its own; the popup stays', async () => {
		h.main.m.recordManual = (p: any) => ({ ok: true, fileMode: 'loose', recordSaved: false, connection: h.main.view(record({ appHash: p.appHash, method: 'manual' })) });

		const ctrl = await open({ appId: 'cursor', view: 'manual' });

		await ctrl.createKey();
		await ctrl.confirmManual();
		expect(ctrl.get()).toMatchObject({ unsaved: true, manual: { mode: 'done', notice: { key: 'aiConnectManualFileLoose' } } });
		expect(ui.close).not.toHaveBeenCalled();
	});

	test('W14: a recorded key whose check failed offers Retry check (a probe only)', async () => {
		let probeOk = false;

		answer('aiConnectProbe', () => (probeOk ? { ok: true } : { ok: false, category: 'unreachable' }));

		const ctrl = await open({ appId: 'other', view: 'manual' }, 'Other app');

		await ctrl.createKey();
		expect(ctrl.get().manual).toMatchObject({ mode: 'done', probeFailed: true });

		probeOk = true;
		await ctrl.retryCheck();
		expect(ctrl.get().manual).toMatchObject({ probeFailed: false, notice: { key: 'aiConnectProbeOk' } });
		expect(h.calls('aiConnectCheck')).toHaveLength(0);
		expect(h.heart.state.revokes).toEqual([]);
	});

	test('W14: a failed install acknowledgement: Retry repeats only the acknowledgement', async () => {
		h.main.m.plans.lmstudio = { ...BASE_PLAN, appId: 'lmstudio', targetId: 'lmstudio', method: 'deeplink', nextStep: 'confirmInApp', targetPath: '/Users/me/.lmstudio/mcp.json' };
		h.main.m.apply = (p: any) => {
			const rec = record({ id: 'lmstudio', appId: 'lmstudio', appHash: p.appHash, method: 'deeplink', nextStep: 'confirmInApp', observedInstalled: false });

			h.main.m.records.set('lmstudio', rec);
			return { ok: true, connection: h.main.view(rec) };
		};
		h.main.m.onCheck = () => {
			const rec = h.main.m.records.get('lmstudio');

			if (rec) {
				h.main.m.records.set('lmstudio', { ...rec, observedInstalled: true });
			};
		};
		h.main.m.stepDoneFails = true;

		const ctrl = await open({ appId: 'lmstudio' }, 'LM Studio');

		ctrl.submit();
		await until(() => ctrl.get().ackFailed);
		expect(ctrl.get()).toMatchObject({ phase: 'step', step: 'confirmInApp', ackFailed: true });

		const applies = h.calls('aiConnectApply').length;

		h.main.m.stepDoneFails = false;
		await ctrl.stepDone();
		expect(h.calls('aiConnectStepDone')).toHaveLength(2);
		expect(h.calls('aiConnectApply')).toHaveLength(applies);
		expect(h.calls('aiConnectOpenApp')).toHaveLength(0);
		expect(ctrl.get().phase).toBe('added');
	});
});

describe('W15: gallery feedback', () => {
	test('W15: a failed first check after a good list keeps the rows and shows the failure (Scan again)', async () => {
		h.existing();
		h.main.m.checkUnsaved = true;
		expect(await flow.load()).toBe(true);
		expect(await flow.check('open')).toBe('unsaved');
		expect(h.store.loadFailed).toBe(true);
		expect(h.store.connectionList).toHaveLength(1);

		h.main.m.checkUnsaved = false;
		expect(await flow.check('scan')).toBe('ok');
		expect(h.store.loadFailed).toBe(false);
	});

	test('W15: Retry check says what failed, the key lookup or the probe; it stays a probe', async () => {
		h.existing();
		h.heart.state.listFails = true;
		expect(probeMessage(await flow.retryProbe(h.store.getById('cursor')))).toEqual({ key: 'aiConnectManageLookupFailed' });

		h.heart.state.listFails = false;
		h.heart.add('hash-old');
		answer('aiConnectProbe', () => ({ ok: false, category: 'unreachable' }));
		expect(probeMessage(await flow.retryProbe(h.store.getById('cursor')))).toEqual({ error: { stage: 'probe', category: 'unreachable' } });
		expect(h.calls('aiConnectCheck')).toHaveLength(0);
		expect(h.heart.state.revokes).toEqual([]);
	});
});

describe('W16: the restart target\'s name everywhere', () => {
	test('W16: the shared Codex file names ChatGPT in the preview, the manual steps and Manage\'s tier notice', async () => {
		const path = '/Users/me/.codex/config.toml';

		h.main.m.detections = [
			{ appId: 'codex', installed: true, targetId: 'codex', targetPaths: [ path ], canRestart: false },
			{ appId: 'chatgpt', installed: true, targetId: 'codex', targetPaths: [ path ], canRestart: true },
		];
		h.main.m.plans.codex = { ...BASE_PLAN, appId: 'codex', targetId: 'codex', targetPath: path, nextStep: 'restart', instructions: { restart: 'aiConnectStepRestart' } };

		const sheet = await open({ appId: 'codex' }, 'Codex');

		expect(sheet.restartName(sheet.get().plan.nextStep)).toBe('ChatGPT');
		expect(sentenceArgs('aiConnectPlanConfigRestart', 'Codex', '~/.codex/config.toml', sheet.restartName('restart'))).toEqual([ 'Codex', '~/.codex/config.toml', 'ChatGPT' ]);

		const manual = await open({ appId: 'codex', view: 'manual' }, 'Codex');
		const steps = manual.get().manual.steps;

		expect(steps[steps.length - 1]).toEqual({ textKey: 'aiConnectStepRestartSelf', args: [ 'ChatGPT' ] });

		h.existing({ id: 'codex', appId: 'codex', targetPath: path, nextStep: 'restart' });

		const m = await manage('codex', 'codex', 'Codex');

		await m.saveTier('full');
		expect(m.get().manageNotice).toEqual({ key: 'aiConnectStepRestart', args: [ 'ChatGPT' ] });
	});
});

describe('W17: no Open for command-line cards', () => {
	test('H18: Open only where main found a bundle or executable it can launch (W17)', () => {
		expect(canOpenApp(null)).toBe(false);
		expect(canOpenApp({ appId: 'cursor', installed: true, targetPaths: [], canRestart: true, canOpen: true })).toBe(true);
		expect(canOpenApp({ appId: 'codex', installed: true, targetPaths: [], canRestart: false })).toBe(false);
	});
});

describe('W19: reveal after disconnect', () => {
	test('W19: an entry left in another Codex home\'s file is offered as Copy path, never revealed', async () => {
		h.main.m.detections = [ { appId: 'codex', installed: true, targetId: 'codex-home-22222222', targetPaths: [ '/Users/me/b/config.toml' ], canRestart: false } ];
		h.heart.add('hash-old');
		h.existing({ id: 'codex-home-11111111', appId: 'codex', targetPath: '/Users/me/a/config.toml', left: 'entry' });

		const ctrl = await manage('codex-home-11111111', 'codex', 'Codex');

		await ctrl.disconnect();
		expect(ctrl.get().result).toMatchObject({ reveal: false, path: '/Users/me/a/config.toml' });
		await ctrl.revealLeftover();
		expect(h.calls('aiConnectReveal')).toHaveLength(0);
	});

	test('W19: the card\'s own file is revealed by the card\'s target', async () => {
		h.heart.add('hash-old');
		h.existing({ left: 'entry' });

		const ctrl = await manage();

		await ctrl.disconnect();
		expect(ctrl.get().result).toMatchObject({ reveal: true, path: BASE_PLAN.targetPath });
		await ctrl.revealLeftover();
		expect(h.calls('aiConnectReveal')[0].param).toEqual({ appId: 'cursor', what: 'target' });
	});
});

describe('W20: the store belongs to an account', () => {
	test('W20: B never sees A\'s connections, not even when B\'s first load fails; A keeps its data on a failed refresh', async () => {
		h.existing();
		await flow.load();
		expect(h.store.accountId).toBe('acc-1');
		expect(h.store.connectionList).toHaveLength(1);

		h.auth.account = { id: 'acc-2' };
		h.main.m.listFails = true;
		expect(await flow.load()).toBe(false);
		expect(h.store).toMatchObject({ accountId: 'acc-2', loadFailed: true, connectionList: [] });

		h.auth.account = { id: 'acc-1' };
		h.main.m.listFails = false;
		await flow.load();
		h.main.m.listFails = true;
		await flow.load();
		expect(h.store.connectionList).toHaveLength(1);

		h.store.clear();
		expect(h.store.accountId).toBe('');
	});
});

describe('W21: disconnect confirms what it showed', () => {
	test('W21: a replacement made after the confirm opened is neither removed nor revoked; Manage reloads', async () => {
		h.heart.add('hash-old');
		h.existing();

		const ctrl = await manage();
		const shown = { id: 'cursor', appHash: 'hash-old' } as const;

		// Another window rotated it; a check brought the new key into this window's store
		h.heart.add('hash-new');
		h.heart.rows.delete('hash-old');
		h.main.m.records.set('cursor', record({ appHash: 'hash-new' }));
		await flow.check('test');
		expect(ctrl.connection().appHash).toBe('hash-new');

		await ctrl.disconnect(false, shown);
		expect(h.calls('aiConnectRemove')[0].param.expectedHash).toBe('hash-old');
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.heart.rows.has('hash-new')).toBe(true);
		expect(h.main.m.records.get('cursor').removed).toBe(false);
		expect(ctrl.get()).toMatchObject({ view: 'manage', manageNotice: { error: { category: 'stale' } } });
	});
});

describe('Defaults: a new connection chooses its spaces; Full or Essential', () => {
	test('no space is preselected: Connect mints nothing until spaces or All spaces are chosen', async () => {
		const ctrl = await open({ appId: 'cursor' }, 'Cursor', true);

		expect(ctrl.get().form.grant).toMatchObject({ allSpaces: false, spaceIds: [] });
		ctrl.submit();
		await until(() => false, 10);
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectApply')).toEqual([]);

		ctrl.setForm({ grant: GRANT });
		ctrl.submit();
		await until(() => h.heart.state.creates == 1);
		expect(h.heart.state.creates).toBe(1);
	});

	test('Full is preselected for apps with large models, Essential for local-model hosts', async () => {
		expect((await open({ appId: 'cursor' })).get().form.tier).toBe('full');
		expect((await open({ appId: 'lmstudio' }, 'LM Studio')).get().form.tier).toBe('small');
	});
});
