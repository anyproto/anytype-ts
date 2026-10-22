import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsExportAnyBlockV2 from './anyBlockV2';

const meta: Meta<typeof SettingsExportAnyBlockV2> = {
	title: 'Page/Main/Settings/Export/AnyBlockV2',
	component: SettingsExportAnyBlockV2,
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
