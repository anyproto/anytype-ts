import type { Meta, StoryObj } from '@storybook/react';
import CommentPost from './post';

const meta: Meta<typeof CommentPost> = {
	title: 'Comment/Post',
	component: CommentPost,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
