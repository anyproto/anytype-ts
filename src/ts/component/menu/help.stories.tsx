import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../.storybook/decorators';
import MenuHelp from './help';

const meta: Meta<typeof MenuHelp> = {
	title: 'Menu/Help',
	component: MenuHelp,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuHelp') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuHelp',
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
