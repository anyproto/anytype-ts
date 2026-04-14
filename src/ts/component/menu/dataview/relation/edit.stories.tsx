import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuDataviewRelationEdit from './edit';

const meta: Meta<typeof MenuDataviewRelationEdit> = {
	title: 'Menu/Dataview/Relation/Edit',
	component: MenuDataviewRelationEdit,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewRelationEdit') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewRelationEdit',
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
