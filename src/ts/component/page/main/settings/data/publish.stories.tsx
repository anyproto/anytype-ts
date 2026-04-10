import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsDataPublish from './publish';

const meta: Meta<typeof SettingsDataPublish> = {
	title: 'Page/Main/Settings/Data/Publish',
	component: SettingsDataPublish,
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
