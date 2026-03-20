import type { Meta, StoryObj } from '@storybook/react';
import Switch from './switch';

const meta: Meta<typeof Switch> = {
	title: 'Form/Switch',
	component: Switch,
	tags: ['autodocs'],
	argTypes: {
		color: {
			control: 'select',
			options: ['grey', 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 'ice', 'teal', 'lime'],
		},
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Off: Story = {
	args: {
		value: false,
	},
};

export const On: Story = {
	args: {
		value: true,
	},
};

export const Readonly: Story = {
	args: {
		value: true,
		readonly: true,
	},
};

export const RedColor: Story = {
	args: {
		value: true,
		color: 'red',
	},
};

export const BlueColor: Story = {
	args: {
		value: true,
		color: 'blue',
	},
};
