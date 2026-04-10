import type { Meta, StoryObj } from '@storybook/react';
import Group from './group';

const meta: Meta<typeof Group> = {
	title: 'Widget/View/Board/Group',
	component: Group,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
