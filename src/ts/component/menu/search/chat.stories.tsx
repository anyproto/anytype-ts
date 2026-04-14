import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuSearchChat from './chat';

const meta: Meta<typeof MenuSearchChat> = {
	title: 'Menu/Search/Chat',
	component: MenuSearchChat,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuSearchChat') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuSearchChat',
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
