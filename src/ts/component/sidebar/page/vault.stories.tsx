import type { Meta, StoryObj } from '@storybook/react';
import SidebarPageVault from './vault';

const meta: Meta<typeof SidebarPageVault> = {
	title: 'Sidebar/Page/Vault',
	component: SidebarPageVault,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
