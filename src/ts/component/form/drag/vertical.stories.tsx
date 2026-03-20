import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DragVertical from './vertical';

const meta: Meta<typeof DragVertical> = {
	title: 'Form/DragVertical',
	component: DragVertical,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ height: 120, padding: 20, display: 'flex', justifyContent: 'center' }}>
				<Story />
			</div>
		),
	],
	argTypes: {
		value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: 0.5,
	},
};

export const Minimum: Story = {
	args: {
		value: 0,
	},
};

export const Maximum: Story = {
	args: {
		value: 1,
	},
};

export const CustomRange: Story = {
	args: {
		value: 0.3,
		min: 0,
		max: 1,
		step: 0.1,
	},
};
