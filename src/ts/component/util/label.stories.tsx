import type { Meta, StoryObj } from '@storybook/react';
import Label from './label';

const meta: Meta<typeof Label> = {
	title: 'Util/Label',
	component: Label,
	tags: ['autodocs'],
	argTypes: {
		color: {
			control: 'select',
			options: ['', 'default', 'grey', 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 'ice', 'teal', 'lime', 'green'],
		},
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: 'This is a label',
	},
};

export const WithColor: Story = {
	args: {
		text: 'Blue label',
		color: 'blue',
	},
};

export const RedColor: Story = {
	args: {
		text: 'Red label',
		color: 'red',
	},
};

export const HtmlContent: Story = {
	args: {
		text: 'Label with <b>bold</b> and <i>italic</i> text.',
	},
};

export const LongText: Story = {
	args: {
		text: 'This is a longer label text that demonstrates how the component handles content that extends beyond a typical length for testing purposes.',
	},
};
