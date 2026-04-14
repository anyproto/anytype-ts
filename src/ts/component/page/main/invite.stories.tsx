import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainInvite from './invite';

const meta: Meta<typeof PageMainInvite> = {
	title: 'Page/Main/Invite',
	component: PageMainInvite,
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
