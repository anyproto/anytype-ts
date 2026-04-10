import type { Meta, StoryObj } from '@storybook/react';
import WidgetSpace from './space';

const meta: Meta<typeof WidgetSpace> = {
	title: 'Widget/Space',
	component: WidgetSpace,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
