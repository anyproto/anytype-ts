import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsImportNotionWarning from './warning';

const meta: Meta<typeof SettingsImportNotionWarning> = {
	title: 'Page/Main/Settings/Import/Notion/Warning',
	component: SettingsImportNotionWarning,
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
