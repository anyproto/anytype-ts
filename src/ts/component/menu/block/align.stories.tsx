import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuBlockHAlign from './align';

const meta: Meta<typeof MenuBlockHAlign> = {
	title: 'Menu/Block/Align',
	component: MenuBlockHAlign,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuBlockAlign') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {
				value: 1,
				restricted: [],
			},
		},
		getId: () => 'menuBlockAlign',
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
