import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import HistoryRight from './right';

const meta: Meta<typeof HistoryRight> = {
	title: 'Page/Main/History/Right',
	component: HistoryRight,
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
