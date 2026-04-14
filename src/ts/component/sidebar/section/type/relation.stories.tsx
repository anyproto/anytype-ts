import type { Meta, StoryObj } from '@storybook/react';
import SidebarSectionTypeRelation from './relation';

const meta: Meta<typeof SidebarSectionTypeRelation> = {
	title: 'Sidebar/Section/Type/Relation',
	component: SidebarSectionTypeRelation,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
