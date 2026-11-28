/**
 * Story data for the AI connect popup and the AI apps page (imported by stories only). Plans and records
 * have the shapes main sends; the key is a placeholder that is obviously not one.
 */
import * as I from 'Interface';
import { FIXTURE_CONNECTION, FIXTURE_MANUAL_CONNECTION } from 'Lib/aiConnect/ipcFixtures';

export const STORY_KEY = 'storybook-preview-key-not-a-real-one';

export const noop = () => {};

export const SPACES: I.LinkApprovalSpace[] = [
	{ id: 'space-1', name: 'Personal', iconEmoji: '' },
	{ id: 'space-2', name: 'Work', iconEmoji: '' },
	{ id: 'space-3', name: 'Family recipes', iconEmoji: '' },
];

export const GRANT_ALL: I.LinkAppGrant = { spaceIds: [], allSpaces: true, perm: I.LocalApiPermission.ReadWrite };
export const GRANT_READ_ONE: I.LinkAppGrant = { spaceIds: [ 'space-2' ], allSpaces: false, perm: I.LocalApiPermission.Read };

export const formatDate = (t: number): string => new Date(t * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const plan = (over: Partial<I.AiPlan>): I.AiPlan => ({
	appId: 'cursor', targetId: 'cursor', route: 'http', tier: 'large', method: 'config', nextStep: 'restart',
	displayTarget: '~/.cursor/mcp.json', canApply: true, existing: 'none', sentenceKey: 'aiConnectPlanConfigRestart',
	instructions: { restart: 'aiConnectStepRestart', afterRestart: 'aiConnectHintCursor', added: 'aiConnectHintCursor' },
	steps: [
		{ textKey: 'aiConnectManualOpen', args: [ '~/.cursor/mcp.json' ], path: '/Users/me/.cursor/mcp.json' },
		{
			textKey: 'aiConnectManualMerge', lang: 'json',
			snippet: '{\n  "mcpServers": {\n    "anytype": {\n      "url": "http://127.0.0.1:31009/mcp/large",\n      "headers": {\n        "Authorization": "Bearer <KEY>"\n      }\n    }\n  }\n}',
		},
		{ textKey: 'aiConnectStepRestartSelf', args: [ 'Cursor' ] },
	],
	targetPath: '/Users/me/.cursor/mcp.json',
	...over,
});

export const PLAN_CURSOR = plan({});

export const PLAN_CURSOR_FOREIGN = plan({ existing: 'foreign', replace: { targetPath: '/Users/me/.cursor/mcp.json', foreignDigest: 'a'.repeat(64) } });

export const PLAN_CURSOR_MANUAL = plan({ canApply: false, method: 'manual', sentenceKey: 'aiConnectPlanManual', error: { stage: 'parse', category: 'unparseable' } });

export const PLAN_CLAUDE_CODE_SANDBOX = plan({
	appId: 'claude-code', targetId: 'claude-code', route: 'http', method: 'cli', nextStep: 'newSession', displayTarget: '',
	sentenceKey: 'aiConnectPlanCli', instructions: { newSession: 'aiConnectStepNewSession' }, note: 'aiConnectNoteSandbox', targetPath: undefined,
	steps: [
		{ textKey: 'aiConnectManualRun', snippet: 'claude mcp add-json --scope user anytype -', lang: 'sh' },
		{ textKey: 'aiConnectManualPasteStdin', snippet: '{"type":"http","url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer <KEY>"}}', lang: 'json' },
	],
});

/** The command entry with the key in its `env` (Other app's Command, Claude Desktop by hand); the screen masks <KEY> */
const COMMAND_ENTRY = '{\n  "mcpServers": {\n    "anytype": {\n      "command": "/Users/me/.anytype/bin/anytype-mcp",\n      "args": [\n        "serve",\n        "--tier",\n        "full"\n      ],\n      "env": {\n        "ANYTYPE_API_KEY": "<KEY>"\n      }\n    }\n  }\n}';

/** Claude's extension: Full only; the key goes in through Claude's own install dialog */
export const PLAN_CLAUDE_DESKTOP = plan({
	appId: 'claude-desktop', targetId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'package', nextStep: 'confirmInApp', displayTarget: '',
	sentenceKey: 'aiConnectPlanPackage', bundleSigned: false,
	instructions: { confirmInApp: 'aiConnectStepConfirm', stalled: 'aiConnectHintClaudeDesktop', restart: 'aiConnectStepRestart', toggle: 'aiConnectStepEnableExtension' },
	steps: [],
});

/** Claude's extension over an Anytype entry in Claude's settings file: Replace and connect removes that entry (Claude is quit first) */
export const PLAN_CLAUDE_DESKTOP_REPLACE: I.AiPlan = {
	...PLAN_CLAUDE_DESKTOP, existing: 'foreign', note: 'aiConnectClaudeReplaceConfig', preflight: 'quitApp', targetPath: undefined,
	replace: { targetPath: '/Users/me/Library/Application Support/Claude/claude_desktop_config.json', foreignDigest: 'b'.repeat(64) },
};

/** An entry the writer can't remove (two `anytype` members): never offered for Replace (R6) */
export const PLAN_CLAUDE_DESKTOP_CANT_REMOVE: I.AiPlan = {
	...PLAN_CLAUDE_DESKTOP, canApply: false, method: 'manual', sentenceKey: 'aiConnectPlanManual', needsKey: false, targetPath: undefined,
	note: 'aiConnectClaudeReplaceCantRemove', error: { stage: 'parse', category: 'unparseable' },
};

/** A development build without the connector and its bundle: nothing to install, with the hint how to build it */
export const PLAN_CLAUDE_DESKTOP_NO_BUNDLE: I.AiPlan = {
	...PLAN_CLAUDE_DESKTOP, canApply: false, method: 'manual', sentenceKey: 'aiConnectPlanManual', needsKey: false, targetPath: undefined,
	error: { stage: 'verify', category: 'bundleMissing', devBuild: true },
};

/** Claude Desktop by hand: its settings file's command entry, the key in `env` */
export const PLAN_CLAUDE_DESKTOP_MANUAL = plan({
	appId: 'claude-desktop', targetId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'config', nextStep: 'restart', displayTarget: '~/Library/Application Support/Claude/claude_desktop_config.json',
	sentenceKey: 'aiConnectPlanConfigRestart', needsKey: true, instructions: { restart: 'aiConnectStepRestart' },
	steps: [
		{ textKey: 'aiConnectManualMerge', snippet: COMMAND_ENTRY, lang: 'json', path: '/Users/me/Library/Application Support/Claude/claude_desktop_config.json' },
		{ textKey: 'aiConnectManualKeepPrivate' },
		{ textKey: 'aiConnectStepRestartSelf', args: [ 'Claude' ] },
	],
});

export const PLAN_LMSTUDIO = plan({
	appId: 'lmstudio', targetId: 'lmstudio', method: 'deeplink', nextStep: 'confirmInApp', displayTarget: '~/.lmstudio/mcp.json', tier: 'small',
	sentenceKey: 'aiConnectPlanDeeplink', instructions: { confirmInApp: 'aiConnectHintLmstudio', toggle: 'aiConnectStepToggle', added: 'aiConnectStepApproveFirstCall' },
});

export const PLAN_CHATGPT = plan({
	appId: 'chatgpt', targetId: 'codex', displayTarget: '~/.codex/config.toml', sentenceKey: 'aiConnectPlanConfigRestart',
	instructions: { restart: 'aiConnectStepRestart', newSession: 'aiConnectStepNewSession', added: 'aiConnectChatgptModes' },
});

/** Other app's Command setup: a manual plan whose entry carries the key in its `env` (masked on screen) */
export const PLAN_OTHER_COMMAND = plan({
	appId: 'other', targetId: null, route: 'stdio', method: 'manual', nextStep: 'none', displayTarget: '', canApply: false, sentenceKey: 'aiConnectPlanManual', instructions: {},
	targetPath: undefined, setups: [ 'url', 'command' ], needsKey: true,
	steps: [
		{ textKey: 'aiConnectManualCommandEntry', snippet: COMMAND_ENTRY, lang: 'json' },
		{ textKey: 'aiConnectManualKeepPrivate' },
		{ textKey: 'aiConnectManualCommandRestart' },
	],
});

export const PLAN_OTHER = plan({
	appId: 'other', targetId: null, method: 'manual', nextStep: 'none', displayTarget: '', canApply: true, sentenceKey: 'aiConnectPlanManual', instructions: {},
	targetPath: undefined,
	steps: [
		{
			textKey: 'aiConnectManualFormatMost', lang: 'json',
			snippet: '{\n  "mcpServers": {\n    "anytype": {\n      "url": "http://127.0.0.1:31009/mcp/large",\n      "headers": {\n        "Authorization": "Bearer <KEY>"\n      }\n    }\n  }\n}',
		},
		{ textKey: 'aiConnectManualUrl', snippet: 'http://127.0.0.1:31009/mcp/large', lang: 'text' },
		{ textKey: 'aiConnectManualHeaderName', snippet: 'Authorization', lang: 'text' },
		{ textKey: 'aiConnectManualHeaderValue', snippet: 'Bearer <KEY>', lang: 'text' },
	],
});

export const CONNECTION_CURSOR: I.AiConnection = { ...FIXTURE_CONNECTION, nextStep: 'none', lastProbe: 'ok', status: 'ok' };

export const CONNECTION_OTHER: I.AiConnection = { ...FIXTURE_MANUAL_CONNECTION, name: 'Zed', status: 'ok' };

export const connection = (over: Partial<I.AiConnection>): I.AiConnection => ({ ...CONNECTION_CURSOR, ...over });

export const detection = (appId: I.AiAppId, over: Partial<I.AiDetection> = {}): I.AiDetection => ({
	appId, installed: true, targetId: appId as I.AiTargetId, targetPaths: [ `/Users/me/.${appId}/config` ], canRestart: false, ...over,
});
