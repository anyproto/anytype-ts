import type { Meta, StoryObj } from '@storybook/react';
import SidebarSectionTypeLayoutFormatPage from './page';

const meta: Meta<typeof SidebarSectionTypeLayoutFormatPage> = {
	title: 'Sidebar/Section/Type/Format/Page',
	component: SidebarSectionTypeLayoutFormatPage,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
