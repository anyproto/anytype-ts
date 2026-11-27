import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import * as I from 'Interface';
import { withThemeSync } from '../../../../../../.storybook/decorators';
import { CATALOG } from 'Lib/aiConnect/catalog';
import { buildGallery } from 'Lib/aiConnect/gallery';
import { connection, CONNECTION_CURSOR, CONNECTION_OTHER, detection, noop } from 'Component/popup/aiConnect/stories.data';
import AiAppsList from './aiAppsList';

interface StoryProps {
	detections: I.AiDetection[];
	connections: I.AiConnection[];
	scanOk: boolean;
	isDesktop: boolean;
	apiState: I.AiApiState;
	loading: boolean;
	/** main's list was read at least once */
	loaded?: boolean;
	loadFailed?: boolean;
	cleanupFailed?: boolean;
};

const nameOf = (item: I.AiAppCatalogItem) => item.name || translate(item.nameKey);

/** The page's model from story data, rendered in the settings column. Every card shows its bundled mark (Util/AiAppIcon) */
const Page = ({ detections, connections, scanOk, isDesktop, apiState, loading, loaded = true, loadFailed, cleanupFailed }: StoryProps) => {
	const [ query, setQuery ] = useState('');
	const map = Object.fromEntries(detections.map(it => [ it.appId, it ]));
	const gallery = buildGallery({ catalog: CATALOG, detections: map, connections, scanOk, isDesktop, loaded, apiListening: (apiState == 'listening'), query, nameOf });

	return (
		<div className="settingsPageContainer">
			<div className="settingsPage pageSettingsAiApps">
				<AiAppsList
					gallery={gallery}
					isDesktop={isDesktop}
					apiState={apiState}
					scanOk={scanOk}
					loadFailed={loadFailed}
					cleanupFailed={cleanupFailed}
					loading={loading}
					query={query}
					icon={appId => map[appId]?.icon || ''}
					onQuery={setQuery}
					onAction={noop}
					onManage={noop}
					onScanAgain={noop}
					onApiSettings={noop}
					onDevelopers={noop}
				/>
			</div>
		</div>
	);
};

const CURSOR = detection('cursor', { targetPaths: [ CONNECTION_CURSOR.targetPath ], canRestart: true });
const CODEX_PATH = '/Users/me/.codex/config.toml';

const meta: Meta<typeof Page> = {
	title: 'Page/Main/Settings/AiApps',
	component: Page,
	parameters: { layout: 'fullscreen' },
	decorators: [ withThemeSync(() => S.Common) ],
	args: { detections: [], connections: [], scanOk: true, isDesktop: true, apiState: 'listening', loading: false },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing connected yet, Cursor and Claude Code found */
export const Detected: Story = {
	args: { detections: [ CURSOR, detection('claude-code') ] },
};

/** Connected rows: added, finish, pending, conflict, revoke failed, an Other app; ChatGPT shared with Codex */
export const Connected: Story = {
	args: {
		detections: [
			CURSOR,
			detection('chatgpt', { targetId: 'codex', targetPaths: [ CODEX_PATH ] }),
			detection('codex', { targetId: 'codex', targetPaths: [ CODEX_PATH ] }),
			detection('claude-code'),
			detection('lmstudio'),
			detection('claude-desktop'),
		],
		connections: [
			CONNECTION_CURSOR,
			connection({ id: 'codex', appId: 'chatgpt', name: 'ChatGPT', targetPath: CODEX_PATH, nextStep: 'restart' }),
			connection({ id: 'lmstudio', appId: 'lmstudio', name: 'LM Studio', targetPath: '/Users/me/.lmstudio/config', status: 'pending', nextStep: 'none', lastProbe: 'none' }),
			connection({ id: 'claude-code', appId: 'claude-code', name: 'Claude Code', targetPath: '/Users/me/.claude-code/config', status: 'conflict' }),
			connection({ id: 'claude-desktop', appId: 'claude-desktop', name: 'Claude Desktop', targetPath: '/Users/me/.claude-desktop/config', status: 'revokeFailed', removed: true, revokePending: [ 'hash-1' ] }),
			CONNECTION_OTHER,
		],
	},
};

/** Gemini CLI, Antigravity and OpenCode found, and the Gemini app: its card shows only because it is installed */
export const GoogleAgents: Story = {
	args: { detections: [ detection('gemini-cli'), detection('antigravity'), detection('opencode'), detection('gemini', { targetId: undefined, targetPaths: [] }) ] },
};

/** Hermes found (its default profile): Connect */
export const HermesDetected: Story = { args: { detections: [ detection('hermes') ] } };

/** The scan finished and found no supported app */
export const NothingDetected: Story = {};

/** The scan couldn't run: every card under Other apps, Scan again */
export const ScanFailed: Story = { args: { scanOk: false, detections: [ CURSOR ] } };

/** The Local API is off: Connect, Fix and Continue disabled; Manage still works */
export const ApiOff: Story = {
	args: { apiState: 'disabled', detections: [ CURSOR, detection('claude-code') ], connections: [ connection({ status: 'removed' }) ] },
};

export const ApiStarting: Story = { args: { apiState: 'unknown', detections: [ CURSOR ] } };

/** The web app or the extension: the catalog only */
export const Empty: Story = { args: { isDesktop: false } };

export const Loading: Story = { args: { loading: true } };

/** Main's list couldn't be read: nothing is said about this computer; Scan again */
export const LoadFailed: Story = { args: { loadFailed: true, loaded: false } };

/** A key Anytype created couldn't be deleted yet */
export const CleanupFailed: Story = { args: { cleanupFailed: true, detections: [ CURSOR ], connections: [ CONNECTION_CURSOR ] } };

/** The list was read but the first check failed: the rows stay, with the failure and Scan again (W15) */
export const CheckFailed: Story = { args: { loadFailed: true, detections: [ CURSOR, detection('claude-code') ], connections: [ CONNECTION_CURSOR ] } };
