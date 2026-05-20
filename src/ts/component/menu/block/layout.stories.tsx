import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuBlockLayout from './layout';

const meta: Meta<typeof MenuBlockLayout> = {
	title: 'Menu/Block/Layout',
	component: MenuBlockLayout,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuBlockLayout') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuBlockLayout',
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
