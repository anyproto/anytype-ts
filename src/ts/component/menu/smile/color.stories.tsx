import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuSmileColor from './color';

const meta: Meta<typeof MenuSmileColor> = {
	title: 'Menu/Smile/Color',
	component: MenuSmileColor,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuSmileColor') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuSmileColor',
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
