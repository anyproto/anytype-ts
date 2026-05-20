import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuSyncStatusInfo from './info';

const meta: Meta<typeof MenuSyncStatusInfo> = {
	title: 'Menu/SyncStatus/Info',
	component: MenuSyncStatusInfo,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuSyncStatusInfo') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {
				title: 'Sync Status',
				message: 'All synced',
			},
		},
		getId: () => 'menuSyncStatusInfo',
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
