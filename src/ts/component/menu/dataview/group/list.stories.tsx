import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuGroupList from './list';

const meta: Meta<typeof MenuGroupList> = {
	title: 'Menu/Dataview/Group/List',
	component: MenuGroupList,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewGroupList') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewGroupList',
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
