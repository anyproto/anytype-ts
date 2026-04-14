import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Notification from './index';
import { withNotification } from '../../../../.storybook/decorators';

const noop = () => {};

const meta: Meta<typeof Notification> = {
	title: 'Notification/Item',
	component: Notification,
	tags: ['autodocs'],
	decorators: [ withNotification ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Import: Story = {
	args: {
		item: {
			id: 'notif-1',
			type: 'import',
			status: 'completed',
			title: 'Import Complete',
			text: 'Successfully imported 12 objects from Notion',
			payload: { importType: 0, spaceId: '', errorCode: 0 },
		},
		style: {},
		resize: noop,
	},
};

export const Gallery: Story = {
	args: {
		item: {
			id: 'notif-2',
			type: 'gallery',
			status: 'completed',
			title: 'Experience Installed',
			text: 'CRM template has been added to your space',
			payload: { spaceId: '', name: 'CRM' },
		},
		style: {},
		resize: noop,
	},
};
