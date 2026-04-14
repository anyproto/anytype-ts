import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Cover from './cover';

const meta: Meta<typeof Cover> = {
	title: 'Util/Cover',
	component: Cover,
	tags: ['autodocs'],
	argTypes: {
		x: {
			control: { type: 'range', min: 0, max: 1, step: 0.05 },
		},
		y: {
			control: { type: 'range', min: 0, max: 1, step: 0.05 },
		},
		scale: {
			control: { type: 'range', min: 0, max: 2, step: 0.1 },
		},
	},
	decorators: [
		(Story) => (
			<div style={{ width: 600, height: 200 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const WithGradient: Story = {
	args: {
		src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=300&fit=crop',
		withScale: false,
	},
};

export const WithPosition: Story = {
	args: {
		src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=300&fit=crop',
		withScale: true,
		x: 0.5,
		y: 0.3,
		scale: 0,
	},
};

export const Zoomed: Story = {
	args: {
		src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=300&fit=crop',
		withScale: true,
		x: 0.5,
		y: 0.5,
		scale: 1,
	},
};

export const WithChildren: Story = {
	args: {
		src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=300&fit=crop',
		withScale: false,
	},
	render: (args) => (
		<Cover {...args}>
			<div style={{ padding: 16, color: 'white', fontWeight: 'bold' }}>Overlay Content</div>
		</Cover>
	),
};

export const Empty: Story = {
	args: {},
};
