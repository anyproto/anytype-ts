import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainChat from './chat';

const meta: Meta<typeof PageMainChat> = {
	title: 'Page/Main/Chat',
	component: PageMainChat,
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
