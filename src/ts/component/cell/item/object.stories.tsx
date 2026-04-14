import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import CellItemObject from './object';

const meta: Meta<typeof CellItemObject> = {
	title: 'Cell/ItemObject',
	component: CellItemObject,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 300 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		cellId: 'cell-1',
		relation: { relationKey: 'assignee' },
		getObject: () => ({ id: 'obj-1', name: 'Project Document', layout: 0 }),
	},
};

export const TaskObject: Story = {
	args: {
		cellId: 'cell-2',
		relation: { relationKey: 'assignee' },
		getObject: () => ({ id: 'obj-2', name: 'Complete onboarding', layout: 2, done: false }),
	},
};

export const CompletedTask: Story = {
	args: {
		cellId: 'cell-3',
		relation: { relationKey: 'assignee' },
		getObject: () => ({ id: 'obj-3', name: 'Setup CI pipeline', layout: 2, done: true }),
	},
};

export const WithRemove: Story = {
	args: {
		cellId: 'cell-4',
		relation: { relationKey: 'assignee' },
		canEdit: true,
		getObject: () => ({ id: 'obj-4', name: 'Removable Item', layout: 0 }),
		onRemove: () => {},
	},
};

export const TypeRelation: Story = {
	args: {
		cellId: 'cell-5',
		relation: { relationKey: 'type' },
		getObject: () => ({ id: 'obj-5', name: 'Page', layout: 0 }),
	},
};
