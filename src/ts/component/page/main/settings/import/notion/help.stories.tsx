import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsImportNotionHelp from './help';

const meta: Meta<typeof SettingsImportNotionHelp> = {
	title: 'Page/Main/Settings/Import/Notion/Help',
	component: SettingsImportNotionHelp,
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
