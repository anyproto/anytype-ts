/**
 * D1 review, round 1 (renderer): regression tests per theme. C: a lost apply reply, mint-intent recovery, sheets
 * bound to the key they showed. D: every bundle rotation retires first, with the access just confirmed. G: what
 * the rows, Manage, Finish and the manual sheet show and keep.
 * Main is the test harness's fake (testHarness.ts), answering as the main-process contract says.
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('Component/form/appGrantFields', () => ({ default: () => null }));
// The Finish view's spinner only (the whole component index needs the app's window)
vi.mock('Component', () => ({ Loader: () => null }));

import AiConnectFinish from '../../component/popup/aiConnect/finish';
import AiConnectManage from '../../component/popup/aiConnect/manage';
import { AiConnectController, type AiConnectPopupData } from './controller';
import * as flow from './flow';
import { CATALOG } from './catalog';
import { buildGallery, connectionState } from './gallery';
import { isValidLinkGrant } from '../linkApprovalGrant';
import UtilString from '../util/string';
import { BASE_PLAN, GRANT, installHarness, READ_ONE, record, SENTINEL, until, type Harness } from './testHarness';

const TEXT = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../json/text.json'), 'utf8'));
const FUTURE = Math.floor(Date.now() / 1000) + 30 * 86400;

let h: Harness;
let ui: { close: () => void; toast: (msg: any) => void };
const live: AiConnectController[] = [];

const BUNDLE_PLAN: any = {
	...BASE_PLAN, appId: 'claude-desktop', targetId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'package', nextStep: 'confirmInApp', displayTarget: '',
	sentenceKey: 'aiConnectPlanPackage', targetPath: undefined, steps: [],
};
const ENTRY = '{"mcpServers":{"anytype":{"command":"/Users/me/.anytype/bin/anytype-mcp","args":["serve","--tier","full"],"env":{"ANYTYPE_API_KEY":"<KEY>"}}}}';
const CLAUDE_CONFIG_PLAN: any = {
	...BASE_PLAN, appId: 'claude-desktop', targetId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'config', targetPath: '/Users/me/Library/Application Support/Claude/claude_desktop_config.json',
	needsKey: true, steps: [ { textKey: 'aiConnectManualMerge', snippet: ENTRY, lang: 'json' }, { textKey: 'aiConnectManualKeepPrivate' } ],
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

const manage = async (id = 'claude-desktop', appId = 'claude-desktop'): Promise<AiConnectController> => {
	const ctrl = await open({ appId: appId as any, connectionId: id, view: 'manage' });

	await until(() => !!ctrl.get().access);
	return ctrl;
};

const settled = async (ctrl: AiConnectController) => {
	await until(() => !ctrl.get().busy);
	await new Promise(r => setTimeout(r, 0));
};

/** The real strings, for the views */
const views = () => {
	vi.stubGlobal('translate', (k: string) => TEXT[k] ?? k);
	vi.stubGlobal('U', { String: UtilString });
	(globalThis as any).S.Common = { getThemePath: () => '' };
};
const fill = (key: string, ...args: string[]): string => UtilString.sprintf(TEXT[key], ...args);
const esc = (s: string): string => renderToStaticMarkup(React.createElement('i', null, s)).replace(/^<i>|<\/i>$/g, '');

const manageProps = (connection: any, over: any = {}) => ({
	appName: 'Claude Desktop', appId: 'claude-desktop', connection, access: { ok: true, present: !!connection.appHash, grant: connection.grant, expireAt: connection.expireAt },
	spaces: [], siblings: [], busy: false, apiListening: true, formatDate: String,
	onSaveAccess: vi.fn(), onSaveTier: vi.fn(), onReveal: vi.fn(), onReconnect: vi.fn(), onReplace: vi.fn(), onDisconnect: vi.fn(), onForget: vi.fn(), onRetry: vi.fn(),
	onRetryCheck: vi.fn(), onManual: vi.fn(), onContinue: vi.fn(), onClose: vi.fn(),
	...over,
});

const finishProps = (bundle: any) => ({
	appName: 'Claude Desktop', appId: 'claude-desktop', phase: 'bundle', instructions: {}, canRestart: false, busy: false,
	bundle: { state: 'finish', copyFailed: false, openFailed: false, configure: false, stopped: false, ...bundle },
	onCancel: vi.fn(), onQuitContinue: vi.fn(), onContinueSelf: vi.fn(), onOpenApp: vi.fn(), onRestart: vi.fn(), onDone: vi.fn(), onLater: vi.fn(), onManual: vi.fn(),
	onFileRoute: vi.fn(), onRevealBundle: vi.fn(), onCopyKey: vi.fn(), onOpenBundle: vi.fn(), onCancelSetup: vi.fn(), onCheckBundle: vi.fn(), onClose: vi.fn(),
});

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

describe('D1R1-C: a lost reply, mint intents, sheets bound to their key', () => {
	test('D1R1-C: the apply reply and the record list both fail: disposal revokes nothing; a later list with a record owning the key revokes nothing', async () => {
		// Main commits, the reply is lost, and its list fails right after
		h.main.m.apply = (p: any) => {
			h.main.m.records.set('claude-desktop', record({ ...BUNDLE_RECORD, appHash: p.appHash, grant: p.grant, expireAt: p.expireAt }));
			h.main.m.statuses.set('claude-desktop', 'pending');
			h.main.m.listFails = true;
			return null;
		};

		const ctrl = await open({ appId: 'claude-desktop' });

		ctrl.submit();
		await settled(ctrl);
		expect(ctrl.get().phase).toBe('error');
		await ctrl.dispose();
		expect(h.heart.state.revokes).toEqual([]);
		expect(flow.heldKey()).toBeNull();

		// The next successful list shows the record that owns the key: committed, nothing revoked (now or later)
		h.main.m.listFails = false;
		expect(await flow.check('test')).toBe('ok');
		expect(await flow.check('test')).toBe('ok');
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.heart.rows.has('hash-1')).toBe(true);
		expect(flow.cleanupFailed()).toBe(false);
	});

	test('D1R1-C: the same, but main never saved a record: kept through disposal, revoked as an orphan by the next successful list', async () => {
		h.main.m.apply = () => {
			h.main.m.listFails = true;
			return null;
		};

		const ctrl = await open({ appId: 'claude-desktop' });

		ctrl.submit();
		await settled(ctrl);
		await ctrl.dispose();
		expect(h.heart.state.revokes).toEqual([]);

		// A failed list decides nothing
		expect(await flow.check('test')).toBe('failed');
		expect(h.heart.state.revokes).toEqual([]);

		h.main.m.listFails = false;
		expect(await flow.check('test')).toBe('ok');
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
		expect(h.heart.rows.has('hash-1')).toBe(false);
	});

	test('D1R1-C: mint-intent recovery is bound to the attempt: a same-name key 2 hours later is never revoked; two matches revoke nothing and keep the intent', async () => {
		const now = Math.floor(Date.now() / 1000);
		const time = now - (3 * 3600);
		const row = (hash: string, createdAt: number) => h.heart.rows.set(hash, { hash, apiKey: `${SENTINEL}-${hash}-abcdefghijklmnop`, name: 'Cursor', createdAt, grant: GRANT, expireAt: 0 });

		h.main.m.staleIntents = [ { id: '00000000000000b1', name: 'Cursor', time } ];
		// The user's own key of the same name, made 2 hours after the intent (outside its 10 minutes)
		row('hash-later', time + (2 * 3600));
		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.calls('aiConnectOrphan')).toHaveLength(0);
		expect(h.main.m.staleIntents).toHaveLength(1);

		// Two unmanaged keys in its window (and a managed one): ambiguous, nothing revoked, the intent waits
		row('hash-a', time + 5);
		row('hash-b', time + 60);
		row('hash-m', time + 30);
		h.existing({ appHash: 'hash-m' });
		await flow.check('test');
		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.calls('aiConnectOrphan')).toHaveLength(0);
		expect(h.main.m.staleIntents).toHaveLength(1);

		// One left in the window, once the managed key is not in it either (D1R2-B): that one is the intent's key
		h.heart.rows.delete('hash-b');
		h.heart.rows.get('hash-m').createdAt = time - 3600;
		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([ 'hash-a' ]);
		expect(h.main.m.staleIntents).toEqual([]);
		expect(h.heart.rows.has('hash-later')).toBe(true);
		expect(h.heart.rows.has('hash-m')).toBe(true);
	});

	test('D1R1-C: an ambiguous intent is dropped once 24 hours old, nothing revoked', async () => {
		const time = Math.floor(Date.now() / 1000) - (25 * 3600);

		[ 'hash-a', 'hash-b' ].forEach((hash, i) => h.heart.rows.set(hash, { hash, apiKey: `${SENTINEL}-${hash}-abcdefghijklmnop`, name: 'Cursor', createdAt: time + i, grant: GRANT, expireAt: 0 }));
		h.main.m.staleIntents = [ { id: '00000000000000b2', name: 'Cursor', time } ];
		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.main.m.staleIntents).toEqual([]);
	});

	test('D1R1-C: the Finish sheet follows the key it showed: another window\'s new key ends its watch and Manage shows the record', async () => {
		const ctrl = await open({ appId: 'claude-desktop' });

		ctrl.submit();
		await until(() => ctrl.get().phase == 'bundle');
		h.heart.add('hash-other', GRANT, 0, 'Claude Desktop');
		h.main.m.records.set('claude-desktop', { ...h.main.m.records.get('claude-desktop'), appHash: 'hash-other' });
		await until(() => ctrl.get().view == 'manage');
		expect(ctrl.get()).toMatchObject({ view: 'manage', manageNotice: { error: { category: 'stale' } } });
		expect(h.calls('aiConnectRemove')).toHaveLength(0);
		expect(h.heart.rows.has('hash-other')).toBe(true);
	});

	test('D1R1-C: Cancel setup removes only the key the sheet showed: a replacement made meanwhile stays, Manage is refreshed', async () => {
		flow.flowConfig.bundlePollInterval = 60000;

		const ctrl = await open({ appId: 'claude-desktop' });

		ctrl.submit();
		await until(() => ctrl.get().phase == 'bundle');
		await settled(ctrl);

		// Another window replaced the key; this window's store hasn't seen it yet
		h.heart.add('hash-other', GRANT, 0, 'Claude Desktop');
		h.main.m.records.set('claude-desktop', { ...h.main.m.records.get('claude-desktop'), appHash: 'hash-other' });
		await ctrl.cancelSetup();
		await until(() => ctrl.get().view == 'manage');
		expect(h.calls('aiConnectRemove').map(it => it.param.expectedHash)).toEqual([ 'hash-1' ]);
		expect(ctrl.get()).toMatchObject({ view: 'manage', connectionId: 'claude-desktop' });
		expect(ctrl.connection().appHash).toBe('hash-other');
		expect(h.heart.state.revokes).not.toContain('hash-other');

		// The store has another key now: Copy key and Cancel setup of a sheet for the old key do nothing to it
		for (const action of [ 'copyKey', 'cancelSetup' ] as const) {
			const again = await open({ appId: 'claude-desktop', connectionId: 'claude-desktop', view: 'finish' });

			await until(() => again.get().phase == 'bundle');
			h.store.upsert({ ...h.store.getById('claude-desktop'), appHash: `hash-${action}` });
			await again[action]();
			expect(again.get().view).toBe('manage');
			await again.dispose();
			h.store.upsert(h.main.view(h.main.m.records.get('claude-desktop')));
		};
		expect(h.calls('aiConnectCopySecret')).toHaveLength(0);
		expect(h.calls('aiConnectRemove')).toHaveLength(1);
	});

	test('D1R1-C: the bundle Reconnect confirmation stands for its key: another key there now retires nothing; the shown key is the expectedHash', async () => {
		h.heart.add('hash-a', GRANT, 0, 'Claude Desktop');
		h.existing({ ...BUNDLE_RECORD, appHash: 'hash-a' });

		const ctrl = await manage();
		const confirmed = { accountId: 'acc-1', id: 'claude-desktop', appHash: 'hash-a' };

		// Replaced in another window between the confirmation and the click, and this window's store has seen it
		h.heart.add('hash-b', GRANT, 0, 'Claude Desktop');
		h.main.m.records.set('claude-desktop', { ...h.main.m.records.get('claude-desktop'), appHash: 'hash-b' });
		h.store.upsert(h.main.view(h.main.m.records.get('claude-desktop')));
		await ctrl.reconnect({ confirmed });
		await settled(ctrl);
		expect(h.calls('aiConnectRetire')).toHaveLength(0);
		expect(h.heart.state.creates).toBe(0);
		expect(ctrl.get()).toMatchObject({ view: 'manage', manageNotice: { error: { category: 'stale' } } });

		// The store hasn't seen it: the retire carries the confirmed hash, main refuses it, Manage is reloaded
		h.store.upsert({ ...h.store.getById('claude-desktop'), appHash: 'hash-a' });
		await ctrl.reconnect({ confirmed });
		await settled(ctrl);
		expect(h.calls('aiConnectRetire').map(it => it.param.expectedHash)).toEqual([ 'hash-a' ]);
		expect(h.heart.state.creates).toBe(0);
		expect(h.heart.state.revokes).toEqual([]);
		expect(ctrl.get()).toMatchObject({ view: 'manage', manageNotice: { error: { category: 'stale' } } });
		expect(ctrl.connection().appHash).toBe('hash-b');

		// Confirmed for the key there now: retired with that hash
		await ctrl.reconnect({ confirmed: { ...confirmed, appHash: 'hash-b' } });
		await until(() => ctrl.get().phase == 'bundle');
		expect(h.calls('aiConnectRetire')[1].param).toMatchObject({ connectionId: 'claude-desktop', expectedHash: 'hash-b' });
	});
});

describe('D1R1-D: every bundle rotation retires first, with the access just confirmed', () => {
	test('D1R1-D: grantChanged → form → submit: aiConnectRetire (with the confirmed access) precedes CreateApp; a failed mint leaves the old hash queued; Reconnect mints with the stored access', async () => {
		// heart's access changed since the record was reconciled; the old key's revoke fails; the mint fails
		h.heart.add('hash-old', READ_ONE, FUTURE, 'Claude Desktop');
		h.existing({ ...BUNDLE_RECORD, appHash: 'hash-old', grant: GRANT, expireAt: 0 });
		h.heart.state.revokeFails.add('hash-old');
		h.heart.state.createFails = true;

		const ctrl = await manage();

		await ctrl.reconnect();
		await until(() => (ctrl.get().view == 'connect') && !ctrl.get().planLoading);
		expect(ctrl.get()).toMatchObject({ formNotice: 'grantChanged', form: { grant: READ_ONE, fixedExpireAt: FUTURE } });
		expect(h.calls('aiConnectRetire')).toHaveLength(0);

		ctrl.submit();
		await settled(ctrl);

		const cmds = h.cmds();

		expect(cmds.indexOf('aiConnectRetire')).toBeGreaterThanOrEqual(0);
		expect(cmds.indexOf('aiConnectRetire')).toBeLessThan(cmds.indexOf('aiConnectMintIntent'));
		expect(h.heart.state.order.indexOf('RevokeApp:hash-old')).toBeLessThan(h.heart.state.order.indexOf('CreateApp'));
		expect(h.calls('aiConnectRetire')[0].param).toEqual({ accountId: 'acc-1', connectionId: 'claude-desktop', expectedHash: 'hash-old', grant: READ_ONE, expireAt: FUTURE });
		expect(h.calls('aiConnectApply')).toHaveLength(0);
		expect(ctrl.get().phase).toBe('error');

		const rec = h.main.m.records.get('claude-desktop');

		expect(rec).toMatchObject({ appHash: '', grant: READ_ONE, expireAt: FUTURE });
		expect(rec.revokePending).toContain('hash-old');
		expect(h.heart.rows.has('hash-old')).toBe(true);
		expect(h.store.getById('claude-desktop')).toMatchObject({ status: 'disconnected', appHash: '' });

		// "Disconnected · Reconnect": the stored (last confirmed) access, a new key on the same record
		h.heart.state.createFails = false;

		const again = await manage();

		await again.reconnect();
		await until(() => again.get().phase == 'bundle');
		expect(h.calls('aiConnectRetire')).toHaveLength(1);
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ method: 'package', expectedHash: null, grant: READ_ONE, expireAt: FUTURE });
		expect(h.heart.rows.get('hash-1')).toMatchObject({ grant: READ_ONE, expireAt: FUTURE });
	});

	test('D1R1-D: a confirmed Reconnect retires with heart\'s live access; Replace on the extension retires before it mints too', async () => {
		h.heart.add('hash-old', GRANT, FUTURE, 'Claude Desktop');
		h.existing({ ...BUNDLE_RECORD, appHash: 'hash-old', grant: GRANT, expireAt: FUTURE });

		const ctrl = await manage();

		await ctrl.reconnect({ confirmed: { accountId: 'acc-1', id: 'claude-desktop', appHash: 'hash-old' } });
		await until(() => ctrl.get().phase == 'bundle');
		expect(h.calls('aiConnectRetire')[0].param).toMatchObject({ expectedHash: 'hash-old', grant: GRANT, expireAt: FUTURE });
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ expectedHash: null, appHash: 'hash-1' });
		await ctrl.dispose();

		// Replace (the sheet, prefilled): the same order, no apply over a live key
		h.heart.add('hash-live', GRANT, 0, 'Claude Desktop');
		h.existing({ ...BUNDLE_RECORD, appHash: 'hash-live', grant: GRANT, expireAt: 0 });

		const other = await manage();

		await other.replace();
		await until(() => (other.get().view == 'connect') && !other.get().planLoading);
		other.submit();
		await until(() => other.get().phase == 'bundle');
		expect(h.calls('aiConnectRetire')[1].param).toMatchObject({ expectedHash: 'hash-live' });
		expect(h.calls('aiConnectApply')[1].param).toMatchObject({ expectedHash: null });
	});
});

describe('D1R1-G: what the rows, Manage, Finish and the manual sheet show and keep', () => {
	test('D1R1-G: a live or retired bundle row with a replaced key queued says "Revocation pending" next to its state; a retired row stays "Disconnected · Reconnect" in Manage', async () => {
		const gallery = (c: any) => buildGallery({
			catalog: CATALOG, detections: {}, connections: [ c ], scanOk: true, isDesktop: true, loaded: true, apiListening: true, query: '', nameOf: it => it.name || it.nameKey,
		}).connected[0];
		const liveRow = { ...record({ ...BUNDLE_RECORD, appHash: 'hash-new', revokePending: [ 'hash-old' ] }), status: 'ok', displayTarget: '' };
		const retired = { ...record({ ...BUNDLE_RECORD, appHash: '', revokePending: [ 'hash-old' ] }), status: 'disconnected', displayTarget: '' };

		expect(gallery(liveRow).status).toEqual({ key: 'aiAppsStatusConnected', dot: 'success', suffix: 'aiAppsStatusRevokePending' });
		expect(gallery(retired)).toMatchObject({ state: 'disconnected', status: { key: 'aiAppsStatusDisconnected', suffix: 'aiAppsStatusRevokePending' } });
		expect(gallery({ ...retired, revokePending: [] }).status.suffix).toBeUndefined();

		// Manage of the retired record: no key lookup, never "Access ended" from its empty hash
		h.existing({ ...BUNDLE_RECORD, appHash: '', revokePending: [ 'hash-old' ] });
		h.main.m.statuses.set('claude-desktop', 'disconnected');
		await flow.load();

		const lists = h.heart.state.lists;
		const ctrl = await manage();

		expect(h.heart.state.lists).toBe(lists);
		expect(ctrl.get().override).toBeNull();
		expect(connectionState(ctrl.connection())).toBe('disconnected');

		views();

		const html = renderToStaticMarkup(React.createElement(AiConnectManage, manageProps(ctrl.connection(), { access: ctrl.get().access }) as any));

		expect(html).toContain(esc(`${TEXT.aiAppsStatusDisconnected} · ${TEXT.aiAppsStatusRevokePending}`));
		expect(html).not.toContain(TEXT.aiAppsStatusAccessEnded);
	});

	test('D1R1-G: Finish: a failed launch shows its error and Open again whatever Claude reports, until it opens; never while Claude has both routes', async () => {
		views();

		const render = (bundle: any) => renderToStaticMarkup(React.createElement(AiConnectFinish, finishProps(bundle) as any));
		const openFailed = esc(fill('aiConnectOpenFailed', 'Claude Desktop'));

		for (const state of [ 'finish', 'off', 'notConfirmed', 'updated' ]) {
			const html = render({ state, openFailed: true });

			expect(html).toContain(TEXT.aiConnectOpenAgain);
			expect(html).toContain(openFailed);
		};
		expect(render({ state: 'notConfirmed' })).not.toContain(TEXT.aiConnectOpenAgain);
		expect(render({ state: 'notConfirmed', openFailed: true, bothRoutes: true })).not.toContain(TEXT.aiConnectOpenAgain);
		expect(render({ state: 'finish', bothRoutes: true })).not.toContain(TEXT.aiConnectOpenAgain);

		// Open again that works clears it
		h.heart.add('hash-a', GRANT, 0, 'Claude Desktop');
		h.main.m.bundleOpenFails = true;

		const ctrl = await open({ appId: 'claude-desktop' });

		ctrl.submit();
		await until(() => ctrl.get().phase == 'bundle');
		expect(ctrl.get().bundle.openFailed).toBe(true);
		await ctrl.openBundle();
		expect(ctrl.get().bundle.openFailed).toBe(false);
	});

	test('D1R1-G: Manage of a Claude record with both routes names both and how to remove one, without Replace; the row says so too', async () => {
		views();

		const c = { ...record({ ...BUNDLE_RECORD, appHash: 'hash-a' }), status: 'conflict', bothRoutes: true, displayTarget: '' };
		const html = renderToStaticMarkup(React.createElement(AiConnectManage, manageProps(c) as any));

		expect(html).toContain(esc(fill('aiConnectAttentionBothRoutes', 'Claude Desktop')));
		expect(html).toContain(esc(fill('aiAppsStatusBothRoutes', 'Claude Desktop')));
		expect(html).not.toContain(esc(fill('aiConnectAttentionConflict', 'Claude Desktop')));
		expect(html).not.toContain(`>${TEXT.aiConnectReplace}<`);
		expect(html).not.toContain(TEXT.aiConnectOpenAgain);

		const row = buildGallery({
			catalog: CATALOG, detections: {}, connections: [ c as any ], scanOk: true, isDesktop: true, loaded: true, apiListening: true, query: '', nameOf: it => it.name || it.nameKey,
		}).connected[0];

		expect(row.status).toMatchObject({ key: 'aiAppsStatusBothRoutes', args: [ 'Claude Desktop' ] });

		// A foreign entry (no bothRoutes) keeps Replace / Forget
		const foreign = renderToStaticMarkup(React.createElement(AiConnectManage, manageProps({ ...c, bothRoutes: undefined }) as any));

		expect(foreign).toContain(esc(fill('aiConnectAttentionConflict', 'Claude Desktop')));
		expect(foreign).toContain(`>${TEXT.aiConnectReplace}<`);
	});

	test('D1R1-G: after a manual Copy the flow keeps no key (a Copy and "I\'ve updated" read it back by hash); Cancel takes the copy off the clipboard', async () => {
		h.main.m.plans['claude-desktop'] = CLAUDE_CONFIG_PLAN;

		const ctrl = await open({ appId: 'claude-desktop', view: 'manual' });

		await ctrl.createKey();
		expect(ctrl.get().manual).toMatchObject({ mode: 'confirm', keyHash: 'hash-1' });

		const key = h.heart.rows.get('hash-1').apiKey;
		const listsBefore = h.heart.state.lists;

		expect(await ctrl.copyStep(ctrl.get().manual.steps[0].snippet)).toBe(true);
		// The first copy came from the flow's own undelivered key: no key list read for it
		expect(h.heart.state.lists).toBe(listsBefore);
		expect(h.main.m.clipboard).toEqual({ text: ENTRY.replace('<KEY>', key), appHash: 'hash-1' });

		// The key isn't held any more: with heart's list failing, a second Copy has nothing to copy
		h.heart.state.listFails = true;
		expect(await ctrl.copyStep(ctrl.get().manual.steps[0].snippet)).toBe(false);
		expect(h.calls('aiConnectCopySecret')).toHaveLength(1);

		// "I've updated": recorded by hash; its probe reads the key back by hash, for that call only
		h.heart.state.listFails = false;
		await ctrl.confirmManual();

		const order = h.cmds();

		expect(h.calls('aiConnectRecordManual')[0].param).toMatchObject({ appHash: 'hash-1' });
		expect(JSON.stringify(h.calls('aiConnectRecordManual')[0].param)).not.toContain(SENTINEL);
		expect(h.calls('aiConnectProbe')[0].param.key).toBe(key);
		expect(order.indexOf('aiConnectRecordManual')).toBeLessThan(order.indexOf('aiConnectProbe'));
		expect(JSON.stringify(flow.heldKey())).not.toContain(SENTINEL);

		// Cancel of a manual sheet: the pending key is released and its copy leaves the clipboard
		h.main.m.records.clear();
		h.store.remove('claude-desktop');

		const cancelled = await open({ appId: 'claude-desktop', view: 'manual' });

		await cancelled.createKey();
		expect(await cancelled.copyStep(cancelled.get().manual.steps[0].snippet)).toBe(true);
		expect(h.main.m.clipboard).toMatchObject({ appHash: 'hash-2' });
		await cancelled.dispose();
		expect(h.calls('aiConnectCopySecret').slice(-1)[0].param).toEqual({ accountId: 'acc-1', appHash: 'hash-2', clear: true });
		expect(h.main.m.clipboard).toBeNull();
		expect(h.heart.state.revokes).toContain('hash-2');
	});

	test('D1R1-G: opening Manage reads no key list; Replace reads heart\'s access when clicked', async () => {
		h.heart.add('hash-old', READ_ONE, 0);
		h.existing({ grant: GRANT });
		h.main.m.statuses.set('cursor', 'conflict');
		h.main.m.plans.cursor = { ...BASE_PLAN, existing: 'foreign', replace: { targetPath: BASE_PLAN.targetPath, foreignDigest: 'a'.repeat(64) } };

		const lists = h.heart.state.lists;
		const ctrl = await manage('cursor', 'cursor');

		expect(h.heart.state.lists).toBe(lists);
		// The record's reconciled access is what Manage shows
		expect(ctrl.get().access).toEqual({ ok: true, present: true, grant: GRANT, expireAt: 0 });

		await ctrl.replace();
		await until(() => (ctrl.get().view == 'connect') && !ctrl.get().planLoading);
		expect(h.heart.state.lists).toBe(lists + 1);
		expect(ctrl.get().form.grant).toEqual(READ_ONE);
	});
});
