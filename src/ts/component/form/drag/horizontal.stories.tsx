import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DragHorizontal from './horizontal';

const meta: Meta<typeof DragHorizontal> = {
	title: 'Form/DragHorizontal',
	component: DragHorizontal,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 300, padding: 20 }}>
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

export const AtStart: Story = {
	args: {
		value: 0,
	},
};

export const AtEnd: Story = {
	args: {
		value: 1,
	},
};

export const WithSnaps: Story = {
	args: {
		value: 0.25,
		snaps: [0, 0.25, 0.5, 0.75, 1],
	},
};

export const StrictSnap: Story = {
	args: {
		value: 0.5,
		snaps: [0, 0.25, 0.5, 0.75, 1],
		strictSnap: true,
	},
};

export const Readonly: Story = {
	args: {
		value: 0.7,
		readonly: true,
	},
};
