import type { Meta, StoryObj } from '@storybook/react';
import Button from './button';

const meta: Meta<typeof Button> = {
	title: 'Form/Button',
	component: Button,
	tags: ['autodocs'],
	argTypes: {
		color: {
			control: 'select',
			options: [ 'black', 'blank', 'accent', 'red', 'dark'],
		},
		type: {
			control: 'select',
			options: ['button', 'input'],
		},
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: 'Click me',
		color: 'black',
	},
};

export const BlankColor: Story = {
	args: {
		text: 'Blank Button',
		color: 'blank',
	},
};

export const RedColor: Story = {
	args: {
		text: 'Delete',
		color: 'red',
	},
};

export const WithIcon: Story = {
	args: {
		text: 'Add',
		icon: 'plus',
		color: 'black',
	},
};

export const WithArrow: Story = {
	args: {
		text: 'More',
		arrow: true,
		color: 'black',
	},
};

export const Active: Story = {
	args: {
		text: 'Active',
		color: 'black',
		active: true,
	},
};

export const InputType: Story = {
	args: {
		text: 'Submit',
		type: 'input',
		color: 'black',
	},
};
