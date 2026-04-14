import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PreviewTab from './tab';

const meta: Meta<typeof PreviewTab> = {
	title: 'Preview/Tab',
	component: PreviewTab,
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
	args: {
		spaceview: { name: 'My Space', iconOption: 1 },
		data: { name: 'Object', layout: 0 },
	},
};
