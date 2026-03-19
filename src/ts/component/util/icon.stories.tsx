import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Icon from './icon';

const meta: Meta<typeof Icon> = {
	title: 'Util/Icon',
	component: Icon,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 20 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		className: 'close',
	},
};

export const WithArrow: Story = {
	args: {
		className: 'expand',
		arrow: true,
	},
};

export const Draggable: Story = {
	args: {
		className: 'drag',
		draggable: true,
	},
};

export const WithInner: Story = {
	args: {
		className: 'plus',
		inner: <span style={{ fontSize: 12 }}>+</span>,
	},
};

export const CustomStyle: Story = {
	args: {
		className: 'custom',
		style: { width: 32, height: 32, background: '#ddd', borderRadius: 8 },
	},
};
