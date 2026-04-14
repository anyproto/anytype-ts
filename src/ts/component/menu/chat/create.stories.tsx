import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuChatCreate from './create';

const meta: Meta<typeof MenuChatCreate> = {
	title: 'Menu/Chat/Create',
	component: MenuChatCreate,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuChatCreate') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuChatCreate',
		getSize: () => ({ width: 280, height: 400 }),
		position: () => {},
		close: () => {},
		setActive: () => {},
		onKeyDown: () => {},
		storageGet: () => ({}),
		storageSet: () => {},
		getItems: () => [],
	},
};
