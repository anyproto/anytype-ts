import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsMembershipLoader from './loader';

const meta: Meta<typeof SettingsMembershipLoader> = {
	title: 'Page/Main/Settings/Membership/Loader',
	component: SettingsMembershipLoader,
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
