import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuRelationSuggest from './suggest';

const meta: Meta<typeof MenuRelationSuggest> = {
	title: 'Menu/Relation/Suggest',
	component: MenuRelationSuggest,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuRelationSuggest') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuRelationSuggest',
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
