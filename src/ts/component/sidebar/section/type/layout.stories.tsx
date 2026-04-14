import type { Meta, StoryObj } from '@storybook/react';
import SidebarSectionTypeLayout from './layout';

const meta: Meta<typeof SidebarSectionTypeLayout> = {
	title: 'Sidebar/Section/Type/Layout',
	component: SidebarSectionTypeLayout,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
