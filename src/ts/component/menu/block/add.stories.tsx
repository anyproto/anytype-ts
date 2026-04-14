import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuBlockAdd from './add';

const meta: Meta<typeof MenuBlockAdd> = {
	title: 'Menu/Block/Add',
	component: MenuBlockAdd,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuBlockAdd') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuBlockAdd',
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
