import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuBlockColor from './color';

const meta: Meta<typeof MenuBlockColor> = {
	title: 'Menu/Block/Color',
	component: MenuBlockColor,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuBlockColor') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {
				value: '',
			},
		},
		getId: () => 'menuBlockColor',
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
