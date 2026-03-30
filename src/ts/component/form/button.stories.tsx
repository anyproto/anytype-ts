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
		size: {
			control: { type: 'select' },
			options: [ 16, 28, 32, 36, 40, 48 ],
			table: { type: { summary: '16 | 28 | 32 | 36 | 40 | 48' } },
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

export const Size16: Story = {
	args: {
		text: 'Tiny',
		size: 16,
		color: 'black',
	},
};

export const Size28: Story = {
	args: {
		text: 'Small',
		size: 28,
		color: 'black',
	},
};

export const Size32: Story = {
	args: {
		text: 'Compact',
		size: 32,
		color: 'black',
	},
};

export const Size36: Story = {
	args: {
		text: 'Medium',
		size: 36,
		color: 'black',
	},
};

export const Size40: Story = {
	args: {
		text: 'Large',
		size: 40,
		color: 'black',
	},
};

export const Size48: Story = {
	args: {
		text: 'Extra Large',
		size: 48,
		color: 'black',
	},
};

export const BlankColor: Story = {
	args: {
		text: 'Blank Button',
		size: 36,
		color: 'blank',
	},
};

export const RedColor: Story = {
	args: {
		text: 'Delete',
		size: 36,
		color: 'red',
	},
};

export const WithIcon: Story = {
	args: {
		text: 'Add',
		icon: 'plus',
		size: 28,
		color: 'black',
	},
};

export const WithArrow: Story = {
	args: {
		text: 'More',
		arrow: true,
		size: 36,
		color: 'black',
	},
};

export const Active: Story = {
	args: {
		text: 'Active',
		size: 36,
		color: 'black',
		active: true,
	},
};

export const InputType: Story = {
	args: {
		text: 'Submit',
		type: 'input',
		size: 36,
		color: 'black',
	},
};
