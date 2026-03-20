import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import EmptyNodes from './emptyNodes';

const meta: Meta<typeof EmptyNodes> = {
	title: 'Util/EmptyNodes',
	component: EmptyNodes,
	tags: ['autodocs'],
	argTypes: {
		count: { control: { type: 'number', min: 0, max: 20 } },
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		className: 'line',
		count: 5,
	},
};

export const FewNodes: Story = {
	args: {
		className: 'line',
		count: 2,
	},
};

export const ManyNodes: Story = {
	args: {
		className: 'line',
		count: 10,
	},
};

export const WithCustomStyle: Story = {
	args: {
		className: 'item',
		count: 3,
		style: { width: 100, height: 40, background: '#eee', borderRadius: 8, marginBottom: 4 },
	},
};
