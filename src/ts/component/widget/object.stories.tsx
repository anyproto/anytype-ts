import type { Meta, StoryObj } from '@storybook/react';
import WidgetObject from './object';

const meta: Meta<typeof WidgetObject> = {
	title: 'Widget/Object',
	component: WidgetObject,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
