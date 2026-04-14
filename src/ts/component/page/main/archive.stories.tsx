import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainArchive from './archive';

const meta: Meta<typeof PageMainArchive> = {
	title: 'Page/Main/Archive',
	component: PageMainArchive,
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
