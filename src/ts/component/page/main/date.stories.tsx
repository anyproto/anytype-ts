import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainDate from './date';

const meta: Meta<typeof PageMainDate> = {
	title: 'Page/Main/Date',
	component: PageMainDate,
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
