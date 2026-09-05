import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import RecoveryProgress from './recoveryProgress';
import { Recovery } from 'Store/recovery';
import * as I from 'Interface';

const RUN = 'story';

const update = (id: number, type: I.RecoveryUpdateType, data: any = {}): I.RecoveryUpdate => ({ runId: RUN, id, timestampMs: id * 100, type, data });

const Seeded = ({ updates, isMinimal }: { updates: I.RecoveryUpdate[]; isMinimal?: boolean }) => {
	// Seeded during the first render: Storybook does not apply the auto-observer, so a post-mount
	// write to the store would never repaint
	useState(() => {
		Recovery.clear();
		updates.forEach(it => Recovery.apply(it));
		S.Common.vaultIsMinimalSet(!!isMinimal);
		return null;
	});

	return <RecoveryProgress />;
};

const discovered = (ids: string[]) => ids.map((spaceId, i) => update(i + 3, I.RecoveryUpdateType.SpaceDiscovered, { spaceId }));

const RUNNING = [
	update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }),
	update(2, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.LoadingSpaces }),
	...discovered([ 's1', 's2', 's3', 's4', 's5' ]),
	update(8, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 's1', state: I.RecoverySpaceState.Loaded }),
	update(9, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 's2', state: I.RecoverySpaceState.Loaded }),
];

const meta: Meta<typeof RecoveryProgress> = {
	title: 'Util/RecoveryProgress',
	component: RecoveryProgress,
	tags: [ 'autodocs' ],
	decorators: [
		(Story) => (
			<div className="sidebarPage pageVault" style={{ width: 288, padding: '12px 0px' }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
	render: () => <Seeded updates={RUNNING} />,
};

export const Minimal: Story = {
	render: () => <Seeded updates={RUNNING} isMinimal={true} />,
};

/** The run is over, so the block renders nothing */
export const Finished: Story = {
	render: () => (
		<Seeded updates={[
			...RUNNING,
			update(10, I.RecoveryUpdateType.Finished, { spacesTotal: 6, spacesLoaded: 6, spacesFailed: 0, viewsConfirmed: true }),
		]} />
	),
};
