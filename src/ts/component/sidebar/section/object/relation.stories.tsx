import type { Meta, StoryObj } from '@storybook/react';
import SidebarSectionObjectRelation from './relation';

const meta: Meta<typeof SidebarSectionObjectRelation> = {
	title: 'Sidebar/Section/Object/Relation',
	component: SidebarSectionObjectRelation,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
