import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import HistoryLeft from './left';

const meta: Meta<typeof HistoryLeft> = {
	title: 'Page/Main/History/Left',
	component: HistoryLeft,
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
