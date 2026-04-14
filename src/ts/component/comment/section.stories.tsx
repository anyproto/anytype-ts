import type { Meta, StoryObj } from '@storybook/react';
import CommentSection from './section';

const meta: Meta<typeof CommentSection> = {
	title: 'Comment/Section',
	component: CommentSection,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
