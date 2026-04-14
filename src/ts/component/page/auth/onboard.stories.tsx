import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageAuthOnboard from './onboard';

const meta: Meta<typeof PageAuthOnboard> = {
	title: 'Page/Auth/Onboard',
	component: PageAuthOnboard,
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
