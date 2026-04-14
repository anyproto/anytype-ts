import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsLanguage from './language';

const meta: Meta<typeof SettingsLanguage> = {
	title: 'Page/Main/Settings/Language',
	component: SettingsLanguage,
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
