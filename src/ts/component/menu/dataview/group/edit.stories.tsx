import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuDataviewGroupEdit from './edit';

const meta: Meta<typeof MenuDataviewGroupEdit> = {
	title: 'Menu/Dataview/Group/Edit',
	component: MenuDataviewGroupEdit,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewGroupEdit') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewGroupEdit',
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
