import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsMembershipIntro from './intro';

const meta: Meta<typeof SettingsMembershipIntro> = {
	title: 'Page/Main/Settings/Membership/Intro',
	component: SettingsMembershipIntro,
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
