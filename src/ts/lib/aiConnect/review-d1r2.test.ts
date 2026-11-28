/**
 * D1 review, round 2 (renderer): regression tests per theme. B: a key that a record, a candidate or a live
 * operation may own is never revoked (Finish and Reconnect act on the hash their window showed, a confirmed
 * Reconnect queues the old key first, mint-intent recovery revokes only an unambiguous match). C: after
 * aiConnectApply the flow keeps no key. Main is the test harness's fake (testHarness.ts).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('Component/form/appGrantFields', () => ({ default: () => null }));
vi.mock('Component', () => ({ Loader: () => null }));

import { AiConnectController, type AiConnectPopupData } from './controller';
import * as flow from './flow';
import { KEY_PLACEHOLDER } from './catalog';
import { isValidLinkGrant } from '../linkApprovalGrant';
import { BASE_PLAN, GRANT, installHarness, READ_ONE, SENTINEL, until, type Harness } from './testHarness';

let h: Harness;
let ui: { close: () => void; toast: (msg: any) => void };
const live: AiConnectController[] = [];

const BUNDLE_PLAN: any = {
	...BASE_PLAN, appId: 'claude-desktop', targetId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'package', nextStep: 'confirmInApp', displayTarget: '',
	sentenceKey: 'aiConnectPlanPackage', targetPath: undefined, steps: [],
};
const BUNDLE_RECORD = { id: 'claude-desktop', appId: 'claude-desktop', name: 'Claude Desktop', route: 'stdio', tier: 'full', recommendedTier: 'full', method: 'package', targetPath: '' };

const open = async (data: AiConnectPopupData, name = 'Claude Desktop'): Promise<AiConnectController> => {
	await flow.load();

	const ctrl = new AiConnectController(data, ui, name);

	live.push(ctrl);
	ctrl.init();
	await until(() => !ctrl.get().planLoading && !ctrl.get().manual.loading);
	if (!isValidLinkGrant(ctrl.get().form.grant)) {
		ctrl.setForm({ grant: { ...GRANT } });
	};
	return ctrl;
};

const settled = async (ctrl: AiConnectController) => {
	await until(() => !ctrl.get().busy);
	await new Promise(r => setTimeout(r, 0));
};

/** Runs `after` right after main answered `cmd` (once) */
const afterAnswer = (cmd: string, after: () => void) => {
	const send = h.main.send.getMockImplementation();
	let done = false;

	h.main.send.mockImplementation(async (c: string, p: any) => {
		const res = await send(c, p);

		if ((c == cmd) && !done) {
			done = true;
			after();
		};
		return res;
	});
};

beforeEach(() => {
	h = installHarness();
	ui = { close: vi.fn(), toast: vi.fn() };
	h.main.m.plans['claude-desktop'] = BUNDLE_PLAN;
});

afterEach(async () => {
	for (const c of live.splice(0)) {
		await c.dispose();
	};
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('D1R2-B: only the hash a window showed, and only an unambiguous orphan, is ever revoked', () => {
	test('D1R2-B: another window replaces the key while the Finish sheet reloads after apply: the sheet stands for the committed key, Manage shows the new one, Cancel revokes nothing', async () => {
		flow.flowConfig.bundlePollInterval = 60000;

		const ctrl = await open({ appId: 'claude-desktop' });
		let release: ((v?: any) => void) | null = null;

		afterAnswer('aiConnectApply', () => {
			release = h.main.holdNext('aiConnectList').resolve;
		});
		ctrl.submit();
		await until(() => !!release);
		expect(h.calls('aiConnectApply')[0].param.appHash).toBe('hash-1');
		// During the reload: another window's Reconnect put key B on the record
		h.heart.add('hash-other', GRANT, 0, 'Claude Desktop');
		h.main.m.records.set('claude-desktop', { ...h.main.m.records.get('claude-desktop'), appHash: 'hash-other' });
		release();
		await until(() => ctrl.get().phase == 'bundle');

		// Cancel setup of this sheet: the key there now is not the one it showed, so Manage shows the record instead
		await ctrl.cancelSetup();
		await until(() => ctrl.get().view == 'manage');
		expect(ctrl.get()).toMatchObject({ view: 'manage', manageNotice: { error: { category: 'stale' } } });
		expect(ctrl.connection().appHash).toBe('hash-other');
		expect(h.calls('aiConnectRemove')).toEqual([]);
		expect(h.heart.state.revokes).not.toContain('hash-other');
		expect(h.heart.rows.has('hash-other')).toBe(true);
	});

	test('D1R2-B: a confirmed bundle Reconnect queues and revokes the shown key before anything else: a plan that fails afterwards leaves "Disconnected · Reconnect", nothing minted', async () => {
		h.heart.add('hash-a', GRANT, 0, 'Claude Desktop');
		h.existing({ ...BUNDLE_RECORD, appHash: 'hash-a' });

		const ctrl = await open({ appId: 'claude-desktop', connectionId: 'claude-desktop', view: 'manage' });

		await until(() => !!ctrl.get().access);
		h.main.holdNext('aiConnectPlan').resolve({ ok: false, error: { stage: 'verify', category: 'unreachable' } });
		await ctrl.reconnect({ confirmed: { accountId: 'acc-1', id: 'claude-desktop', appHash: 'hash-a' } });
		await settled(ctrl);

		const order = h.cmds();

		expect(h.calls('aiConnectRetire').map(c => c.param.expectedHash)).toEqual([ 'hash-a' ]);
		expect(order.indexOf('aiConnectRetire')).toBeLessThan(order.lastIndexOf('aiConnectPlan'));
		expect(h.heart.state.revokes).toEqual([ 'hash-a' ]);
		expect(h.heart.state.creates).toBe(0);
		expect(h.main.m.records.get('claude-desktop')).toMatchObject({ appHash: '' });

		// Retry goes on from the retired record (no second retire, nothing else revoked) and mints for it
		await ctrl.reconnect();
		await until(() => ctrl.get().phase == 'bundle');
		expect(h.calls('aiConnectRetire')).toHaveLength(1);
		expect(h.calls('aiConnectApply').slice(-1)[0].param).toMatchObject({ expectedHash: null, appHash: 'hash-1' });
	});

	test('D1R2-B: mint-intent recovery: an unmanaged key beside a managed one in the window, or one made with another access, is kept; only an unambiguous unowned match is revoked', async () => {
		const now = Math.floor(Date.now() / 1000);
		const time = now - 60;
		const row = (hash: string, over: any = {}) => h.heart.rows.set(hash, { hash, apiKey: `${SENTINEL}-${hash}-abcdefghijklmnop`, name: 'Cursor', createdAt: time + 5, grant: GRANT, expireAt: 0, ...over });

		h.main.m.staleIntents = [ { id: '00000000000000d1', name: 'Cursor', time, grant: GRANT, expireAt: 0 } as any ];
		// The committed delivery's key (its intent went with its record) and another app's key of the same name
		row('hash-managed');
		h.existing({ appHash: 'hash-managed' });
		row('hash-theirs', { createdAt: time + 30 });
		await flow.check('test');
		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.calls('aiConnectOrphan')).toHaveLength(0);
		expect(h.main.m.staleIntents).toHaveLength(1);

		// Without the managed key in the window: one made with another access isn't this intent's either
		h.heart.rows.get('hash-managed').createdAt = time - 3600;
		h.heart.rows.get('hash-theirs').grant = READ_ONE;
		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.main.m.staleIntents).toHaveLength(1);

		// The one key of that name, access and expiry, owned by nobody: the intent's
		h.heart.rows.get('hash-theirs').grant = GRANT;
		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([ 'hash-theirs' ]);
		expect(h.main.m.staleIntents).toEqual([]);
		expect(h.heart.rows.has('hash-managed')).toBe(true);
	});

	test('D1R2-B: a mint intent whose window ran out while it was being saved (the machine slept) is renewed before CreateApp; it names the access and expiry', async () => {
		const ctrl = await open({ appId: 'cursor' }, 'Cursor');
		const held = h.main.holdNext('aiConnectMintIntent');

		held.resolve({ ok: true, id: '00000000000000e1', time: Math.floor(Date.now() / 1000) - (11 * 60) });
		ctrl.submit();
		await until(() => h.calls('aiConnectApply').length == 1);

		const saves = h.calls('aiConnectMintIntent').filter(c => !c.param.done);

		expect(saves).toHaveLength(2);
		expect(saves[1].param).toMatchObject({ name: 'Cursor', grant: GRANT, expireAt: 0 });
		expect(h.calls('aiConnectMintIntent').filter(c => c.param.done).map(c => c.param.id)).toEqual([ '00000000000000e1' ]);
		expect(h.calls('aiConnectApply')[0].param.intentId).not.toBe('00000000000000e1');
		expect(h.heart.state.creates).toBe(1);
	});
});

describe('D1R2-C: after aiConnectApply the renderer keeps no key', () => {
	test('D1R2-C: main took the key and answered "quit the app first": the flow holds only the hash (a Copy needs heart\'s list), and the retry reads the key back by hash', async () => {
		const ctrl = await open({ appId: 'cursor' }, 'Cursor');

		h.main.m.apply = () => ({ ok: false, needs: 'quitApp' });
		ctrl.submit();
		await until(() => ctrl.get().phase == 'needsQuit');

		const key = h.heart.rows.get('hash-1').apiKey;

		expect(h.calls('aiConnectApply')[0].param.key).toBe(key);
		expect(flow.heldKey()).toEqual({ appHash: 'hash-1', committed: false });

		// Nothing left in the flow to copy from: with heart's list failing, the copy has no key
		h.heart.state.listFails = true;
		expect(await flow.copySecret({ template: KEY_PLACEHOLDER, appHash: 'hash-1' })).toBe(false);
		expect(h.calls('aiConnectCopySecret')).toEqual([]);

		// Retry: the same pending key, read back by its hash for this delivery only
		h.heart.state.listFails = false;
		h.main.m.apply = null;

		const lists = h.heart.state.lists;

		ctrl.consent('allowQuit');
		await until(() => h.calls('aiConnectApply').length == 2);
		expect(h.heart.state.lists).toBeGreaterThan(lists);
		expect(h.calls('aiConnectApply')[1].param).toMatchObject({ appHash: 'hash-1', key });
		expect(h.heart.state.creates).toBe(1);
	});
});
