import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import RecoveryStatus from './recoveryStatus';
import { Recovery } from 'Store/recovery';
import * as I from 'Interface';

const RUN = 'story';

const update = (id: number, type: I.RecoveryUpdateType, data: any = {}): I.RecoveryUpdate => ({ runId: RUN, id, timestampMs: id * 100, type, data });

const space = (id: number, spaceId: string, state: I.RecoverySpaceState) => update(id, I.RecoveryUpdateType.SpaceStateChanged, { spaceId, state });

const Seeded = ({ updates, withCancel }: { updates: I.RecoveryUpdate[]; withCancel?: boolean }) => {
	// Seeded during the first render, not in an effect: Storybook does not apply the auto-observer
	// that makes the component observe the store, so a post-mount write would never repaint
	useState(() => {
		Recovery.clear();
		updates.forEach(it => Recovery.apply(it));
		return null;
	});

	return <RecoveryStatus inFlow={true} onCancel={withCancel ? () => {} : undefined} />;
};

const meta: Meta<typeof RecoveryStatus> = {
	title: 'Util/RecoveryStatus',
	component: RecoveryStatus,
	tags: [ 'autodocs' ],
	decorators: [
		(Story) => (
			<div style={{ width: 480, padding: 24 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const WarmStart: Story = {
	render: () => (
		<Seeded updates={[
			update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }),
			update(2, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.Connecting }),
			update(3, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's1' }),
			update(4, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's2' }),
			update(5, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's3' }),
			update(6, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.LoadingSpaces }),
			space(7, 's1', I.RecoverySpaceState.Loaded),
		]} />
	),
};

export const ColdStart: Story = {
	render: () => (
		<Seeded withCancel={true} updates={[
			update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }),
			update(2, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.Connecting }),
			update(3, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.FetchingAccount }),
			update(4, I.RecoveryUpdateType.AccountFetchStarted, { attempt: 1 }),
			update(5, I.RecoveryUpdateType.AccountFetchStarted, { attempt: 3 }),
		]} />
	),
};

export const LocalPeers: Story = {
	render: () => (
		<Seeded withCancel={true} updates={[
			update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }),
			update(2, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.Connecting }),
			update(3, I.RecoveryUpdateType.LocalPeersStateChanged, { state: I.RecoveryLocalPeersState.Connecting, fromState: I.RecoveryLocalPeersState.NoLocalPeers }),
			update(4, I.RecoveryUpdateType.PeerSpaceExchange, { peerId: 'lan1', exchanged: true, hasAccountSpace: true, sharedSpaceCount: 2 }),
			update(5, I.RecoveryUpdateType.LocalPeersStateChanged, { state: I.RecoveryLocalPeersState.AccountFound, fromState: I.RecoveryLocalPeersState.Connecting }),
		]} />
	),
};

export const LoadingChannels: Story = {
	render: () => (
		<Seeded updates={[
			update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }),
			update(2, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.Connecting }),
			update(3, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.FetchingAccount }),
			update(4, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.LoadingSpaces }),
			...[ 5, 6, 7, 8, 9, 10, 11 ].map(id => update(id, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: `space${id}` })),
			space(12, 'space5', I.RecoverySpaceState.Loaded),
			space(13, 'space6', I.RecoverySpaceState.Loaded),
			space(14, 'space7', I.RecoverySpaceState.Loaded),
		]} />
	),
};

export const WaitingForNetwork: Story = {
	render: () => (
		<Seeded updates={[
			update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }),
			update(2, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.Connecting }),
			update(3, I.RecoveryUpdateType.PhaseChanged, {
				phase: I.RecoveryPhase.WaitingForNetwork,
				fromPhase: I.RecoveryPhase.Connecting,
				error: { class: I.RecoveryErrorClass.NoNetwork, retryable: true, debugMessage: '' },
			}),
		]} />
	),
};

export const Finished: Story = {
	render: () => (
		<Seeded updates={[
			update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }),
			update(2, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.LoadingSpaces }),
			update(3, I.RecoveryUpdateType.Finished, { spacesTotal: 4, spacesLoaded: 4, spacesFailed: 0, viewsConfirmed: true }),
		]} />
	),
};

export const Failed: Story = {
	render: () => (
		<Seeded updates={[
			update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }),
			update(2, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.Connecting }),
			update(3, I.RecoveryUpdateType.PhaseChanged, {
				phase: I.RecoveryPhase.Failed,
				error: { class: I.RecoveryErrorClass.AccountDeleted, retryable: false, debugMessage: '' },
			}),
		]} />
	),
};
