import type { Meta, StoryObj } from '@storybook/react';
import ListChildren from './children';

const meta: Meta<typeof ListChildren> = {
	title: 'List/Children',
	component: ListChildren,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
