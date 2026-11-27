import { describe, expect, test } from 'vitest';
import type { AiStep } from '../../interface/aiConnect';
import { KEY_PLACEHOLDER } from './catalog';
import { canCopyStep, errorKey, fillStep, KEY_MASK, keyText, sentenceArgs, stepNeedsKey, stepsNeedKey, unsupportedKey, withFinishingStep } from './steps';
import { parseAiConnectRoute } from './deeplink';

const KEY = 'SENTINEL-key-abcdefghijklmnop';
const withKey: AiStep = { textKey: 'aiConnectManualMerge', snippet: `{"Authorization":"Bearer ${KEY_PLACEHOLDER}","x":"${KEY_PLACEHOLDER}"}`, lang: 'json' };
const noKey: AiStep = { textKey: 'aiConnectManualRun', snippet: 'claude mcp add-json --scope user anytype -', lang: 'sh' };
const textOnly: AiStep = { textKey: 'aiConnectManualPrepare' };

describe('steps', () => {
	test('before a key exists the placeholder stays and Copy is off for snippets that need it', () => {
		expect(fillStep(withKey, '', true)).toBe(withKey.snippet);
		expect(fillStep(withKey, '', false)).toBe(withKey.snippet);
		expect(canCopyStep(withKey, '')).toBe(false);
		expect(canCopyStep(noKey, '')).toBe(true);
		expect(canCopyStep(textOnly, KEY)).toBe(false);
	});

	test('masked on screen, the real key in the copy value, every placeholder replaced', () => {
		const shown = fillStep(withKey, KEY, true);
		const copied = fillStep(withKey, KEY, false);

		expect(shown).not.toContain(KEY);
		expect(shown).not.toContain(KEY_PLACEHOLDER);
		expect(shown.split(KEY_MASK)).toHaveLength(3);
		expect(copied).toBe(`{"Authorization":"Bearer ${KEY}","x":"${KEY}"}`);
		expect(canCopyStep(withKey, KEY)).toBe(true);
	});

	test('the mask does not tell the key length', () => {
		expect(fillStep(withKey, 'a'.repeat(16), true)).toBe(fillStep(withKey, 'b'.repeat(64), true));
		expect(keyText(KEY, false)).toBe(KEY_MASK);
		expect(keyText(KEY, true)).toBe(KEY);
		expect(keyText('', true)).toBe(KEY_PLACEHOLDER);
	});

	test('the key row only when a step needs a key', () => {
		expect(stepNeedsKey(withKey)).toBe(true);
		expect(stepNeedsKey(noKey)).toBe(false);
		expect(stepsNeedKey([ textOnly, noKey ])).toBe(false);
		expect(stepsNeedKey([ textOnly, withKey ])).toBe(true);
	});

	test('sentence arguments follow each text', () => {
		expect(sentenceArgs('aiConnectPlanConfigRestart', 'Cursor', '~/.cursor/mcp.json')).toEqual([ 'Cursor', '~/.cursor/mcp.json', 'Cursor' ]);
		expect(sentenceArgs('aiConnectPlanConfigReload', 'LM Studio', '~/x')).toEqual([ 'LM Studio', '~/x' ]);
		expect(sentenceArgs('aiConnectPlanConfigMcpReload', 'Antigravity', '~/.gemini/config/mcp_config.json')).toEqual([ 'Antigravity', '~/.gemini/config/mcp_config.json' ]);
		expect(sentenceArgs('aiConnectPlanPackage', 'Claude Desktop', '')).toEqual([ 'Claude Desktop', 'Claude Desktop' ]);
		expect(sentenceArgs('aiConnectPlanManual', 'Codex', '~/x')).toEqual([ 'Codex' ]);
	});

	test('text keys of unsupported cards and error categories', () => {
		expect(unsupportedKey('chatgpt-web')).toBe('aiConnectUnsupportedChatgptWeb');
		expect(unsupportedKey('claude-web')).toBe('aiConnectUnsupportedClaudeWeb');
		expect(unsupportedKey('chatgpt-classic')).toBe('aiConnectUnsupportedChatgptClassic');
		expect(unsupportedKey('gemini')).toBe('aiConnectUnsupportedGemini');
		expect(errorKey('cliTooOld')).toBe('aiConnectErrorCliTooOld');
		expect(errorKey('')).toBe('aiConnectErrorUnknown');
	});
});

describe('withFinishingStep (V24)', () => {
	const plan = (over: any) => ({ appId: 'cursor', nextStep: 'restart', instructions: {}, steps: [ { textKey: 'aiConnectManualOpen' }, withKey ], ...over }) as any;

	test('the app\'s reload instruction ends the steps', () => {
		expect(withFinishingStep(plan({}), 'Cursor').pop()).toEqual({ textKey: 'aiConnectStepRestartSelf', args: [ 'Cursor' ] });
		expect(withFinishingStep(plan({ nextStep: 'newSession' }), 'Codex').pop()).toEqual({ textKey: 'aiConnectStepNewSession', args: [ 'Codex' ] });
		expect(withFinishingStep(plan({ nextStep: 'reloadServer', instructions: { reloadServer: 'aiConnectStepCopilotCli' } }), 'VS Code').pop().textKey).toBe('aiConnectStepCopilotCli');
		expect(withFinishingStep(plan({ nextStep: 'toggle', instructions: { toggle: 'aiConnectStepToggle' } }), 'LM Studio').pop().textKey).toBe('aiConnectStepToggle');
	});

	test('not twice, not for nothing to do, not without steps', () => {
		expect(withFinishingStep(plan({ steps: [ withKey, { textKey: 'aiConnectStepRestartSelf', args: [ 'Claude' ] } ] }), 'Claude')).toHaveLength(2);
		expect(withFinishingStep(plan({ nextStep: 'none' }), 'Other app')).toHaveLength(2);
		expect(withFinishingStep(plan({ nextStep: 'confirmInApp' }), 'LM Studio')).toHaveLength(2);
		expect(withFinishingStep(plan({ steps: [] }), 'Cursor')).toEqual([]);
	});
});

describe('parseAiConnectRoute', () => {
	test('the app id of a known card', () => {
		expect(parseAiConnectRoute('/ai/connect?app=cursor')).toEqual({ app: 'cursor' });
		expect(parseAiConnectRoute('ai/connect?app=claude-code')).toEqual({ app: 'claude-code' });
	});

	test('every other field is dropped', () => {
		expect(parseAiConnectRoute('/ai/connect/?app=cursor&key=x&route=y')).toEqual({ app: 'cursor' });
		expect(parseAiConnectRoute('/ai/connect?key=x&app=cursor#frag')).toEqual({ app: 'cursor' });
	});

	test('an unknown or missing app → \'\'', () => {
		expect(parseAiConnectRoute('/ai/connect?app=nope')).toEqual({ app: '' });
		expect(parseAiConnectRoute('/ai/connect?app=__proto__')).toEqual({ app: '' });
		expect(parseAiConnectRoute('/ai/connect')).toEqual({ app: '' });
	});

	test('any other path → null', () => {
		expect(parseAiConnectRoute('/ai/other')).toBeNull();
		expect(parseAiConnectRoute('/ai/connect/x')).toBeNull();
		expect(parseAiConnectRoute('/main/ai/connect?app=cursor')).toBeNull();
		expect(parseAiConnectRoute('')).toBeNull();
	});
});
