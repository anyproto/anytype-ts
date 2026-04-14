import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainNavigation from './navigation';

const meta: Meta<typeof PageMainNavigation> = {
	title: 'Page/Main/Navigation',
	component: PageMainNavigation,
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
