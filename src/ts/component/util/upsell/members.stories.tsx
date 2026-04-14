import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import UpsellMembers from './members';

const meta: Meta<typeof UpsellMembers> = {
	title: 'Util/Upsell/Members',
	component: UpsellMembers,
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
		isRed: false,
	},
};

export const Warning: Story = {
	args: {
		route: 'settings',
		isRed: true,
	},
};

export const WithClassName: Story = {
	args: {
		route: 'settings',
		isRed: false,
		className: 'customBanner',
	},
};
