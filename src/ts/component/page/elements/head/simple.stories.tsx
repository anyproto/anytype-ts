import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SimpleHead from './simple';

const meta: Meta<typeof SimpleHead> = {
	title: 'Page/Elements/Head/Simple',
	component: SimpleHead,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'sb-root',
	},
};

export const Readonly: Story = {
	args: {
		rootId: 'sb-root',
		readonly: true,
	},
};
