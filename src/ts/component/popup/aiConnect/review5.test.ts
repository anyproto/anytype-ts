/**
 * Phase 5 review, renderer views (SSR of the real components; the spaces picker is stubbed).
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('Component/form/appGrantFields', () => ({ default: () => null }));

import AiConnectForm from './form';
import AiConnectManual from './manual';
import { manualReason } from './text';
import { DEFAULT_GRANT } from 'Lib/aiConnect/catalog';
import { GRANT_ALL, PLAN_CURSOR, SPACES, formatDate, noop } from './stories.data';
import UtilString from 'Lib/util/string';

// The real strings (the test setup mocks json/text.json)
const TEXT = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../json/text.json'), 'utf8'));
const t = (key: string): string => TEXT[key] ?? key;
const esc = (s: string): string => renderToStaticMarkup(React.createElement('i', null, s)).replace(/^<i>|<\/i>$/g, '');

const formProps = (over: any = {}) => ({
	appName: 'Cursor', appId: 'cursor', routes: [ 'http' ], route: 'http', tier: 'full', grant: GRANT_ALL, spaces: SPACES, name: 'Cursor', days: 0,
	plan: PLAN_CURSOR, planLoading: false, busy: false, apiListening: true, formatDate,
	onGrant: noop, onName: noop, onDays: noop, onTier: noop, onRoute: noop, onSubmit: noop, onManual: noop, onCancel: noop,
	...over,
});

const HERMES_FOREIGN = { ...PLAN_CURSOR, appId: 'hermes', canApply: false, method: 'manual', existing: 'foreign', note: 'aiConnectHermesGateway', error: { stage: 'validate', category: 'conflict' }, replace: undefined };
const STEPS = [ { textKey: 'aiConnectManualHermesEnv', snippet: 'MCP_ANYTYPE_ME_API_KEY=<KEY>', lang: 'text' } ];

beforeEach(() => {
	vi.stubGlobal('translate', t);
	vi.stubGlobal('S', { Common: { getThemePath: () => '' } });
	vi.stubGlobal('U', { String: UtilString });
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('H9: Hermes conflict copy', () => {
	test('H9: a Hermes foreign plan never says Connecting replaces it', () => {
		const html = renderToStaticMarkup(React.createElement(AiConnectForm, formProps({ appName: 'Hermes', appId: 'hermes', plan: HERMES_FOREIGN })));

		expect(html).not.toContain(esc(t('aiConnectReplaceNotice').replace('%s', 'Hermes')));

		// A plan that does offer Replace still says so
		const cursor = renderToStaticMarkup(React.createElement(AiConnectForm, formProps({ plan: { ...PLAN_CURSOR, existing: 'foreign', replace: { targetPath: '/x', foreignDigest: 'a'.repeat(64) } } })));

		expect(cursor).toContain(esc(t('aiConnectReplaceNotice').replace('%s', 'Cursor')));
	});

	test('H9: the manual view shows the plan\'s note together with its steps', () => {
		const reason = manualReason(HERMES_FOREIGN as any, STEPS as any, 'Hermes');

		expect(reason).toBe(t('aiConnectHermesGateway'));

		const html = renderToStaticMarkup(React.createElement(AiConnectManual, { appName: 'Hermes', appId: 'hermes', mode: 'create', steps: STEPS, reason, grant: GRANT_ALL, spaces: SPACES, apiListening: true, onCopy: noop } as any));

		expect(html).toContain(esc(reason));
		expect(html).toContain('MCP_ANYTYPE_ME_API_KEY');
		// Without a note, a plan with steps needs no reason line (as before)
		expect(manualReason({ ...HERMES_FOREIGN, note: undefined } as any, STEPS as any, 'Hermes')).toBe('');
	});
});

describe('H15: the Full tier\'s file-tools note is visible', () => {
	test('H15: Claude Desktop (stdio) with Advanced closed shows it once; the manual view shows it beside its steps', () => {
		const hint = esc(t('aiConnectTierFullStdioHint'));
		const html = renderToStaticMarkup(React.createElement(AiConnectForm, formProps({ appName: 'Claude Desktop', appId: 'claude-desktop', routes: [ 'stdio' ], route: 'stdio' })));

		expect(html.split(hint).length - 1).toBe(1);
		expect(html).toContain('aria-expanded="false"');

		const open = renderToStaticMarkup(React.createElement(AiConnectForm, formProps({ appName: 'Claude Desktop', appId: 'claude-desktop', routes: [ 'stdio' ], route: 'stdio', initialAdvanced: true })));

		expect(open.split(hint).length - 1).toBe(1);

		const manual = renderToStaticMarkup(React.createElement(AiConnectManual, { appName: 'Other app', appId: 'other', mode: 'create', steps: STEPS, tierHint: t('aiConnectTierFullStdioHint'), grant: GRANT_ALL, spaces: SPACES, apiListening: true, onCopy: noop } as any));

		expect(manual).toContain(hint);
	});
});

describe('H19: the legacy Large option stays while editing', () => {
	test('H19: a Large connection switched to Essential still lists Large', () => {
		const html = renderToStaticMarkup(React.createElement(AiConnectForm, formProps({ tier: 'small', savedTier: 'large', initialAdvanced: true })));

		expect(html).toContain(esc(t('aiConnectTierLarge')));
		expect(renderToStaticMarkup(React.createElement(AiConnectForm, formProps({ tier: 'small', initialAdvanced: true })))).not.toContain(esc(t('aiConnectTierLarge')));
	});
});

describe('H20: stories show the new defaults', () => {
	test('H20: the default Connect and manual Create key stories use the empty grant and the Full tier', () => {
		const form = fs.readFileSync(path.resolve(__dirname, 'form.stories.tsx'), 'utf8');
		const manual = fs.readFileSync(path.resolve(__dirname, 'manual.stories.tsx'), 'utf8');
		const metaArgs = (src: string) => src.slice(src.indexOf('\targs: {'), src.indexOf('\n\t},', src.indexOf('\targs: {')));

		expect(DEFAULT_GRANT).toEqual({ spaceIds: [], allSpaces: false, perm: 1 });
		expect(metaArgs(form)).toContain('grant: DEFAULT_GRANT');
		expect(metaArgs(form)).toContain('tier: \'full\'');
		expect(metaArgs(manual)).toContain('grant: DEFAULT_GRANT');
	});
});
