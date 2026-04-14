import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import ChatEmpty from './empty';

const meta: Meta<typeof ChatEmpty> = {
	title: 'Block/Chat/Empty',
	component: ChatEmpty,
	tags: ['autodocs'],
	decorators: [ withBlock('blockChat') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
