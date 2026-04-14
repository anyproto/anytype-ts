import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainSet from './set';

const meta: Meta<typeof PageMainSet> = {
	title: 'Page/Main/Set',
	component: PageMainSet,
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
