import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsExportMarkdown from './markdown';

const meta: Meta<typeof SettingsExportMarkdown> = {
	title: 'Page/Main/Settings/Export/Markdown',
	component: SettingsExportMarkdown,
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
