import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuBlockColor from './background';

const meta: Meta<typeof MenuBlockColor> = {
	title: 'Menu/Block/Background',
	component: MenuBlockColor,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuBlockBackground') ],
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
		getId: () => 'menuBlockBackground',
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
