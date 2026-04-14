import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuObjectValues from './values';

const meta: Meta<typeof MenuObjectValues> = {
	title: 'Menu/Dataview/Object/Values',
	component: MenuObjectValues,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewObjectValues') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewObjectValues',
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
