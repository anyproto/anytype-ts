import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuDataviewSource from './source';

const meta: Meta<typeof MenuDataviewSource> = {
	title: 'Menu/Dataview/Source',
	component: MenuDataviewSource,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewSource') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewSource',
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
