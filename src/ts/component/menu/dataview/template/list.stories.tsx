import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuTemplateList from './list';

const meta: Meta<typeof MenuTemplateList> = {
	title: 'Menu/Dataview/Template/List',
	component: MenuTemplateList,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewTemplateList') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewTemplateList',
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
