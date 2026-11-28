/**
 * tokens-plan §5 D1, the renderer's side: the key lives in the AI app, the renderer keeps only its hash.
 * Main is the test harness's fake (testHarness.ts): it answers as tokens-plan §3 says main does.
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('Component/form/appGrantFields', () => ({ default: () => null }));

import AiConnectManual from '../../component/popup/aiConnect/manual';
import { AiConnectController, type AiConnectPopupData } from './controller';
import * as flow from './flow';
import { isValidLinkGrant } from '../linkApprovalGrant';
import { KEY_MASK } from './steps';
import UtilString from '../util/string';
import { BASE_PLAN, GRANT, installHarness, record, SENTINEL, until, type Harness } from './testHarness';

const TEXT = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../json/text.json'), 'utf8'));

let h: Harness;
let ui: { close: () => void; toast: (msg: any) => void };
const live: AiConnectController[] = [];

const BUNDLE_PLAN: any = {
	...BASE_PLAN, appId: 'claude-desktop', targetId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'package', nextStep: 'confirmInApp', displayTarget: '',
	sentenceKey: 'aiConnectPlanPackage', targetPath: undefined, steps: [],
};
const ENTRY = '{"mcpServers":{"anytype":{"command":"/Users/me/.anytype/bin/anytype-mcp","args":["serve","--tier","full"],"env":{"ANYTYPE_API_KEY":"<KEY>"}}}}';
const COMMAND_PLAN: any = {
	...BASE_PLAN, appId: 'other', targetId: null, route: 'stdio', tier: 'full', method: 'manual', canApply: false, nextStep: 'none', displayTarget: '', targetPath: undefined,
	setups: [ 'url', 'command' ], needsKey: true,
	steps: [ { textKey: 'aiConnectManualCommandEntry', snippet: ENTRY, lang: 'json' }, { textKey: 'aiConnectManualKeepPrivate' }, { textKey: 'aiConnectManualCommandRestart' } ],
};
const CLAUDE_CONFIG_PLAN: any = {
	...BASE_PLAN, appId: 'claude-desktop', targetId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'config', targetPath: '/Users/me/Library/Application Support/Claude/claude_desktop_config.json',
	needsKey: true, steps: [ { textKey: 'aiConnectManualMerge', snippet: ENTRY, lang: 'json' }, { textKey: 'aiConnectManualKeepPrivate' } ],
};

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

/** Nothing the renderer keeps holds a key: the controller's state, the store, the flow's held key */
const holdsNoKey = (ctrl: AiConnectController | null) => {
	expect(JSON.stringify(ctrl?.get() || {})).not.toContain(SENTINEL);
	expect(JSON.stringify(h.store.connectionList)).not.toContain(SENTINEL);
	expect(JSON.stringify(flow.heldKey())).not.toContain(SENTINEL);
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

describe('D1, renderer', () => {
	test('D1-09: bundle connect, no request from Claude: stays "key not confirmed", no probe, the key on the clipboard, heldKey() has no key while Finish is open', async () => {
		h.main.m.onCheck = () => {
			const rec = h.main.m.records.get('claude-desktop');

			// Main: the extension is installed and on, heart hasn't seen the key used
			if (rec && !rec.confirmed) {
				h.main.m.records.set('claude-desktop', { ...rec, bundleState: 'notConfirmed' });
			};
		};

		const ctrl = await open({ appId: 'claude-desktop' });

		expect(ctrl.bundlePlan()).toBe(true);
		ctrl.submit();
		await until(() => ctrl.get().phase == 'bundle');
		await until(() => h.calls('aiConnectCheck').length >= 2);
		await settled(ctrl);

		const key = h.heart.rows.get('hash-1').apiKey;
		const apply = h.calls('aiConnectApply')[0].param;

		expect(apply).toMatchObject({ method: 'package', tier: 'full', appHash: 'hash-1' });
		expect(h.calls('aiConnectProbe')).toHaveLength(0);
		expect(h.main.m.clipboard).toEqual({ text: key, connectionId: 'claude-desktop' });
		expect(flow.heldKey()).toEqual({ appHash: 'hash-1', committed: true });
		expect(h.store.getById('claude-desktop')).toMatchObject({ status: 'pending', bundleState: 'notConfirmed' });
		expect(h.calls('aiConnectCheck').slice(-1)[0].param.keys).toContainEqual({ hash: 'hash-1', present: true, grant: GRANT, expireAt: 0, active: false });
		expect(ctrl.get().phase).toBe('bundle');
		holdsNoKey(ctrl);
	});

	test('D1-10 (renderer): heart\'s isActive reaches main; "Connected" ends the Finish view', async () => {
		const ctrl = await open({ appId: 'claude-desktop' });

		ctrl.submit();
		await until(() => ctrl.get().phase == 'bundle');
		h.heart.rows.get('hash-1').isActive = true;
		await until(() => ctrl.get().phase == 'connected');
		expect(h.calls('aiConnectCheck').slice(-1)[0].param.keys).toContainEqual(expect.objectContaining({ hash: 'hash-1', active: true }));
		expect(h.main.m.clipboard).toBeNull();
		expect(h.calls('aiConnectProbe')).toHaveLength(0);
	});

	test('D1-12: bundle Reconnect retires the old key first; a failed CreateApp leaves the row Disconnected; a failed RevokeApp keeps the hash queued and the flow goes on', async () => {
		h.heart.add('hash-old', GRANT, 0, 'Claude Desktop');
		h.existing({ id: 'claude-desktop', appId: 'claude-desktop', appHash: 'hash-old', name: 'Claude Desktop', route: 'stdio', tier: 'full', method: 'package', targetPath: '' });

		// CreateApp fails after the confirmation
		h.heart.state.createFails = true;

		const ctrl = await open({ appId: 'claude-desktop', connectionId: 'claude-desktop', view: 'manage' });

		await until(() => !!ctrl.get().access);
		await ctrl.reconnect();
		await settled(ctrl);

		const cmds = h.cmds();

		expect(cmds.indexOf('aiConnectRetire')).toBeGreaterThanOrEqual(0);
		expect(cmds.indexOf('aiConnectRetire')).toBeLessThan(cmds.indexOf('aiConnectMintIntent'));
		expect(h.heart.state.order.indexOf('RevokeApp:hash-old')).toBeLessThan(h.heart.state.order.indexOf('CreateApp'));
		expect(h.store.getById('claude-desktop')).toMatchObject({ status: 'disconnected', appHash: '' });
		expect(h.calls('aiConnectApply')).toHaveLength(0);

		// Reconnect from "Disconnected · Reconnect": nothing left to retire; the record's access, a new key on the same record
		h.heart.state.createFails = false;
		await ctrl.reconnect();
		await until(() => ctrl.get().phase == 'bundle');
		expect(h.calls('aiConnectRetire')).toHaveLength(1);
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ method: 'package', tier: 'full', expectedHash: null, grant: GRANT });
		await ctrl.dispose();

		// Again, now with RevokeApp refused for the old key: it stays queued, a new key is minted and delivered on the same record
		h.heart.state.createFails = false;
		h.heart.add('hash-old2', GRANT, 0, 'Claude Desktop');
		h.existing({ id: 'claude-desktop', appId: 'claude-desktop', appHash: 'hash-old2', name: 'Claude Desktop', route: 'stdio', tier: 'full', method: 'package', targetPath: '' });
		h.heart.state.revokeFails.add('hash-old2');

		const again = await open({ appId: 'claude-desktop', connectionId: 'claude-desktop', view: 'manage' });

		await until(() => !!again.get().access);
		await again.reconnect();
		await until(() => again.get().phase == 'bundle');

		const rec = h.main.m.records.get('claude-desktop');

		expect(h.calls('aiConnectApply').slice(-1)[0].param).toMatchObject({ method: 'package', tier: 'full', expectedHash: null });
		expect(rec.appHash).not.toBe('hash-old2');
		expect(rec.revokePending).toContain('hash-old2');
		expect(h.heart.rows.has('hash-old2')).toBe(true);
	});

	test('D1-13: copy or open fails after the save: retry actions, the key kept; a lost reply is found by its hash, never released; a key with no record goes through its mint intent', async () => {
		h.main.m.bundleCopyFails = true;
		h.main.m.bundleOpenFails = true;

		const ctrl = await open({ appId: 'claude-desktop' });

		ctrl.submit();
		await until(() => ctrl.get().phase == 'bundle');
		expect(ctrl.get().bundle).toMatchObject({ copyFailed: true, openFailed: true });
		expect(h.heart.state.revokes).toEqual([]);

		await ctrl.copyKey();
		expect(h.calls('aiConnectCopySecret')[0].param).toEqual({ accountId: 'acc-1', connectionId: 'claude-desktop', text: h.heart.rows.get('hash-1').apiKey });
		expect(ctrl.get().bundle.copyFailed).toBe(false);
		await ctrl.openBundle();
		expect(h.calls('aiConnectOpenApp').slice(-1)[0].param).toEqual({ appId: 'claude-desktop', bundle: true });
		holdsNoKey(ctrl);
		await ctrl.dispose();
		expect(h.heart.state.revokes).toEqual([]);

		// The apply reply is lost after main saved the record: listed by the key's hash, committed, nothing released
		h.main.m.records.clear();
		h.main.m.apply = (p: any) => {
			h.main.m.records.set('claude-desktop', record({ id: 'claude-desktop', appId: 'claude-desktop', appHash: p.appHash, method: 'package', route: 'stdio', tier: 'full', bundleState: 'finish' }));
			return null;
		};

		const lost = await open({ appId: 'claude-desktop' });

		lost.submit();
		await until(() => lost.get().phase == 'bundle');
		await lost.dispose();
		expect(flow.heldKey()).toBeNull();
		expect(h.heart.state.revokes).toEqual([]);
		expect(h.heart.rows.has('hash-2')).toBe(true);

		// Anytype died before the save: the key has no record. The next run (no mint of its own in flight) finds it by
		// the earlier run's mint intent and revokes it
		const now = Math.floor(Date.now() / 1000);

		h.main.m.intents.clear();
		h.heart.rows.delete('hash-1');
		// The lost reply's record key is an earlier one: a managed key in the window would keep the match ambiguous (D1R2-B)
		h.heart.rows.get('hash-2').createdAt = now - 3600;

		h.heart.rows.set('hash-crash', { hash: 'hash-crash', apiKey: `${SENTINEL}-crash-abcdefghijklmnop`, name: 'Claude Desktop', createdAt: now, grant: GRANT, expireAt: 0 });
		h.main.m.staleIntents = [ { id: '00000000000000c1', name: 'Claude Desktop', time: now - 5 } ];
		await flow.check('test');
		expect(h.heart.state.revokes).toEqual([ 'hash-crash' ]);
		expect(h.main.m.staleIntents).toEqual([]);
	});

	test('D1-14: an intent no key matches is kept, then the key listed later is queued and revoked; one 25 hours old is dropped', async () => {
		const now = Math.floor(Date.now() / 1000);

		h.main.m.staleIntents = [ { id: '00000000000000a1', name: 'Cursor', time: now - 5 } ];
		await flow.check('test');
		expect(h.main.m.staleIntents).toHaveLength(1);
		expect(h.calls('aiConnectMintIntent')).toHaveLength(0);

		// heart lists the key now (its grant file was unreadable a moment ago)
		h.heart.rows.set('hash-late', { hash: 'hash-late', apiKey: `${SENTINEL}-late-abcdefghijklmnop`, name: 'Cursor', createdAt: now, grant: GRANT, expireAt: 0 });
		await flow.check('test');
		expect(h.calls('aiConnectOrphan')[0].param).toMatchObject({ hash: 'hash-late', intentId: '00000000000000a1' });
		expect(h.heart.state.revokes).toEqual([ 'hash-late' ]);
		expect(h.main.m.staleIntents).toEqual([]);

		h.main.m.staleIntents = [ { id: '00000000000000a2', name: 'Cursor', time: now - (25 * 3600) } ];
		await flow.check('test');
		expect(h.main.m.staleIntents).toEqual([]);
		expect(h.calls('aiConnectMintIntent').slice(-1)[0].param).toEqual({ accountId: 'acc-1', id: '00000000000000a2', done: true });
	});

	test('D1-22: manual and Manage views (Other\'s Command, Claude by hand): no key lookup on open, masked on screen, Copy sends the real key through main, no key kept', async () => {
		h.main.m.plans.other = COMMAND_PLAN;
		h.heart.add('hash-cmd', GRANT, 0, 'My agent');
		h.existing({ id: 'other-1a2b3c4d', appId: 'other', appHash: 'hash-cmd', name: 'My agent', route: 'stdio', tier: 'full', method: 'manual', setup: 'command', keyFp: '', targetPath: '' });

		// The baseline before Manage opens: neither Manage nor the manual view looks a key up (D1S-15)
		const lists = h.heart.state.lists;
		const ctrl = await open({ appId: 'other', connectionId: 'other-1a2b3c4d', view: 'manage' }, 'My agent');

		await until(() => !!ctrl.get().access);
		expect(h.heart.state.lists).toBe(lists);
		await ctrl.enterManual('done', h.store.getById('other-1a2b3c4d'));
		await until(() => !ctrl.get().manual.loading);
		expect(h.heart.state.lists).toBe(lists);
		expect(ctrl.get().manual).toMatchObject({ mode: 'done', keyHash: 'hash-cmd', setup: 'command' });
		expect(h.calls('aiConnectPlan').slice(-1)[0].param).toMatchObject({ method: 'command', connectionId: 'other-1a2b3c4d' });
		holdsNoKey(ctrl);

		// The screen: the mask, never the key or a Show button
		vi.stubGlobal('translate', (k: string) => TEXT[k] ?? k);
		vi.stubGlobal('U', { String: UtilString });
		(globalThis as any).S.Common = { getThemePath: () => '' };

		const html = renderToStaticMarkup(React.createElement(AiConnectManual, {
			appName: 'My agent', appId: 'other', mode: 'done', steps: ctrl.get().manual.steps, hasKey: true, grant: GRANT, spaces: [], apiListening: true, busy: false,
			planLoading: false, withName: false, name: 'My agent', onCopy: vi.fn(), onCopySecret: vi.fn(),
		} as any));

		expect(html).toContain(KEY_MASK);
		expect(html).not.toContain(SENTINEL);
		expect(html).not.toContain('&lt;KEY&gt;');
		expect(html).not.toContain('>Show<');

		const key = h.heart.rows.get('hash-cmd').apiKey;

		expect(await ctrl.copyStep(ctrl.get().manual.steps[0].snippet)).toBe(true);
		expect(h.calls('aiConnectCopySecret')[0].param).toEqual({ accountId: 'acc-1', appHash: 'hash-cmd', text: ENTRY.replace('<KEY>', key) });
		holdsNoKey(ctrl);

		// Claude Desktop by hand (no bundle in this build): the settings file's entry, recorded as a command setup
		h.main.m.plans['claude-desktop'] = CLAUDE_CONFIG_PLAN;

		const claude = await open({ appId: 'claude-desktop', view: 'manual' });

		expect(h.calls('aiConnectPlan').slice(-1)[0].param.method).toBe('config');
		await claude.createKey();
		expect(claude.get().manual).toMatchObject({ mode: 'confirm', keyHash: 'hash-1' });
		holdsNoKey(claude);
		expect(await claude.copyStep(claude.get().manual.steps[0].snippet)).toBe(true);
		expect(h.calls('aiConnectCopySecret')[1].param.text).toBe(ENTRY.replace('<KEY>', h.heart.rows.get('hash-1').apiKey));
		await claude.confirmManual();
		expect(h.calls('aiConnectRecordManual')[0].param).toMatchObject({ appId: 'claude-desktop', appHash: 'hash-1', setup: 'command', route: 'stdio' });
		holdsNoKey(claude);
	});
});
