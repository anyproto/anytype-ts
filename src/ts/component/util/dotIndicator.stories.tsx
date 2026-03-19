import type { Meta, StoryObj } from '@storybook/react';
import DotIndicator from './dotIndicator';

const meta: Meta<typeof DotIndicator> = {
	title: 'Util/DotIndicator',
	component: DotIndicator,
	tags: ['autodocs'],
	argTypes: {
		index: { control: { type: 'number', min: 0 } },
		count: { control: { type: 'number', min: 0 } },
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		index: 0,
		count: 5,
	},
};

export const MiddleDot: Story = {
	args: {
		index: 2,
		count: 5,
	},
};

export const LastDot: Story = {
	args: {
		index: 4,
		count: 5,
	},
};

export const SingleDot: Story = {
	args: {
		index: 0,
		count: 1,
	},
};

export const ManyDots: Story = {
	args: {
		index: 5,
		count: 10,
	},
};
