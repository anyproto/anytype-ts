import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Frame from './frame';

const meta: Meta<typeof Frame> = {
	title: 'Util/Frame',
	component: Frame,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ position: 'relative', width: 400, height: 300, border: '1px solid #ddd' }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: <div style={{ padding: 20, background: '#f5f5f5', borderRadius: 8 }}>Centered content</div>,
	},
};

export const WithClassName: Story = {
	args: {
		className: 'customFrame',
		children: <div style={{ padding: 40, background: '#e8f4fd', borderRadius: 12 }}>Custom frame</div>,
	},
};
