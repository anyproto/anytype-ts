import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsSpaceStorage from './storage';

const meta: Meta<typeof SettingsSpaceStorage> = {
	title: 'Page/Main/Settings/Space/Storage',
	component: SettingsSpaceStorage,
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
