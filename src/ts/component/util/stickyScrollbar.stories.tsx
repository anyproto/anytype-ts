import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import StickyScrollbar from './stickyScrollbar';

const meta: Meta<typeof StickyScrollbar> = {
	title: 'Util/StickyScrollbar',
	component: StickyScrollbar,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 600, height: 100, position: 'relative', overflow: 'auto' }}>
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

export const Inline: Story = {
	args: {
		isInline: true,
	},
};
