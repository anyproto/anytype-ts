import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import InputWithFile from './inputWithFile';

const meta: Meta<typeof InputWithFile> = {
	title: 'Form/InputWithFile',
	component: InputWithFile,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 400 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		block: { id: 'storybook-block' },
	},
};

export const WithFile: Story = {
	args: {
		withFile: true,
		textFile: 'Upload a file',
		block: { id: 'storybook-block-file' },
	},
};

export const Readonly: Story = {
	args: {
		readonly: true,
		block: { id: 'storybook-block-readonly' },
	},
};
