import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ObjectType from './type';

const meta: Meta<typeof ObjectType> = {
	title: 'Util/Object/Type',
	component: ObjectType,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ fontSize: 14 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		object: { name: 'Page' },
	},
};

export const LongTypeName: Story = {
	args: {
		object: { name: 'A Very Long Type Name That Should Be Shortened' },
	},
};

export const Deleted: Story = {
	args: {
		object: { name: 'Deleted Type', isDeleted: true },
	},
};

export const EmptyObject: Story = {
	args: {
		object: { _empty_: true },
	},
};
