import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainMedia from './media';

const meta: Meta<typeof PageMainMedia> = {
	title: 'Page/Main/Media',
	component: PageMainMedia,
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
