import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ControlButtons from './controlButtons';

const meta: Meta<typeof ControlButtons> = {
	title: 'Page/Elements/Head/ControlButtons',
	component: ControlButtons,
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
