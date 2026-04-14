import type { Meta, StoryObj } from '@storybook/react';
import Graph from './provider';

const meta: Meta<typeof Graph> = {
	title: 'Graph/Provider',
	component: Graph,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
