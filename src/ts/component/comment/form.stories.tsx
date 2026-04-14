import type { Meta, StoryObj } from '@storybook/react';
import CommentForm from './form';

const meta: Meta<typeof CommentForm> = {
	title: 'Comment/Form',
	component: CommentForm,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
