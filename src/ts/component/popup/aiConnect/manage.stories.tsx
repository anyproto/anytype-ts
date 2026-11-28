import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// The app's modules in their usual order (the app icon reads the theme store, which needs the Component barrel loaded first)
import 'Component';
import { withPopup, withThemeSync } from '../../../../../.storybook/decorators';
import AiConnectManage, { AiConnectResult } from './manage';
import { CONNECTION_CURSOR, CONNECTION_OTHER, connection, formatDate, GRANT_ALL, GRANT_READ_ONE, noop, SPACES } from './stories.data';

const meta: Meta<typeof AiConnectManage> = {
	title: 'Popup/AiConnect/Manage',
	component: AiConnectManage,
	decorators: [ withPopup('AiConnect'), withThemeSync(() => S.Common) ],
	args: {
		appName: 'Cursor',
		appId: 'cursor',
		connection: CONNECTION_CURSOR,
		access: { grant: GRANT_ALL, expireAt: 0, present: true },
		spaces: SPACES,
		siblings: [],
		busy: false,
		apiListening: true,
		formatDate,
		onSaveAccess: noop,
		onSaveTier: noop,
		onReveal: noop,
		onReconnect: noop,
		onReplace: noop,
		onDisconnect: noop,
		onForget: noop,
		onRetry: noop,
		onRetryCheck: noop,
		onManual: noop,
		onClose: noop,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Manage: Story = {};

/** Only read, one space, an expiry */
export const ManageReadOnly: Story = { args: { access: { grant: GRANT_READ_ONE, expireAt: 1900000000, present: true } } };

/** Change access, inline */
export const ManageEditAccess: Story = { args: { initialEditing: 'access' } };

/** The entry in the file belongs to another account or was added by hand */
export const ManageConflict: Story = { args: { connection: connection({ status: 'conflict' }) } };

/** Disconnected, but heart didn't confirm the revoke: Retry */
export const ManageRevokeFailed: Story = { args: { connection: connection({ status: 'revokeFailed', removed: true, revokePending: [ 'hash-1' ] }) } };

export const ManageRemoved: Story = { args: { connection: connection({ status: 'removed' }) } };

export const ManageProbeFailed: Story = { args: { connection: connection({ lastProbe: 'unauthorized' }) } };

/** ChatGPT's record, also used by Codex */
export const ManageShared: Story = {
	args: { appName: 'ChatGPT', appId: 'chatgpt', connection: connection({ id: 'codex', appId: 'chatgpt', name: 'ChatGPT', displayTarget: '~/.codex/config.toml' }), siblings: [ 'Codex' ] },
};

/** An Other-app connection: no file, the tool set is part of what the user pasted */
/** Claude Desktop set up through its settings file, with a bundle Claude could install: "Use Claude's extension" (R8) */
export const ManageClaudeUseExtension: Story = {
	args: {
		appName: 'Claude Desktop', appId: 'claude-desktop', onUseExtension: noop,
		connection: connection({
			id: 'claude-desktop', appId: 'claude-desktop', name: 'Claude Desktop', route: 'stdio', method: 'config',
			targetPath: '/Users/me/Library/Application Support/Claude/claude_desktop_config.json', displayTarget: '~/Library/Application Support/Claude/claude_desktop_config.json',
		}),
	},
};

export const ManageOther: Story = { args: { appName: 'Zed', appId: 'other', connection: CONNECTION_OTHER, access: { grant: GRANT_READ_ONE, expireAt: 0, present: true } } };

/** After a disconnect that left the entry in place */
export const ManageResult: Story = {
	render: () => (
		<AiConnectResult
			appName="Cursor"
			lines={[ 'The key is deleted, so the entry no longer works, but Anytype couldn\'t remove it from ~/.cursor/mcp.json. You can delete it by hand.' ]}
			reveal={true}
			onReveal={noop}
			onClose={noop}
		/>
	),
};

/** A conflict, and the key lookup failed: Try again; Replace and Reconnect wait for a lookup that worked (W2) */
export const ManageLookupFailed: Story = { args: { connection: connection({ status: 'conflict' }), access: null, lookupFailed: true, onRetryLookup: noop } };

/** After a disconnect that left the entry in another Codex home's file: its path to copy, no Reveal (W19) */
export const ManageResultCopyPath: Story = {
	render: () => (
		<AiConnectResult
			appName="Codex"
			lines={[ 'Anytype couldn\'t remove its entry from ~/old/.codex/config.toml. You can delete it by hand.', 'Anytype deleted the key it gave Codex.' ]}
			reveal={false}
			path="/Users/me/old/.codex/config.toml"
			onReveal={noop}
			onCopyPath={noop}
			onClose={noop}
		/>
	),
};
