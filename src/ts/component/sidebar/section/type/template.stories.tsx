import type { Meta, StoryObj } from '@storybook/react';
import SidebarSectionTypeTemplate from './template';

const meta: Meta<typeof SidebarSectionTypeTemplate> = {
	title: 'Sidebar/Section/Type/Template',
	component: SidebarSectionTypeTemplate,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
