import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuFilterAdvanced from './advanced';

const meta: Meta<typeof MenuFilterAdvanced> = {
	title: 'Menu/Dataview/Filter/Advanced',
	component: MenuFilterAdvanced,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewFilterAdvanced') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewFilterAdvanced',
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
