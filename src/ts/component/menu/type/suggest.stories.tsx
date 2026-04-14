import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuTypeSuggest from './suggest';

const meta: Meta<typeof MenuTypeSuggest> = {
	title: 'Menu/Type/Suggest',
	component: MenuTypeSuggest,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuTypeSuggest') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuTypeSuggest',
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
