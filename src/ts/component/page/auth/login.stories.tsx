import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageAuthLogin from './login';

const meta: Meta<typeof PageAuthLogin> = {
	title: 'Page/Auth/Login',
	component: PageAuthLogin,
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
