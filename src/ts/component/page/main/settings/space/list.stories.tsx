import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsSpaceList from './list';

const meta: Meta<typeof SettingsSpaceList> = {
	title: 'Page/Main/Settings/Space/List',
	component: SettingsSpaceList,
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
