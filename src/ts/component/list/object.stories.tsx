import type { Meta, StoryObj } from '@storybook/react';
import ListObject from './object';

const meta: Meta<typeof ListObject> = {
	title: 'List/Object',
	component: ListObject,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
