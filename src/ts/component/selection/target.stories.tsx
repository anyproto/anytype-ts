import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SelectionTarget from './target';

const meta: Meta<typeof SelectionTarget> = {
	title: 'Selection/Target',
	component: SelectionTarget,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 'selection-1',
		type: 0,
		children: <div style={{ padding: 16 }}>Selectable content</div>,
	},
};
