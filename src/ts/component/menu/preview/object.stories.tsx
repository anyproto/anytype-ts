import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuPreviewObject from './object';

const meta: Meta<typeof MenuPreviewObject> = {
	title: 'Menu/Preview/Object',
	component: MenuPreviewObject,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuPreviewObject') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuPreviewObject',
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
