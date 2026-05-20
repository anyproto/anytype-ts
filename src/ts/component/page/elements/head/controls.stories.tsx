import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Controls from './controls';

const meta: Meta<typeof Controls> = {
	title: 'Page/Elements/Head/Controls',
	component: Controls,
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
