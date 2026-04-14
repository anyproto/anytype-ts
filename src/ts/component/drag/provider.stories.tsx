import type { Meta, StoryObj } from '@storybook/react';
import DragProvider from './provider';

const meta: Meta<typeof DragProvider> = {
	title: 'Drag/Provider',
	component: DragProvider,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
