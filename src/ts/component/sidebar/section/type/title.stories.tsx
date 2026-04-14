import type { Meta, StoryObj } from '@storybook/react';
import SidebarSectionTypeTitle from './title';

const meta: Meta<typeof SidebarSectionTypeTitle> = {
	title: 'Sidebar/Section/Type/Title',
	component: SidebarSectionTypeTitle,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
