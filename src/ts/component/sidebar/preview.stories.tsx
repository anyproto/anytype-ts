import type { Meta, StoryObj } from '@storybook/react';
import SidebarLayoutPreview from './preview';

const meta: Meta<typeof SidebarLayoutPreview> = {
	title: 'Sidebar/Preview',
	component: SidebarLayoutPreview,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
