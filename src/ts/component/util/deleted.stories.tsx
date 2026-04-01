import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Deleted from './deleted';

const meta: Meta<typeof Deleted> = {
	title: 'Util/Deleted',
	component: Deleted,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ height: 400, position: 'relative' }}>
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

export const InPopup: Story = {
	args: {
		isPopup: true,
	},
};
