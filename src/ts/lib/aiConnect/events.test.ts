import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AiConnectController, type AiConnectPopupData } from './controller';
import * as flow from './flow';
import { isValidLinkGrant } from '../linkApprovalGrant';
import { BASE_PLAN, GRANT, installHarness, record, SENTINEL, until, type Harness } from './testHarness';

let h: Harness;
let ui: { close: () => void; toast: (msg: any) => void };
const live: AiConnectController[] = [];

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

const settled = async (ctrl: AiConnectController) => {
	await until(() => !ctrl.get().busy);
	await new Promise(r => setTimeout(r, 0));
};

const codes = () => h.events().map(([ code ]) => code);

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

describe('AiConnect* events from the flows (task 4)', () => {
	test('a delivery: Start, Delivered, ProbeOk, NextStep — identifiers only', async () => {
		const ctrl = await open({ appId: 'cursor' });

		expect(h.events()).toEqual([]);
		ctrl.submit();
		await settled(ctrl);
		expect(ctrl.get().phase).toBe('step');

		expect(h.events()).toEqual([
			[ 'AiConnectStart', { app: 'cursor', route: 'http' } ],
			[ 'AiConnectDelivered', { app: 'cursor', method: 'config' } ],
			[ 'AiConnectProbeOk', { app: 'cursor' } ],
			[ 'AiConnectNextStep', { app: 'cursor', step: 'restart' } ],
		]);
		expect(JSON.stringify(h.events())).not.toContain(SENTINEL);
	});

	test('a failed delivery: Failed with its stage and category; a failed check after it too', async () => {
		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'permission', path: '/Users/me/.cursor/mcp.json' } });

		const ctrl = await open({ appId: 'cursor' });

		ctrl.submit();
		await settled(ctrl);
		expect(h.events()).toEqual([
			[ 'AiConnectStart', { app: 'cursor', route: 'http' } ],
			[ 'AiConnectFailed', { app: 'cursor', stage: 'write', category: 'permission' } ],
		]);
	});

	test('a probe that fails after the delivery: Failed at the probe stage, no ProbeOk', async () => {
		const ctrl = await open({ appId: 'cursor' });
		const probe = h.main.holdNext('aiConnectProbe');

		probe.resolve({ ok: false, category: 'unauthorized' });
		ctrl.submit();
		await settled(ctrl);
		expect(codes()).toEqual([ 'AiConnectStart', 'AiConnectDelivered', 'AiConnectFailed' ]);
		expect(h.events()[2][1]).toEqual({ app: 'cursor', stage: 'probe', category: 'unauthorized' });
	});

	test('an Other app set up by hand: Start on Create key, which records it: Delivered (manual) and ProbeOk', async () => {
		h.main.m.plans.other = { ...BASE_PLAN, appId: 'other', targetId: undefined, targetPath: undefined, canApply: false };
		h.main.m.recordManual = (p: any) => {
			const rec = record({ id: 'other-0a1b2c3d', appId: 'other', appHash: p.appHash, method: 'manual', keyFp: '', targetPath: '' });

			h.main.m.records.set(rec.id, rec);
			return { ok: true, connection: h.main.view(rec) };
		};

		const ctrl = await open({ appId: 'other', view: 'manual' }, 'Other app');

		// Other app: Create key records the connection at once
		await ctrl.createKey();
		await settled(ctrl);
		expect(ctrl.get().manual.mode).toBe('done');

		expect(h.events()).toEqual([
			[ 'AiConnectStart', { app: 'other', route: 'http' } ],
			[ 'AiConnectDelivered', { app: 'other', method: 'manual' } ],
			[ 'AiConnectProbeOk', { app: 'other' } ],
		]);
		expect(JSON.stringify(h.events())).not.toContain(SENTINEL);
	});

	test('a settings file edited by hand: Start on Create key, Delivered (manual) and ProbeOk on "I\'ve updated"', async () => {
		const ctrl = await open({ appId: 'cursor', view: 'manual' });

		await ctrl.createKey();
		expect(codes()).toEqual([ 'AiConnectStart' ]);
		await ctrl.confirmManual();
		await settled(ctrl);

		expect(h.events()).toEqual([
			[ 'AiConnectStart', { app: 'cursor', route: 'http' } ],
			[ 'AiConnectDelivered', { app: 'cursor', method: 'manual' } ],
			[ 'AiConnectProbeOk', { app: 'cursor' } ],
		]);
		expect(JSON.stringify(h.events())).not.toContain(SENTINEL);
	});

	test('an unsupported card: UnsupportedShown', async () => {
		await open({ appId: 'chatgpt-web' }, 'ChatGPT on the web');
		expect(h.events()).toEqual([ [ 'AiConnectUnsupportedShown', { app: 'chatgpt-web' } ] ]);
	});

	test('Disconnect and Forget: Removed by the user', async () => {
		h.heart.add('hash-old');
		h.existing();
		h.existing({ id: 'other-0a1b2c3d', appId: 'other', appHash: 'hash-other', method: 'manual', targetPath: '' });
		h.heart.add('hash-other');
		await flow.load();

		await flow.disconnect(h.store.getById('cursor'));
		await flow.forget(h.store.getById('other-0a1b2c3d'));

		expect(h.events()).toEqual([
			[ 'AiConnectRemoved', { app: 'cursor', by: 'user' } ],
			[ 'AiConnectRemoved', { app: 'other', by: 'user' } ],
		]);
	});

	test('Z12: a check main reports an entry removed in the AI app for: Removed by self-heal, once, also with two windows', async () => {
		h.heart.add('hash-old');
		h.existing();
		await flow.check('auto');
		expect(h.events()).toEqual([]);

		h.main.m.onCheck = () => h.main.m.statuses.set('cursor', 'removed');
		await flow.check('auto');
		// The other window's pass listed the record as ok before the first check (the race): its own check
		// still sees the change, but main reports it only to the first
		h.main.m.statuses.delete('cursor');
		await flow.check('auto');

		expect(h.events()).toEqual([ [ 'AiConnectRemoved', { app: 'cursor', by: 'selfheal' } ] ]);
		expect(h.calls('aiConnectCheck').length).toBe(3);
	});

	test('Z12: a Disconnect whose reply arrives under another account reports nothing', async () => {
		h.heart.add('hash-old');
		h.existing();
		await flow.load();

		const held = h.main.holdNext('aiConnectRemove');
		const done = flow.disconnect(h.store.getById('cursor'));

		h.auth.account = { id: 'acc-2' };
		held.resolve();
		await done;
		expect(h.events()).toEqual([]);
	});

	test('Z13: the sheet closed while apply was in flight: Delivered and ProbeOk still reported where the flow settles', async () => {
		const ctrl = await open({ appId: 'cursor' });
		const held = h.main.holdNext('aiConnectApply');

		ctrl.submit();
		await until(() => h.calls('aiConnectApply').length == 1);
		ctrl.cancel();
		const disposed = ctrl.dispose();

		held.resolve();
		await disposed;
		await until(() => h.events().length >= 3);

		expect(h.events()).toEqual([
			[ 'AiConnectStart', { app: 'cursor', route: 'http' } ],
			[ 'AiConnectDelivered', { app: 'cursor', method: 'config' } ],
			[ 'AiConnectProbeOk', { app: 'cursor' } ],
		]);
		expect(JSON.stringify(h.events())).not.toContain(SENTINEL);
	});

	test('Z13: a delivery whose reply arrives under another account reports nothing for it', async () => {
		const ctrl = await open({ appId: 'cursor' });
		const held = h.main.holdNext('aiConnectApply');

		ctrl.submit();
		await until(() => h.calls('aiConnectApply').length == 1);
		h.auth.account = { id: 'acc-2' };
		held.resolve();
		await settled(ctrl);
		expect(h.events()).toEqual([ [ 'AiConnectStart', { app: 'cursor', route: 'http' } ] ]);
	});

	test('A16: two Disconnects while the revoke waits report one removal', async () => {
		h.heart.add('hash-old');
		h.heart.state.revokeFails.add('hash-old');
		h.existing();
		await flow.load();

		await flow.disconnect(h.store.getById('cursor'));
		expect(h.store.getById('cursor')).toMatchObject({ removed: true, revokePending: [ 'hash-old' ] });
		await flow.disconnect(h.store.getById('cursor'));

		expect(h.events()).toEqual([ [ 'AiConnectRemoved', { app: 'cursor', by: 'user' } ] ]);
	});

	test('A13: an unconfirmed CLI delivery whose probe answers under another account reports no probe outcome', async () => {
		h.main.m.plans['claude-code'] = { ...BASE_PLAN, appId: 'claude-code', method: 'cli', nextStep: 'newSession' };
		h.main.m.apply = (p: any) => {
			const rec = record({ id: 'claude-code', appId: 'claude-code', appHash: p.appHash, method: 'cli', nextStep: 'newSession', unconfirmed: [ { appHash: p.appHash, running: false } ] });

			h.main.m.records.set('claude-code', rec);
			return { ok: false, unconfirmed: true, error: { stage: 'cli', category: 'timeout' }, connection: h.main.view(rec) };
		};

		let checks = 0;

		h.main.m.onCheck = () => {
			if (++checks == 2) {
				delete h.main.m.records.get('claude-code').unconfirmed;
			};
		};

		const ctrl = await open({ appId: 'claude-code' }, 'Claude Code');
		const probe = h.main.holdNext('aiConnectProbe');

		ctrl.submit();
		await until(() => h.calls('aiConnectProbe').length == 1);
		h.auth.account = { id: 'acc-2' };
		probe.resolve();
		await new Promise(r => setTimeout(r, 0));
		await new Promise(r => setTimeout(r, 0));

		expect(codes()).toEqual([ 'AiConnectStart', 'AiConnectDelivered' ]);
	});
});
