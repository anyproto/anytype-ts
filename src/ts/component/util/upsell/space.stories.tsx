import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import UpsellSpace from './space';

const meta: Meta<typeof UpsellSpace> = {
	title: 'Util/Upsell/Space',
	component: UpsellSpace,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 400 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		route: 'settings',
		isRed: true,
	},
};

export const WithClassName: Story = {
	args: {
		route: 'settings',
		isRed: true,
		className: 'customBanner',
	},
};
