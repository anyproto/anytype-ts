import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// The app's modules in their usual order (the app icon reads the theme store, which needs the Component barrel loaded first)
import 'Component';
import { withPopup, withThemeSync } from '../../../../../.storybook/decorators';
import * as I from 'Interface';
import { DEFAULT_GRANT } from 'Lib/aiConnect/catalog';
import AiConnectManual, { type AiConnectManualProps } from './manual';
import { GRANT_ALL, noop, PLAN_CLAUDE_CODE_SANDBOX, PLAN_CLAUDE_DESKTOP, PLAN_CURSOR, PLAN_OTHER, PLAN_OTHER_COMMAND, SPACES, STEPS_OTHER_COMMAND_DONE, STORY_KEY } from './stories.data';

/** Name and access live in the container; here in story state */
const Stateful = (props: AiConnectManualProps) => {
	const [ name, setName ] = useState(props.name);
	const [ grant, setGrant ] = useState<I.LinkAppGrant>(props.grant);

	return <AiConnectManual {...props} name={name} grant={grant} onName={v => { setName(v); props.onName(v); }} onGrant={v => { setGrant(v); props.onGrant(v); }} />;
};

const meta: Meta<typeof AiConnectManual> = {
	title: 'Popup/AiConnect/Manual',
	component: AiConnectManual,
	decorators: [ withPopup('AiConnect'), withThemeSync(() => S.Common) ],
	render: args => <Stateful {...args} />,
	// Observable in the Actions panel: what Copy emits, and the Create key / I've updated / Check again clicks
	argTypes: {
		onCopy: { action: 'copy' },
		onCreateKey: { action: 'createKey' },
		onConfirm: { action: 'confirm' },
		onRecheck: { action: 'recheck' },
		onReveal: { action: 'reveal' },
		onName: { action: 'name' },
		onGrant: { action: 'grant' },
	},
	args: {
		appName: 'Cursor',
		appId: 'cursor',
		mode: 'done',
		steps: PLAN_CURSOR.steps,
		planLoading: false,
		apiKey: STORY_KEY,
		withName: false,
		name: 'Cursor',
		// The new default: no space chosen yet (H20)
		grant: DEFAULT_GRANT,
		spaces: SPACES,
		busy: false,
		apiListening: true,
		onDone: noop,
		onCancel: noop,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Cursor's steps with the key in place, masked until Show */
export const Manual: Story = { args: { grant: GRANT_ALL } };

/** After a failed delivery: the new key, recorded only by "I've updated Cursor" */
export const ManualConfirm: Story = { args: { mode: 'confirm', grant: GRANT_ALL } };

/** Other app before Create key: a name, the access, the steps with <KEY> */
export const ManualOther: Story = { args: { appName: 'Other app', appId: 'other', mode: 'create', apiKey: '', withName: true, name: 'Other app', steps: PLAN_OTHER.steps } };

/** Other app, the URL setup chosen, with the choice of setups on a computer that offers both */
export const ManualOtherSetups: Story = {
	args: { appName: 'Other app', appId: 'other', mode: 'create', apiKey: '', withName: true, name: 'Other app', steps: PLAN_OTHER.steps, setups: [ 'url', 'command' ], setup: 'url', onSetup: noop },
};

/** Other app, Command chosen: the key will stay in a private file in the Anytype folder; no <KEY> anywhere */
export const ManualOtherCommand: Story = {
	args: { appName: 'Other app', appId: 'other', mode: 'create', apiKey: '', withName: true, name: 'Other app', steps: PLAN_OTHER_COMMAND.steps, setups: [ 'url', 'command' ], setup: 'command', onSetup: noop },
};

/** Other app, Command, after Create key: the setup text with the connection's id, and nothing to copy but it */
export const ManualOtherCommandDone: Story = {
	args: { appName: 'My agent', appId: 'other', mode: 'done', apiKey: '', steps: STEPS_OTHER_COMMAND_DONE, notice: 'The key is saved. Add the setup text above to the app.' },
};

/** Claude Desktop: Anytype keeps the key in its own folder; nothing to copy */
export const ManualClaudeDesktop: Story = { args: { appName: 'Claude Desktop', appId: 'claude-desktop', mode: 'create', apiKey: '', steps: PLAN_CLAUDE_DESKTOP.steps } };

/** Claude Code's command removed the old entry and didn't add the new one */
export const ManualRestoreOld: Story = {
	args: { appName: 'Claude Code', appId: 'claude-code', mode: 'restoreOld', steps: PLAN_CLAUDE_CODE_SANDBOX.steps, oldKey: 'storybook-previous-key-not-real', onRestored: noop },
};

/** An outdated Claude CLI: the prerequisite only, Check again, no key (V8) */
export const ManualPrerequisite: Story = {
	args: { appName: 'Claude Code', appId: 'claude-code', mode: 'prerequisite', apiKey: '', steps: [ { textKey: 'aiConnectManualUpdateCli', args: [ 'Claude Code', '2.1.327' ] } ] },
};

/** No steps: this package can't be started by other apps */
export const ManualUnavailable: Story = {
	args: { appName: 'Claude Desktop', appId: 'claude-desktop', mode: 'create', apiKey: '', steps: [], reason: 'This Anytype package can\'t be started by other apps, so it can\'t be added to Claude Desktop. Use the .deb, .rpm or tar.gz build.' },
};

/** Recorded, but the settings file is readable by others and the list couldn't be saved: both notices, Save again (W14) */
export const ManualUnsaved: Story = {
	args: {
		notice: 'Other users of this computer may be able to read Cursor\'s settings file, and Anytype couldn\'t change that. Check the file\'s permissions.',
		unsaved: true,
	},
};

/** Recorded, but the check with the new key failed: Retry check (W14) */
export const ManualProbeFailed: Story = { args: { appName: 'Other app', appId: 'other', apiKey: STORY_KEY, steps: PLAN_OTHER.steps, probeFailed: true } };

/** Claude Desktop with a key file of someone else's: Create key replaces exactly that one (W8) */
export const ManualClaudeReplace: Story = { args: { appName: 'Claude Desktop', appId: 'claude-desktop', mode: 'create', apiKey: '', steps: PLAN_CLAUDE_DESKTOP.steps, replace: true } };

/** The Local API isn't listening on the steps' address: the key is withheld, the steps redacted (X4) */
export const ManualApiOff: Story = { args: { mode: 'confirm', apiKey: '', keyHidden: true, apiListening: false } };

/** Hermes already uses Anytype through the gateway's bot account: never replaced; the same entry under anytype_me, by hand */
export const ManualHermesGateway: Story = {
	args: {
		appName: 'Hermes',
		appId: 'hermes',
		mode: 'create',
		apiKey: '',
		reason: translate('aiConnectHermesGateway'),
		steps: [
			{ textKey: 'aiConnectManualOpen', args: [ '~/.hermes/.env' ], path: '/Users/me/.hermes/.env' },
			{ textKey: 'aiConnectManualHermesEnv', snippet: 'MCP_ANYTYPE_ME_API_KEY=<KEY>', lang: 'text' },
			{ textKey: 'aiConnectManualOpen', args: [ '~/.hermes/config.yaml' ], path: '/Users/me/.hermes/config.yaml' },
			{ textKey: 'aiConnectManualMerge', snippet: 'mcp_servers:\n  anytype_me:\n    url: http://127.0.0.1:31009/mcp/full\n    headers:\n      Authorization: Bearer ${MCP_ANYTYPE_ME_API_KEY}\n', lang: 'yaml' },
			{ textKey: 'aiConnectManualHermesProfile' },
		],
	},
};
