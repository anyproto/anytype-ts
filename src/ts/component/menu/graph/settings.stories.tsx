import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuGraphSettings from './settings';

const meta: Meta<typeof MenuGraphSettings> = {
	title: 'Menu/Graph/Settings',
	component: MenuGraphSettings,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuGraphSettings') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {
				storageKey: 'graphGlobal',
			},
		},
		getId: () => 'menuGraphSettings',
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
