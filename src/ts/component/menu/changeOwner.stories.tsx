import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../.storybook/decorators';
import MenuChangeOwner from './changeOwner';

const meta: Meta<typeof MenuChangeOwner> = {
	title: 'Menu/ChangeOwner',
	component: MenuChangeOwner,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuChangeOwner') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuChangeOwner',
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
