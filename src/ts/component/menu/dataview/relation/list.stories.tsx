import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuRelationList from './list';

const meta: Meta<typeof MenuRelationList> = {
	title: 'Menu/Dataview/Relation/List',
	component: MenuRelationList,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewRelationList') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewRelationList',
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
