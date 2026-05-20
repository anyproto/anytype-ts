import type { Meta, StoryObj } from '@storybook/react';
import ProgressBar from './progressBar';

const meta: Meta<typeof ProgressBar> = {
	title: 'Util/ProgressBar',
	component: ProgressBar,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const SingleSegment: Story = {
	args: {
		segments: [
			{ name: 'Used', caption: '50%', percent: 0.5, isActive: true },
		],
		current: '500 MB',
		max: '1 GB',
	},
};

export const MultipleSegments: Story = {
	args: {
		segments: [
			{ name: 'Documents', caption: '30%', percent: 0.3, isActive: true },
			{ name: 'Images', caption: '20%', percent: 0.2, isActive: false },
			{ name: 'Videos', caption: '15%', percent: 0.15, isActive: false },
		],
		current: '650 MB',
		max: '1 GB',
	},
};

export const AlmostFull: Story = {
	args: {
		segments: [
			{ name: 'Used', caption: '95%', percent: 0.95, isActive: true, className: 'warning' },
		],
		current: '950 MB',
		max: '1 GB',
	},
};

export const Complete: Story = {
	args: {
		segments: [
			{ name: 'Complete', caption: '100%', percent: 1.0, isActive: true },
		],
		complete: true,
		current: '1 GB',
		max: '1 GB',
	},
};

export const Empty: Story = {
	args: {
		segments: [
			{ name: 'Used', caption: '0%', percent: 0, isActive: false },
		],
		current: '0 MB',
		max: '1 GB',
	},
};
