import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import EditorHead from './editor';

const meta: Meta<typeof EditorHead> = {
	title: 'Page/Elements/Head/Editor',
	component: EditorHead,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'sb-root',
	},
};
