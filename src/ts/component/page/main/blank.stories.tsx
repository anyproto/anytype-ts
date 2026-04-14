import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainBlank from './blank';

const meta: Meta<typeof PageMainBlank> = {
	title: 'Page/Main/Blank',
	component: PageMainBlank,
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
