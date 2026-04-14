import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuDataviewFilterValues from './values';

const meta: Meta<typeof MenuDataviewFilterValues> = {
	title: 'Menu/Dataview/Filter/Values',
	component: MenuDataviewFilterValues,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewFilterValues') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewFilterValues',
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
