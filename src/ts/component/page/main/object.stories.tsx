import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainObject from './object';

const meta: Meta<typeof PageMainObject> = {
	title: 'Page/Main/Object',
	component: PageMainObject,
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
