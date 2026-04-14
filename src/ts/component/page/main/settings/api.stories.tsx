import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsApi from './api';

const meta: Meta<typeof SettingsApi> = {
	title: 'Page/Main/Settings/Api',
	component: SettingsApi,
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
