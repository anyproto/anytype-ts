import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ObjectCover from './cover';

const meta: Meta<typeof ObjectCover> = {
	title: 'Util/Object/Cover',
	component: ObjectCover,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 600, minHeight: 200 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		object: {
			id: 'obj-1',
			name: 'Test Object',
			layout: 0,
		},
	},
};

export const WithCover: Story = {
	args: {
		object: {
			id: 'obj-2',
			name: 'Object with Cover',
			layout: 0,
			coverType: 1,
			coverId: 'cover-image-1',
			coverX: 0.5,
			coverY: 0.5,
			coverScale: 0,
		},
	},
};

export const EmptyObject: Story = {
	args: {
		object: {},
	},
};
