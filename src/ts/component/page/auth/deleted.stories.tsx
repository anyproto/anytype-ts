import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageAuthDeleted from './deleted';

const meta: Meta<typeof PageAuthDeleted> = {
	title: 'Page/Auth/Deleted',
	component: PageAuthDeleted,
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
