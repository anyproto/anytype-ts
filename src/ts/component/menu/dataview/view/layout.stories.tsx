import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuViewLayout from './layout';

const meta: Meta<typeof MenuViewLayout> = {
	title: 'Menu/Dataview/View/Layout',
	component: MenuViewLayout,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewViewLayout') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewViewLayout',
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
