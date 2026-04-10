import type { Meta, StoryObj } from '@storybook/react';
import TreeItem from './item';

const meta: Meta<typeof TreeItem> = {
	title: 'Widget/Tree/Item',
	component: TreeItem,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
