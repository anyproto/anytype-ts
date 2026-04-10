import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuBlockRelationEdit from './edit';

const meta: Meta<typeof MenuBlockRelationEdit> = {
	title: 'Menu/Block/Relation/Edit',
	component: MenuBlockRelationEdit,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuBlockRelationEdit') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuBlockRelationEdit',
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
