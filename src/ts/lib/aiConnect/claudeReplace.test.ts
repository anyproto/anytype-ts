/**
 * Claude Desktop, renderer side: the extension replacing the Anytype entry in Claude's settings file (the same
 * Replace consent as the settings-file routes, own entry included), the waiting view's clipboard wording before
 * and after main clears the key, and the text of a build without a usable bundle.
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
import AiConnectForm from '../../component/popup/aiConnect/form';
import { errorText, planReason } from '../../component/popup/aiConnect/text';
import { AiConnectController, type AiConnectPopupData } from './controller';
import * as flow from './flow';
import { isValidLinkGrant } from '../linkApprovalGrant';
import UtilString from '../util/string';
import { BASE_PLAN, GRANT, installHarness, record, until, type Harness } from './testHarness';

const TEXT = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../json/text.json'), 'utf8'));
const APP = 'Claude Desktop';
const CONFIG = '/Users/me/Library/Application Support/Claude/claude_desktop_config.json';

let h: Harness;
let ui: { close: () => void; toast: (msg: any) => void };
const live: AiConnectController[] = [];

const BUNDLE_PLAN: any = {
	...BASE_PLAN, appId: 'claude-desktop', targetId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'package', nextStep: 'confirmInApp', displayTarget: '',
	sentenceKey: 'aiConnectPlanPackage', targetPath: undefined, steps: [],
};
const REPLACE = { targetPath: CONFIG, foreignDigest: 'c'.repeat(64) };
/** The extension's plan over an entry in Claude's settings file: someone else's, or this account's own */
const replacePlan = (existing: 'foreign' | 'ours'): any => ({ ...BUNDLE_PLAN, existing, replace: { ...REPLACE }, note: 'aiConnectClaudeReplaceConfig' });

const views = () => {
	vi.stubGlobal('translate', (k: string) => TEXT[k] ?? k);
	vi.stubGlobal('U', { String: UtilString });
	(globalThis as any).S.Common = { getThemePath: () => '' };
};
const fill = (key: string, ...args: string[]): string => UtilString.sprintf(TEXT[key], ...args);
const esc = (s: string): string => renderToStaticMarkup(React.createElement('i', null, s)).replace(/^<i>|<\/i>$/g, '');

const open = async (data: AiConnectPopupData): Promise<AiConnectController> => {
	await flow.load();

	const ctrl = new AiConnectController(data, ui, APP);

	live.push(ctrl);
	ctrl.init();
	await until(() => !ctrl.get().planLoading && !ctrl.get().manual.loading);
	if (!isValidLinkGrant(ctrl.get().form.grant)) {
		ctrl.setForm({ grant: { ...GRANT } });
	};
	return ctrl;
};

const formProps = (plan: any) => ({
	appName: APP, appId: 'claude-desktop', routes: [ 'stdio' ], route: 'stdio', tier: 'full', grant: GRANT, spaces: [], name: APP, days: 0,
	plan, planLoading: false, busy: false, apiListening: true, fullOnly: true, formatDate: String,
	onGrant: vi.fn(), onName: vi.fn(), onDays: vi.fn(), onTier: vi.fn(), onRoute: vi.fn(), onSubmit: vi.fn(), onManual: vi.fn(), onCancel: vi.fn(),
});

const finishHtml = (bundle: any) => renderToStaticMarkup(React.createElement(AiConnectFinish, {
	appName: APP, appId: 'claude-desktop', phase: 'bundle', instructions: {}, canRestart: false, busy: false,
	bundle: { state: 'finish', copyFailed: false, openFailed: false, configure: false, stopped: false, copied: false, ...bundle },
	onCancel: vi.fn(), onQuitContinue: vi.fn(), onContinueSelf: vi.fn(), onOpenApp: vi.fn(), onRestart: vi.fn(), onDone: vi.fn(), onLater: vi.fn(), onManual: vi.fn(),
	onFileRoute: vi.fn(), onRevealBundle: vi.fn(), onCopyKey: vi.fn(), onOpenBundle: vi.fn(), onCancelSetup: vi.fn(), onCheckBundle: vi.fn(), onClose: vi.fn(),
} as any));

beforeEach(() => {
	h = installHarness();
	ui = { close: vi.fn(), toast: vi.fn() };
	h.main.m.plans['claude-desktop'] = BUNDLE_PLAN;
});

afterEach(async () => {
	for (const c of live.splice(0)) {
		await c.dispose();
	};
	flow.flowConfig.clipboardTtl = 5 * 60 * 1000;
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('Claude Desktop: the extension replaces the settings-file entry (renderer)', () => {
	test('replace-sheet: the extension\'s Replace plan offers "Replace and connect" with its own note (what is removed), not the generic replace notice; its own entry too', () => {
		views();

		for (const existing of [ 'foreign', 'ours' ] as const) {
			const html = renderToStaticMarkup(React.createElement(AiConnectForm, formProps(replacePlan(existing)) as any));

			expect(html).toContain(`>${esc(TEXT.aiConnectReplaceButton)}<`);
			expect(html).toContain(esc(fill('aiConnectClaudeReplaceConfig', APP)));
			expect(html).not.toContain(esc(fill('aiConnectReplaceNotice', APP)));
		};

		// The plain extension plan is a plain Connect
		const plain = renderToStaticMarkup(React.createElement(AiConnectForm, formProps(BUNDLE_PLAN) as any));

		expect(plain).toContain(`>${esc(TEXT.aiAppsConnect)}<`);
		expect(plain).not.toContain(esc(fill('aiConnectClaudeReplaceConfig', APP)));
	});

	test('replace-consent: without the Replace the extension\'s plan over this account\'s own entry mints nothing (needsReplace), as for a foreign one', async () => {
		h.main.m.plans['claude-desktop'] = replacePlan('ours');

		const res = await flow.connect({
			appId: 'claude-desktop', route: 'stdio', tier: 'full', recommendedTier: 'full', grant: GRANT, name: APP, expireAt: 0, method: 'package', existing: null, shown: BUNDLE_PLAN,
		});

		expect(res).toMatchObject({ kind: 'plan', reason: 'needsReplace' });
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectApply')).toHaveLength(0);
	});

	test('replace-foreign: Replace and connect sends exactly the consent shown with the apply; nothing is retired first', async () => {
		h.main.m.plans['claude-desktop'] = replacePlan('foreign');

		const ctrl = await open({ appId: 'claude-desktop' });

		ctrl.submit();
		await until(() => ctrl.get().phase == 'bundle');

		const [ apply ] = h.calls('aiConnectApply');

		expect(apply.param).toMatchObject({ method: 'package', tier: 'full', expectedHash: null, replace: REPLACE });
		expect(h.cmds()).not.toContain('aiConnectRetire');
	});

	test('replace-own: this account\'s settings-file record → no aiConnectRetire before the mint; main\'s commit queues the old key, which is revoked only after the delivery; one record remains', async () => {
		h.heart.add('hash-old', GRANT, 0, APP);
		h.existing({
			id: 'claude-desktop', appId: 'claude-desktop', name: APP, route: 'stdio', tier: 'large', recommendedTier: 'full', method: 'config', appHash: 'hash-old',
			targetPath: '/Users/me/.anytype/ai-connect/claude-desktop.json', entryDigest: 'd'.repeat(64),
		});
		h.main.m.plans['claude-desktop'] = replacePlan('ours');

		// The connect sheet for the card (a mapped record otherwise opens its Manage)
		const ctrl = await open({ appId: 'claude-desktop', view: 'connect' });

		ctrl.submit();
		await until(() => (ctrl.get().phase == 'bundle') && h.heart.state.revokes.includes('hash-old'));

		const [ apply ] = h.calls('aiConnectApply');
		const order = h.heart.state.order;

		expect(h.cmds()).not.toContain('aiConnectRetire');
		expect(apply.param).toMatchObject({ method: 'package', expectedHash: 'hash-old', replace: REPLACE });
		// The new key exists before the old one goes, and the old one goes only after main's commit
		expect(order.indexOf('CreateApp')).toBeLessThan(order.indexOf('RevokeApp:hash-old'));
		expect(h.cmds().indexOf('aiConnectApply')).toBeLessThan(h.cmds().lastIndexOf('aiConnectRevoked'));
		expect([ ...h.main.m.records.values() ]).toHaveLength(1);
		expect(h.main.m.records.get('claude-desktop')).toMatchObject({ method: 'package', appHash: 'hash-1', revokePending: [] });
	});

	test('replace-changed: main finds the entry changed (conflict) → back to the sheet with a fresh preview, no error view', async () => {
		h.main.m.plans['claude-desktop'] = replacePlan('foreign');
		h.main.m.apply = () => ({ ok: false, error: { stage: 'validate', category: 'conflict', path: CONFIG } });

		const ctrl = await open({ appId: 'claude-desktop' });
		const plans = h.calls('aiConnectPlan').length;

		ctrl.submit();
		await until(() => !ctrl.get().busy && (ctrl.get().view == 'connect') && (h.calls('aiConnectPlan').length > plans + 1));
		expect(ctrl.get().phase).not.toBe('error');
		expect(ctrl.get().view).toBe('connect');
	});
});

describe('Claude Desktop: the waiting view says where the key is', () => {
	test('finish-clipboard: every waiting sub-state says the key is copied while main holds it, and points to Copy key again after the clear', () => {
		views();

		const copied = esc(fill('aiConnectBundleClipboard', APP));
		const copiedConfigure = esc(TEXT.aiConnectBundleClipboardConfigure);
		const cleared = esc(TEXT.aiConnectBundleClipboardCleared);
		const cases: [ any, string ][] = [
			// The install dialog, and switched off: Claude asks for the key
			[ { state: 'finish' }, copied ],
			[ { state: 'finish', openFailed: true }, copied ],
			[ { state: 'finish', stopped: true }, copied ],
			[ { state: 'off' }, copied ],
			// Configure (installed, not confirmed or updated): the user pastes it there
			[ { state: 'notConfirmed' }, copiedConfigure ],
			[ { state: 'updated' }, copiedConfigure ],
			[ { state: 'finish', configure: true }, copiedConfigure ],
		];

		for (const [ bundle, text ] of cases) {
			const on = finishHtml({ ...bundle, copied: true });
			const off = finishHtml({ ...bundle, copied: false });

			expect(on).toContain(text);
			expect(on).not.toContain(cleared);
			expect(off).toContain(cleared);
			expect(off).not.toContain(copied);
			expect(off).not.toContain(copiedConfigure);
			expect(off).toContain(`>${esc(TEXT.aiConnectCopyKeyAgain)}<`);
		};

		// A key that couldn't be copied: its own notice and Copy key, no clipboard wording
		const failed = finishHtml({ copyFailed: true });

		expect(failed).toContain(esc(TEXT.aiConnectBundleCopyFailed));
		expect(failed).not.toContain(cleared);
		expect(failed).not.toContain(copied);
		expect(failed).toContain(`>${esc(TEXT.aiConnectCopyKey)}<`);
	});

	test('finish-clipboard: after Connect the sheet says copied; main\'s clear shows on the next check; Copy key again says copied until the deadline', async () => {
		flow.flowConfig.bundlePollTimeout = 5000;

		const ctrl = await open({ appId: 'claude-desktop' });

		ctrl.submit();
		await until(() => ctrl.get().phase == 'bundle');
		expect(ctrl.get().bundle.copied).toBe(true);
		await until(() => h.calls('aiConnectCheck').length > 1);
		expect(ctrl.get().bundle.copied).toBe(true);

		// Main cleared it (another copy, an account switch, its deadline): the watch's next check says so
		h.main.m.clipboard = null;
		expect(await until(() => !ctrl.get().bundle.copied)).toBe(true);

		// Copy key again: copied, then the deadline passes with no check needed
		flow.flowConfig.clipboardTtl = 30;
		await ctrl.copyKey();
		expect(ctrl.get().bundle.copied).toBe(true);
		expect(h.main.m.clipboard).toMatchObject({ connectionId: 'claude-desktop' });
		expect(await until(() => !ctrl.get().bundle.copied, 2000)).toBe(true);
	});

	test('finish-clipboard: the sheet opened again later shows what main says (key still copied, or not)', async () => {
		h.existing({ ...record({ id: 'claude-desktop', appId: 'claude-desktop', name: APP, route: 'stdio', tier: 'full', method: 'package', targetPath: '', appHash: 'hash-b' }) });
		h.main.m.statuses.set('claude-desktop', 'pending');
		h.main.m.clipboard = { text: 'x', connectionId: 'claude-desktop' };
		await flow.load();

		const ctrl = await open({ appId: 'claude-desktop', connectionId: 'claude-desktop', view: 'finish' } as any);

		await until(() => ctrl.get().phase == 'bundle');
		expect(ctrl.get().bundle.copied).toBe(true);
	});
});

describe('Claude Desktop: a build without a usable bundle (text)', () => {
	test('bundle-missing-text: a release build says what is missing and to reinstall; a development build adds how to build it; neither names Snap or Flatpak', () => {
		views();

		const release = errorText({ stage: 'verify', category: 'bundleMissing' }, APP);
		const dev = errorText({ stage: 'verify', category: 'bundleMissing', devBuild: true }, APP);

		expect(release).toBe(fill('aiConnectErrorBundleMissing', APP));
		expect(dev).toBe(fill('aiConnectErrorBundleMissingDev', APP));
		expect(dev).toContain('./update.sh');
		expect(dev).toContain('ANYTYPE_MCP_BIN');
		expect(release).not.toContain('update.sh');
		for (const text of [ release, dev ]) {
			expect(text).not.toMatch(/Snap|Flatpak|AppImage/);
		};
		expect(planReason({ ...BUNDLE_PLAN, canApply: false, method: 'manual', error: { stage: 'verify', category: 'bundleMissing', devBuild: true } }, APP)).toBe(dev);

		// The Linux package's text stays for the Linux package only
		expect(errorText({ stage: 'detect', category: 'unsupportedPackage' }, APP)).toBe(TEXT.aiConnectErrorUnsupportedPackage);
	});
});
