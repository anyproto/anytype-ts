import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsImportObsidian from './obsidian';

const meta: Meta<typeof SettingsImportObsidian> = {
	title: 'Page/Main/Settings/Import/Obsidian',
	component: SettingsImportObsidian,
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
