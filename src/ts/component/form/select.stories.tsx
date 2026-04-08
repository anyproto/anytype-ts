import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Select from './select';

const meta: Meta<typeof Select> = {
	title: 'Form/Select',
	component: Select,
	tags: ['autodocs'],
	argTypes: {
		size: {
			control: { type: 'select' },
			options: [28, 36],
			table: { type: { summary: '28 | 36' } },
		},
	},
	decorators: [
		(Story) => (
			<div style={{ width: 300 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const basicOptions = [
	{ id: '1', name: 'Option A' },
	{ id: '2', name: 'Option B' },
	{ id: '3', name: 'Option C' },
];

const colorOptions = [
	{ id: 'red', name: 'Red' },
	{ id: 'green', name: 'Green' },
	{ id: 'blue', name: 'Blue' },
];

export const Default: Story = {
	args: {
		id: 'select-default',
		value: '1',
		options: basicOptions,
	},
};

export const Size36: Story = {
	args: {
		id: 'select-size36',
		value: '1',
		options: basicOptions,
		size: 36,
	},
};

export const WithInitialPlaceholder: Story = {
	args: {
		id: 'select-initial',
		value: '',
		options: basicOptions,
		initial: 'Choose an option...',
	},
};

export const Readonly: Story = {
	args: {
		id: 'select-readonly',
		value: '2',
		options: basicOptions,
		readonly: true,
	},
};

export const ManyOptions: Story = {
	args: {
		id: 'select-many',
		value: '1',
		options: Array.from({ length: 10 }, (_, i) => ({
			id: String(i + 1),
			name: `Item ${i + 1}`,
		})),
	},
};
