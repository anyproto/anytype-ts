import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainMembership from './membership';

const meta: Meta<typeof PageMainMembership> = {
	title: 'Page/Main/Membership',
	component: PageMainMembership,
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
