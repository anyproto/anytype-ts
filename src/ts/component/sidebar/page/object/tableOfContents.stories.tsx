import type { Meta, StoryObj } from '@storybook/react';
import SidebarPageTableOfContents from './tableOfContents';

const meta: Meta<typeof SidebarPageTableOfContents> = {
	title: 'Sidebar/Page/Object/TableOfContents',
	component: SidebarPageTableOfContents,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
