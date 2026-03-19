import type { Meta, StoryObj } from '@storybook/react';
import Input from './input';

const meta: Meta<typeof Input> = {
	title: 'Form/Input',
	component: Input,
	tags: ['autodocs'],
	argTypes: {
		type: {
			control: 'select',
			options: ['text', 'password', 'email', 'number', 'search', 'url'],
		},
		size: {
			control: { type: 'select' },
			options: [ 28, 36, 40 ],
			table: { type: { summary: '28 | 36 | 40' } },
		},
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: 'Enter text...',
	},
};

export const Size28: Story = {
	args: {
		placeholder: 'Size 28 (default)',
		size: 28,
	},
};

export const Size36: Story = {
	args: {
		placeholder: 'Size 36',
		size: 36,
	},
};

export const Size40: Story = {
	args: {
		placeholder: 'Size 40',
		size: 40,
	},
};

export const WithValue: Story = {
	args: {
		value: 'Hello World',
	},
};

export const Password: Story = {
	args: {
		type: 'password',
		placeholder: 'Enter password...',
	},
};

export const Number: Story = {
	args: {
		type: 'number',
		placeholder: '0',
		min: 0,
		max: 100,
		step: 1,
	},
};

export const Readonly: Story = {
	args: {
		value: 'Read-only text',
		readonly: true,
	},
};

export const WithMaxLength: Story = {
	args: {
		placeholder: 'Max 10 chars',
		maxLength: 10,
	},
};
