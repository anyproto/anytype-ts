import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuObjectContext from './context';

const meta: Meta<typeof MenuObjectContext> = {
	title: 'Menu/Object/Context',
	component: MenuObjectContext,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuObjectContext') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuObjectContext',
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
