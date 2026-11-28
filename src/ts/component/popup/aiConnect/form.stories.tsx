import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// The app's modules in their usual order (the app icon reads the theme store, which needs the Component barrel loaded first)
import 'Component';
import { withPopup, withThemeSync } from '../../../../../.storybook/decorators';
import * as I from 'Interface';
import { DEFAULT_GRANT } from 'Lib/aiConnect/catalog';
import AiConnectForm, { type AiConnectFormProps } from './form';
import {
	formatDate, GRANT_ALL, GRANT_READ_ONE, noop, PLAN_CLAUDE_CODE_SANDBOX, PLAN_CLAUDE_DESKTOP, PLAN_CLAUDE_DESKTOP_NO_BUNDLE, PLAN_CLAUDE_DESKTOP_REPLACE, PLAN_CURSOR, PLAN_CURSOR_FOREIGN,
	PLAN_CURSOR_MANUAL, SPACES,
} from './stories.data';

/** The sheet's values live in its container; here in story state */
const Stateful = (props: AiConnectFormProps) => {
	const [ grant, setGrant ] = useState<I.LinkAppGrant>(props.grant);
	const [ name, setName ] = useState(props.name);
	const [ days, setDays ] = useState(props.days);
	const [ tier, setTier ] = useState<I.AiTier>(props.tier);
	const [ route, setRoute ] = useState<I.AiRoute>(props.route);

	return <AiConnectForm {...props} grant={grant} name={name} days={days} tier={tier} route={route} onGrant={setGrant} onName={setName} onDays={setDays} onTier={setTier} onRoute={setRoute} />;
};

const meta: Meta<typeof AiConnectForm> = {
	title: 'Popup/AiConnect/Connect',
	component: AiConnectForm,
	decorators: [ withPopup('AiConnect'), withThemeSync(() => S.Common) ],
	render: args => <Stateful {...args} />,
	args: {
		appName: 'Cursor',
		appId: 'cursor',
		routes: [ 'http' ],
		route: 'http',
		// The new defaults: nothing chosen yet, the card's default tier (H20)
		tier: 'full',
		grant: DEFAULT_GRANT,
		spaces: SPACES,
		name: 'Cursor',
		days: 0,
		plan: PLAN_CURSOR,
		planLoading: false,
		busy: false,
		apiListening: true,
		formatDate,
		onGrant: noop,
		onName: noop,
		onDays: noop,
		onTier: noop,
		onRoute: noop,
		onSubmit: noop,
		onManual: noop,
		onCancel: noop,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Cursor: read and edit, all spaces; what happens; one primary action */
export const Connect: Story = {};

/** Claude Code with its sandbox on: the route follows the plan (MCP tools) and the note says why */
export const ConnectAdvanced: Story = {
	args: { appName: 'Claude Code', appId: 'claude-code', name: 'Claude Code', routes: [ 'skill', 'http' ], route: 'http', plan: PLAN_CLAUDE_CODE_SANDBOX, initialAdvanced: true },
};

/** An Anytype entry this account didn't create: the button says it replaces it */
export const ConnectReplace: Story = { args: { plan: PLAN_CURSOR_FOREIGN } };

/** The space picker open with one space and "only read" */
export const ConnectSpaces: Story = { args: { grant: GRANT_READ_ONE, initialSpaces: true } };

/** A settings file Anytype can't read: manual setup is the way */
export const ConnectManualOnly: Story = { args: { plan: PLAN_CURSOR_MANUAL } };

/** A reconnect after the key is gone: prefilled, the stored expiry as a date */
export const ConnectReconnect: Story = { args: { notice: 'reconnect', fixedExpireAt: 1900000000, grant: GRANT_READ_ONE, initialAdvanced: true } };

/** A moved Codex home: the new location */
export const ConnectMoved: Story = {
	args: { appName: 'Codex', appId: 'codex', name: 'Codex', plan: { ...PLAN_CURSOR, appId: 'codex', displayTarget: '~/work/.codex/config.toml', sentenceKey: 'aiConnectPlanConfigSession' }, movedPath: '~/work/.codex/config.toml' },
};

/** The Local API is off: Connect is disabled */
export const ConnectApiOff: Story = { args: { apiListening: false } };

/** Claude Desktop's extension: the tool set is Full only; Advanced offers Claude's settings file instead (§3.3) */
export const ConnectClaudeExtension: Story = {
	args: { appName: 'Claude Desktop', appId: 'claude-desktop', routes: [ 'stdio' ], route: 'stdio', tier: 'full', plan: PLAN_CLAUDE_DESKTOP, fullOnly: true, onConfigRoute: noop, initialAdvanced: true },
};

/** Claude Desktop's extension over an Anytype entry in Claude's settings file: Replace and connect removes that entry */
export const ConnectClaudeExtensionReplace: Story = {
	args: { appName: 'Claude Desktop', appId: 'claude-desktop', routes: [ 'stdio' ], route: 'stdio', tier: 'full', plan: PLAN_CLAUDE_DESKTOP_REPLACE, fullOnly: true, onConfigRoute: noop },
};

/** A development build without Claude's extension bundle: what is missing and how to build it */
export const ConnectClaudeNoBundle: Story = {
	args: { appName: 'Claude Desktop', appId: 'claude-desktop', routes: [ 'stdio' ], route: 'stdio', tier: 'full', plan: PLAN_CLAUDE_DESKTOP_NO_BUNDLE, fullOnly: true },
};

/** While delivering */
export const ConnectBusy: Story = { args: { busy: true } };

/** A Replace on the settings-file fallback: the record's own key and values, which can't change here (W3) */
export const ConnectLocked: Story = {
	args: { appName: 'LM Studio', appId: 'lmstudio', name: 'LM work', plan: { ...PLAN_CURSOR_FOREIGN, appId: 'lmstudio', displayTarget: '~/.lmstudio/mcp.json' }, grant: GRANT_READ_ONE, fixedExpireAt: 1900000000, locked: true },
};
