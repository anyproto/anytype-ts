import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainEdit from './edit';

const meta: Meta<typeof PageMainEdit> = {
	title: 'Page/Main/Edit',
	component: PageMainEdit,
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
