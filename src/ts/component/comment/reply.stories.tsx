import type { Meta, StoryObj } from '@storybook/react';
import CommentReply from './reply';

const meta: Meta<typeof CommentReply> = {
	title: 'Comment/Reply',
	component: CommentReply,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
