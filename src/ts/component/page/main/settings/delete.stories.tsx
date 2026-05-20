import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsDelete from './delete';

const meta: Meta<typeof SettingsDelete> = {
	title: 'Page/Main/Settings/Delete',
	component: SettingsDelete,
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
