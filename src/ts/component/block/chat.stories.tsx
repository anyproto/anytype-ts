import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../.storybook/decorators';
import BlockChat from './chat';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-chat';

const makeBlock = (id: string) => new M.Block({
	id,
	type: I.BlockType.Chat,
	childrenIds: [],
	content: {},
});

const meta: Meta<typeof BlockChat> = {
	title: 'Block/Chat',
	component: BlockChat,
	tags: ['autodocs'],
	decorators: [ withBlock('blockChat') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('chat-default'),
	},
};
