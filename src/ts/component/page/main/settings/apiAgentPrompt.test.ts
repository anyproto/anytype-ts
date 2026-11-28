import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Url from 'json/url';

vi.mock('Component', () => ({
	Label: ({ text, className }: { text: string; className?: string }) => React.createElement('div', { className: `label ${className || ''}` }, text),
}));

import ApiAgentPrompt, { agentPrompt, listeningAddr } from './apiAgentPrompt';

// The real strings (the test setup mocks json/text.json)
const TEXT = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../../json/text.json'), 'utf8'));
const t = (key: string): string => TEXT[key] ?? key;
const OK = { success: true, listenAddr: '127.0.0.1:31012', error: '' };

let copyToast: ReturnType<typeof vi.fn>;

beforeEach(() => {
	copyToast = vi.fn();
	vi.stubGlobal('translate', t);
	vi.stubGlobal('J', { Url });
	vi.stubGlobal('U', { Common: { copyToast } });
});

afterEach(() => {
	vi.unstubAllGlobals();
});

const render = (props: any) => renderToStaticMarkup(React.createElement(ApiAgentPrompt, props));

/** The Copy prompt button's click, as React would call it (the element tree, not the markup) */
const click = (props: any) => {
	const tree: any = (ApiAgentPrompt as any)(props);
	const button = tree.props.children.find((c: any) => c?.type == 'button');

	button.props.onClick();
	return button;
};

describe('Local API page: Copy prompt', () => {
	test('the prompt is exactly the skill sentence with the listening address', () => {
		expect(Url.agentSkill).toBe('https://developers.anytype.io/skill.md');
		expect(agentPrompt('127.0.0.1:31012')).toBe('Read https://developers.anytype.io/skill.md and use it to connect to Anytype on this computer (Local API at http://127.0.0.1:31012).');
	});

	test('H22: a native, named button; on and bound: copies the prompt with the "Prompt copied" toast', () => {
		const html = render({ enabled: true, status: OK });

		expect(html).toContain('Let AI agents connect');
		expect(html).toContain(t('localApiAgentPromptText'));
		expect(html).toMatch(/<button type="button" class="button black size28 copyPrompt ?"[^>]*>Copy prompt<\/button>/);
		expect(html).not.toContain('disabled');

		click({ enabled: true, status: OK });
		expect(copyToast).toHaveBeenCalledWith('', agentPrompt('127.0.0.1:31012'), 'Prompt copied');
	});

	test('H12: off, starting or a failed bind: disabled with its hint, nothing copied', () => {
		const off = render({ enabled: false, status: OK });
		const starting = render({ enabled: true, status: null });
		const failed = render({ enabled: true, status: { success: false, listenAddr: '', error: 'address in use' } });

		expect(off).toContain('Turn on the Local API first');
		expect(starting).toContain(t('localApiAgentPromptStarting'));
		expect(failed).toContain(t('localApiAgentPromptFailed').replace(/'/g, '&#x27;'));
		for (const html of [ off, starting, failed ]) {
			expect(html).toMatch(/<button[^>]*disabled=""/);
		};

		click({ enabled: true, status: { success: false, listenAddr: '127.0.0.1:31009', error: 'address in use' } });
		expect(copyToast).not.toHaveBeenCalled();
		expect(listeningAddr({ success: true, listenAddr: '127.0.0.1:99999', error: '' } as any)).toBe('');
	});
});
