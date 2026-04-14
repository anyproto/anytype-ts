import type { Meta, StoryObj } from '@storybook/react';
import SidebarSectionTypeLayoutFormatList from './list';

const meta: Meta<typeof SidebarSectionTypeLayoutFormatList> = {
	title: 'Sidebar/Section/Type/Format/List',
	component: SidebarSectionTypeLayoutFormatList,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
