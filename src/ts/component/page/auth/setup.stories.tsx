import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageAuthSetup from './setup';

const meta: Meta<typeof PageAuthSetup> = {
	title: 'Page/Auth/Setup',
	component: PageAuthSetup,
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
