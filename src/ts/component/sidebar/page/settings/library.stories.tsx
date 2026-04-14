import type { Meta, StoryObj } from '@storybook/react';
import SidebarPageSettingsLibrary from './library';

const meta: Meta<typeof SidebarPageSettingsLibrary> = {
	title: 'Sidebar/Page/Settings/Library',
	component: SidebarPageSettingsLibrary,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
