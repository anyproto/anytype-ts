import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../.storybook/decorators';
import MenuOneToOne from './oneToOne';

const meta: Meta<typeof MenuOneToOne> = {
	title: 'Menu/OneToOne',
	component: MenuOneToOne,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuOneToOne') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuOneToOne',
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
