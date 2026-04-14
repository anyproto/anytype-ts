import type { Meta, StoryObj } from '@storybook/react';
import CellObject from './object';

const meta: Meta<typeof CellObject> = {
	title: 'Cell/Object',
	component: CellObject,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
