import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsSpaceHome from './home';

const meta: Meta<typeof SettingsSpaceHome> = {
	title: 'Page/Main/Settings/Space/Home',
	component: SettingsSpaceHome,
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
