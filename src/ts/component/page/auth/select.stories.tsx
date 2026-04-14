import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageAuthSelect from './select';

const meta: Meta<typeof PageAuthSelect> = {
	title: 'Page/Auth/Select',
	component: PageAuthSelect,
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
