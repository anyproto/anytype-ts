import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsMembershipPurchased from './purchased';

const meta: Meta<typeof SettingsMembershipPurchased> = {
	title: 'Page/Main/Settings/Membership/Purchased',
	component: SettingsMembershipPurchased,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		isPopup: false,
	},
};
