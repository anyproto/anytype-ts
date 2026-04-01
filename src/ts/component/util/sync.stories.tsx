import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Sync from './sync';
import * as I from 'Interface';

const meta: Meta<typeof Sync> = {
	title: 'Util/Sync',
	component: Sync,
	tags: ['autodocs'],
	argTypes: {},
	decorators: [
		(Story) => (
			<div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const setSyncStatus = (status: I.SyncStatusSpace, network: I.SyncStatusNetwork = I.SyncStatusNetwork.Anytype, error: I.SyncStatusError = I.SyncStatusError.None) => {
	const spaceId = S.Common.space || 'storybook-space';
	S.Auth.syncStatusUpdate({
		id: spaceId,
		status,
		network,
		error,
		p2p: I.P2PStatus.NotConnected,
		syncingCounter: 0,
		devicesCounter: 0,
		notSyncedCounter: 0,
	});
};

export const Synced: Story = {
	decorators: [
		(Story) => {
			setSyncStatus(I.SyncStatusSpace.Synced);
			return <Story />;
		},
	],
	args: {
		onClick: () => {},
	},
};

export const Syncing: Story = {
	decorators: [
		(Story) => {
			setSyncStatus(I.SyncStatusSpace.Syncing);
			return <Story />;
		},
	],
	args: {
		onClick: () => {},
	},
};

export const Error: Story = {
	decorators: [
		(Story) => {
			setSyncStatus(I.SyncStatusSpace.Error, I.SyncStatusNetwork.Anytype, I.SyncStatusError.NetworkError);
			return <Story />;
		},
	],
	args: {
		onClick: () => {},
	},
};

export const Offline: Story = {
	decorators: [
		(Story) => {
			setSyncStatus(I.SyncStatusSpace.Offline, I.SyncStatusNetwork.LocalOnly);
			return <Story />;
		},
	],
	args: {
		onClick: () => {},
	},
};

export const StorageLimitExceeded: Story = {
	decorators: [
		(Story) => {
			setSyncStatus(I.SyncStatusSpace.Error, I.SyncStatusNetwork.Anytype, I.SyncStatusError.StorageLimitExceed);
			return <Story />;
		},
	],
	args: {
		onClick: () => {},
	},
};
