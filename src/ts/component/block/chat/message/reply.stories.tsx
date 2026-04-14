import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../../.storybook/decorators';
import ChatMessageReply from './reply';

const meta: Meta<typeof ChatMessageReply> = {
	title: 'Block/Chat/Message/Reply',
	component: ChatMessageReply,
	tags: ['autodocs'],
	decorators: [ withBlock('blockChat') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 'reply-1',
		subId: 'sub-1',
		getReplyContent: () => ({ text: 'This is a reply', attachment: null, isMultiple: false }),
		onReplyClick: () => console.log('reply clicked'),
	},
};
