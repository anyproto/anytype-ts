import type { Meta, StoryObj } from '@storybook/react';
import CommentList from './list';

const meta: Meta<typeof CommentList> = {
	title: 'Comment/List',
	component: CommentList,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
