import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuItemFilter from './filter';

const meta: Meta<typeof MenuItemFilter> = {
	title: 'Menu/Item/Filter',
	component: MenuItemFilter,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuItemFilter') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuItemFilter',
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
