import type { Meta, StoryObj } from '@storybook/react';
import Checkbox from './checkbox';

const meta: Meta<typeof Checkbox> = {
	title: 'Form/Checkbox',
	component: Checkbox,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
	args: {
		value: false,
	},
};

export const Checked: Story = {
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

export const ReadonlyUnchecked: Story = {
	args: {
		value: false,
		readonly: true,
	},
};
