import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuBlockEmoji from './emoji';

const meta: Meta<typeof MenuBlockEmoji> = {
	title: 'Menu/Block/Emoji',
	component: MenuBlockEmoji,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuBlockEmoji') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuBlockEmoji',
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
