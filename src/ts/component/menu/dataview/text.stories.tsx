import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuDataviewText from './text';

const meta: Meta<typeof MenuDataviewText> = {
	title: 'Menu/Dataview/Text',
	component: MenuDataviewText,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewText') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewText',
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
