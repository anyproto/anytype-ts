import type { Meta, StoryObj } from '@storybook/react';
import SidebarLeft from './left';

const meta: Meta<typeof SidebarLeft> = {
	title: 'Sidebar/Left',
	component: SidebarLeft,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
