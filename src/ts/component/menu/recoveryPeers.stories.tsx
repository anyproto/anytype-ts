import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../.storybook/decorators';
import MenuRecoveryPeers from './recoveryPeers';
import { Recovery } from 'Store/recovery';
import * as I from 'Interface';

const RUN = 'story';

const update = (id: number, type: I.RecoveryUpdateType, data: any = {}): I.RecoveryUpdate => ({ runId: RUN, id, timestampMs: id * 100, type, data });

const connected = (id: number, peerId: string, kind: I.RecoveryPeerKind, nodeTypes: string[], transport: string) =>
	update(id, I.RecoveryUpdateType.PeerConnected, { peerId, kind, nodeTypes, transport, openConnections: 1 });

const seed = (updates: I.RecoveryUpdate[]) => {
	Recovery.clear();
	updates.forEach(it => Recovery.apply(it));
};

const args = {
	param: { data: {} },
	getId: () => 'menuRecoveryPeers',
	getSize: () => ({ width: 288, height: 200 }),
	position: () => {},
	close: () => {},
	setActive: () => {},
	onKeyDown: () => {},
	storageGet: () => ({}),
	storageSet: () => {},
	getItems: () => [],
} as any;

const Seeded = (props: any) => {
	// Seeded during the first render: Storybook does not apply the auto-observer
	useState(() => {
		seed(props.updates);
		return null;
	});

	return <MenuRecoveryPeers {...args} />;
};

const meta: Meta<typeof MenuRecoveryPeers> = {
	title: 'Menu/RecoveryPeers',
	component: MenuRecoveryPeers,
	tags: [ 'autodocs' ],
	decorators: [ withMenuClass('menuRecoveryPeers') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Seeded updates={[
			update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }),
			connected(2, 'lan1', I.RecoveryPeerKind.Local, [], ''),
			update(3, I.RecoveryUpdateType.PeerSpaceExchange, { peerId: 'lan1', exchanged: true, hasAccountSpace: true, sharedSpaceCount: 3 }),
			connected(4, 'file1', I.RecoveryPeerKind.Network, [ 'file' ], 'quic'),
			connected(5, 'file2', I.RecoveryPeerKind.Network, [ 'file' ], 'yamux'),
			connected(6, 'tree1', I.RecoveryPeerKind.Network, [ 'tree' ], 'quic'),
			connected(7, 'tree2', I.RecoveryPeerKind.Network, [ 'tree' ], 'quic'),
		]} />
	),
};

/** Nothing connected yet: every row reads zero */
export const Empty: Story = {
	render: () => (
		<Seeded updates={[ update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }) ]} />
	),
};
