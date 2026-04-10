import type { Meta, StoryObj } from '@storybook/react';
import ListMenu from './menu';

const meta: Meta<typeof ListMenu> = {
	title: 'List/Menu',
	component: ListMenu,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
