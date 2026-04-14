import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageAuthMigrate from './migrate';

const meta: Meta<typeof PageAuthMigrate> = {
	title: 'Page/Auth/Migrate',
	component: PageAuthMigrate,
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
