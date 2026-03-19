import type { Meta, StoryObj } from '@storybook/react';
import InputWithLabel from './inputWithLabel';

const meta: Meta<typeof InputWithLabel> = {
	title: 'Form/InputWithLabel',
	component: InputWithLabel,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: 'Name',
		value: '',
		placeholder: 'Enter your name',
	},
};

export const WithValue: Story = {
	args: {
		label: 'Email',
		value: 'user@example.com',
		placeholder: 'Enter email',
	},
};

export const Readonly: Story = {
	args: {
		label: 'ID',
		value: 'abc-123-def',
		readonly: true,
	},
};

export const WithMaxLength: Story = {
	args: {
		label: 'Username',
		value: '',
		placeholder: 'Max 20 characters',
		maxLength: 20,
	},
};
