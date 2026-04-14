import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsPinConfirm from './confirm';

const meta: Meta<typeof SettingsPinConfirm> = {
	title: 'Page/Main/Settings/Pin/Confirm',
	component: SettingsPinConfirm,
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
