import type { Meta, StoryObj } from '@storybook/react';
import SidebarPageObjectRelation from './relation';

const meta: Meta<typeof SidebarPageObjectRelation> = {
	title: 'Sidebar/Page/Object/Relation',
	component: SidebarPageObjectRelation,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
