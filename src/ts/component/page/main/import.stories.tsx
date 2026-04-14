import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainImport from './import';

const meta: Meta<typeof PageMainImport> = {
	title: 'Page/Main/Import',
	component: PageMainImport,
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
