import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainHistory from './history';

const meta: Meta<typeof PageMainHistory> = {
	title: 'Page/Main/History',
	component: PageMainHistory,
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
