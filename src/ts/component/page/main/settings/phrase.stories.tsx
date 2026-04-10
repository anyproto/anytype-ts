import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsPhrase from './phrase';

const meta: Meta<typeof SettingsPhrase> = {
	title: 'Page/Main/Settings/Phrase',
	component: SettingsPhrase,
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
