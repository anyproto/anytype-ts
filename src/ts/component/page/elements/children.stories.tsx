import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Children from './children';

const meta: Meta<typeof Children> = {
	title: 'Page/Elements/Children',
	component: Children,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'sb-children',
	},
};
