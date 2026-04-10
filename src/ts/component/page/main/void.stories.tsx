import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainVoid from './void';

const meta: Meta<typeof PageMainVoid> = {
	title: 'Page/Main/Void',
	component: PageMainVoid,
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
