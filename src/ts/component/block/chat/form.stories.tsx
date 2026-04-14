import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import ChatForm from './form';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-chat-form';

const makeBlock = (id: string) => new M.Block({
	id,
	type: I.BlockType.Chat,
	childrenIds: [],
	content: {},
});

const meta: Meta<typeof ChatForm> = {
	title: 'Block/Chat/Form',
	component: ChatForm,
	tags: ['autodocs'],
	decorators: [ withBlock('blockChat') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('chat-form-default'),
		blockId: 'chat-form-default',
		subId: 'sub-1',
		isEmpty: true,
		onScrollToBottomClick: () => {},
		scrollToBottom: () => {},
		scrollToMessage: () => {},
		loadMessagesByOrderId: () => {},
		getMessages: () => [],
		getReplyContent: () => ({ text: '', attachment: null, isMultiple: false }),
		highlightMessage: () => {},
		reloadAndScrollToBottom: () => {},
		isBottom: { current: true },
	},
};
