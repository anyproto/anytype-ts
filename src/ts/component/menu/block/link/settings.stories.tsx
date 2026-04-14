import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuBlockLinkSettings from './settings';

const meta: Meta<typeof MenuBlockLinkSettings> = {
	title: 'Menu/Block/Link/Settings',
	component: MenuBlockLinkSettings,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuBlockLinkSettings') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuBlockLinkSettings',
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
