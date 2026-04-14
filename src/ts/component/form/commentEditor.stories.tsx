import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import CommentEditor from './commentEditor';

const meta: Meta<typeof CommentEditor> = {
	title: 'Form/CommentEditor',
	component: CommentEditor,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 480 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const Readonly: Story = {
	args: {
		readonly: true,
	},
};

export const WithPlaceholder: Story = {
	args: {
		placeholder: 'Write a comment...',
		maxLength: 500,
	},
};
