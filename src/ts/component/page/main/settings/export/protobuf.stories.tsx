import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsExportProtobuf from './protobuf';

const meta: Meta<typeof SettingsExportProtobuf> = {
	title: 'Page/Main/Settings/Export/Protobuf',
	component: SettingsExportProtobuf,
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
