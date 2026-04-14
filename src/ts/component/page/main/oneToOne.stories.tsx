import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainOneToOne from './oneToOne';

const meta: Meta<typeof PageMainOneToOne> = {
	title: 'Page/Main/OneToOne',
	component: PageMainOneToOne,
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
