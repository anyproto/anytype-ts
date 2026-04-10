import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuDataviewFileList from './list';

const meta: Meta<typeof MenuDataviewFileList> = {
	title: 'Menu/Dataview/File/List',
	component: MenuDataviewFileList,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewFileList') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewFileList',
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
