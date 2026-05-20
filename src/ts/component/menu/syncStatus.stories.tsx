import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../.storybook/decorators';
import MenuSyncStatus from './syncStatus';

const meta: Meta<typeof MenuSyncStatus> = {
	title: 'Menu/SyncStatus',
	component: MenuSyncStatus,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuSyncStatus') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuSyncStatus',
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
