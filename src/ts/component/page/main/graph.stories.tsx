import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainGraph from './graph';

const meta: Meta<typeof PageMainGraph> = {
	title: 'Page/Main/Graph',
	component: PageMainGraph,
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
