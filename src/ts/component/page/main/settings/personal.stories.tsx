import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsPersonal from './personal';

const meta: Meta<typeof SettingsPersonal> = {
	title: 'Page/Main/Settings/Personal',
	component: SettingsPersonal,
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
