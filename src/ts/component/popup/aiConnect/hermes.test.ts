import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { HERMES_AGENT_PROMPT, HERMES_PLUGIN, HERMES_SETUP } from 'Lib/aiConnect/hermes';
import AiConnectHermesGuide, { AiConnectHermesRemote } from './hermes';

// The real strings (the test setup mocks json/text.json)
const TEXT = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../json/text.json'), 'utf8'));
const t = (key: string): string => TEXT[key] ?? key;
const esc = (s: string): string => renderToStaticMarkup(React.createElement('code', null, s)).replace(/^<code>|<\/code>$/g, '');
const noop = () => {};

beforeEach(() => {
	vi.stubGlobal('translate', t);
	vi.stubGlobal('S', { Common: { getThemePath: () => '' } });
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('Hermes guides', () => {
	test('collapsed by default under the sheet: only the two section titles', () => {
		const html = renderToStaticMarkup(React.createElement(AiConnectHermesGuide, { sections: [ 'gateway', 'remote' ], onCopy: noop, onLink: noop }));

		expect(html).toContain('Chat with Hermes in Anytype');
		expect(html).toContain('Hermes on another machine');
		expect(html).toContain('aria-expanded="false"');
		expect(html).not.toContain('hermes plugins install');
	});

	test('the gateway section open: the checklist, its commands and the agent prompt; on Windows one line instead', () => {
		const html = renderToStaticMarkup(React.createElement(AiConnectHermesGuide, { sections: [ 'gateway', 'remote' ], open: [ 'gateway' ], onCopy: noop, onLink: noop }));

		expect(html).toContain(esc(t('aiConnectHermesStepInvite')));
		expect(html).toContain(`<code>${esc(HERMES_PLUGIN)}</code>`);
		expect(html).toContain(`<code>${esc(HERMES_SETUP)}</code>`);
		expect(html).toContain(`<code>${esc(HERMES_AGENT_PROMPT)}</code>`);
		expect(html).toContain(esc(t('aiConnectHermesUnix')));

		const win = renderToStaticMarkup(React.createElement(AiConnectHermesGuide, { sections: [ 'gateway' ], open: [ 'gateway' ], windows: true, onCopy: noop, onLink: noop }));

		expect(win).toContain(esc(t('aiConnectHermesWindows')));
		expect(win).not.toContain(esc(HERMES_PLUGIN));
	});

	test('H16: another machine: no hidden disclosure button; after Done, Tab reaches the first Copy (the trap\'s order)', () => {
		const html = renderToStaticMarkup(React.createElement(AiConnectHermesRemote, { appName: 'Hermes', onCopy: noop, onLink: noop, onClose: noop }));
		const buttons = html.match(/<button[^>]*>[^<]*/g) || [];

		expect(html).toContain('Hermes on another machine');
		expect(html).not.toContain('advancedToggle');
		expect(html).not.toContain('aria-expanded');
		// Focus order: the first button is a Copy, the last is Done (Tab from Done wraps to the first, Shift+Tab back)
		expect(buttons[0]).toContain('>Copy');
		expect(buttons[buttons.length - 1]).toContain('>Done');
		expect(html).toContain(`<code>${esc(HERMES_SETUP)}</code>`);
		expect(html).toContain(`<code>${esc(HERMES_AGENT_PROMPT)}</code>`);
	});
});
