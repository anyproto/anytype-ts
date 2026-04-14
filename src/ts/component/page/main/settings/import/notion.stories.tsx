import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsImportNotion from './notion';

const meta: Meta<typeof SettingsImportNotion> = {
	title: 'Page/Main/Settings/Import/Notion',
	component: SettingsImportNotion,
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
