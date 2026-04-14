import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsAccount from './account';

const meta: Meta<typeof SettingsAccount> = {
	title: 'Page/Main/Settings/Account',
	component: SettingsAccount,
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
