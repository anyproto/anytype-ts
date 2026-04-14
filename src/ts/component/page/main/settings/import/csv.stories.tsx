import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsImportCsv from './csv';

const meta: Meta<typeof SettingsImportCsv> = {
	title: 'Page/Main/Settings/Import/Csv',
	component: SettingsImportCsv,
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
