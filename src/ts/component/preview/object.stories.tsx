import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PreviewObject from './object';

const meta: Meta<typeof PreviewObject> = {
	title: 'Preview/Object',
	component: PreviewObject,
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
	args: {},
};
