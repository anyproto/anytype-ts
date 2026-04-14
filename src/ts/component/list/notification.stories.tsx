import type { Meta, StoryObj } from '@storybook/react';
import ListNotification from './notification';

const meta: Meta<typeof ListNotification> = {
	title: 'List/Notification',
	component: ListNotification,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
