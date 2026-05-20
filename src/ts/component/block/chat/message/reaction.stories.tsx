import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../../.storybook/decorators';
import ChatMessageReaction from './reaction';

const meta: Meta<typeof ChatMessageReaction> = {
	title: 'Block/Chat/Message/Reaction',
	component: ChatMessageReaction,
	tags: ['autodocs'],
	decorators: [ withBlock('blockChat') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		icon: '👍',
		authors: ['user1'],
		onSelect: (icon: string) => console.log('selected', icon),
	},
};

export const Multiple: Story = {
	args: {
		icon: '❤️',
		authors: ['user1', 'user2', 'user3'],
		onSelect: (icon: string) => console.log('selected', icon),
	},
};
