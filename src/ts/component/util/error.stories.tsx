import type { Meta, StoryObj } from '@storybook/react';
import Error from './error';

const meta: Meta<typeof Error> = {
	title: 'Util/Error',
	component: Error,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: 'Something went wrong. Please try again.',
	},
};

export const WithId: Story = {
	args: {
		id: 'error-name',
		text: 'Name is required.',
	},
};

export const HtmlContent: Story = {
	args: {
		text: 'Invalid <b>email</b> address format.',
	},
};

export const WithClassName: Story = {
	args: {
		text: 'Custom styled error message.',
		className: 'customError',
	},
};
