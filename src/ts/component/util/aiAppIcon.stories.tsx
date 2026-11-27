import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// The app's modules in their usual order (the icon reads the theme store, which needs the Component barrel loaded first)
import 'Component';
import { withThemeSync } from '../../../../.storybook/decorators';
import AiAppIcon from './aiAppIcon';
import { CATALOG } from 'Lib/aiConnect/catalog';

/** A 32×32 PNG (a filled square), standing in for the icon main reads from the installed app */
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAM0lEQVR4nO3OsQkAMAgAQbfMKM7qNKa3FwK5h+8vQhpVnt4cAAAAAAAAAAAAAOB9gL7rAtyj9czf2nKYAAAAAElFTkSuQmCC';

const meta: Meta<typeof AiAppIcon> = {
	title: 'Util/AiAppIcon',
	component: AiAppIcon,
	parameters: { container: { padding: 16 } },
	decorators: [ withThemeSync(() => S.Common) ],
	args: { name: 'Cursor' },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Claude Desktop, Claude on the web and mobile */
export const Claude: Story = { args: { appId: 'claude-desktop', name: 'Claude Desktop' } };

/** Claude Code */
export const ClaudeCode: Story = { args: { appId: 'claude-code', name: 'Claude Code' } };

/** ChatGPT, ChatGPT Classic, ChatGPT on the web */
export const Chatgpt: Story = { args: { appId: 'chatgpt', name: 'ChatGPT' } };

/** Codex */
export const Codex: Story = { args: { appId: 'codex', name: 'Codex' } };

/** Cursor: its official light and dark marks */
export const Cursor: Story = { args: { appId: 'cursor', name: 'Cursor' } };

/** VS Code + GitHub Copilot: the Copilot mark */
export const Copilot: Story = { args: { appId: 'vscode', name: 'VS Code + GitHub Copilot' } };

/** LM Studio: its official color icon */
export const LmStudio: Story = { args: { appId: 'lmstudio', name: 'LM Studio' } };

/** Gemini CLI */
export const GeminiCli: Story = { args: { appId: 'gemini-cli', name: 'Gemini CLI' } };

/** Antigravity */
export const Antigravity: Story = { args: { appId: 'antigravity', name: 'Antigravity' } };

/** OpenCode */
export const Opencode: Story = { args: { appId: 'opencode', name: 'OpenCode' } };

/** The Gemini app (its card is unsupported) */
export const Gemini: Story = { args: { appId: 'gemini', name: 'Gemini' } };

/** Other app: the MCP mark */
export const OtherApp: Story = { args: { appId: 'other', name: 'Other app' } };

/** Every card in catalog order; the mark wins over the installed app's icon */
export const AllCards: Story = {
	render: () => (
		<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
			{CATALOG.map(item => <AiAppIcon key={item.id} appId={item.id} name={item.name || item.id} icon={PNG} />)}
		</div>
	),
};

/** No mark for the card: the installed app's own icon */
export const WithIcon: Story = { args: { appId: 'unknown', name: 'Zed', icon: PNG } };

/** No mark and no icon from the system: the first letter */
export const Letter: Story = { args: { appId: 'unknown', name: 'Zed' } };

/** An icon that can't be shown falls back to the letter */
export const BrokenIcon: Story = { args: { appId: 'unknown', name: 'Zed', icon: 'data:image/png;base64,broken' } };
