import type { Meta, StoryObj } from '@storybook/react';
import SidebarPageWidget from './widget';

const meta: Meta<typeof SidebarPageWidget> = {
	title: 'Sidebar/Page/Widget',
	component: SidebarPageWidget,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
