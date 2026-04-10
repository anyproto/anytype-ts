import type { Meta, StoryObj } from '@storybook/react';
import GraphTimeline from './timeline';

const meta: Meta<typeof GraphTimeline> = {
	title: 'Graph/Timeline',
	component: GraphTimeline,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 'timeline-1',
		graphRef: { current: null },
		storageKey: 'graphTimeline',
	},
};
