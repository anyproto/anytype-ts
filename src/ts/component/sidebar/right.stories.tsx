import type { Meta, StoryObj } from '@storybook/react';
import SidebarRight from './right';

const meta: Meta<typeof SidebarRight> = {
	title: 'Sidebar/Right',
	component: SidebarRight,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
