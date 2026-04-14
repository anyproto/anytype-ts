import type { Meta, StoryObj } from '@storybook/react';
import SidebarSectionObjectTableOfContents from './tableOfContents';

const meta: Meta<typeof SidebarSectionObjectTableOfContents> = {
	title: 'Sidebar/Section/Object/TableOfContents',
	component: SidebarSectionObjectTableOfContents,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
