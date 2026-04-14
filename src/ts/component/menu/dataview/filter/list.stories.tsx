import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuFilterList from './list';

const meta: Meta<typeof MenuFilterList> = {
	title: 'Menu/Dataview/Filter/List',
	component: MenuFilterList,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewFilterList') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewFilterList',
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
