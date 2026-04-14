import type { Meta, StoryObj } from '@storybook/react';
import DragLayer from './layer';

const meta: Meta<typeof DragLayer> = {
	title: 'Drag/Layer',
	component: DragLayer,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
