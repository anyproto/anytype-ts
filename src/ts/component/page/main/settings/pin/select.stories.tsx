import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsPinSelect from './select';

const meta: Meta<typeof SettingsPinSelect> = {
	title: 'Page/Main/Settings/Pin/Select',
	component: SettingsPinSelect,
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
