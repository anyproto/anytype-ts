import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuViewSettings from './settings';

const meta: Meta<typeof MenuViewSettings> = {
	title: 'Menu/Dataview/View/Settings',
	component: MenuViewSettings,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewViewSettings') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewViewSettings',
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
