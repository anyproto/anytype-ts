import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsSpaceShare from './share';

const meta: Meta<typeof SettingsSpaceShare> = {
	title: 'Page/Main/Settings/Space/Share',
	component: SettingsSpaceShare,
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
