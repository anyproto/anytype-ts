import type { Meta, StoryObj } from '@storybook/react';
import Banner from './banner';

const meta: Meta<typeof Banner> = {
	title: 'Util/Banner',
	component: Banner,
	tags: ['autodocs'],
	argTypes: {
		color: {
			control: 'select',
			options: ['green', 'red', 'orange', 'blue', 'purple'],
		},
		buttonColor: {
			control: 'select',
			options: ['simple', 'black', 'blank', 'red', 'blue'],
		},
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'Welcome',
		text: 'This is a banner with a message.',
		color: 'green',
	},
};

export const WithButton: Story = {
	args: {
		title: 'Update Available',
		text: 'A new version is available for download.',
		button: 'Update Now',
		color: 'blue',
		buttonColor: 'simple',
	},
};

export const RedWarning: Story = {
	args: {
		title: 'Warning',
		text: 'Your storage is almost full.',
		button: 'Upgrade',
		color: 'red',
		buttonColor: 'simple',
	},
};

export const TextOnly: Story = {
	args: {
		text: 'A simple text banner without a title.',
		color: 'orange',
	},
};
