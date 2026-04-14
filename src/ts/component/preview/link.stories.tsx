import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PreviewLink from './link';

const meta: Meta<typeof PreviewLink> = {
	title: 'Preview/Link',
	component: PreviewLink,
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
		url: 'https://anytype.io',
	},
};
