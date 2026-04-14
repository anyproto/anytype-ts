import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsSpaceShareMembers from './members';

const meta: Meta<typeof SettingsSpaceShareMembers> = {
	title: 'Page/Main/Settings/Space/Share/Members',
	component: SettingsSpaceShareMembers,
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
