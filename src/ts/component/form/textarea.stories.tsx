import type { Meta, StoryObj } from '@storybook/react';
import Textarea from './textarea';

const meta: Meta<typeof Textarea> = {
	title: 'Form/Textarea',
	component: Textarea,
	tags: ['autodocs'],
	argTypes: {
		rows: { control: { type: 'number', min: 1, max: 20 } },
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: 'Enter text...',
	},
};

export const WithValue: Story = {
	args: {
		value: 'This is a textarea with some initial content that can span multiple lines.',
	},
};

export const WithRows: Story = {
	args: {
		placeholder: 'Fixed height textarea',
		rows: 5,
	},
};

export const Readonly: Story = {
	args: {
		value: 'This text cannot be edited',
		readonly: true,
	},
};

export const WithMaxLength: Story = {
	args: {
		placeholder: 'Max 100 characters',
		maxLength: 100,
	},
};
