import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../.storybook/decorators';
import MenuIdentity from './identity';

const meta: Meta<typeof MenuIdentity> = {
	title: 'Menu/Identity',
	component: MenuIdentity,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuIdentity') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuIdentity',
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
