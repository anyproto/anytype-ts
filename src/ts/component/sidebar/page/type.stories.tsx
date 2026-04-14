import type { Meta, StoryObj } from '@storybook/react';
import SidebarPageType from './type';

const meta: Meta<typeof SidebarPageType> = {
	title: 'Sidebar/Page/Type',
	component: SidebarPageType,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
